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

export type EventDataMap = {
    'video-devicelist-update': Map<string, MediaDeviceInfo>; // Example: Array of video devices
    'log': string; // Example: Log data,
    'permission-status-change': {
        detail: string,
        state: BrowserPermissionStateClass
    }
};
export type EventListeners = {
    [K in typeof EventRegistry[number]]: Array<(data: EventDataMap[K]) => void>;
};