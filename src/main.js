import { Api } from './api';
import { ViewElements } from './view-elements';

const LogicElements = {
  burnProccess: {
    firmwareArrayBuffer: null,
    offset: 0,
  }
};

const api = new Api();

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
        alert(err);
      });
  });
  ViewElements.chooseFirmwareButton.addEventListener('click', () => {
    LogicElements.burnProccess.firmwareArrayBuffer = null;
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
      LogicElements.burnProccess.firmwareArrayBuffer = readerEvent.target.result;
      LogicElements.burnProccess.offset = 0;
      ViewElements.burnButton.disabled = false;
    };
  });
};

initView();

api.init();
api.setAutopingMode(true, 5000);