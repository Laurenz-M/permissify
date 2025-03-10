# 📦 Permissify

[![npm version](https://img.shields.io/npm/v/permissify.svg)](https://www.npmjs.com/package/permissify)
[![License](https://img.shields.io/npm/l/permissify.svg)](LICENSE)
[![Downloads](https://img.shields.io/npm/dt/permissify.svg)](https://www.npmjs.com/package/permissify)
<!--[![Build Status](https://img.shields.io/github/actions/workflow/status/Laurenz-M/permissify/ci.yml)](https://github.com/Laurenz-M/permissify/actions)-->

A short description of what this package does.

# Table of Contents

1. [Introduction](#-introduction)
2. [Getting Started](#-getting-started)
3. [Installation](#-installation)
4. [Usage](#-usage)
5. [API Reference](#-api-reference)
   - [getVideoDevicePermissionWrapper()](#getvideodevicepermissionwrapperusermediaconstraints-mediastreamconstraints-promisea-hrefsuccessfulcamerarequestspansuccessfulcamerarequestspana--a-hreffailedcamerarequestspanfailedcamerarequestspana)
   - [getDevicesWrapper()](#getdeviceswrapper-promise-successful-true-result-mediadeviceinfo-duration-number----successful-false-result-string-duration-number-)
   - [getMediaDeviceByStream()](#getmediadevicebystreamstream-mediastream)
   - [startCamera()](#startcameraid-string-constraints-mediastreamconstraints-promisecamerarequestacceptedwrapper--camerarequestdeniedwrapper--camerainiterrorclass)
   - [getCameraPermissionState()](#getcamerapermissionstate-promise-state-browserpermissionstateclass-detail-string-)
   - [stopCameraStream()](#stopcamerastreamstream-mediastream-track-mediastreamtrack)
   - [stopCameraStreamById()](#stopcamerastreambyidcameraid-string-track-mediastreamtrack)
   - [getPreferredCamera()](#getpreferredcameravideodevices-mediadeviceinfo)
   - [initHandler()](#inithandlerconstraints-mediastreamconstraints---video-globalidealcameraconstraints--promisecamerarequestacceptedwrapper--camerarequestdeniedwrapper--camerainiterrorclass)
6. [Type Reference](#-api-reference-types)
   - [ResolutionTable](#resolution-table-resolution16by9table)
   - [GlobalCameraConstraints](#global-camera-constraints-globalidealcameraconstraints)
   - [FailedCameraRequest](#failedcamerarequest)
   - [SuccessfulCameraRequestResult](#successfulcamerarequestresult)
   - [SuccessfulCameraRequest](#successfulcamerarequest)
   - [CameraRequestDeniedWrapper](#camerarequestdeniedwrapper)
   - [CameraAcceptedDeniedWrapper](#camerarequestacceptedwrapper)
   - [RequestRetryableBasic](#requestretryablebasic)
   - [RequestRetryableAfterReload](#requestretryableafterreload)
   - [RequestRetryableUnknown](#requestretryableunknown)
   - [RequestRetryableWithDetail](#requestretryablewithdetail)
   - [CameraInitErrorClass](#camerainiterrorclass)
   - [BrowserDeniedReasonClass](#browserdeniedreasonclass)
   - [BrowserPermissionStateClass](#browserpermissionstateclass)
7. [Examples](#-examples)
8. [Contributing](#-contributing)
9. [Changelog](#-changelog) 
10. [Support](#-contact--support)
11. [License](#-license)



## ✨ Features

- 🚀 Feature 1
- 🔥 Feature 2
- ✅ Feature 3
- 🔧 Feature 4

---

## 📦 Installation

Install via npm:

```sh
npm install permissify
```

Or using yarn:

```sh
yarn add permissify
```

---

## 🚀 Usage

Basic example:

```ts
import {CameraPermissionHandler} from "permissify";

const handler = new CameraPermissionHandler();

onMounted(async () => {
    const initResult = await handler.initHandler();
    if(initResult.permissionGranted === true) {
        //request successful and results(strongly typed):
        const workingStream = initResult.request.result.stream;
        //set html stream source;
        console.log(initResult.request.result.devices);
        return;
    }
    //handle any kind of errors
})
```

More advanced example:

```ts
import {CameraPermissionHandler} from "permissify";
import {CameraInitErrorClass} from "./index";

const handler = new CameraPermissionHandler();

onMounted(async () => {
    const initResult = await handler.initHandler();

    //Handle initial errors e.g Navigator api not supported
    if (initResult instanceof CameraInitErrorClass) {
        console.log("Error starting cam: ", initResult); //Handle your initial error
        return;
    }

    //IMPORTANT: strictly check for false (instead of !initResult.permissionGranted) 
    // to retain strong ts types and intelliSense
    if(initResult.permissionGranted === false) {
        console.log("Camera Access denied by: ", initResult.deniedBy); //Browser or User
        console.log("Is retryable: ", initResult.retryable); //handle retry
        return
    }

    //request successful and results(strongly typed):
    const workingStream = initResult.request.result.stream;
    //set html stream source;
    console.log(initResult.request.result.devices);
})

onUnmounted(() => {
    //stop camera
})
```

---
<!--
## 🔧 Configuration

If your package requires configuration, document it here.

```ts
import { CameraPermissionHandler } from "permissify";

const handler = new CameraPermissionHandler();
```

| Option    | Type    | Default | Description       |
|-----------|--------|---------|-------------------|
| `option1` | boolean | `false` | Enables feature X |
| `option2` | string  | `"none"` | Sets mode        |

---

-->


### getVideoDevicePermissionWrapper(userMediaConstraints?: <a href="https://udn.realityripple.com/docs/Web/API/MediaStreamConstraints"><span>MediaStreamConstraints</span></a>): Promise<<a href="#successfulcamerarequest"><span>SuccessfulCameraRequest</span></a> | <a href="#failedcamerarequest"><span>FailedCameraRequest</span></a>>

Requests permission for video device access and returns the result, including the permission state before and after the request.

#### Parameters:
| Parameter             | Type                   | Description                                        |
|-----------------------|------------------------|----------------------------------------------------|
| `userMediaConstraints` | <a href="https://udn.realityripple.com/docs/Web/API/MediaStreamConstraints"><span>MediaStreamConstraints</span></a> | The constraints for accessing the media stream (optional) |

#### Returns:
- **Promise<<span style="font-size: 12px;">[SuccessfulCameraRequest](#successfulcamerarequest)</span> | <span style="font-size: 12px;">[FailedCameraRequest](#failedcamerarequest)</span>>** - A promise that resolves with either a successful or failed camera request, along with permission state and duration.
---

### getDevicesWrapper(): Promise<{ successful: true, result: <span><a href="https://developer.mozilla.org/de/docs/Web/API/MediaDeviceInfo">MediaDeviceInfo</a></span>[], duration: number } | { successful: false, result: string, duration: number }>
Gets a list of video devices and returns either a success with the device list or a failure with the error message.

#### Parameters:
None

#### Returns:
- **Promise<{ successful: true, result: <span><a href="https://developer.mozilla.org/de/docs/Web/API/MediaDeviceInfo">MediaDeviceInfo</a></span>[], duration: number } | { successful: false, result: string, duration: number }>** - A promise that resolves with either a successful response containing video devices or a failed response with an error message.

---

### getMediaDeviceByStream(stream: <span><a href="https://developer.mozilla.org/de/docs/Web/API/MediaStream">MediaStream</a></span>)
Extracts the video device ID from the given media stream.

#### Parameters:
| Parameter | Type       | Description                            |
|-----------|------------|----------------------------------------|
| `stream`  | <span><a href="https://developer.mozilla.org/de/docs/Web/API/MediaStream">MediaStream</a></span> | The media stream to extract device info from |

#### Returns:
- **{ videoDeviceId: any }** - The video device ID extracted from the media stream.

---

### startCamera(id?: string, constraints?: <a href="https://udn.realityripple.com/docs/Web/API/MediaStreamConstraints"><span>MediaStreamConstraints</span></a>): Promise<[CameraRequestAcceptedWrapper](#camera-request-accepted-wrapper) | [CameraRequestDeniedWrapper](#camera-request-denied-wrapper) | [CameraInitErrorClass](#camerainiterrorclass)>
Starts the camera with the given device ID and constraints, and returns the result based on permission state.

#### Parameters:
| Parameter   | Type                   | Description                                      |
|-------------|------------------------|--------------------------------------------------|
| `id`        | string (optional)       | The ID of the video device to use (optional)     |
| `constraints` | <a href="https://udn.realityripple.com/docs/Web/API/MediaStreamConstraints"><span>MediaStreamConstraints</span></a> | The media stream constraints (optional)           |

#### Returns:
- **Promise<[CameraRequestAcceptedWrapper](#camerarequestacceptedwrapper) | [CameraRequestDeniedWrapper](#camera-request-denied-wrapper) | [CameraInitErrorClass](#camerainiterrorclass)>** - A promise that resolves with either a successful camera start response, a denied camera request, or an error.

---

### getCameraPermissionState(): Promise<{ state: [BrowserPermissionStateClass](#browserpermissionstateclass), detail: string }>
Checks the current permission state for camera access and returns the state along with a detailed message.

#### Parameters:
None

#### Returns:
- **Promise<{ state: [BrowserPermissionStateClass](#browserpermissionstateclass), detail: string }>** - A promise that resolves with the camera permission state and a description of the state.

---

### stopCameraStream(stream: <span><a href="https://developer.mozilla.org/de/docs/Web/API/MediaStream">MediaStream</a></span>, track?: <span><a href="https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack">MediaStreamTrack</a></span>)
Stops the given media stream or a specific track within the stream.

#### Parameters:
| Parameter | Type            | Description                                       |
|-----------|-----------------|---------------------------------------------------|
| `stream`  | <span><a href="https://developer.mozilla.org/de/docs/Web/API/MediaStream">MediaStream</a></span>     | The media stream to stop                          |
| `track`   | <span><a href="https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack">MediaStreamTrack</a></span> (optional) | A specific track to remove from the stream (optional) |

#### Returns:
- **void** - Stops the tracks in the provided stream, or a specific track if provided.

---

### stopCameraStreamById(cameraId: string, track?: <span><a href="https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack">MediaStreamTrack</a></span>)
Stops the camera stream associated with the given camera ID, or stops a specific track in the stream.

#### Parameters:
| Parameter  | Type                | Description                                       |
|------------|---------------------|---------------------------------------------------|
| `cameraId` | string              | The ID of the camera stream to stop               |
| `track`    | <span><a href="https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack">MediaStreamTrack</a></span> (optional) | A specific track to remove from the stream (optional) |

#### Returns:
- **string | void** - Returns 'not found' if the camera ID doesn't exist, or stops the tracks in the stream.

---

### getPreferredCamera(videoDevices: <span><a href="https://developer.mozilla.org/de/docs/Web/API/MediaDeviceInfo">MediaDeviceInfo</a></span>[])
Determines the preferred camera (environmental or front) from a list of available video devices.

#### Parameters:
| Parameter         | Type              | Description                                           |
|-------------------|-------------------|-------------------------------------------------------|
| `videoDevices`    | <span><a href="https://developer.mozilla.org/de/docs/Web/API/MediaDeviceInfo">MediaDeviceInfo</a></span> | An array of available video devices                   |

#### Returns:
- **{ facing: string, id: string }** - Returns the preferred camera's facing direction ('environment', 'front', or 'unknown') and the device ID of the camera.

---

### initHandler(constraints: <a href="https://udn.realityripple.com/docs/Web/API/MediaStreamConstraints"><span>MediaStreamConstraints</span></a> = { video: GlobalIdealCameraConstraints }): Promise<[CameraRequestAcceptedWrapper](#camerarequestacceptedwrapper) | [CameraRequestDeniedWrapper](#camerarequestdeniedwrapper) | [CameraInitErrorClass](#camerainiterrorclass)>
Initializes the camera and handles permission states, device detection, and updates for the camera access.

#### Parameters:
| Parameter     | Type                 | Description                                       |
|---------------|----------------------|---------------------------------------------------|
| `constraints` | <a href="https://udn.realityripple.com/docs/Web/API/MediaStreamConstraints"><span>MediaStreamConstraints</span></a> (optional) | The constraints for the media stream (default is GlobalIdealCameraConstraints) |

#### Returns:
- **Promise<[CameraRequestAcceptedWrapper](#camerarequestacceptedwrapper) | [CameraRequestDeniedWrapper](#camerarequestdeniedwrapper) | [CameraInitErrorClass](#camerainiterrorclass)>** - A promise that resolves with the appropriate response, either an accepted wrapper, denied wrapper, or error.

---

## 📖 API Reference: Types

### Resolution Table: `resolution16By9Table`
Defines a mapping of common resolutions with a 16:9 aspect ratio, including `4k` and `720p` resolutions.

```ts
{
  '4k': { height: 4096, width: 2160 },
  '720p': { height: 1280, width: 720 }
}
```

---

### Global Camera Constraints: `GlobalIdealCameraConstraints`
Defines ideal camera settings using `720p` resolution with a front-facing camera and a 60fps frame rate.

```ts
{
  height: { ideal: 1280 },
  width: { ideal: 720 },
  facingMode: { ideal: 'environment' },
  frameRate: { ideal: 60 }
}
```

---

### `FailedCameraRequest`
Represents a failed camera request with details about permission state, error information, and request duration.

<pre>
{
  permissionState: {
    preRequest: <span style="font-size: 12px;"><a href="#browserpermissionstateclass">BrowserPermissionStateClass</a></span>,
    postRequest: <span style="font-size: 12px;"><a href="#browserpermissionstateclass">BrowserPermissionStateClass</a></span>,
  },
  permissionGranted: false,
  result: { 
    originalError: string, 
    mappedError: <span style="font-size: 12px;"><a href="#camerainiterrorclass">CameraInitErrorClass</a></span>,
  },
  duration: number
}
</pre>

---

### `SuccessfulCameraRequestResult`
Represents a successful camera request, containing the stream and device information.

<pre>
{
  stream: <span style="font-size: 12px;"><a href="#successfulcamerarequestresult">MediaStream</a></span>,
  devices: <span><a href="https://developer.mozilla.org/de/docs/Web/API/MediaDeviceInfo">MediaDeviceInfo</a></span>[],
}
</pre>>

---

### `SuccessfulCameraRequest`
Represents a successful camera request, including permission states and the resulting stream and device information.

<pre>
{
  permissionState: {
    preRequest: <span style="font-size: 12px;"><a href="#browserpermissionstateclass">BrowserPermissionStateClass</a></span>,
    postRequest: <span style="font-size: 12px;"><a href="#browserpermissionstateclass">BrowserPermissionStateClass</a></span>,
  },
  permissionGranted: true,
  result: <span style="font-size: 12px;"><a href="#successfulcamerarequestresult">SuccessfulCameraRequestResult</a></span>,
  duration: number
}
</pre>
---

### `RequestRetryableBasic`
Represents a request that can be retried, indicating if the retry is possible.

```ts
{
  value: "Yes" | "No",
  detail: null
}
```

---

### `RequestRetryableAfterReload`
Describes a retryable request that can only be retried after a reload, specifying the trigger for reload.

```ts
{
  value: "AfterReload",
  detail: 'browser-button' | 'any-button'
}
```

---

### `RequestRetryableUnknown`
Describes a retryable request with an unknown status.

```ts
{
  value: "Unknown",
  detail: null
}
```

---

### `RequestRetryableWithDetail`
A union type that combines `RequestRetryableUnknown` and `RequestRetryableAfterReload`.
<pre>
  <span style="font-size: 12px;"><a href="#requestretryableunknown">RequestRetryableUnknown</a></span> | <span style="font-size: 12px;"><a href="#requestretryableafterreload">RequestRetryableAfterReload</a></span>,
</pre>

---

### `CameraRequestDeniedWrapper`
Represents a denied camera request with details about the denial reason, retry status, and permission state.

<pre>
{
  permissionGranted: false,
  deniedBy: <span style="font-size: 12px;"><a href="#browserdeniedreasonclass">BrowserDeniedReasonClass</a></span>,
  retryable: <span style="font-size: 12px;"><a href="#requestretryablebasic">RequestRetryableBasic</a></span> | <span style="font-size: 12px;"><a href="#request-retryable-with-detail">RequestRetryableWithDetail</a></span>,
  permissionState: <span style="font-size: 12px;"><a href="#browserpermissionstateclass">BrowserPermissionStateClass</a></span>,
  request: <span style="font-size: 12px;"><a href="#failedcamerarequest">FailedCameraRequest</a></span>,
}
</pre>

---

### `CameraRequestAcceptedWrapper`
Represents an accepted camera request with permission status and result details.

<pre>
{
  permissionGranted: true,
  permissionState: <span style="font-size: 12px;"><a href="#browserpermissionstateclass">BrowserPermissionStateClass</a></span>,
  request: <span style="font-size: 12px;"><a href="#successfulcamerarequest">SuccessfulCameraRequest</a></span>,
}
</pre>

---

### `CameraInitErrorClass`
Represents various camera initialization error states such as `PermissionDismissed`, `PermissionDenied`, `NoDevices`, etc.

```ts
class CameraInitErrorClass {
  static readonly PermissionDismissed = new CameraInitErrorClass("PermissionDismissed");
  static readonly PermissionDenied = new CameraInitErrorClass("PermissionDenied");
  static readonly InUse = new CameraInitErrorClass("InUse");
  static readonly Overconstrained = new CameraInitErrorClass("Overconstrained");
  static readonly UnknownError = new CameraInitErrorClass("UnknownError");
  static readonly BrowserApiInaccessible = new CameraInitErrorClass("BrowserApiInaccessible");
  static readonly NoDevices = new CameraInitErrorClass("NoDevices");
}
```

---

### `BrowserDeniedReasonClass`
Represents the reason for denial of camera access, either by the browser or the user.

```ts
class BrowserDeniedReasonClass {
  static readonly Browser = new BrowserDeniedReasonClass("Browser");
  static readonly User = new BrowserDeniedReasonClass("User");
}
```

---

### `BrowserPermissionStateClass`
Represents the permission state of the browser, with values like `Granted`, `Denied`, `Prompt`, etc.



---

## 🎯 Examples

Check out the `/examples` folder for more detailed usage.


---

## 🛠️ Development

Clone the repository:

```sh
git clone https://github.com/Laurenz-M/permissify.git
cd permissify
npm install
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature-branch`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature-branch`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📬 Contact & Support

- GitHub: [https://github.com/Laurenz-M/permissify](https://github.com/Laurenz-M/permissify)
- Issues: [https://github.com/Laurenz-M/permissify/issues](https://github.com/Laurenz-M/permissify/issues)
