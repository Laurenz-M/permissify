import { BrowserPermissionStateClass, CameraInitErrorClass, CameraRequestAcceptedWrapper, CameraRequestDeniedWrapper, EventDataMap, EventListeners, FailedCameraRequest, SuccessfulCameraRequest } from "./enums";
export declare class CameraPermissionHandler {
    onLoadPermissionResult: null | {
        duration: number;
        response: SuccessfulCameraRequest | FailedCameraRequest;
        postRequestState: BrowserPermissionStateClass;
    };
    selectedDeviceId: string | null;
    videoDevices: Map<string, MediaDeviceInfo>;
    activeStreams: Map<string, {
        stream: MediaStream;
        device: MediaTrackSettings;
    }>;
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
    getMediaDeviceByStream(stream: MediaStream): MediaTrackSettings | null;
    startCamera(params: {
        id?: string;
        constraints?: MediaStreamConstraints;
    }): Promise<CameraRequestAcceptedWrapper | CameraRequestDeniedWrapper | CameraInitErrorClass>;
    initHandler(constraints?: MediaStreamConstraints): Promise<CameraRequestAcceptedWrapper | CameraRequestDeniedWrapper | CameraInitErrorClass>;
    private permissionGrantedHandler;
    private permissionDeniedHandler;
    private permissionPromptHandler;
    private permissionErrorhandler;
}
