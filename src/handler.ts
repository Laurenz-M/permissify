import {
    BrowserDeniedReasonClass,
    BrowserPermissionStateClass,
    CameraInitErrorClass, CameraRequestAcceptedWrapper, CameraRequestDeniedWrapper, EventDataMap, EventListeners,
    EventRegistry,
    FailedCameraRequest, GlobalIdealCameraConstraints, PermissionsRetryableClass,
    SuccessfulCameraRequest
} from "./enums";

export class CameraPermissionHandler {
    public onLoadPermissionResult: null | { duration: number, response: SuccessfulCameraRequest | FailedCameraRequest, postRequestState: BrowserPermissionStateClass } = null;
    public selectedDeviceId: string | null = null;
    public videoDevices: Map<string,MediaDeviceInfo> = new Map();
    public activeStreams: Map<string, { stream: MediaStream, device:MediaTrackSettings}> = new Map();
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
        console.log('stopCameraByStrea', stream)
        const streamCameraId = this.getMediaDeviceByStream(stream)?.deviceId;
        if(!streamCameraId) {
            return CameraInitErrorClass.DeviceNotFound;
        }
        if(track) {
            stream.removeTrack(track);
            return
        }
        stream.getTracks().forEach(track => {
            track.stop();
        });
        this.activeStreams.delete(stream.id)
    }
    public async stopCameraStreamById(cameraId: string, track?: MediaStreamTrack) {
        //TODO fix
        const res = this.activeStreams.get(cameraId);
        if(!res) {
            return CameraInitErrorClass.DeviceNotFound;
        }
        if(track) {
            res.stream.removeTrack(track);
        }
        else {
            res.stream.getTracks().forEach(track => {
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
        console.log('stream',stream)
        const videoTrack = stream.getTracks()[0];
        return  videoTrack ? videoTrack.getSettings() : null;
    }
    public async startCamera(params:{id?: string, constraints?: MediaStreamConstraints
    }): Promise<CameraRequestAcceptedWrapper | CameraRequestDeniedWrapper | CameraInitErrorClass> {
        const constraints = params.constraints;
        const id = params.id;

        let initalConstraints: MediaStreamConstraints | null = null

        if(constraints && id) {
            if(constraints.video === undefined || typeof constraints.video === 'boolean') {
                initalConstraints = {
                    audio: constraints.audio,
                    video: {
                        deviceId: {
                            exact: id
                        },
                    }
                }
            } else {
                initalConstraints = {
                    audio: constraints.audio,
                    video: {
                        ...constraints.video,
                        deviceId: {
                            exact: id
                        }
                    }
                }
            }
            //ID: id overwrites constrains > deviceId
            //use constraints
        } else if(constraints && !id) {
            initalConstraints = constraints
            //use constraints
        } else if(!constraints && id) {
            initalConstraints = {
                video: {
                    deviceId: {
                        exact: id
                    }
                }
            }
            //id with default constraints
        }
        else if(!constraints && !id){
            //TODO define and use default constraints
            initalConstraints = {
                video: true
            }
        } else {
            return CameraInitErrorClass.UnknownError
        }

        if(!navigator?.mediaDevices?.getUserMedia) {
            return CameraInitErrorClass.BrowserApiInaccessible
        }
        const devices = await this.getVideoDevices()
        if(devices.successful && devices.result.length === 0) {
            return CameraInitErrorClass.NoDevices
        }
        this.emit('log', String(initalConstraints))
        console.log('Calculated Constraints: ',initalConstraints)
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
    }
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
            console.log('test', request.result.stream)
            const deviceByStream = this.getMediaDeviceByStream(request.result.stream)
            if(!deviceByStream) return CameraInitErrorClass.DeviceNotFound
            request.result.devices.forEach(dev => {
                this.videoDevices.set(dev.deviceId, dev)
            })
            this.activeStreams.set(request.result.stream.id, { stream:
                request.result.stream,
                device: deviceByStream
            });
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