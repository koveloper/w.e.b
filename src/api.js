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
  constructor() {
    super({ endpoint: AppConstants.api.WS_ENDPOINT });
    this._endpoint = AppConstants.api.HTTP_ENDPOINT;
    this.ping = this.ping.bind(this);
    this._handleWsBinaryData = this._handleWsBinaryData.bind(this);
    this._initialized = false;
    this._webSocketMode = false;
    this._autoPingTimerId = null;
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
  }

  _handleWsClosed() {
    this._webSocketMode = false;
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
        break;
      case AppConstants.api.packetTypes.FIRMWARE_FRAGMENT_REQUEST:
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
  }) {
    return fetch(
        `${this._endpoint}/${url}`,
        { method, body, headers },
    ).then(Api.checkStatus);
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
  }) {
    return this._request({ url, method, body, headers })
      .catch(Api.catchError);
  }

  static checkStatus(response) {
    if (
      response.status < SuccessHTTPStatusRange.MIN ||
      response.status > SuccessHTTPStatusRange.MAX
    ) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
    return response;
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
    this._autoPingTimerId = setInterval(this.ping, intervalMs < 1000 ? 1000 : intervalMs);
  }
  
  ping() {
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

  burn() {

  }
}