import { Api } from './api';
import { AppConstants } from './constants';
import { ViewElements } from './view-elements';

let _firmwareArrayBuf = null;

const wrapModalMessage = function(modalElement) {
  const _modalElement = modalElement;
  let _timerId = null;
  return {
    show: (text) => {
      _modalElement.querySelector('div').textContent = text;
      _modalElement.style.maxHeight = '100px';
      _modalElement.style.opacity = 1;
      if(_timerId) {
        clearTimeout(_timerId);
        _timerId = null;
      }
      _timerId = setTimeout(() => {
        clearTimeout(_timerId);
        _modalElement.style.maxHeight = 0;
        _modalElement.style.opacity = 0;
        _timerId = null;
      }, AppConstants.ui.ERROR_SHOW_INTERVAL);    
    }
  };
};

const errorModal = new wrapModalMessage(ViewElements.error);
const messageModal = new wrapModalMessage(ViewElements.message);

const api = new Api({
  wsConnectedCallback: (isConnected) => {
    ViewElements.webSocketIndicator.style.opacity = isConnected ? '0.7' : '0';
  },
  updateStatusCallback: (status) => {
    ViewElements.burnStatusSpan.textContent = `${status.percent}%`;
    ViewElements.burnStatusProgressBar.style.width = `${status.percent}%`;
    if(status.finished) {
      ViewElements.burnStatusSpan.textContent = '';
      ViewElements.burnStatusProgressBar.style.width = '0';      
    }    
  }
});

const initView = () => {
  ViewElements.appWrapper.classList.remove('vertical-hided');
  ViewElements.exitBootloaderCancelButton.addEventListener('click', () => {
    ViewElements.exitBootloaderCheckbox.checked = false;
  });
  ViewElements.exitBootloaderYesButton.addEventListener('click', () => {
    api.exitBootloader()
      .then(() => {

      })
      .catch((err) => {
        errorModal.show(err);
      });
  });
  ViewElements.chooseFirmwareButton.addEventListener('click', () => {
    _firmwareArrayBuf = null;
    ViewElements.burnButton.disabled = true;
    ViewElements.chosenFilenameSpan.textContent = '';
    ViewElements.chooseFirmwareDialogButton.click();
  });
  ViewElements.chooseFirmwareDialogButton.addEventListener('change', (e) => {
    const file = e.target.files[0]; 
    ViewElements.chosenFilenameSpan.textContent = file.name;
    // setting up the reader
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    // here we tell the reader what to do when it's done reading...
    reader.onload = readerEvent => {
      _firmwareArrayBuf = readerEvent.target.result;
      ViewElements.burnButton.disabled = false;
    };
  });
  ViewElements.burnButton.addEventListener('click', () => {
    if(ViewElements.burnButton.disabled || api.isBurning()) {
      return;
    }
    api.burn(_firmwareArrayBuf)
    .then(() => {
      messageModal.show('BURN DONE!');
    })
    .catch((err) => {
      errorModal.show(err);
    });
  });
};

initView();

api.init();
api.setAutopingMode(true, 5000);