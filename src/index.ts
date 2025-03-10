export const resolution16By9Table = {
  '4k': {
    height: 4096,
    width: 2160
  },
  '720p': {
    height: 1280,
    width: 720
  }
} as const;
export const GlobalIdealCameraConstraints = {
  height: { ideal: resolution16By9Table['720p'].height },
  width: { ideal: resolution16By9Table['720p'].width },
  facingMode: { ideal: 'environment' },
  frameRate: { ideal: 60 }
};
export interface FailedCameraRequest {
  permissionState: {
    preRequest: BrowserPermissionStateClass,
    postRequest: BrowserPermissionStateClass
  },
  permissionGranted: false,
  result: { originalError: string, mappedError: CameraInitErrorClass },
  duration: number
}
export interface SuccessfulCameraRequestResult {
  stream: MediaStream,
  devices: MediaDeviceInfo[]
}
export interface SuccessfulCameraRequest {
  permissionState: {
    preRequest: BrowserPermissionStateClass,
    postRequest: BrowserPermissionStateClass
  },
  permissionGranted: true,
  result: SuccessfulCameraRequestResult,
  duration: number
}
export interface RequestRetryableBasic {
  value: typeof PermissionsRetryableClass.Yes | typeof PermissionsRetryableClass.No,
  detail: null
}
export type RequestRetryableAfterReload = {
  value: typeof PermissionsRetryableClass.AfterReload,
  detail: 'browser-button' | 'any-button'
}
export type RequestRetryableUnknown = {
  value: typeof PermissionsRetryableClass.Unknown,
  detail: null
}
export type RequestRetryableWithDetail = RequestRetryableUnknown | RequestRetryableAfterReload
export interface CameraRequestDeniedWrapper {
  permissionGranted: false,
  deniedBy: BrowserDeniedReasonClass,
  retryable: RequestRetryableBasic | RequestRetryableWithDetail,
  permissionState: BrowserPermissionStateClass,
  //if Permissionstate was already denied, no request will be sent => null
  request: FailedCameraRequest
}
export interface CameraRequestAcceptedWrapper {
  permissionGranted: true,
  permissionState: BrowserPermissionStateClass,
  request: SuccessfulCameraRequest
}


export class CameraInitErrorClass {
  private constructor(public readonly value: string) {}

  static readonly PermissionDismissed = new CameraInitErrorClass("PermissionDismissed");
  static readonly PermissionDenied = new CameraInitErrorClass("PermissionDenied");
  static readonly InUse = new CameraInitErrorClass("InUse");
  static readonly Overconstrained = new CameraInitErrorClass("Overconstrained");
  static readonly UnknownError = new CameraInitErrorClass("UnknownError");
  static readonly BrowserApiInaccessible = new CameraInitErrorClass("BrowserApiInaccessible");
  static readonly NoDevices = new CameraInitErrorClass("NoDevices");
  static readonly DeviceNotFound = new CameraInitErrorClass("DeviceNotFound");


  static from(value: string): CameraInitErrorClass | undefined {
    return Object.values(CameraInitErrorClass).find((e) => e.value === value);
  }

  toString(): string {
    return this.value;
  }
}

export class BrowserDeniedReasonClass {
  private constructor(public readonly value: string) {}

  static readonly Browser = new BrowserDeniedReasonClass("Browser");
  static readonly User = new BrowserDeniedReasonClass("User");


  static from(value: string): BrowserDeniedReasonClass | undefined {
    return Object.values(BrowserDeniedReasonClass).find((e) => e.value === value);
  }

  toString(): string {
    return this.value;
  }
}



export class BrowserPermissionStateClass {
  private constructor(public readonly value: string) {}

  static readonly Granted = new BrowserPermissionStateClass("Granted");
  static readonly Denied = new BrowserPermissionStateClass("Denied");
  static readonly Prompt = new BrowserPermissionStateClass("Prompt");
  static readonly Error = new BrowserPermissionStateClass("Error");


