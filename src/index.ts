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
    preRequest: BrowserPermissionState,
    postRequest: BrowserPermissionState
  },
  permissionGranted: false,
  result: { originalError: string, mappedError: CameraInitError },
  duration: number
}
export interface SuccessfulCameraRequestResult {
  stream: MediaStream,
  devices: MediaDeviceInfo[]
}
export interface SuccessfulCameraRequest {
  permissionState: {
    preRequest: BrowserPermissionState,
    postRequest: BrowserPermissionState
  },
  permissionGranted: true,
  result: SuccessfulCameraRequestResult,
  duration: number
}
export interface RequestRetryableBasic {
  value: PermissionsRetryable.Yes | PermissionsRetryable.No,
  detail: null
}
export type RequestRetryableAfterReload = {
  value: PermissionsRetryable.AfterReload,
  detail: 'browser-button' | 'any-button'
}
export type RequestRetryableUnknown = {
  value: PermissionsRetryable.Unknown,
  detail: null
}
export type RequestRetryableWithDetail = RequestRetryableUnknown | RequestRetryableAfterReload
export interface CameraRequestDeniedWrapper {
  permissionGranted: false,
  deniedBy: BrowserDeniedReason,
  retryable: RequestRetryableBasic | RequestRetryableWithDetail,
  permissionState: BrowserPermissionState,
  //if Permissionstate was already denied, no request will be sent => null
  request: null | FailedCameraRequest
}
export interface CameraRequestAcceptedWrapper {
  permissionGranted: true,
  permissionState: BrowserPermissionState,
  request: SuccessfulCameraRequest
}

export enum CameraInitError {
  PermissionDenied = 'PermissionDenied',
  PermissionDismissed = 'PermissionDismissed',
  InUse = 'InUse',
  Overconstrained = 'Overconstrained',
  UnknownError = 'UnknownError',
  BrowserApiInaccessible = 'BrowserApiInaccessible',
  NoDevices = 'NoDevices'
}
export enum BrowserDeniedReason {
    Browser = 'Browser',
    User = 'User'
}

export enum BrowserPermissionState {
    Granted = 'Granted',
    Denied = 'Denied',
    Prompt = 'Prompt',
  Error = 'Error'
}
export enum PermissionsRetryable {
    Yes = 'Yes',
    No = 'No',
    AfterReload = 'AfterReload',
    Unknown = 'Unknown'
}
export enum BrowserType {
    Chromium = 'Chromium',
    Firefox = 'Firefox',
    Safari = 'Safari',
    Unknown = 'Unknown'
}
export const EventRegistry = ['video-devicelist-update', 'log', 'permission-status-change'] as const

