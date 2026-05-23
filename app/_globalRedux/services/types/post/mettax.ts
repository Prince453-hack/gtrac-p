// create token
export interface CreateTokenResponse {
  code: number;
  data: string;
  msg: string;
}

export interface GetMettaxDevicesResponse {
  code: number;
  data: {
    deviceData: {
      deviceName: string;
      model: string;
      deviceTime: string;
      address: any;
      speed: number;
      course: number;
      acc: number;
      lat: number;
      lon: number;
      num: number;
      signal: number;
      quantity: any;
      voltage: any;
      elec: number;
      type: number;
      voltageLevel: any;
      rssi: any;
      disarmingStatus: any;
      chargeStatus: any;
      blockedStatus: number;
    };
    expand: { status: boolean; activeTime: string; reportTime: string };
  }[];
  msg: string;
}

export interface GetMettaxDeviceInfoResponse {
  code: number;
  data: { id: string; channelName: string };
  msg: string;
}

export interface GetMettaxDeviceShadowResponse {
  code: number;
  data: {
    deviceData: {
      deviceName: string;
      deviceId: string;
      deviceTime: string;
      address: string | null;
      speed: number;
      course: number;
      acc: number;
      lat: number;
      lon: number;
      num: number;
      signal: number;
      quantity: any;
      voltage: any;
      elec: number;
      type: number;
      voltageLevel: any;
      rssi: any;
      disarmingStatus: any;
      chargeStatus: any;
      blockedStatus: number;
      odometer: number;
      accUpdateTime: any;
    };
    expand: {
      status: boolean;
      activeTime: string;
      reportTime: string;
    };
  }[];
  msg: string;
}

export interface GetMettaxTalkChannelResponse {
  code: number;
  data: {
    deviceId: string;
    channelId: number;
    talkChannel: string;
    talkUrl: string;
  };
  msg: string;
}
