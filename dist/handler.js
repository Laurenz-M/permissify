var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { BrowserDeniedReasonClass, BrowserPermissionStateClass, CameraInitErrorClass, EventRegistry, GlobalIdealCameraConstraints, PermissionsRetryableClass } from "./enums";
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
    getBrowserPermissionState() {
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
    stopCameraByStream(stream, track) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            console.log('stopCameraByStrea', stream);
            const streamCameraId = (_a = this.getMediaDeviceByStream(stream)) === null || _a === void 0 ? void 0 : _a.deviceId;
            if (!streamCameraId) {
                return CameraInitErrorClass.DeviceNotFound;
            }
            if (track) {
                stream.removeTrack(track);
                return;
            }
            stream.getTracks().forEach(track => {
                track.stop();
            });
            this.activeStreams.delete(stream.id);
        });
    }
    stopCameraStreamById(cameraId, track) {
        return __awaiter(this, void 0, void 0, function* () {
            //TODO fix
            const res = this.activeStreams.get(cameraId);
            if (!res) {
                return CameraInitErrorClass.DeviceNotFound;
            }
            if (track) {
                res.stream.removeTrack(track);
            }
            else {
                res.stream.getTracks().forEach(track => {
                    track.stop();
                });
            }
        });
    }
    getPreferredCamera(videoDevices) {
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
    requestVideoDevice() {
        return __awaiter(this, arguments, void 0, function* (userMediaConstraints = { video: Object.assign({}, GlobalIdealCameraConstraints) }) {
            const start = performance.now();
            const preRequestState = (yield this.getBrowserPermissionState()).state;
            try {
                const stream = yield navigator.mediaDevices.getUserMedia(userMediaConstraints); //this.timeoutWrapper(5000);
                const videoDevices = yield navigator.mediaDevices.enumerateDevices();
                //console.log('getUserMedia', performance.now() - start);
                const acceptedGetUserMediaTime = performance.now() - start;
                const postRequestPermissionState = (yield this.getBrowserPermissionState()).state;
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
                const postRequestPermissionState = (yield this.getBrowserPermissionState()).state;
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
    getVideoDevices() {
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
        console.log('stream', stream);
        const videoTrack = stream.getTracks()[0];
        return videoTrack ? videoTrack.getSettings() : null;
    }
    startCamera(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const constraints = params.constraints;
            const id = params.id;
            let initalConstraints = null;
            if (constraints && id) {
                if (constraints.video === undefined || typeof constraints.video === 'boolean') {
                    initalConstraints = {
                        audio: constraints.audio,
                        video: {
                            deviceId: {
                                exact: id
                            },
                        }
                    };
                }
                else {
                    initalConstraints = {
                        audio: constraints.audio,
                        video: Object.assign(Object.assign({}, constraints.video), { deviceId: {
                                exact: id
                            } })
                    };
                }
                //ID: id overwrites constrains > deviceId
                //use constraints
            }
            else if (constraints && !id) {
                initalConstraints = constraints;
                //use constraints
            }
            else if (!constraints && id) {
                initalConstraints = {
                    video: {
                        deviceId: {
                            exact: id
                        }
                    }
                };
                //id with default constraints
            }
            else if (!constraints && !id) {
                //TODO define and use default constraints
                initalConstraints = {
                    video: true
                };
            }
            else {
                return CameraInitErrorClass.UnknownError;
            }
            if (!((_a = navigator === null || navigator === void 0 ? void 0 : navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.getUserMedia)) {
                return CameraInitErrorClass.BrowserApiInaccessible;
            }
            const devices = yield this.getVideoDevices();
            if (devices.successful && devices.result.length === 0) {
                return CameraInitErrorClass.NoDevices;
            }
            this.emit('log', String(initalConstraints));
            console.log('Calculated Constraints: ', initalConstraints);
            const onLoadPermissionState = (yield this.getBrowserPermissionState()).state;
            const onLoadPermissionResult = yield this.requestVideoDevice(initalConstraints);
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
    initHandler() {
        return __awaiter(this, arguments, void 0, function* (constraints = { video: GlobalIdealCameraConstraints }) {
            var _a;
            if (!((_a = navigator === null || navigator === void 0 ? void 0 : navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.getUserMedia)) {
                return CameraInitErrorClass.BrowserApiInaccessible;
            }
            const devices = yield this.getVideoDevices();
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
                    const devices = yield this.getVideoDevices();
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
            const onLoadPermissionState = (yield this.getBrowserPermissionState()).state;
            const onLoadPermissionResult = yield this.requestVideoDevice(constraints);
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
            console.log('test', request.result.stream);
            const deviceByStream = this.getMediaDeviceByStream(request.result.stream);
            if (!deviceByStream)
                return CameraInitErrorClass.DeviceNotFound;
            request.result.devices.forEach(dev => {
                this.videoDevices.set(dev.deviceId, dev);
            });
            this.activeStreams.set(request.result.stream.id, { stream: request.result.stream,
                device: deviceByStream
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
