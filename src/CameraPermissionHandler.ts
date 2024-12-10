const resolution16By9Table = {
  '4k': {
    height: 4096,
    width: 2160
  },
  '720p': {
    height: 1280,
    width: 720
  }
} as const;
const GlobalIdealCameraConstraints = {
  height: { ideal: resolution16By9Table['720p'].height },
  width: { ideal: resolution16By9Table['720p'].width },
  facingMode: { ideal: 'environment' },
  frameRate: { ideal: 60 }
};
interface FailedCameraRequest {
  permissionState: {
    preRequest: BrowserPermissionState,
    postRequest: BrowserPermissionState
  },
  permissionGranted: false,
  result: { originalError: string, mappedError: CameraInitError },
  duration: number
}
interface SuccessfulCameraRequestResult {
  stream: MediaStream,
  devices: MediaDeviceInfo[]
}
interface SuccessfulCameraRequest {
  permissionState: {
    preRequest: BrowserPermissionState,
    postRequest: BrowserPermissionState
  },
  permissionGranted: true,
  result: SuccessfulCameraRequestResult,
  duration: number
}
interface RequestRetryable {
  value: PermissionsRetryable.Yes | PermissionsRetryable.No,
  detail: null
}
interface RequestRetryableWithDetail {
  value: PermissionsRetryable.AfterReload,
  detail: 'browser-button' | 'any-button'
}
interface CameraRequestDeniedWrapper {
  permissionGranted: false,
  deniedBy: BrowserDeniedReason,
  retryable: RequestRetryable | RequestRetryableWithDetail,
  permissionState: BrowserPermissionState,
  //if Permissionstate was already denied, no request will be sent => null
  request: null | FailedCameraRequest
}
interface CameraRequestAcceptedWrapper {
  permissionGranted: true,
  permissionState: BrowserPermissionState,
  request: SuccessfulCameraRequest
}

export enum CameraInitError {
    PermissionDenied = 'PermissionDenied',
    PermissionDismissed = 'PermissionDismissed',
    InUse = 'InUse',
    Overconstrained = 'Overconstrained',
    UnknownError = 'UnknownError'
}
enum BrowserDeniedReason {
    Browser = 'Browser',
    User = 'User'
}

export enum CameraError {
    UserDenied = 'UserDenied',
    BrowserDenied = 'BrowserDenied',
    BrowserUiReloadRequired = 'BrowserUiReloadRequired',
    ReloadRequired = 'ReloadRequired'
}
enum BrowserPermissionState {
    Granted = 'Granted',
    Denied = 'Denied',
    Prompt = 'Prompt',
  Error = 'Error'
}
export enum PermissionsRetryable {
    Yes = 'Yes',
    No = 'No',
    AfterReload = 'AfterReload'
}
export enum BrowserType {
    Chromium = 'Chromium',
    Firefox = 'Firefox',
    Safari = 'Safari',
    Unknown = 'Unknown'
}
const EventRegistry = ['video-devicelist-update', 'log'] as const