  static from(value: string): BrowserPermissionStateClass | undefined {
    return Object.values(BrowserPermissionStateClass).find((e) => e.value === value);
  }

  toString(): string {
    return this.value;
  }
}



export class PermissionsRetryableClass {
  private constructor(public readonly value: string) {}

  static readonly Yes = new PermissionsRetryableClass("Yes");
  static readonly No = new PermissionsRetryableClass("No");
  static readonly AfterReload = new PermissionsRetryableClass("AfterReload");
  static readonly Unknown = new PermissionsRetryableClass("Unknown");


  static from(value: string): PermissionsRetryableClass | undefined {
    return Object.values(PermissionsRetryableClass).find((e) => e.value === value);
  }

  toString(): string {
    return this.value;
  }
}
export const EventRegistry = ['video-devicelist-update', 'log', 'permission-status-change'] as const

type EventDataMap = {
  'video-devicelist-update': Map<string, MediaDeviceInfo>; // Example: Array of video devices
  'log': string; // Example: Log data,
  'permission-status-change': {
    detail: string,
    state: BrowserPermissionStateClass
  }
};
type EventListeners = {
  [K in typeof EventRegistry[number]]: Array<(data: EventDataMap[K]) => void>;
};
export class CameraPermissionHandler {
  public onLoadPermissionResult: null | { duration: number, response: SuccessfulCameraRequest | FailedCameraRequest, postRequestState: BrowserPermissionStateClass } = null;
  public selectedDeviceId: string | null = null;
  public videoDevices: Map<string,MediaDeviceInfo> = new Map();
  public activeStreams: Map<string,MediaStream> = new Map();
  //public videoElementId: string | null = null;
  public events: EventListeners;
  constructor() {
    this.events = EventRegistry.reduce(
        (acc, event) => ({...acc, [event]: []}),
        {} as EventListeners
    )
  }
  public on<K extends keyof EventDataMap>(
      eventName: K,
      listener: (data: EventDataMap[K]) => void
  ) {
    this.events[eventName].push(listener)
  }
  private emit<K extends keyof EventDataMap>(eventName: K, data: EventDataMap[K])  {
      this.events[eventName].forEach((listener: (data: EventDataMap[K]) => void) => {
        listener(data); // Invoke listener with the correct type
      });
  }
  public async getBrowserPermissionState(): Promise<{ state: BrowserPermissionStateClass, detail: string }> {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const perm = await navigator.permissions.query({ name: 'camera' });
      //console.log('permname',perm.name)
      if(perm.state === 'granted'){
        return {
          state: BrowserPermissionStateClass.Granted,
          detail: 'Requests for camera access will be granted immediately'
        };
      }
      else if(perm.state === 'denied') {
        return {
          state: BrowserPermissionStateClass.Denied,
          detail: 'Requests will be denied immediately'
        };
      }
      else {
        return {
          state: BrowserPermissionStateClass.Prompt,
          detail: 'Requests will trigger a prompt to the user. The users input decides if access is allowed or not'
        };
      }
    } catch (e) {
      return {
        state: BrowserPermissionStateClass.Error,
        detail: String(e)
      }
    }

  }

  public async stopCameraByStream(stream: MediaStream, track?: MediaStreamTrack) {
    const streamCameraId = this.getMediaDeviceByStream(stream).videoDevice?.deviceId;
    if(!streamCameraId) {
      return CameraInitErrorClass.DeviceNotFound;
    }
    if(!track) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      if(streamCameraId) {
        this.activeStreams.delete(streamCameraId);
      }
      return;
    }
    stream.removeTrack(track);
  }
  public async stopCameraStreamById(cameraId: string, track?: MediaStreamTrack) {
    const res = this.activeStreams.get(cameraId);
    if(!res) {
      return CameraInitErrorClass.DeviceNotFound;
    }
    if(track) {
      res.removeTrack(track);
    }
    else {
      res.getTracks().forEach(track => {
        track.stop();
      });
    }
  }
  public getPreferredCamera(videoDevices: MediaDeviceInfo[]) {
    const environmentCamera = videoDevices.find(device =>
      device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('environment')
    );

    if (environmentCamera) {
      return {
        facing: 'environment',
        id: environmentCamera.deviceId
      };
    }

    const userCamera = videoDevices.find(device =>
      device.label.toLowerCase().includes('front') ||
            device.label.toLowerCase().includes('user')
    );

    if (userCamera) {
      return {
        facing: 'front',
        id: userCamera.deviceId
      };
    }

    return {
      facing: 'unknown',
      id: videoDevices[0].deviceId // Use the first available camera
    };
  }

  private cameraErrorMessageMapper(e: any): { originalError: string, mappedError: CameraInitErrorClass } {
    const stringedError = String(e);
    if(!stringedError || !e.name) {
      return {
        originalError: stringedError,
        mappedError: CameraInitErrorClass.UnknownError
      }
    }
    if(stringedError === 'OverconstrainedError') {
      return {
        originalError: stringedError,
        mappedError: CameraInitErrorClass.Overconstrained };
    }
    const errorDetail = ((String(e).split(':'))[1]).trim();
    if(e.name === 'NotAllowedError' && stringedError.includes('denied')){//errorDetail === 'Permission denied'){
      return {
        originalError: stringedError,
        mappedError: CameraInitErrorClass.PermissionDenied
      };
    }
    else if(e.name === 'NotAllowedError' && stringedError.includes('dismissed')) {// errorDetail === 'Permission dismissed') {
      return {
        originalError: stringedError,
        mappedError: CameraInitErrorClass.PermissionDismissed
      };
    }
    else if(e.name === 'NotReadableError' && errorDetail === 'Device in use') {
      return {
        originalError: stringedError,
        mappedError: CameraInitErrorClass.InUse
      };
    }
    else if(stringedError.toLowerCase().includes('start') && stringedError.toLowerCase().includes('failed')) {
      return {
        originalError: stringedError,
        mappedError: CameraInitErrorClass.InUse
      }
    }
    /*else if(e.name === 'Timeout') {
      CameraInitErrorClass.Timeout;
    }*/
    else {
      return {
        originalError: stringedError,
        mappedError: CameraInitErrorClass.UnknownError
      };
    }
  }
  private getReloadButtonType(): { result: 'browser-button' | 'any-button', browser: string } {
    const userAgent = navigator.userAgent.toLowerCase();
    const browserButtonRequiredBrowserRegexList = new Map([
      ['firefox_desktop', new RegExp('^(?=.*firefox)(?!.*(mobile|tablet|android)).*$', 'i')]
    ]);
    for (const [key, value] of browserButtonRequiredBrowserRegexList) { // Using the default iterator (could be `map.entries()` instead)
      //console.log(value.test(userAgent), userAgent);
      if(value.test(userAgent)) {
        return { result: 'browser-button', browser: key };
      }
    }
    return { result: 'any-button', browser: 'any' };
  }
  private cameraPermissionDeniedReason(deniedAfterMs: number, browserDeniedThreshold = 200) {
    return deniedAfterMs <= browserDeniedThreshold ? BrowserDeniedReasonClass.Browser : BrowserDeniedReasonClass.User;
  }
  public async requestVideoDevice(userMediaConstraints: MediaStreamConstraints = { video: { ...GlobalIdealCameraConstraints}  }): Promise<SuccessfulCameraRequest | FailedCameraRequest> {
    const start = performance.now();
    const preRequestState = (await this.getBrowserPermissionState()).state;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(userMediaConstraints);//this.timeoutWrapper(5000);
      const videoDevices = await navigator.mediaDevices.enumerateDevices();
      //console.log('getUserMedia', performance.now() - start);
      const acceptedGetUserMediaTime = performance.now() - start;
      const postRequestPermissionState = (await this.getBrowserPermissionState()).state;
      return {
        permissionState: {
          preRequest: preRequestState,
          postRequest: postRequestPermissionState
        },
        permissionGranted: true,
        result: { stream, devices: videoDevices.filter(device => device.kind === 'videoinput') },
        duration: acceptedGetUserMediaTime
      };
    }
    catch(e) {
      const deniedGetUserMediaTime = performance.now() - start;
      const postRequestPermissionState = (await this.getBrowserPermissionState()).state;
      return {
        permissionState: {
          preRequest: preRequestState,
          postRequest: postRequestPermissionState
        },
        permissionGranted: false,
        result: this.cameraErrorMessageMapper(e),
        duration: deniedGetUserMediaTime
      };
    }
  }
  public async getVideoDevices(): Promise<{ successful: true, result: MediaDeviceInfo[], duration: number } | { successful: false, result: string, duration: number }> {
    const start = performance.now();
    try {
      const videoDevices = await navigator.mediaDevices.enumerateDevices();
      const acceptedEnumerateTime = performance.now() - start;
      return {
        successful: true,
        result: videoDevices.filter(device => device.kind === 'videoinput'),
        duration: acceptedEnumerateTime
      };
    }
    catch(e) {
      const deniedEnumerateTime = performance.now() - start;
      return {
        successful: false,
        result: String(e),
        duration: deniedEnumerateTime
      };
    }
  }
  public getMediaDeviceByStream(stream: MediaStream) {
    const videoTrack = stream.getVideoTracks()[0];
    const videoDevice = videoTrack ? videoTrack.getSettings() : null;
    return { videoDevice: videoDevice };
  }
  public async startCamera(id?: string, constraints?: MediaStreamConstraints): Promise<CameraRequestAcceptedWrapper | CameraRequestDeniedWrapper | CameraInitErrorClass> {
    const initalConstraints = {
      video: {}
    };
    if(constraints && constraints.video !== undefined) {
      if(typeof constraints.video === 'boolean') {
        initalConstraints.video = { deviceId: id ? { exact: id } : true };
      } else {
        initalConstraints.video = { ...constraints.video, deviceId: id ? { exact: id } : undefined, };
      }
    }
    else {
      initalConstraints.video = { ...GlobalIdealCameraConstraints, deviceId: id ? { exact: id } : undefined, };
    }
    if(!navigator?.mediaDevices?.getUserMedia) {
      return CameraInitErrorClass.BrowserApiInaccessible
    }
    const devices = await this.getVideoDevices()
    if(devices.successful && devices.result.length === 0) {
      return CameraInitErrorClass.NoDevices
    }
    const onLoadPermissionState = (await this.getBrowserPermissionState()).state;
    const onLoadPermissionResult = await this.requestVideoDevice(initalConstraints);

    if(onLoadPermissionState === BrowserPermissionStateClass.Denied) {
      return this.permissionDeniedHandler(onLoadPermissionResult)
    }
    if(onLoadPermissionState === BrowserPermissionStateClass.Granted) {
      return this.permissionGrantedHandler(onLoadPermissionResult)
    }
    if(onLoadPermissionState === BrowserPermissionStateClass.Prompt) {
      return this.permissionPromptHandler(onLoadPermissionResult)
    }
    if(onLoadPermissionState === BrowserPermissionStateClass.Error) {
      return this.permissionErrorhandler(onLoadPermissionResult)
      //TODO Write handler for this
    }
    return CameraInitErrorClass.UnknownError
    /*
    const onLoadPermissionState = (await this.getCameraPermissionState()).state;
    if(onLoadPermissionState === BrowserPermissionStateClass.Denied) {
      const deniedOnLoad: CameraRequestDeniedWrapper = {
        permissionState: BrowserPermissionStateClass.Denied,
        retryable: { value: PermissionsRetryableClass.No, detail: null },
        deniedBy: BrowserDeniedReasonClass.Browser,
        request: null,
        permissionGranted: false
      };
      return deniedOnLoad;
      //return { ...this.showManualEnableMock(CameraError.BrowserDenied), };
    }
    if(onLoadPermissionState === BrowserPermissionStateClass.Granted) {
      const test = await this.getVideoDevicePermissionWrapper(constraints);
      if(!test.permissionGranted) {
        //TODO handle generic error not related to permission
        return;
      }
      this.videoDevices = test.result.devices;
      this.emit('video-devicelist-update', this.videoDevices);
      const grantedOnLoad: CameraRequestAcceptedWrapper = {
        permissionGranted: true,
        permissionState: BrowserPermissionStateClass.Granted,
        request: test
      };
      return grantedOnLoad;
    }
    //state === prompt
    const promptResponse = await this.getVideoDevicePermissionWrapper(constraints);
    if(promptResponse.permissionGranted) {
      //this.videoElementId = elementId;
      const grantedOnRequest: CameraRequestAcceptedWrapper= {
        permissionGranted: true,
        permissionState: BrowserPermissionStateClass.Granted,
        request: promptResponse
      };
      this.videoDevices = promptResponse.result.devices;
      this.emit('video-devicelist-update', this.videoDevices);
      return grantedOnRequest;//await this.startCameraAfterSuccessfulPrompt(promptResponse.result.stream, promptResponse.result.devices); //handleOnLoadPermissionSuccess()
    }
    //same as: await this.handleOnloadPermissionFailure({ permissionFailureTimeMs: endPromptTimer });

    if(!promptResponse.permissionGranted) {

      //find out if request was temporarily denied or
      //if(permState === 'granted') throw new Error('State granted in failure handler');
      const rejectedReason = this.cameraPermissionDeniedReason(promptResponse.duration);
      if(promptResponse.permissionState.postRequest === BrowserPermissionStateClass.Denied) {
        const deniedOnPromptNoRetry: CameraRequestDeniedWrapper = {
          permissionGranted: false,
          deniedBy: rejectedReason,
          permissionState: BrowserPermissionStateClass.Denied,
          retryable: { value: PermissionsRetryableClass.No, detail: null },
          request: promptResponse
        };
        return deniedOnPromptNoRetry;
      }
      //Prompt is retryable
      const browserRejected = rejectedReason === BrowserDeniedReasonClass.Browser;
      const browserRejectedOnLoad = this.onLoadPermissionResult && this.onLoadPermissionResult.duration && this.cameraPermissionDeniedReason(this.onLoadPermissionResult.duration) === BrowserDeniedReasonClass.Browser;
      const onLoadRequestRetryable = this.onLoadPermissionResult && this.onLoadPermissionResult.postRequestState === BrowserPermissionStateClass.Prompt;
      if(browserRejectedOnLoad && onLoadRequestRetryable && browserRejected) {
        //This edgecase appears on firefox mobile, where it seems like the browser permission variable for the camera is not updated correctly.
        //We check if the browser has rejected the camera onLoad and what the retry-state was after the rejection.
        //if the state is "prompt", meaning the browser says it allows another prompt, but the new prompt is rejected by the browser again,
        // we can assume that the state being "prompt" is incorrectly reported and that we are NOT allowed to prompt
        const deniedOnPromptFirefoxEdgecase: CameraRequestDeniedWrapper = {
          permissionGranted: false,
          deniedBy: BrowserDeniedReasonClass.Browser,
          retryable: { value: PermissionsRetryableClass.No, detail: null },
          permissionState: BrowserPermissionStateClass.Denied,
          //if Permissionstate was already denied, no request will be sent => null
          request: promptResponse
        };
        return deniedOnPromptFirefoxEdgecase;
        //return this.showManualEnableMock(CameraError.BrowserDenied);
      }


      if(rejectedReason === BrowserDeniedReasonClass.Browser) {
        const deniedOnPromptBrowser: CameraRequestDeniedWrapper = {
          permissionGranted: false,
          deniedBy: BrowserDeniedReasonClass.Browser,
          retryable: { value: PermissionsRetryableClass.AfterReload, detail: this.getReloadButtonType().result },
          permissionState: (await this.getCameraPermissionState()).state,
          //if Permissionstate was already denied, no request will be sent => null
          request: promptResponse
        };
        return deniedOnPromptBrowser;
        //return this.showManualReloadMock(CameraError.BrowserDenied);
      }
      const deniedOnPromptUser: CameraRequestDeniedWrapper = {
        permissionGranted: false,
        deniedBy: BrowserDeniedReasonClass.User,
        retryable: { value: PermissionsRetryableClass.Yes, detail: null },
        permissionState: (await this.getCameraPermissionState()).state,
        //if Permissionstate was already denied, no request will be sent => null
        request: promptResponse
      };
      return deniedOnPromptUser;
    }
    throw new Error('Unexpected behavior on init' + String((await this.getCameraPermissionState()).state));
    */
  }

  /*private async timeoutWrapper(delay: number, constraints: MediaStreamConstraints = { video: true }): Promise<MediaStream> {
    // Create a promise for the getUserMedia request
    const mediaPromise = navigator.mediaDevices.getUserMedia(constraints);
    const timeoutMessage = 'Timeout: Media request took too long';
    // Set up a timeout to throw an error after the delay
    const timeoutPromise: Promise<string> = new Promise((reject) =>
      setTimeout(() => reject(timeoutMessage), delay)
    );

    const result = await Promise.any([mediaPromise, timeoutPromise]);
    if(typeof result === 'string') {
      throw new Error(timeoutMessage);
    }
    return result;
  }*/
  public async initHandler(constraints: MediaStreamConstraints = { video: GlobalIdealCameraConstraints }): Promise<CameraRequestAcceptedWrapper | CameraRequestDeniedWrapper | CameraInitErrorClass> {
    if(!navigator?.mediaDevices?.getUserMedia) {
      return CameraInitErrorClass.BrowserApiInaccessible
    }
    const devices = await this.getVideoDevices()
    if(devices.successful && devices.result.length === 0) {
      return CameraInitErrorClass.NoDevices
    }
    if(devices.successful && devices.result.length > 0) {
      devices.result.forEach(dev => {
        this.videoDevices.set(dev.deviceId, dev)
      })
      this.emit('video-devicelist-update', this.videoDevices)
    }
    if(navigator.mediaDevices.ondevicechange === null) {
      navigator.mediaDevices.ondevicechange = async () => {
        const devices = await this.getVideoDevices()
        if(devices.successful) {
          devices.result.forEach(dev => {
            this.videoDevices.set(dev.deviceId, dev)
          })
          this.emit('video-devicelist-update', this.videoDevices)
        }
      }
      this.emit('log', 'Installed camera-device-change watcher')
    }
    if(navigator.permissions.query) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const state = await navigator.permissions.query({ name: 'camera' })
      state.onchange = async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const perm = await navigator.permissions.query({ name: 'camera' });
          //console.log('permname',perm.name)
          if(perm.state === 'granted'){
            this.emit('permission-status-change', {
              state: BrowserPermissionStateClass.Granted,
              detail: 'Requests for camera access will be granted immediately'
            })
          }
          else if(perm.state === 'denied') {
            this.emit('permission-status-change', {
              state: BrowserPermissionStateClass.Denied,
              detail: 'Requests will be denied immediately'
            })
          }
          else {
            this.emit('permission-status-change', {
              state: BrowserPermissionStateClass.Prompt,
              detail: 'Requests will trigger a prompt to the user. The users input decides if access is allowed or not'
            })
          }
        } catch (e) {
          this.emit('permission-status-change', {
            state: BrowserPermissionStateClass.Error,
            detail: String(e)
          })
        }
      }
      this.emit('log', 'Installed camera-browser-permission watcher')
    }

    const onLoadPermissionState = (await this.getBrowserPermissionState()).state;
    const onLoadPermissionResult = await this.requestVideoDevice(constraints);
    this.onLoadPermissionResult = {
      duration: onLoadPermissionResult.duration,
      response: onLoadPermissionResult,
      postRequestState: onLoadPermissionResult.permissionState.postRequest
    };

    if(onLoadPermissionState === BrowserPermissionStateClass.Denied) {
      return this.permissionDeniedHandler(onLoadPermissionResult)
    }
    if(onLoadPermissionState === BrowserPermissionStateClass.Granted) {
      return this.permissionGrantedHandler(onLoadPermissionResult)
    }
    if(onLoadPermissionState === BrowserPermissionStateClass.Prompt) {
      return this.permissionPromptHandler(onLoadPermissionResult)
    }
    if(onLoadPermissionState === BrowserPermissionStateClass.Error) {
      return this.permissionErrorhandler(onLoadPermissionResult)
      //TODO Write handler for this
    }
    return CameraInitErrorClass.UnknownError
  }

  private permissionGrantedHandler(request: SuccessfulCameraRequest | FailedCameraRequest): CameraRequestDeniedWrapper | CameraRequestAcceptedWrapper | CameraInitErrorClass {
    if(request.permissionGranted) {
      request.result.devices.forEach(dev => {
        this.videoDevices.set(dev.deviceId, dev)
      })
      this.activeStreams.set(request.result.stream.id, request.result.stream);
      this.emit('video-devicelist-update', this.videoDevices);
      const grantedOnLoad: CameraRequestAcceptedWrapper = {
        permissionGranted: true,
        permissionState: BrowserPermissionStateClass.Granted,
        request: request
      };
      return grantedOnLoad;
    }
    if(!request.permissionGranted) {
      //throw new Error('State is granted, but camera gave error. THIS IS MOST LIKELY BECAUSE CAMERA ALREADY IN USE');
      request.result.mappedError = CameraInitErrorClass.InUse
      const startCameraError: CameraRequestDeniedWrapper = {
        deniedBy: this.cameraPermissionDeniedReason(request.duration),
        permissionGranted: false,
        permissionState: request.permissionState.postRequest,
        request: request,
        retryable: { value: PermissionsRetryableClass.Unknown, detail: null }
      }
      return startCameraError
    }
    return CameraInitErrorClass.UnknownError
  }
  private permissionDeniedHandler(request: SuccessfulCameraRequest | FailedCameraRequest): CameraRequestDeniedWrapper | CameraRequestAcceptedWrapper | typeof CameraInitErrorClass.UnknownError {
    if(!request.permissionGranted) {

      const deniedOnLoad: CameraRequestDeniedWrapper = {
        permissionState: BrowserPermissionStateClass.Denied,
        retryable: { value: PermissionsRetryableClass.No, detail: null},
        deniedBy: BrowserDeniedReasonClass.Browser, //this.getRejectedReason(onLoadPermissionResult.duration),
        request: request,
        permissionGranted: false
      };
      return deniedOnLoad;
    }
    if(request.permissionGranted) {
      const grantedOnDeniedState: CameraRequestAcceptedWrapper = {
        permissionGranted: true,
        permissionState: request.permissionState.postRequest,
        request: request
      }
      return grantedOnDeniedState
    }
    return CameraInitErrorClass.UnknownError
  }
  private permissionPromptHandler(request: SuccessfulCameraRequest | FailedCameraRequest): CameraRequestDeniedWrapper | CameraRequestAcceptedWrapper | typeof CameraInitErrorClass.UnknownError {
    const rejectedReason =  this.cameraPermissionDeniedReason(request.duration)
    if(!request.permissionGranted && request.permissionState.postRequest === BrowserPermissionStateClass.Denied) {
      //non-retryable
      const deniedOnPromptNoRetry: CameraRequestDeniedWrapper = {
        permissionGranted: false,
        deniedBy: rejectedReason,
        permissionState: BrowserPermissionStateClass.Denied,
        retryable: { value: PermissionsRetryableClass.No, detail: null },
        request: request
      };
      return deniedOnPromptNoRetry;
    }
    //firefox edgecase
    const browserRejected = rejectedReason === BrowserDeniedReasonClass.Browser;
    const browserRejectedOnLoad = this.onLoadPermissionResult && typeof this.onLoadPermissionResult.duration === 'number' && this.cameraPermissionDeniedReason(this.onLoadPermissionResult.duration) === BrowserDeniedReasonClass.Browser;
    const onLoadRequestRetryable = this.onLoadPermissionResult && this.onLoadPermissionResult.postRequestState === BrowserPermissionStateClass.Prompt;
    const firefoxEdgecase = browserRejectedOnLoad && onLoadRequestRetryable && browserRejected

    if(!request.permissionGranted && firefoxEdgecase) {
      const deniedOnPromptFirefoxEdgecase: CameraRequestDeniedWrapper = {
        permissionGranted: false,
        deniedBy: BrowserDeniedReasonClass.Browser,
        retryable: { value: PermissionsRetryableClass.No, detail: null },
        permissionState: BrowserPermissionStateClass.Denied,
        //if Permissionstate was already denied, no request will be sent => null
        request: request
      };
      return deniedOnPromptFirefoxEdgecase;
    }
    if(!request.permissionGranted && rejectedReason === BrowserDeniedReasonClass.Browser) {
      const deniedOnPromptBrowser: CameraRequestDeniedWrapper = {
        permissionGranted: false,
        deniedBy: BrowserDeniedReasonClass.Browser,
        retryable: { value: PermissionsRetryableClass.AfterReload, detail: this.getReloadButtonType().result },
        permissionState: request.permissionState.postRequest,
        //if Permissionstate was already denied, no request will be sent => null
        request: request
      };
      return deniedOnPromptBrowser;
      //return this.showManualReloadMock(CameraError.BrowserDenied);
    }
    if(!request.permissionGranted && rejectedReason === BrowserDeniedReasonClass.User && request.result.mappedError) {
      const deniedOnPromptUser: CameraRequestDeniedWrapper = {
        permissionGranted: false,
        deniedBy: BrowserDeniedReasonClass.User,
        retryable: { value: PermissionsRetryableClass.Yes, detail: null},
        permissionState: request.permissionState.postRequest,
        //if Permissionstate was already denied, no request will be sent => null
        request: request
      };
      return deniedOnPromptUser;
    }
    if(!request.permissionGranted && rejectedReason === BrowserDeniedReasonClass.User) {
      const deniedOnPromptUser: CameraRequestDeniedWrapper = {
        permissionGranted: false,
        deniedBy: BrowserDeniedReasonClass.User,
        retryable: { value: PermissionsRetryableClass.Yes, detail: null},
        permissionState: request.permissionState.postRequest,
        //if Permissionstate was already denied, no request will be sent => null
        request: request
      };
      return deniedOnPromptUser;
    }
    if(request.permissionGranted) {
      const acceptedOnPrompt: CameraRequestAcceptedWrapper = {
        permissionGranted: true,
        permissionState: request.permissionState.postRequest,
        request: request,
      }
      return acceptedOnPrompt
    }
    return CameraInitErrorClass.UnknownError
  }
  private permissionErrorhandler(request: SuccessfulCameraRequest | FailedCameraRequest): CameraRequestDeniedWrapper | CameraRequestAcceptedWrapper |  typeof CameraInitErrorClass.UnknownError {
    if(request.permissionGranted) {
      const acceptedOnError: CameraRequestAcceptedWrapper = {
        permissionGranted: true,
        request,
        permissionState: BrowserPermissionStateClass.Error
      }
      return acceptedOnError
    }
    if(!request.permissionGranted) {
      const rejectedOnError: CameraRequestDeniedWrapper = {
        permissionGranted: false,
        permissionState: BrowserPermissionStateClass.Error,
        request,
        deniedBy: this.cameraPermissionDeniedReason(request.duration),
        retryable: { value: PermissionsRetryableClass.Unknown, detail: null }
      }
      return rejectedOnError
    }
    return CameraInitErrorClass.UnknownError
  }

}