export default class WebSocketWrapper {

  constructor({ host = location.host, endpoint}) {
    this._host = host;
    this._endpoint = endpoint;
    this._wsIptr = null;
    this._handleWsOpen = this._handleWsOpen.bind(this);
    this._handleWsMessage = this._handleWsMessage.bind(this);
    this._handleWsCloseOrError = this._handleWsCloseOrError.bind(this);
    this._textMessageReceivedCallback = null;
    this._binaryDataReceivedCallback = null;
  }

  setTextMessageReceivedCallback(textMessageReceivedCallback) {
    this._textMessageReceivedCallback = textMessageReceivedCallback;
  }

  setBinaryDataReceivedCallback(binaryDataReceivedCallback) {
    this._binaryDataReceivedCallback = binaryDataReceivedCallback;
  }

  _handleWsOpen() {
  }

  _handleWsClosed() {
  }

  _handleWsMessage(evt) {
    if (typeof (evt.data) === 'string') {
      if(this._textMessageReceivedCallback) {
        this._textMessageReceivedCallback(evt.data);
      }
      return;
    }
    if(this._binaryDataReceivedCallback) {
      this._binaryDataReceivedCallback(evt.data);
    }    
  }

  _handleWsCloseOrError() {
    this._handleWsClosed();
    this.open();
  }

  open() {
    if (this._wsIptr && this._wsIptr.readyState !== WebSocket.CLOSED) {
      return;
    }
    try {
      this._wsIptr = new WebSocket(`ws://${this._host}${this._endpoint}`);
      this._wsIptr.binaryType = 'arraybuffer';
      this._wsIptr.onopen = this._handleWsOpen;
      this._wsIptr.onmessage = this._handleWsMessage;
      this._wsIptr.onclose = this._handleWsCloseOrError;
      this._wsIptr.onerror = this._handleWsCloseOrError;
    } catch(err) {
      setTimeout(this._handleWsCloseOrError, 1000);
    }    
  }

  close() {
    if (!this._wsIptr) {
      return;
    }
    this._wsIptr.onopen = null;
    this._wsIptr.onmessage = null;
    this._wsIptr.onerror = null;
    this._wsIptr.onclose = null;
    this._wsIptr.close();
    this._wsIptr = null;
  }

  sendArray(data = []) {
    if (!this._wsIptr) {
      this.open();
      return false;
    }
    if (this._wsIptr.readyState === WebSocket.CLOSING) {
      this._handleWsCloseOrError();      
      return false;
    }
    if (this._wsIptr.readyState === WebSocket.CLOSED) {
      this.open();
      this._handleWsCloseOrError();      
      return false;
    }
    if(data instanceof ArrayBuffer) {
      this._wsIptr.send(data);
      return true;
    }
    const arrayBuf = new ArrayBuffer(data.length);
    const dv = new DataView(arrayBuf);
    data.forEach((byte, i) => { dv.setUint8(i, byte); });
    try {
      this._wsIptr.send(arrayBuf);
      return true;
    } catch(err) {
      this._handleWsCloseOrError();
    }    
    return false;
  }  
}