type EventDataMap = {
  'video-devicelist-update': MediaDeviceInfo[]; // Example: Array of video devices
  'log': string; // Example: Log data
};
type EventListeners = {
  [K in typeof EventRegistry[number]]: Array<(data: EventDataMap[K]) => void>;
};
export class CameraPermissionHandler {
  public onLoadPermissionResult: null | { duration: number, response: SuccessfulCameraRequest | FailedCameraRequest, postRequestState: BrowserPermissionState } = null;
  public selectedDeviceId: string | null = null;
  public videoDevices: MediaDeviceInfo[] = [];
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
    //console.log(eventName, listener);
    this.events[eventName].push(listener)
  }
  private emit<K extends keyof EventDataMap>(
      eventName: K,
      data: EventDataMap[K]
  )  {
      this.events[eventName].forEach((listener: (data: EventDataMap[K]) => void) => {
        listener(data); // Invoke listener with the correct type
      });
  }
  public async getCameraPermissionState(): Promise<BrowserPermissionState> {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const perm = await navigator.permissions.query({ name: 'camera' });
      if(perm.state === 'granted'){
        return BrowserPermissionState.Granted;
      }
      else if(perm.state === 'denied') {
        return BrowserPermissionState.Denied;
      }
      else {
        return BrowserPermissionState.Prompt;
      }
    } catch (e) {
      return BrowserPermissionState.Error
    }

  }

  public async cycleCamera() {
    // TODO finish this
    const state = await this.getCameraPermissionState();
    if(state === BrowserPermissionState.Denied) {
      return;
    }
    if(state === BrowserPermissionState.Prompt) {
      return;
    }

    const devices = await this.getDevicesWrapper();
    if(!devices.successful) {
      return;
    }
    let currentIndex = null;
    this.videoDevices.forEach((device, index) => {
      if(device.deviceId === this.selectedDeviceId) {
        currentIndex = index;
      }
    });
    if(currentIndex === null) {
      const test = this.getPreferredCamera(this.videoDevices);
      return await this.startCamera(test.id);
    }
    const indexToSelect = currentIndex+1 === this.videoDevices.length ? 0 : currentIndex + 1;
    this.selectedDeviceId = this.videoDevices[indexToSelect].deviceId;
    return await this.startCamera(this.videoDevices[indexToSelect].deviceId);

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
      console.log(value.test(userAgent), userAgent);
      if(value.test(userAgent)) {
        return { result: 'browser-button', browser: key };
      }
    }
    return { result: 'any-button', browser: 'any' };
  }
  private cameraPermissionDeniedReason(deniedAfterMs: number, browserDeniedThreshold = 200) {
    console.log(deniedAfterMs, browserDeniedThreshold, deniedAfterMs <= browserDeniedThreshold);
    return deniedAfterMs <= browserDeniedThreshold ? BrowserDeniedReason.Browser : BrowserDeniedReason.User;
  }
  public async getVideoDevicePermissionWrapper(userMediaConstraints: MediaStreamConstraints = { video: {
    ...GlobalIdealCameraConstraints
  }  }): Promise<SuccessfulCameraRequest | FailedCameraRequest> {
    const start = performance.now();
    const preRequestState = await this.getCameraPermissionState();
    try {
      const stream = await navigator.mediaDevices.getUserMedia(userMediaConstraints);//this.timeoutWrapper(5000);
      const videoDevices = await navigator.mediaDevices.enumerateDevices();
      //console.log('getUserMedia', performance.now() - start);
      const acceptedGetUserMediaTime = performance.now() - start;
      const postRequestPermissionState = await this.getCameraPermissionState();
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
      const postRequestPermissionState = await this.getCameraPermissionState();
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
  public async startCamera(id?: string, constraints?: MediaStreamConstraints) {
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
    const onLoadPermissionState = await this.getCameraPermissionState();
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
          permissionState: await this.getCameraPermissionState(),
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
        permissionState: await this.getCameraPermissionState(),
        //if Permissionstate was already denied, no request will be sent => null
        request: promptResponse
      };
      return deniedOnPromptUser;
      //return this.showPleaseAcceptMock(CameraError.UserDenied);
      /*if(promptResponse.permissionState.postRequest === BrowserPermissionState.Denied) {
        return this.showManualEnableMock();
      }
      else if(promptResponse.permissionState.postRequest === BrowserPermissionState.Prompt) {

        return this.showPleaseAcceptMock();
      }*/
    }
    throw new Error('Unexpected behavior on init' + String(await this.getCameraPermissionState()));
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
  public async initHandler(constraints: MediaStreamConstraints = { video: GlobalIdealCameraConstraints }): Promise<CameraRequestAcceptedWrapper | CameraRequestDeniedWrapper | 'unknown-state'> {
    const onLoadPermissionState = await this.getCameraPermissionState();
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
      //TODO Write handler for this
    }
    return 'unknown-state'
  }

  private permissionGrantedHandler(request: SuccessfulCameraRequest | FailedCameraRequest): CameraRequestDeniedWrapper | CameraRequestAcceptedWrapper | 'unknown-state' {
    if(request.permissionGranted) {
      this.videoDevices = request.result.devices;
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
      const startCameraError: CameraRequestDeniedWrapper = {
        deniedBy: this.cameraPermissionDeniedReason(request.duration),
        permissionGranted: false,
        permissionState: request.permissionState.postRequest,
        request: request,
        retryable: { value: PermissionsRetryable.Yes, detail: null }
      }
      return startCameraError
    }
    return 'unknown-state'
  }
  private permissionDeniedHandler(request: SuccessfulCameraRequest | FailedCameraRequest): CameraRequestDeniedWrapper | CameraRequestAcceptedWrapper | 'unknown-state' {
    if(!request.permissionGranted) {

      const deniedOnLoad: CameraRequestDeniedWrapper = {
        permissionState: BrowserPermissionState.Denied,
        retryable: {value: PermissionsRetryable.No, detail: null},
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
    return 'unknown-state'
  }
  private permissionPromptHandler(request: SuccessfulCameraRequest | FailedCameraRequest): CameraRequestDeniedWrapper | CameraRequestAcceptedWrapper | 'unknown-state' {
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
    if(!request.permissionGranted && rejectedReason === BrowserDeniedReason.User) {
      const deniedOnPromptUser: CameraRequestDeniedWrapper = {
        permissionGranted: false,
        deniedBy: BrowserDeniedReason.User,
        retryable: {value: PermissionsRetryable.Yes, detail: null},
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
    return 'unknown-state'
  }


}


// TODO include navigator.permissions.query({ name: 'camera' }).onchange(() => { })
// TODO include navigator.mediaDevices.deviceChange(() => { }) handler







