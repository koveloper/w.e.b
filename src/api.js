import { AppConstants } from './constants';
import WebSocketWrapper from './web-socket-wrapper';


const Method = {
  GET: 'GET',
  PUT: 'PUT',
  POST: 'POST',
  DELETE: 'DELETE',
};

const SuccessHTTPStatusRange = {
  MIN: 200,
  MAX: 299,
};

export class Api extends WebSocketWrapper {
  constructor({ wsConnectedCallback, updateStatusCallback } = {}) {
    super({ endpoint: AppConstants.api.WS_ENDPOINT });
    this._endpoint = AppConstants.api.HTTP_ENDPOINT;
    this.ping = this.ping.bind(this);
    this._ping = this._ping.bind(this);
    this._sendWsReadyForDownloadPacket = this._sendWsReadyForDownloadPacket.bind(this);
    this._handleWsBinaryData = this._handleWsBinaryData.bind(this);
    this._initialized = false;
    this._webSocketMode = false;
    this._autoPingTimerId = null;
    this._firmwareArrayBuffer = null;
    this._wsConnectedCallback = wsConnectedCallback;
    this._updateStatusCallback = updateStatusCallback;
    this._wsBurnTimer = null;
    this._wsBurnDone = false;
    this._wsBurned = 0;
  }

  init() {
    if(this._initialized) {
      return;
    }
    this._initialized = true;
    this.setBinaryDataReceivedCallback(this._handleWsBinaryData);
    this.open();
  }

  _handleWsOpen() {
    this._webSocketMode = true;
    if(this._wsConnectedCallback) {
      this._wsConnectedCallback(true);
    }
  }

  _handleWsClosed() {
    this._webSocketMode = false;
    if(this._wsConnectedCallback) {
      this._wsConnectedCallback(false);
    }
  }

  _sendWsReadyForDownloadPacket() {
    const data = this._firmwareArrayBuffer === null ?
      [0, 0, 0, 0]
      : [
        this._firmwareArrayBuffer.byteLength & 255,
        (this._firmwareArrayBuffer.byteLength >> 8) & 255,
        (this._firmwareArrayBuffer.byteLength >> 16) & 255,
        (this._firmwareArrayBuffer.byteLength >> 24) & 255,
      ];
    return this.sendArray(
        this._createWsCommand(
            AppConstants.api.packetTypes.READY_FOR_DOWNLOAD_RESPONSE,
            data
        )
    );
  }

  _handleFirmwareSegmentRequest(packet) {
    if(this._firmwareArrayBuffer === null) {
      this._sendWsReadyForDownloadPacket();
    }
    if(packet.data.length < 6) {
      return;
    }
    let offset = 0;
    let firmwareOffset = packet.data[offset++]
      | (packet.data[offset++] << 8)
      | (packet.data[offset++] << 16)
      | (packet.data[offset++] << 24);
    let size = packet.data[offset++]
      | (packet.data[offset++] << 8);
    if(firmwareOffset < this._firmwareArrayBuffer) {
      const portion = [];
      while(firmwareOffset < this._firmwareArrayBuffer.byteLength && size--) {
        portion.push(this._firmwareArrayBuffer.getUint8(firmwareOffset++));
      }
      this.sendArray(
          this._createWsCommand(
              AppConstants.api.packetTypes.FIRMWARE_FRAGMENT_RESPONSE,
              portion
          )
      );
      this._wsBurned = firmwareOffset;
    }
  }

  _handleWsBinaryData(arrayBuffer) {
    this._webSocketMode = true;    
    const packet = this._parseWebSocketInputPacket(arrayBuffer);
    if(!packet) {
      return;
    }
    switch(packet.type) {
      case AppConstants.api.packetTypes.PING:
        this.ping();
        break;
      case AppConstants.api.packetTypes.READY_FOR_DOWNLOAD_REQUEST:
        this._sendWsReadyForDownloadPacket();
        break;
      case AppConstants.api.packetTypes.FIRMWARE_FRAGMENT_REQUEST:
        this._handleFirmwareSegmentRequest(packet);
        break;
      case AppConstants.api.packetTypes.FIRMWARE_UPDATE_DONE:
        this._wsBurnDone = true;
        break;
    }
  }

