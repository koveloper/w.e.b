!function(e){var t={};function r(s){if(t[s])return t[s].exports;var a=t[s]={i:s,l:!1,exports:{}};return e[s].call(a.exports,a,a.exports,r),a.l=!0,a.exports}r.m=e,r.c=t,r.d=function(e,t,s){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:s})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var s=Object.create(null);if(r.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var a in e)r.d(s,a,function(t){return e[t]}.bind(null,a));return s},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=0)}([function(e,t,r){"use strict";r.r(t);const s={api:{MAGIC:4278259967,PACKET_FIELD_SIZE_MAGIC:4,PACKET_FIELD_SIZE_TYPE:2,PACKET_FIELD_SIZE_DATA_LENGTH:4,packetTypes:{EXIT_BOOTLOADER:1,READY_FOR_DOWNLOAD_REQUEST:2,READY_FOR_DOWNLOAD_RESPONSE:3,FIRMWARE_FRAGMENT_REQUEST:4,FIRMWARE_FRAGMENT_RESPONSE:5,PING:6,FIRMWARE_UPDATE_DONE:7},WS_ENDPOINT:"bootloader/ws",HTTP_ENDPOINT:`http://${location.host}/bootloader`},ui:{ERROR_SHOW_INTERVAL:5e3}};const a="GET",n="POST",i=200,o=299;class l extends class{constructor({host:e=location.host,endpoint:t}){this._host=e,this._endpoint=t,this._wsIptr=null,this._handleWsOpen=this._handleWsOpen.bind(this),this._handleWsMessage=this._handleWsMessage.bind(this),this._handleWsCloseOrError=this._handleWsCloseOrError.bind(this),this._textMessageReceivedCallback=null,this._binaryDataReceivedCallback=null}setTextMessageReceivedCallback(e){this._textMessageReceivedCallback=e}setBinaryDataReceivedCallback(e){this._binaryDataReceivedCallback=e}_handleWsOpen(){}_handleWsClosed(){}_handleWsMessage(e){"string"!=typeof e.data?this._binaryDataReceivedCallback&&this._binaryDataReceivedCallback(e.data):this._textMessageReceivedCallback&&this._textMessageReceivedCallback(e.data)}_handleWsCloseOrError(){this._handleWsClosed(),this.open()}open(){if(!this._wsIptr||this._wsIptr.readyState===WebSocket.CLOSED)try{this._wsIptr=new WebSocket(`ws://${this._host}${this._endpoint}`),this._wsIptr.binaryType="arraybuffer",this._wsIptr.onopen=this._handleWsOpen,this._wsIptr.onmessage=this._handleWsMessage,this._wsIptr.onclose=this._handleWsCloseOrError,this._wsIptr.onerror=this._handleWsCloseOrError}catch(e){setTimeout(this._handleWsCloseOrError,1e3)}}close(){this._wsIptr&&(this._wsIptr.onopen=null,this._wsIptr.onmessage=null,this._wsIptr.onerror=null,this._wsIptr.onclose=null,this._wsIptr.close(),this._wsIptr=null)}sendArray(e=[]){if(!this._wsIptr)return this.open(),!1;if(this._wsIptr.readyState===WebSocket.CLOSING)return this._handleWsCloseOrError(),!1;if(this._wsIptr.readyState===WebSocket.CLOSED)return this.open(),this._handleWsCloseOrError(),!1;if(e instanceof ArrayBuffer)return this._wsIptr.send(e),!0;const t=new ArrayBuffer(e.length),r=new DataView(t);e.forEach((e,t)=>{r.setUint8(t,e)});try{return this._wsIptr.send(t),!0}catch(e){this._handleWsCloseOrError()}return!1}}{constructor({wsConnectedCallback:e,updateStatusCallback:t}={}){super({endpoint:s.api.WS_ENDPOINT}),this._endpoint=s.api.HTTP_ENDPOINT,this.ping=this.ping.bind(this),this._ping=this._ping.bind(this),this._sendWsReadyForDownloadPacket=this._sendWsReadyForDownloadPacket.bind(this),this._handleWsBinaryData=this._handleWsBinaryData.bind(this),this._initialized=!1,this._webSocketMode=!1,this._autoPingTimerId=null,this._firmwareArrayBuffer=null,this._wsConnectedCallback=e,this._updateStatusCallback=t,this._wsBurnTimer=null,this._wsBurnDone=!1,this._wsBurned=0}init(){this._initialized||(this._initialized=!0,this.setBinaryDataReceivedCallback(this._handleWsBinaryData),this.open())}_handleWsOpen(){this._webSocketMode=!0,this._wsConnectedCallback&&this._wsConnectedCallback(!0)}_handleWsClosed(){this._webSocketMode=!1,this._wsConnectedCallback&&this._wsConnectedCallback(!1)}_sendWsReadyForDownloadPacket(){const e=null===this._firmwareArrayBuffer?[0,0,0,0]:[255&this._firmwareArrayBuffer.byteLength,this._firmwareArrayBuffer.byteLength>>8&255,this._firmwareArrayBuffer.byteLength>>16&255,this._firmwareArrayBuffer.byteLength>>24&255];return this.sendArray(this._createWsCommand(s.api.packetTypes.READY_FOR_DOWNLOAD_RESPONSE,e))}_handleFirmwareSegmentRequest(e){if(null===this._firmwareArrayBuffer&&this._sendWsReadyForDownloadPacket(),e.data.length<6)return;let t=0,r=e.data[t++]|e.data[t++]<<8|e.data[t++]<<16|e.data[t++]<<24,a=e.data[t++]|e.data[t++]<<8;if(r<this._firmwareArrayBuffer){const e=[];for(;r<this._firmwareArrayBuffer.byteLength&&a--;)e.push(this._firmwareArrayBuffer.getUint8(r++));this.sendArray(this._createWsCommand(s.api.packetTypes.FIRMWARE_FRAGMENT_RESPONSE,e)),this._wsBurned=r}}_handleWsBinaryData(e){this._webSocketMode=!0;const t=this._parseWebSocketInputPacket(e);if(t)switch(t.type){case s.api.packetTypes.PING:this.ping();break;case s.api.packetTypes.READY_FOR_DOWNLOAD_REQUEST:this._sendWsReadyForDownloadPacket();break;case s.api.packetTypes.FIRMWARE_FRAGMENT_REQUEST:this._handleFirmwareSegmentRequest(t);break;case s.api.packetTypes.FIRMWARE_UPDATE_DONE:this._wsBurnDone=!0}}_parseWebSocketInputPacket(e){const t=new DataView(e),r=s.api.PACKET_FIELD_SIZE_MAGIC+s.api.PACKET_FIELD_SIZE_TYPE+s.api.PACKET_FIELD_SIZE_DATA_LENGTH;if(e.byteLength<r)return null;const a={magic:t.getUint32(0,!0),type:t.getUint32(s.api.PACKET_FIELD_SIZE_MAGIC,!0),dataLength:t.getUint32(s.api.PACKET_FIELD_SIZE_MAGIC+s.api.PACKET_FIELD_SIZE_TYPE,!0)};if(a.magic!==s.api.MAGIC)return null;if(a.dataLength!==e.byteLength-r)return null;a.data=[];for(let e=0;e<a.dataLength;e++)a.data.push(t.getUint8(r+e));return a}_insertInDataView(e,t,r,s){switch(s){case 1:e.setUint8(t,r);break;case 2:e.setUint16(t,r,!0);break;case 4:e.setUint32(t,r,!0);break;default:return t}return t+s}_createWsCommand(e,...t){const r=new ArrayBuffer(s.api.PACKET_FIELD_SIZE_MAGIC+s.api.PACKET_FIELD_SIZE_TYPE+s.api.PACKET_FIELD_SIZE_DATA_LENGTH+t.length),a=new DataView(r);let n=this._insertInDataView(a,0,s.api.MAGIC,s.api.PACKET_FIELD_SIZE_MAGIC);return n=this._insertInDataView(a,n,e,s.api.PACKET_FIELD_SIZE_TYPE),n=this._insertInDataView(a,n,t?t.length:0,s.api.PACKET_FIELD_SIZE_DATA_LENGTH),t.forEach(e=>a.setUint8(n++,e)),r}_request({url:e,method:t=a,body:r=null,headers:s=new Headers}){return fetch(`${this._endpoint}/${e}`,{method:t,body:r,headers:s}).then(l.checkStatus)}_makeRequestWithDataResponse({url:e,method:t=a,body:r=null,headers:s=new Headers}){return this._request({url:e,method:t,body:r,headers:s}).then(e=>"application/json"===e.headers.get("Content-Type")?l.toJSON(e):l.toBLOB(e)).catch(l.catchError)}_makeRequestWithoutDataResponse({url:e,method:t=a,body:r=null,headers:s=new Headers}){return this._request({url:e,method:t,body:r,headers:s}).catch(l.catchError)}static checkStatus(e){if(e.status<i||e.status>o)throw new Error(`${e.status}: ${e.statusText}`);return e}static toJSON(e){return e.json()}static toBLOB(e){return e.blob().then(e=>e)}static catchError(e){throw e}setAutopingMode(e,t=1e3){null!==this._autoPingTimerId&&clearInterval(this._autoPingTimerId),e&&(this._autoPingTimerId=setInterval(this._ping,t<1e3?1e3:t))}_ping(){this.ping().then(()=>{}).catch(()=>{})}ping(){return this._webSocketMode?new Promise((e,t)=>{this.sendArray(this._createWsCommand(s.api.packetTypes.PING))&&e(),t("web socket transmit error")}):this._makeRequestWithoutDataResponse({url:"ping",method:a})}exitBootloader(){return this._webSocketMode?new Promise((e,t)=>{this.sendArray(this._createWsCommand(s.api.packetTypes.EXIT_BOOTLOADER))&&e(),t("web socket transmit error")}):this._makeRequestWithoutDataResponse({url:"exit",method:a})}_wsBurn(){return new Promise((e,t)=>{this._wsBurnTimer=setInterval(()=>{if(this._wsBurnDone)this._updateStatusCallback({bytesOverall:this._firmwareArrayBuffer.byteLength,bytesBurned:this._firmwareArrayBuffer.byteLength,percent:100,finished:!0}),clearInterval(this._wsBurnTimer),e();else if(this._updateStatusCallback){const e={bytesOverall:this._firmwareArrayBuffer.byteLength,bytesBurned:this._wsBurned,percent:Math.round(100*this._wsBurned/this._firmwareArrayBuffer.byteLength),finished:!1};console.log(e),this._updateStatusCallback(e)}console.log("ws burn cycle operation"),this._sendWsReadyForDownloadPacket()||t()},100)})}isBurning(){return null!==this._firmwareArrayBuffer}burn(e){if(console.log("burn"),console.log(e),!e||this._firmwareArrayBuffer)return Promise.reject("burning already started");if(this._firmwareArrayBuffer=e,this._webSocketMode)return this._wsBurn();const t=new Headers;return t.set("Content-Type","application/octet-stream"),this._makeRequestWithoutDataResponse({url:"burn",method:n,headers:t,body:e}).catch(e=>{throw this._firmwareArrayBuffer=null,e})}}const h={error:document.querySelector(".error"),errorContent:document.querySelector(".error-content"),message:document.querySelector(".message"),messageContent:document.querySelector(".message-content"),appWrapper:document.querySelector(".app-wrapper"),webSocketIndicator:document.querySelector(".header-web-socket-inidicator"),exitBootloaderCheckbox:document.querySelector("#exit-boot"),exitBootloaderYesButton:document.querySelector("#exit-boot-yes"),exitBootloaderCancelButton:document.querySelector("#exit-boot-cancel"),chooseFirmwareButton:document.querySelector("#choose-firmware"),chosenFilenameSpan:document.querySelector(".main-choose-firmware-chosen-file"),chooseFirmwareDialogButton:document.querySelector("#file-input"),burnButton:document.querySelector("#burn"),burnStatusSpan:document.querySelector(".main-burn-status"),burnStatusProgressBar:document.querySelector(".main-burn-progress-bar")};let c=null;const u=function(e){const t=e;let r=null;return{show:e=>{t.querySelector("div").textContent=e,t.style.maxHeight="100px",t.style.opacity=1,r&&(clearTimeout(r),r=null),r=setTimeout(()=>{clearTimeout(r),t.style.maxHeight=0,t.style.opacity=0,r=null},s.ui.ERROR_SHOW_INTERVAL)}}},d=new u(h.error),_=new u(h.message),p=new l({wsConnectedCallback:e=>{h.webSocketIndicator.style.opacity=e?"0.7":"0"},updateStatusCallback:e=>{h.burnStatusSpan.textContent=e.percent+"%",h.burnStatusProgressBar.style.width=e.percent+"%",e.finished&&(h.burnStatusSpan.textContent="",h.burnStatusProgressBar.style.width="0")}});h.appWrapper.classList.remove("vertical-hided"),h.exitBootloaderCancelButton.addEventListener("click",()=>{h.exitBootloaderCheckbox.checked=!1}),h.exitBootloaderYesButton.addEventListener("click",()=>{p.exitBootloader().then(()=>{}).catch(e=>{d.show(e)})}),h.chooseFirmwareButton.addEventListener("click",()=>{c=null,h.burnButton.disabled=!0,h.chosenFilenameSpan.textContent="",h.chooseFirmwareDialogButton.click()}),h.chooseFirmwareDialogButton.addEventListener("change",e=>{const t=e.target.files[0];h.chosenFilenameSpan.textContent=t.name;const r=new FileReader;r.readAsArrayBuffer(t),r.onload=e=>{c=e.target.result,h.burnButton.disabled=!1}}),h.burnButton.addEventListener("click",()=>{h.burnButton.disabled||p.isBurning()||p.burn(c).then(()=>{_.show("BURN DONE!")}).catch(e=>{d.show(e)})}),p.init(),p.setAutopingMode(!0,5e3)}]);
//# sourceMappingURL=bundle.js.map