export declare const resolution16By9Table: {
    readonly '4k': {
        readonly height: 4096;
        readonly width: 2160;
    };
    readonly '720p': {
        readonly height: 1280;
        readonly width: 720;
    };
};
export declare const GlobalIdealCameraConstraints: {
    height: {
        ideal: 1280;
    };
    width: {
        ideal: 720;
    };
    facingMode: {
        ideal: string;
    };
    frameRate: {
        ideal: number;
    };
};
export interface FailedCameraRequest {
    permissionState: {
        preRequest: BrowserPermissionStateClass;
        postRequest: BrowserPermissionStateClass;
    };
    permissionGranted: false;
    result: {
        originalError: string;
        mappedError: CameraInitErrorClass;
    };
    duration: number;
}
export interface SuccessfulCameraRequestResult {
    stream: MediaStream;
    devices: MediaDeviceInfo[];
}
export interface SuccessfulCameraRequest {
    permissionState: {
        preRequest: BrowserPermissionStateClass;
        postRequest: BrowserPermissionStateClass;
    };
    permissionGranted: true;
    result: SuccessfulCameraRequestResult;
    duration: number;
}
export interface RequestRetryableBasic {
    value: typeof PermissionsRetryableClass.Yes | typeof PermissionsRetryableClass.No;
    detail: null;
}
export type RequestRetryableAfterReload = {
    value: typeof PermissionsRetryableClass.AfterReload;
    detail: 'browser-button' | 'any-button';
};
export type RequestRetryableUnknown = {
    value: typeof PermissionsRetryableClass.Unknown;
    detail: null;
};
export type RequestRetryableWithDetail = RequestRetryableUnknown | RequestRetryableAfterReload;
export interface CameraRequestDeniedWrapper {
    permissionGranted: false;
    deniedBy: BrowserDeniedReasonClass;
    retryable: RequestRetryableBasic | RequestRetryableWithDetail;
    permissionState: BrowserPermissionStateClass;
    request: FailedCameraRequest;
}
export interface CameraRequestAcceptedWrapper {
    permissionGranted: true;
    permissionState: BrowserPermissionStateClass;
    request: SuccessfulCameraRequest;
}
export declare class CameraInitErrorClass {
    readonly value: string;
    private constructor();
    static readonly PermissionDismissed: CameraInitErrorClass;
    static readonly PermissionDenied: CameraInitErrorClass;
    static readonly InUse: CameraInitErrorClass;
    static readonly Overconstrained: CameraInitErrorClass;
    static readonly UnknownError: CameraInitErrorClass;
    static readonly BrowserApiInaccessible: CameraInitErrorClass;
    static readonly NoDevices: CameraInitErrorClass;
    static readonly DeviceNotFound: CameraInitErrorClass;
    static from(value: string): CameraInitErrorClass | undefined;
    toString(): string;
}
export declare class BrowserDeniedReasonClass {
    readonly value: string;
    private constructor();
    static readonly Browser: BrowserDeniedReasonClass;
    static readonly User: BrowserDeniedReasonClass;
    static from(value: string): BrowserDeniedReasonClass | undefined;
    toString(): string;
}
export declare class BrowserPermissionStateClass {
    readonly value: string;
    private constructor();
    static readonly Granted: BrowserPermissionStateClass;
    static readonly Denied: BrowserPermissionStateClass;
    static readonly Prompt: BrowserPermissionStateClass;
    static readonly Error: BrowserPermissionStateClass;
    static from(value: string): BrowserPermissionStateClass | undefined;
    toString(): string;
}
export declare class PermissionsRetryableClass {
    readonly value: string;
    private constructor();
    static readonly Yes: PermissionsRetryableClass;
    static readonly No: PermissionsRetryableClass;
    static readonly AfterReload: PermissionsRetryableClass;
    static readonly Unknown: PermissionsRetryableClass;
    static from(value: string): PermissionsRetryableClass | undefined;
    toString(): string;
}
export declare const EventRegistry: readonly ["video-devicelist-update", "log", "permission-status-change"];
type EventDataMap = {
    'video-devicelist-update': Map<string, MediaDeviceInfo>;
    'log': string;
    'permission-status-change': {
        detail: string;
        state: BrowserPermissionStateClass;
    };
};
type EventListeners = {
    [K in typeof EventRegistry[number]]: Array<(data: EventDataMap[K]) => void>;
};
export declare class CameraPermissionHandler {
    onLoadPermissionResult: null | {
        duration: number;
        response: SuccessfulCameraRequest | FailedCameraRequest;
        postRequestState: BrowserPermissionStateClass;
    };
    selectedDeviceId: string | null;
    videoDevices: Map<string, MediaDeviceInfo>;
    activeStreams: Map<string, MediaStream>;
    events: EventListeners;
    constructor();
    on<K extends keyof EventDataMap>(eventName: K, listener: (data: EventDataMap[K]) => void): void;
    private emit;
    getBrowserPermissionState(): Promise<{
        state: BrowserPermissionStateClass;
        detail: string;
    }>;
    stopCameraByStream(stream: MediaStream, track?: MediaStreamTrack): Promise<CameraInitErrorClass | undefined>;
    stopCameraStreamById(cameraId: string, track?: MediaStreamTrack): Promise<CameraInitErrorClass | undefined>;
    getPreferredCamera(videoDevices: MediaDeviceInfo[]): {
        facing: string;
        id: string;
    };
    private cameraErrorMessageMapper;
    private getReloadButtonType;
    private cameraPermissionDeniedReason;
    requestVideoDevice(userMediaConstraints?: MediaStreamConstraints): Promise<SuccessfulCameraRequest | FailedCameraRequest>;
    getVideoDevices(): Promise<{
        successful: true;
        result: MediaDeviceInfo[];
        duration: number;
    } | {
        successful: false;
        result: string;
        duration: number;
    }>;
    getMediaDeviceByStream(stream: MediaStream): {
        videoDevice: MediaTrackSettings | null;
    };
    startCamera(id?: string, constraints?: MediaStreamConstraints): Promise<CameraRequestAcceptedWrapper | CameraRequestDeniedWrapper | CameraInitErrorClass>;
    initHandler(constraints?: MediaStreamConstraints): Promise<CameraRequestAcceptedWrapper | CameraRequestDeniedWrapper | CameraInitErrorClass>;
    private permissionGrantedHandler;
    private permissionDeniedHandler;
    private permissionPromptHandler;
    private permissionErrorhandler;
}
export {};
