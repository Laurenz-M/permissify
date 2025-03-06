var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const resolution16By9Table = {
    '4k': {
        height: 4096,
        width: 2160
    },
    '720p': {
        height: 1280,
        width: 720
    }
};
export const GlobalIdealCameraConstraints = {
    height: { ideal: resolution16By9Table['720p'].height },
    width: { ideal: resolution16By9Table['720p'].width },
    facingMode: { ideal: 'environment' },
    frameRate: { ideal: 60 }
};
export var CameraInitError;
(function (CameraInitError) {
    CameraInitError["PermissionDenied"] = "PermissionDenied";
    CameraInitError["PermissionDismissed"] = "PermissionDismissed";
    CameraInitError["InUse"] = "InUse";
    CameraInitError["Overconstrained"] = "Overconstrained";
    CameraInitError["UnknownError"] = "UnknownError";
    CameraInitError["BrowserApiInaccessible"] = "BrowserApiInaccessible";
    CameraInitError["NoDevices"] = "NoDevices";
})(CameraInitError || (CameraInitError = {}));
export class CameraInitErrorClass {
    constructor(value) {
        this.value = value;
    }
    static from(value) {
        return Object.values(CameraInitErrorClass).find((e) => e.value === value);
    }
    toString() {
        return this.value;
    }
}
CameraInitErrorClass.PermissionDismissed = new CameraInitErrorClass("PermissionDismissed");
CameraInitErrorClass.PermissionDenied = new CameraInitErrorClass("PermissionDenied");
CameraInitErrorClass.InUse = new CameraInitErrorClass("InUse");
CameraInitErrorClass.Overconstrained = new CameraInitErrorClass("Overconstrained");
CameraInitErrorClass.UnknownError = new CameraInitErrorClass("UnknownError");
CameraInitErrorClass.BrowserApiInaccessible = new CameraInitErrorClass("BrowserApiInaccessible");
CameraInitErrorClass.NoDevices = new CameraInitErrorClass("NoDevices");
export var BrowserDeniedReason;
(function (BrowserDeniedReason) {
    BrowserDeniedReason["Browser"] = "Browser";
    BrowserDeniedReason["User"] = "User";
})(BrowserDeniedReason || (BrowserDeniedReason = {}));
export class BrowserDeniedReasonClass {
    constructor(value) {
        this.value = value;
    }
    static from(value) {
        return Object.values(BrowserDeniedReasonClass).find((e) => e.value === value);
    }
    toString() {
        return this.value;
    }
}
BrowserDeniedReasonClass.Browser = new BrowserDeniedReasonClass("Browser");
BrowserDeniedReasonClass.User = new BrowserDeniedReasonClass("User");
export var BrowserPermissionState;
(function (BrowserPermissionState) {
    BrowserPermissionState["Granted"] = "Granted";
    BrowserPermissionState["Denied"] = "Denied";
    BrowserPermissionState["Prompt"] = "Prompt";
    BrowserPermissionState["Error"] = "Error";
})(BrowserPermissionState || (BrowserPermissionState = {}));
export class BrowserPermissionStateClass {
    constructor(value) {
        this.value = value;
    }
    static from(value) {
        return Object.values(BrowserPermissionStateClass).find((e) => e.value === value);
    }
    toString() {
        return this.value;
    }
}
BrowserPermissionStateClass.Granted = new BrowserPermissionStateClass("Granted");
BrowserPermissionStateClass.Denied = new BrowserPermissionStateClass("Denied");
BrowserPermissionStateClass.Prompt = new BrowserPermissionStateClass("Prompt");
BrowserPermissionStateClass.Error = new BrowserPermissionStateClass("Error");
export var PermissionsRetryable;
(function (PermissionsRetryable) {
    PermissionsRetryable["Yes"] = "Yes";
    PermissionsRetryable["No"] = "No";
    PermissionsRetryable["AfterReload"] = "AfterReload";
    PermissionsRetryable["Unknown"] = "Unknown";
})(PermissionsRetryable || (PermissionsRetryable = {}));
export class PermissionsRetryableClass {
    constructor(value) {
        this.value = value;
    }
    static from(value) {
        return Object.values(PermissionsRetryableClass).find((e) => e.value === value);
    }
    toString() {
        return this.value;
    }
}
PermissionsRetryableClass.Yes = new PermissionsRetryableClass("Yes");
PermissionsRetryableClass.No = new PermissionsRetryableClass("No");
PermissionsRetryableClass.AfterReload = new PermissionsRetryableClass("AfterReload");
PermissionsRetryableClass.Unknown = new PermissionsRetryableClass("Unknown");
export var BrowserType;
(function (BrowserType) {
    BrowserType["Chromium"] = "Chromium";
    BrowserType["Firefox"] = "Firefox";
    BrowserType["Safari"] = "Safari";
    BrowserType["Unknown"] = "Unknown";
})(BrowserType || (BrowserType = {}));
export const EventRegistry = ['video-devicelist-update', 'log', 'permission-status-change'];
export class CameraPermissionHandler {
    constructor() {
        this.onLoadPermissionResult = null;
        this.selectedDeviceId = null;
        this.videoDevices = new Map();
        this.activeStreams = new Map();
        this.events = EventRegistry.reduce((acc, event) => (Object.assign(Object.assign({}, acc), { [event]: [] })), {});
    }
    on(eventName, listener) {
        this.events[eventName].push(listener);
    }
    emit(eventName, data) {
        this.events[eventName].forEach((listener) => {
            listener(data); // Invoke listener with the correct type
        });
    }
    getCameraPermissionState() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const perm = yield navigator.permissions.query({ name: 'camera' });
                //console.log('permname',perm.name)
                if (perm.state === 'granted') {
                    return {
                        state: BrowserPermissionStateClass.Granted,
                        detail: 'Requests for camera access will be granted immediately'
                    };
                }
                else if (perm.state === 'denied') {
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
            }
            catch (e) {
                return {
                    state: BrowserPermissionStateClass.Error,
                    detail: String(e)
                };
            }
        });
    }
    stopCameraStream(stream, track) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const streamCameraId = (_a = this.getMediaDeviceByStream(stream).videoDeviceId) === null || _a === void 0 ? void 0 : _a.deviceId;
            if (!track) {
                stream.getTracks().forEach(track => {
                    track.stop();
                });
                if (streamCameraId) {
                    this.activeStreams.delete(streamCameraId);
                }
                return;
            }
            stream.removeTrack(track);
        });
    }
    stopCameraStreamById(cameraId, track) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = this.activeStreams.get(cameraId);
            if (!res) {
                return 'not found';
            }
            if (track) {
                res.removeTrack(track);
            }
            else {
                res.getTracks().forEach(track => {
                    track.stop();
                });
            }
        });
    }
    getPreferredCamera(videoDevices) {
        this.emit('log', JSON.stringify(videoDevices));
        const environmentCamera = videoDevices.find(device => device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('environment'));
        if (environmentCamera) {
            return {
                facing: 'environment',
                id: environmentCamera.deviceId
            };
        }
        const userCamera = videoDevices.find(device => device.label.toLowerCase().includes('front') ||
            device.label.toLowerCase().includes('user'));
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
    cameraErrorMessageMapper(e) {
        const stringedError = String(e);
        console.log('str', stringedError);
        if (!stringedError || !e.name) {
            return {
                originalError: stringedError,
                mappedError: CameraInitErrorClass.UnknownError
            };
        }
        if (stringedError === 'OverconstrainedError') {
            return {
                originalError: stringedError,
                mappedError: CameraInitErrorClass.Overconstrained
            };
        }
        const errorDetail = ((String(e).split(':'))[1]).trim();
        if (e.name === 'NotAllowedError' && stringedError.includes('denied')) { //errorDetail === 'Permission denied'){
            return {
                originalError: stringedError,
                mappedError: CameraInitErrorClass.PermissionDenied
            };
        }
        else if (e.name === 'NotAllowedError' && stringedError.includes('dismissed')) { // errorDetail === 'Permission dismissed') {
            return {
                originalError: stringedError,
                mappedError: CameraInitErrorClass.PermissionDismissed
            };
        }
        else if (e.name === 'NotReadableError' && errorDetail === 'Device in use') {
            return {
                originalError: stringedError,
                mappedError: CameraInitErrorClass.InUse
            };
        }
        else if (stringedError.toLowerCase().includes('start') && stringedError.toLowerCase().includes('failed')) {
            return {
                originalError: stringedError,
                mappedError: CameraInitErrorClass.InUse
            };
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
    getReloadButtonType() {
        const userAgent = navigator.userAgent.toLowerCase();
        const browserButtonRequiredBrowserRegexList = new Map([
            ['firefox_desktop', new RegExp('^(?=.*firefox)(?!.*(mobile|tablet|android)).*$', 'i')]
        ]);
        for (const [key, value] of browserButtonRequiredBrowserRegexList) { // Using the default iterator (could be `map.entries()` instead)
            //console.log(value.test(userAgent), userAgent);
            if (value.test(userAgent)) {
                return { result: 'browser-button', browser: key };
            }
        }
        return { result: 'any-button', browser: 'any' };
    }
    cameraPermissionDeniedReason(deniedAfterMs, browserDeniedThreshold = 200) {
        return deniedAfterMs <= browserDeniedThreshold ? BrowserDeniedReasonClass.Browser : BrowserDeniedReasonClass.User;
    }
    getVideoDevicePermissionWrapper() {
        return __awaiter(this, arguments, void 0, function* (userMediaConstraints = { video: Object.assign({}, GlobalIdealCameraConstraints) }) {
            const start = performance.now();
            const preRequestState = (yield this.getCameraPermissionState()).state;
            try {
                const stream = yield navigator.mediaDevices.getUserMedia(userMediaConstraints); //this.timeoutWrapper(5000);
                const videoDevices = yield navigator.mediaDevices.enumerateDevices();
                //console.log('getUserMedia', performance.now() - start);
                const acceptedGetUserMediaTime = performance.now() - start;
                const postRequestPermissionState = (yield this.getCameraPermissionState()).state;
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
            catch (e) {
                const deniedGetUserMediaTime = performance.now() - start;
                const postRequestPermissionState = (yield this.getCameraPermissionState()).state;
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
        });
    }
    getDevicesWrapper() {
        return __awaiter(this, void 0, void 0, function* () {
            const start = performance.now();
            try {
                const videoDevices = yield navigator.mediaDevices.enumerateDevices();
                const acceptedEnumerateTime = performance.now() - start;
                return {
                    successful: true,
                    result: videoDevices.filter(device => device.kind === 'videoinput'),
                    duration: acceptedEnumerateTime
                };
            }
            catch (e) {
                const deniedEnumerateTime = performance.now() - start;
                return {
                    successful: false,
                    result: String(e),
                    duration: deniedEnumerateTime
                };
            }
        });
    }
    getMediaDeviceByStream(stream) {
        const videoTrack = stream.getVideoTracks()[0];
        const videoDeviceId = videoTrack ? videoTrack.getSettings() : null;
        return { videoDeviceId };
    }
    startCamera(id, constraints) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const initalConstraints = {
                video: {}
            };
            if (constraints && constraints.video !== undefined) {
                if (typeof constraints.video === 'boolean') {
                    initalConstraints.video = { deviceId: id ? { exact: id } : true };
                }
                else {
                    initalConstraints.video = Object.assign(Object.assign({}, constraints.video), { deviceId: id ? { exact: id } : undefined });
                }
            }
            else {
                initalConstraints.video = Object.assign(Object.assign({}, GlobalIdealCameraConstraints), { deviceId: id ? { exact: id } : undefined });
            }
            if (!((_a = navigator === null || navigator === void 0 ? void 0 : navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.getUserMedia)) {
                return CameraInitErrorClass.BrowserApiInaccessible;
            }
            const devices = yield this.getDevicesWrapper();
            if (devices.successful && devices.result.length === 0) {
                return CameraInitErrorClass.NoDevices;
            }
            const onLoadPermissionState = (yield this.getCameraPermissionState()).state;
            const onLoadPermissionResult = yield this.getVideoDevicePermissionWrapper(constraints);
            if (onLoadPermissionState === BrowserPermissionStateClass.Denied) {
                return this.permissionDeniedHandler(onLoadPermissionResult);
            }
            if (onLoadPermissionState === BrowserPermissionStateClass.Granted) {
                return this.permissionGrantedHandler(onLoadPermissionResult);
            }
            if (onLoadPermissionState === BrowserPermissionStateClass.Prompt) {
                return this.permissionPromptHandler(onLoadPermissionResult);
            }
            if (onLoadPermissionState === BrowserPermissionStateClass.Error) {
                return this.permissionErrorhandler(onLoadPermissionResult);
                //TODO Write handler for this
            }
            return CameraInitErrorClass.UnknownError;
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
        });
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
    initHandler() {
        return __awaiter(this, arguments, void 0, function* (constraints = { video: GlobalIdealCameraConstraints }) {
            var _a;
            if (!((_a = navigator === null || navigator === void 0 ? void 0 : navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.getUserMedia)) {
                return CameraInitErrorClass.BrowserApiInaccessible;
            }
            const devices = yield this.getDevicesWrapper();
            if (devices.successful && devices.result.length === 0) {
                return CameraInitErrorClass.NoDevices;
            }
            if (devices.successful && devices.result.length > 0) {
                devices.result.forEach(dev => {
                    this.videoDevices.set(dev.deviceId, dev);
                });
                this.emit('video-devicelist-update', this.videoDevices);
            }
            if (navigator.mediaDevices.ondevicechange === null) {
                navigator.mediaDevices.ondevicechange = () => __awaiter(this, void 0, void 0, function* () {
                    const devices = yield this.getDevicesWrapper();
                    if (devices.successful) {
                        devices.result.forEach(dev => {
                            this.videoDevices.set(dev.deviceId, dev);
                        });
                        this.emit('video-devicelist-update', this.videoDevices);
                    }
                });
                this.emit('log', 'Installed camera-device-change watcher');
            }
            if (navigator.permissions.query) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const state = yield navigator.permissions.query({ name: 'camera' });
                state.onchange = () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        const perm = yield navigator.permissions.query({ name: 'camera' });
                        //console.log('permname',perm.name)
                        if (perm.state === 'granted') {
                            this.emit('permission-status-change', {
                                state: BrowserPermissionStateClass.Granted,
                                detail: 'Requests for camera access will be granted immediately'
                            });
                        }
                        else if (perm.state === 'denied') {
                            this.emit('permission-status-change', {
                                state: BrowserPermissionStateClass.Denied,
                                detail: 'Requests will be denied immediately'
                            });
                        }
                        else {
                            this.emit('permission-status-change', {
                                state: BrowserPermissionStateClass.Prompt,
                                detail: 'Requests will trigger a prompt to the user. The users input decides if access is allowed or not'
                            });
                        }
                    }
                    catch (e) {
                        this.emit('permission-status-change', {
                            state: BrowserPermissionStateClass.Error,
                            detail: String(e)
                        });
                    }
                });
                this.emit('log', 'Installed camera-browser-permission watcher');
            }
            const onLoadPermissionState = (yield this.getCameraPermissionState()).state;
            const onLoadPermissionResult = yield this.getVideoDevicePermissionWrapper(constraints);
            this.onLoadPermissionResult = {
                duration: onLoadPermissionResult.duration,
                response: onLoadPermissionResult,
                postRequestState: onLoadPermissionResult.permissionState.postRequest
            };
            if (onLoadPermissionState === BrowserPermissionStateClass.Denied) {
                return this.permissionDeniedHandler(onLoadPermissionResult);
            }
            if (onLoadPermissionState === BrowserPermissionStateClass.Granted) {
                return this.permissionGrantedHandler(onLoadPermissionResult);
            }
            if (onLoadPermissionState === BrowserPermissionStateClass.Prompt) {
                return this.permissionPromptHandler(onLoadPermissionResult);
            }
            if (onLoadPermissionState === BrowserPermissionStateClass.Error) {
                return this.permissionErrorhandler(onLoadPermissionResult);
                //TODO Write handler for this
            }
            return CameraInitErrorClass.UnknownError;
        });
    }
    permissionGrantedHandler(request) {
        if (request.permissionGranted) {
            request.result.devices.forEach(dev => {
                this.videoDevices.set(dev.deviceId, dev);
            });
            this.emit('video-devicelist-update', this.videoDevices);
            const grantedOnLoad = {
                permissionGranted: true,
                permissionState: BrowserPermissionStateClass.Granted,
                request: request
            };
            return grantedOnLoad;
        }
        if (!request.permissionGranted) {
            //throw new Error('State is granted, but camera gave error. THIS IS MOST LIKELY BECAUSE CAMERA ALREADY IN USE');
            request.result.mappedError = CameraInitErrorClass.InUse;
            const startCameraError = {
                deniedBy: this.cameraPermissionDeniedReason(request.duration),
                permissionGranted: false,
                permissionState: request.permissionState.postRequest,
                request: request,
                retryable: { value: PermissionsRetryableClass.Unknown, detail: null }
            };
            return startCameraError;
        }
        return CameraInitErrorClass.UnknownError;
    }
    permissionDeniedHandler(request) {
        if (!request.permissionGranted) {
            const deniedOnLoad = {
                permissionState: BrowserPermissionStateClass.Denied,
                retryable: { value: PermissionsRetryableClass.No, detail: null },
                deniedBy: BrowserDeniedReasonClass.Browser, //this.getRejectedReason(onLoadPermissionResult.duration),
                request: request,
                permissionGranted: false
            };
            return deniedOnLoad;
        }
        if (request.permissionGranted) {
            const grantedOnDeniedState = {
                permissionGranted: true,
                permissionState: request.permissionState.postRequest,
                request: request
            };
            return grantedOnDeniedState;
        }
        return CameraInitErrorClass.UnknownError;
    }
    permissionPromptHandler(request) {
        const rejectedReason = this.cameraPermissionDeniedReason(request.duration);
        if (!request.permissionGranted && request.permissionState.postRequest === BrowserPermissionStateClass.Denied) {
            //non-retryable
            const deniedOnPromptNoRetry = {
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
        const firefoxEdgecase = browserRejectedOnLoad && onLoadRequestRetryable && browserRejected;
        if (!request.permissionGranted && firefoxEdgecase) {
            const deniedOnPromptFirefoxEdgecase = {
                permissionGranted: false,
                deniedBy: BrowserDeniedReasonClass.Browser,
                retryable: { value: PermissionsRetryableClass.No, detail: null },
                permissionState: BrowserPermissionStateClass.Denied,
                //if Permissionstate was already denied, no request will be sent => null
                request: request
            };
            return deniedOnPromptFirefoxEdgecase;
        }
        if (!request.permissionGranted && rejectedReason === BrowserDeniedReasonClass.Browser) {
            const deniedOnPromptBrowser = {
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
        if (!request.permissionGranted && rejectedReason === BrowserDeniedReasonClass.User && request.result.mappedError) {
            const deniedOnPromptUser = {
                permissionGranted: false,
                deniedBy: BrowserDeniedReasonClass.User,
                retryable: { value: PermissionsRetryableClass.Yes, detail: null },
                permissionState: request.permissionState.postRequest,
                //if Permissionstate was already denied, no request will be sent => null
                request: request
            };
            return deniedOnPromptUser;
        }
        if (!request.permissionGranted && rejectedReason === BrowserDeniedReasonClass.User) {
            const deniedOnPromptUser = {
                permissionGranted: false,
                deniedBy: BrowserDeniedReasonClass.User,
                retryable: { value: PermissionsRetryableClass.Yes, detail: null },
                permissionState: request.permissionState.postRequest,
                //if Permissionstate was already denied, no request will be sent => null
                request: request
            };
            return deniedOnPromptUser;
        }
        if (request.permissionGranted) {
            const acceptedOnPrompt = {
                permissionGranted: true,
                permissionState: request.permissionState.postRequest,
                request: request,
            };
            return acceptedOnPrompt;
        }
        return CameraInitErrorClass.UnknownError;
    }
    permissionErrorhandler(request) {
        if (request.permissionGranted) {
            const acceptedOnError = {
                permissionGranted: true,
                request,
                permissionState: BrowserPermissionStateClass.Error
            };
            return acceptedOnError;
        }
        if (!request.permissionGranted) {
            const rejectedOnError = {
                permissionGranted: false,
                permissionState: BrowserPermissionStateClass.Error,
                request,
                deniedBy: this.cameraPermissionDeniedReason(request.duration),
                retryable: { value: PermissionsRetryableClass.Unknown, detail: null }
            };
            return rejectedOnError;
        }
        return CameraInitErrorClass.UnknownError;
    }
}
