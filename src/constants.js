export const AppConstants = {
  api: {
    MAGIC: 0xFF0110FF,
    PACKET_FIELD_SIZE_MAGIC: 4,
    PACKET_FIELD_SIZE_TYPE: 2,
    PACKET_FIELD_SIZE_DATA_LENGTH: 4,
    packetTypes: {
      EXIT_BOOTLOADER: 0x0001,
      READY_FOR_DOWNLOAD_REQUEST: 0x0002,
      READY_FOR_DOWNLOAD_RESPONSE: 0x0003,
      FIRMWARE_FRAGMENT_REQUEST: 0x0004,
      FIRMWARE_FRAGMENT_RESPONSE: 0x0005,
      PING: 0x0006,
    },
    WS_ENDPOINT: 'bootloader',
    HTTP_ENDPOINT: `http://${location.host}/bootloader`
  }
};