  _parseWebSocketInputPacket(arrayBuffer) {
    const dv = new DataView(arrayBuffer);
    const minPacketSize = AppConstants.api.PACKET_FIELD_SIZE_MAGIC + AppConstants.api.PACKET_FIELD_SIZE_TYPE + AppConstants.api.PACKET_FIELD_SIZE_DATA_LENGTH;
    if(arrayBuffer.byteLength < minPacketSize) {
      return null;
    }  
    const packet = {
      magic: dv.getUint32(0, true),
      type: dv.getUint32(AppConstants.api.PACKET_FIELD_SIZE_MAGIC, true),
      dataLength: dv.getUint32(AppConstants.api.PACKET_FIELD_SIZE_MAGIC + AppConstants.api.PACKET_FIELD_SIZE_TYPE, true),
    };
    if(packet.magic !== AppConstants.api.MAGIC) {
      return null;
    }
    if(packet.dataLength !== (arrayBuffer.byteLength - minPacketSize)) {
      return null;
    }
    packet.data = [];
    for(let offset = 0; offset < packet.dataLength; offset++) {
      packet.data.push(dv.getUint8(minPacketSize + offset));
    }
    return packet;
  }

  _insertInDataView(dv, offset, value, valueSize) {
    switch(valueSize) {
      case 1: dv.setUint8(offset, value);
        break;
      case 2: dv.setUint16(offset, value, true);
        break;
      case 4: dv.setUint32(offset, value, true);
        break;
      default:
        return offset;
    }
    return offset + valueSize;
  }

  _createWsCommand(type, ...args) {
    const cmd = new ArrayBuffer(
        AppConstants.api.PACKET_FIELD_SIZE_MAGIC
        + AppConstants.api.PACKET_FIELD_SIZE_TYPE
        + AppConstants.api.PACKET_FIELD_SIZE_DATA_LENGTH
        + args.length
    );
    const dv = new DataView(cmd);
    let offset = this._insertInDataView(dv, 0, AppConstants.api.MAGIC, AppConstants.api.PACKET_FIELD_SIZE_MAGIC);
    offset = this._insertInDataView(dv, offset, type, AppConstants.api.PACKET_FIELD_SIZE_TYPE);
    offset = this._insertInDataView(dv, offset, args ? args.length : 0, AppConstants.api.PACKET_FIELD_SIZE_DATA_LENGTH);
    args.forEach(v => dv.setUint8(offset++, v));
    return cmd;
  }

