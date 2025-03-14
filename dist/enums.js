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
CameraInitErrorClass.DeviceNotFound = new CameraInitErrorClass("DeviceNotFound");
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
export const EventRegistry = ['video-devicelist-update', 'log', 'permission-status-change'];