type EventDataMap = {
  'video-devicelist-update': Map<string, MediaDeviceInfo>; // Example: Array of video devices
  'log': string; // Example: Log data,
  'permission-status-change': {
    detail: string,
    state: BrowserPermissionState
  }
};
type EventListeners = {
  [K in typeof EventRegistry[number]]: Array<(data: EventDataMap[K]) => void>;
};
export class CameraPermissionHandler {
  public onLoadPermissionResult: null | { duration: number, response: SuccessfulCameraRequest | FailedCameraRequest, postRequestState: BrowserPermissionState } = null;
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
  public async getCameraPermissionState(): Promise<{ state: BrowserPermissionState, detail: string }> {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const perm = await navigator.permissions.query({ name: 'camera' });
      //console.log('permname',perm.name)
      if(perm.state === 'granted'){
        return {
          state: BrowserPermissionState.Granted,
          detail: 'Requests for camera access will be granted immediately'
        };
      }
      else if(perm.state === 'denied') {
        return {
          state: BrowserPermissionState.Denied,
          detail: 'Requests will be denied immediately'
        };
      }
      else {
        return {
          state: BrowserPermissionState.Prompt,
          detail: 'Requests will trigger a prompt to the user. The users input decides if access is allowed or not'
        };
      }
    } catch (e) {
      return {
        state: BrowserPermissionState.Error,
        detail: String(e)
      }
    }

  }

  public async stopCameraStream(stream: MediaStream, track?: MediaStreamTrack) {
    const streamCameraId = this.getMediaDeviceByStream(stream).videoDeviceId?.deviceId;
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
      return 'not found';
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
    this.emit('log',JSON.stringify(videoDevices));
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

  private cameraErrorMessageMapper(e: any): { originalError: string, mappedError: CameraInitError } {
    const stringedError = String(e);
    console.log('str',stringedError)
    if(!stringedError || !e.name) {
      return {
        originalError: stringedError,
        mappedError: CameraInitError.UnknownError
      }
    }
    if(stringedError === 'OverconstrainedError') {
      return {
        originalError: stringedError,
        mappedError: CameraInitError.Overconstrained };
    }
    const errorDetail = ((String(e).split(':'))[1]).trim();
    if(e.name === 'NotAllowedError' && stringedError.includes('denied')){//errorDetail === 'Permission denied'){
      return {
        originalError: stringedError,
        mappedError: CameraInitError.PermissionDenied
      };
    }
    else if(e.name === 'NotAllowedError' && stringedError.includes('dismissed')) {// errorDetail === 'Permission dismissed') {
      return {
        originalError: stringedError,
        mappedError: CameraInitError.PermissionDismissed
      };
    }
    else if(e.name === 'NotReadableError' && errorDetail === 'Device in use') {
      return {
        originalError: stringedError,
        mappedError: CameraInitError.InUse
      };
    }
    else if(stringedError.toLowerCase().includes('start') && stringedError.toLowerCase().includes('failed')) {
      return {
        originalError: stringedError,
        mappedError: CameraInitError.InUse
      }
    }
    /*else if(e.name === 'Timeout') {
      CameraInitError.Timeout;
    }*/
    else {
      return {
        originalError: stringedError,
        mappedError: CameraInitError.UnknownError
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
    return deniedAfterMs <= browserDeniedThreshold ? BrowserDeniedReason.Browser : BrowserDeniedReason.User;
  }
  public async getVideoDevicePermissionWrapper(userMediaConstraints: MediaStreamConstraints = { video: { ...GlobalIdealCameraConstraints}  }): Promise<SuccessfulCameraRequest | FailedCameraRequest> {
    const start = performance.now();
    const preRequestState = (await this.getCameraPermissionState()).state;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(userMediaConstraints);//this.timeoutWrapper(5000);
      const videoDevices = await navigator.mediaDevices.enumerateDevices();
      //console.log('getUserMedia', performance.now() - start);
      const acceptedGetUserMediaTime = performance.now() - start;
      const postRequestPermissionState = (await this.getCameraPermissionState()).state;
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
      const postRequestPermissionState = (await this.getCameraPermissionState()).state;
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
  public async getDevicesWrapper(): Promise<{ successful: true, result: MediaDeviceInfo[], duration: number } | { successful: false, result: string, duration: number }> {
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
    const videoDeviceId = videoTrack ? videoTrack.getSettings() : null;
    return { videoDeviceId };
  }
  public async startCamera(id?: string, constraints?: MediaStreamConstraints): Promise<CameraRequestAcceptedWrapper | CameraRequestDeniedWrapper | CameraInitError> {
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
      return CameraInitError.BrowserApiInaccessible
    }
    const devices = await this.getDevicesWrapper()
    if(devices.successful && devices.result.length === 0) {
      return CameraInitError.NoDevices
    }
    const onLoadPermissionState = (await this.getCameraPermissionState()).state;
    const onLoadPermissionResult = await this.getVideoDevicePermissionWrapper(constraints);

    if(onLoadPermissionState === BrowserPermissionState.Denied) {
      return this.permissionDeniedHandler(onLoadPermissionResult)
    }
    if(onLoadPermissionState === BrowserPermissionState.Granted) {
      return this.permissionGrantedHandler(onLoadPermissionResult)
    }
    if(onLoadPermissionState === BrowserPermissionState.Prompt) {
      return this.permissionPromptHandler(onLoadPermissionResult)
    }
    if(onLoadPermissionState === BrowserPermissionState.Error) {
      return this.permissionErrorhandler(onLoadPermissionResult)
      //TODO Write handler for this
    }
    return CameraInitError.UnknownError
    /*
    const onLoadPermissionState = (await this.getCameraPermissionState()).state;
    if(onLoadPermissionState === BrowserPermissionState.Denied) {
      const deniedOnLoad: CameraRequestDeniedWrapper = {
        permissionState: BrowserPermissionState.Denied,
        retryable: { value: PermissionsRetryable.No, detail: null },
        deniedBy: BrowserDeniedReason.Browser,
        request: null,
        permissionGranted: false
      };
      return deniedOnLoad;
      //return { ...this.showManualEnableMock(CameraError.BrowserDenied), };
    }
    if(onLoadPermissionState === BrowserPermissionState.Granted) {
      const test = await this.getVideoDevicePermissionWrapper(constraints);
      if(!test.permissionGranted) {
        //TODO handle generic error not related to permission
        return;
      }
      this.videoDevices = test.result.devices;
      this.emit('video-devicelist-update', this.videoDevices);
      const grantedOnLoad: CameraRequestAcceptedWrapper = {
        permissionGranted: true,
        permissionState: BrowserPermissionState.Granted,
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
        permissionState: BrowserPermissionState.Granted,
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
      if(promptResponse.permissionState.postRequest === BrowserPermissionState.Denied) {
        const deniedOnPromptNoRetry: CameraRequestDeniedWrapper = {
          permissionGranted: false,
          deniedBy: rejectedReason,
          permissionState: BrowserPermissionState.Denied,
          retryable: { value: PermissionsRetryable.No, detail: null },
          request: promptResponse
        };
        return deniedOnPromptNoRetry;
      }
      //Prompt is retryable
      const browserRejected = rejectedReason === BrowserDeniedReason.Browser;
      const browserRejectedOnLoad = this.onLoadPermissionResult && this.onLoadPermissionResult.duration && this.cameraPermissionDeniedReason(this.onLoadPermissionResult.duration) === BrowserDeniedReason.Browser;
      const onLoadRequestRetryable = this.onLoadPermissionResult && this.onLoadPermissionResult.postRequestState === BrowserPermissionState.Prompt;
      if(browserRejectedOnLoad && onLoadRequestRetryable && browserRejected) {
        //This edgecase appears on firefox mobile, where it seems like the browser permission variable for the camera is not updated correctly.
        //We check if the browser has rejected the camera onLoad and what the retry-state was after the rejection.
        //if the state is "prompt", meaning the browser says it allows another prompt, but the new prompt is rejected by the browser again,
        // we can assume that the state being "prompt" is incorrectly reported and that we are NOT allowed to prompt
        const deniedOnPromptFirefoxEdgecase: CameraRequestDeniedWrapper = {
          permissionGranted: false,
          deniedBy: BrowserDeniedReason.Browser,
          retryable: { value: PermissionsRetryable.No, detail: null },
          permissionState: BrowserPermissionState.Denied,
          //if Permissionstate was already denied, no request will be sent => null
          request: promptResponse
        };
        return deniedOnPromptFirefoxEdgecase;
        //return this.showManualEnableMock(CameraError.BrowserDenied);
      }


      if(rejectedReason === BrowserDeniedReason.Browser) {
        const deniedOnPromptBrowser: CameraRequestDeniedWrapper = {
          permissionGranted: false,
          deniedBy: BrowserDeniedReason.Browser,
          retryable: { value: PermissionsRetryable.AfterReload, detail: this.getReloadButtonType().result },
          permissionState: (await this.getCameraPermissionState()).state,
          //if Permissionstate was already denied, no request will be sent => null
          request: promptResponse
        };
        return deniedOnPromptBrowser;
        //return this.showManualReloadMock(CameraError.BrowserDenied);
      }
      const deniedOnPromptUser: CameraRequestDeniedWrapper = {
        permissionGranted: false,
        deniedBy: BrowserDeniedReason.User,
        retryable: { value: PermissionsRetryable.Yes, detail: null },
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
  public async initHandler(constraints: MediaStreamConstraints = { video: GlobalIdealCameraConstraints }): Promise<CameraRequestAcceptedWrapper | CameraRequestDeniedWrapper | CameraInitError> {
    if(!navigator?.mediaDevices?.getUserMedia) {
      return CameraInitError.BrowserApiInaccessible
    }
    const devices = await this.getDevicesWrapper()
    if(devices.successful && devices.result.length === 0) {
      return CameraInitError.NoDevices
    }
    if(devices.successful && devices.result.length > 0) {
      devices.result.forEach(dev => {
        this.videoDevices.set(dev.deviceId, dev)
      })
      this.emit('video-devicelist-update', this.videoDevices)
    }
    if(navigator.mediaDevices.ondevicechange === null) {
      navigator.mediaDevices.ondevicechange = async () => {
        const devices = await this.getDevicesWrapper()
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
              state: BrowserPermissionState.Granted,
              detail: 'Requests for camera access will be granted immediately'
            })
          }
          else if(perm.state === 'denied') {
            this.emit('permission-status-change', {
              state: BrowserPermissionState.Denied,
              detail: 'Requests will be denied immediately'
            })
          }
          else {
            this.emit('permission-status-change', {
              state: BrowserPermissionState.Prompt,
              detail: 'Requests will trigger a prompt to the user. The users input decides if access is allowed or not'
            })
          }
        } catch (e) {
          this.emit('permission-status-change', {
            state: BrowserPermissionState.Error,
            detail: String(e)
          })
        }
      }
      this.emit('log', 'Installed camera-browser-permission watcher')
    }

    const onLoadPermissionState = (await this.getCameraPermissionState()).state;
    const onLoadPermissionResult = await this.getVideoDevicePermissionWrapper(constraints);
    this.onLoadPermissionResult = {
      duration: onLoadPermissionResult.duration,
      response: onLoadPermissionResult,
      postRequestState: onLoadPermissionResult.permissionState.postRequest
    };

    if(onLoadPermissionState === BrowserPermissionState.Denied) {
      return this.permissionDeniedHandler(onLoadPermissionResult)
    }
    if(onLoadPermissionState === BrowserPermissionState.Granted) {
      return this.permissionGrantedHandler(onLoadPermissionResult)
    }
    if(onLoadPermissionState === BrowserPermissionState.Prompt) {
      return this.permissionPromptHandler(onLoadPermissionResult)
    }
    if(onLoadPermissionState === BrowserPermissionState.Error) {
      return this.permissionErrorhandler(onLoadPermissionResult)
      //TODO Write handler for this
    }
    return CameraInitError.UnknownError
  }

  private permissionGrantedHandler(request: SuccessfulCameraRequest | FailedCameraRequest): CameraRequestDeniedWrapper | CameraRequestAcceptedWrapper | CameraInitError.UnknownError {
    if(request.permissionGranted) {
      request.result.devices.forEach(dev => {
        this.videoDevices.set(dev.deviceId, dev)
      })
      this.emit('video-devicelist-update', this.videoDevices);
      const grantedOnLoad: CameraRequestAcceptedWrapper = {
        permissionGranted: true,
        permissionState: BrowserPermissionState.Granted,
        request: request
      };
      return grantedOnLoad;
    }
    if(!request.permissionGranted) {
      //throw new Error('State is granted, but camera gave error. THIS IS MOST LIKELY BECAUSE CAMERA ALREADY IN USE');
      request.result.mappedError = CameraInitError.InUse
      const startCameraError: CameraRequestDeniedWrapper = {
        deniedBy: this.cameraPermissionDeniedReason(request.duration),
        permissionGranted: false,
        permissionState: request.permissionState.postRequest,
        request: request,
        retryable: { value: PermissionsRetryable.Unknown, detail: null }
      }
      return startCameraError
    }
    return CameraInitError.UnknownError
  }
  private permissionDeniedHandler(request: SuccessfulCameraRequest | FailedCameraRequest): CameraRequestDeniedWrapper | CameraRequestAcceptedWrapper | CameraInitError.UnknownError {
    if(!request.permissionGranted) {

      const deniedOnLoad: CameraRequestDeniedWrapper = {
        permissionState: BrowserPermissionState.Denied,
        retryable: { value: PermissionsRetryable.No, detail: null},
        deniedBy: BrowserDeniedReason.Browser, //this.getRejectedReason(onLoadPermissionResult.duration),
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
    return CameraInitError.UnknownError
  }
  private permissionPromptHandler(request: SuccessfulCameraRequest | FailedCameraRequest): CameraRequestDeniedWrapper | CameraRequestAcceptedWrapper | CameraInitError.UnknownError {
    const rejectedReason =  this.cameraPermissionDeniedReason(request.duration)
    if(!request.permissionGranted && request.permissionState.postRequest === BrowserPermissionState.Denied) {
      //non-retryable
      const deniedOnPromptNoRetry: CameraRequestDeniedWrapper = {
        permissionGranted: false,
        deniedBy: rejectedReason,
        permissionState: BrowserPermissionState.Denied,
        retryable: { value: PermissionsRetryable.No, detail: null },
        request: request
      };
      return deniedOnPromptNoRetry;
    }
    //firefox edgecase
    const browserRejected = rejectedReason === BrowserDeniedReason.Browser;
    const browserRejectedOnLoad = this.onLoadPermissionResult && typeof this.onLoadPermissionResult.duration === 'number' && this.cameraPermissionDeniedReason(this.onLoadPermissionResult.duration) === BrowserDeniedReason.Browser;
    const onLoadRequestRetryable = this.onLoadPermissionResult && this.onLoadPermissionResult.postRequestState === BrowserPermissionState.Prompt;
    const firefoxEdgecase = browserRejectedOnLoad && onLoadRequestRetryable && browserRejected

    if(!request.permissionGranted && firefoxEdgecase) {
      const deniedOnPromptFirefoxEdgecase: CameraRequestDeniedWrapper = {
        permissionGranted: false,
        deniedBy: BrowserDeniedReason.Browser,
        retryable: { value: PermissionsRetryable.No, detail: null },
        permissionState: BrowserPermissionState.Denied,
        //if Permissionstate was already denied, no request will be sent => null
        request: request
      };
      return deniedOnPromptFirefoxEdgecase;
    }
    if(!request.permissionGranted && rejectedReason === BrowserDeniedReason.Browser) {
      const deniedOnPromptBrowser: CameraRequestDeniedWrapper = {
        permissionGranted: false,
        deniedBy: BrowserDeniedReason.Browser,
        retryable: { value: PermissionsRetryable.AfterReload, detail: this.getReloadButtonType().result },
        permissionState: request.permissionState.postRequest,
        //if Permissionstate was already denied, no request will be sent => null
        request: request
      };
      return deniedOnPromptBrowser;
      //return this.showManualReloadMock(CameraError.BrowserDenied);
    }
    if(!request.permissionGranted && rejectedReason === BrowserDeniedReason.User && request.result.mappedError) {
      const deniedOnPromptUser: CameraRequestDeniedWrapper = {
        permissionGranted: false,
        deniedBy: BrowserDeniedReason.User,
        retryable: { value: PermissionsRetryable.Yes, detail: null},
        permissionState: request.permissionState.postRequest,
        //if Permissionstate was already denied, no request will be sent => null
        request: request
      };
      return deniedOnPromptUser;
    }
    if(!request.permissionGranted && rejectedReason === BrowserDeniedReason.User) {
      const deniedOnPromptUser: CameraRequestDeniedWrapper = {
        permissionGranted: false,
        deniedBy: BrowserDeniedReason.User,
        retryable: { value: PermissionsRetryable.Yes, detail: null},
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
    return CameraInitError.UnknownError
  }
  private permissionErrorhandler(request: SuccessfulCameraRequest | FailedCameraRequest): CameraRequestDeniedWrapper | CameraRequestAcceptedWrapper |  CameraInitError.UnknownError {
    if(request.permissionGranted) {
      const acceptedOnError: CameraRequestAcceptedWrapper = {
        permissionGranted: true,
        request,
        permissionState: BrowserPermissionState.Error
      }
      return acceptedOnError
    }
    if(!request.permissionGranted) {
      const rejectedOnError: CameraRequestDeniedWrapper = {
        permissionGranted: false,
        permissionState: BrowserPermissionState.Error,
        request,
        deniedBy: this.cameraPermissionDeniedReason(request.duration),
        retryable: { value: PermissionsRetryable.Unknown, detail: null }
      }
      return rejectedOnError
    }
    return CameraInitError.UnknownError
  }

}