  _request({
    url,
    method = Method.GET,
    body = null,
    headers = new Headers(),
    commitProgress = false
  }) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.open(method, `${this._endpoint}/${url}`);
      headers.keys.forEach((key) => {
        xhr.setRequestHeader(key, headers.get(key));
      });
      xhr.send(body);
      xhr.onload = () => {
        if(commitProgress && this._updateStatusCallback) {
          this._updateStatusCallback({
            bytesOverall: this._firmwareArrayBuffer.byteLength,
            bytesBurned: this._firmwareArrayBuffer.byteLength,
            percent: 100,
            finished: true
          });
        }
        resolve(xhr);
      };
      xhr.onerror = () => {
        reject('Error while performing XMLHttpRequest');
      };
      if(commitProgress && this._updateStatusCallback) {
        xhr.upload.onprogress = function(evt) {
          const burnStatus = {
            bytesOverall: evt.total,
            bytesBurned: evt.loaded,
            percent: Math.round(evt.loaded * 100 / evt.total),
            finished: false
          };
          console.log(burnStatus);
          this._updateStatusCallback(burnStatus);
        };
      }
    }).then(Api.checkStatus);
  }

  _makeRequestWithDataResponse({
    url,
    method = Method.GET,
    body = null,
    headers = new Headers(),
  }) {
    return this._request({ url, method, body, headers })
      .then((response) => {
        return response.headers.get('Content-Type') === 'application/json' ? Api.toJSON(response) : Api.toBLOB(response);
      })
      .catch(Api.catchError);
  }

  _makeRequestWithoutDataResponse({
    url,
    method = Method.GET,
    body = null,
    headers = new Headers(),
    commitProgress = false
  }) {
    return this._request({ url, method, body, headers, commitProgress })
      .catch(Api.catchError);
  }

  static checkStatus(xhr) {
    if (
      xhr.status < SuccessHTTPStatusRange.MIN ||
      xhr.status > SuccessHTTPStatusRange.MAX
    ) {
      throw new Error(`${xhr.status}: ${xhr.statusText}`);
    }
    return xhr.response;
  }

  static toJSON(response) {
    return response.json();
  }

  static toBLOB(response) {
    return response.blob().then(_blob => {
      return _blob;
    });
  }
  
  static catchError(err) {
    throw err;
  }

  setAutopingMode(isEnabled, intervalMs = 1000) {
    if(this._autoPingTimerId !== null) {
      clearInterval(this._autoPingTimerId);
    }
    if(!isEnabled) {
      return;
    }
    this._autoPingTimerId = setInterval(this._ping, intervalMs < 1000 ? 1000 : intervalMs);
  }

  _ping() {
    this.ping().then(() => {}).catch(() => {});
  }
  
  ping() {
    if(this._firmwareArrayBuffer) {
      return Promise.reject();
    }
    if(this._webSocketMode) {
      return new Promise((resolve, reject) => {
        if(this.sendArray(this._createWsCommand(AppConstants.api.packetTypes.PING))) {
          resolve();
        }
        reject('web socket transmit error');    
      });
    }    
    return this._makeRequestWithoutDataResponse({
      url: 'ping',
      method: Method.GET,      
    }).then((response) => {
      this.close();
      return Promise.resolve(response);
    });
  }  

  exitBootloader() {
    if(this._webSocketMode) {
      return new Promise((resolve, reject) => {
      
        if(this.sendArray(this._createWsCommand(AppConstants.api.packetTypes.EXIT_BOOTLOADER))) {
          resolve();
        }
        reject('web socket transmit error');
      });
    }
    return this._makeRequestWithoutDataResponse({
      url: 'exit',
      method: Method.GET,      
    });
  }

  _wsBurn() {
    return new Promise((resolve, reject) => {
      this._wsBurnTimer = setInterval(() => {
        if(this._wsBurnDone) {
          this._updateStatusCallback({
            bytesOverall: this._firmwareArrayBuffer.byteLength,
            bytesBurned: this._firmwareArrayBuffer.byteLength,
            percent: 100,
            finished: true
          });
          clearInterval(this._wsBurnTimer);
          resolve();
        } else {
          if(this._updateStatusCallback) {
            const burnStatus = {
              bytesOverall: this._firmwareArrayBuffer.byteLength,
              bytesBurned: this._wsBurned,
              percent: Math.round(this._wsBurned * 100 / this._firmwareArrayBuffer.byteLength),
              finished: false
            };
            console.log(burnStatus);
            this._updateStatusCallback(burnStatus);
          }
        }
        console.log('ws burn cycle operation');
        if(!this._sendWsReadyForDownloadPacket()) {
          reject();          
        }
      }, 100);
    });
  }

  isBurning() {
    return this._firmwareArrayBuffer !== null;
  }

  burn(firmwareArrayBuffer) {
    console.log('burn');
    console.log(firmwareArrayBuffer);
    if(!firmwareArrayBuffer || this._firmwareArrayBuffer) {
      return Promise.reject('burning already started');
    }
    this._firmwareArrayBuffer = firmwareArrayBuffer;
    if(this._webSocketMode) {
      return this._wsBurn();
    }
    const headers = new Headers();
    headers.set('Content-Type', 'application/octet-stream');
    return this._makeRequestWithoutDataResponse({
      url: 'burn',
      method: Method.POST,
      headers,
      body: firmwareArrayBuffer,
      commitProgress: true
    }).catch(err => {
      this._firmwareArrayBuffer = null;
      throw err;
    });
  }
}