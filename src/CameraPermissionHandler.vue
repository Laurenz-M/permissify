<template>
  <video
    id="video"
    autoplay
    muted
    playsinline
    disablepictureinpicture
    :style="useManualCode ? 'visibility: hidden' : 'visibility: visible'"
    class="h-full bg-black absolute top-0 left-0 overflow-y-hidden w-screen h-screen"
    style="background-color:black; object-fit: cover; width: 100vw;overflow: hidden; margin: 0px; border: 1px solid red"
  ></video>
  <div
      v-if="!useManualCode && (permissionGranted || permissionLoading)"
      class="h-full"
  >


    <div
        class="flex flex-column justify-content-between align-items-center h-full"
    >
      <slot name="cancel">
        <div class="w-full flex justify-content-start">
          <div @click="async () => {
            emit('cancel')
            await stopCamera()
          }" style="margin: 3vh; height: 14vw; max-height: 100px; aspect-ratio: 1/1; border-radius: 100%; border: 2px solid white; opacity: 100%;" class="flex justify-content-center align-items-center">
            <i class="pi pi-chevron-left text-white text-xl"></i>
          </div>
        </div>
      </slot>

      <div class="mt-6 flex justify-content-center align-items-center">
        <slot :name="header">
          <div class="text-white font-bold text-3xl">
            {{ props.header }}
          </div>
        </slot>
      </div>
      <slot name="center">
        <div v-if="type === 'barcode'" style="aspect-ratio: 2/1" class="square">
          <div v-if="showSquareOverlay" class="overflow-hidden flex justify-content-center align-items-center" style="width: 80%; height: 80%">
            <BarcodeIcon style="color: white; object-fit: cover; opacity: 0.2"></BarcodeIcon>
          </div>
        </div>
        <div v-else-if="type === 'qr-code'" style="aspect-ratio: 1/1" class="square">
          <div v-if="showSquareOverlay" class="w-full h-full">
            <QrCode style="color: white; opacity: 0.15; object-fit: cover"></QrCode>

          </div>
        </div>
      </slot>
      <slot name="manual-button">
        <div>
          {{mediaDevices.length}}
          <PButton
              class="mt-5 mb-8 font-bold border-2 text-white"
              outlined
              rounded
              v-if="mediaDevices.length > 1"
              @click="async () => {
              await handler.cycleCamera()
            }"
          >
            <i class="pi pi-replay"></i>
          </PButton>
          <PButton
              class="mt-5 mb-8 font-bold border-2 text-white"
              outlined
              rounded
              @click="async () => {
                await stopCamera()
                useManualCode = true
              }"
          >
            Use code instead {{mediaDevices.length}}
          </PButton>
        </div>
      </slot>
    </div>
  </div>
  <div v-else class="relative h-full">

    <div :class="`${ props.manualInputModalLike ? ' surface-800 opacity-50' : ''}`" class="absolute top-0 h-full w-full"></div>

    <div class="flex flex-column h-full justify-content-between align-items-center">
      <div class="w-full flex justify-content-start z-10">
        <slot name="manual-input-cancel">
          <div @click="emit('cancel')" style="margin: 3vh; height: 14vw; max-height: 75px; aspect-ratio: 1/1; border-radius: 100%; border: 2px solid black; opacity: 100%;" class="flex justify-content-center align-items-center">
            <i class="pi pi-chevron-left text-xl"></i>
          </div>
        </slot>
      </div>
      <div  style="max-width: 500px; width: 90%" :class="`${ props.manualInputModalLike ? 'border-round-xl shadow-6' : ''}`" class="bg-white h-full flex flex-column align-items-center justify-content-center">
        <slot name="manual-input">
          <h1 class="text-2xl mb-4 text-center font-bold">
            {{ type === 'qr-code' ? "Enter given ID" : "Enter Barcode value" }}
          </h1>
          <div v-if="type === 'barcode'">
            <div class="w-full flex flex-column justify-content-center align-items-center">
              <div style="width: 80%; height: 100%" class="overflow-hidden ">
                <BarcodeIcon style="color: black; object-fit: cover;"></BarcodeIcon>
              </div>

            </div>
            <div class="w-full flex align-items-center justify-content-center mb-4">
              <div style="border: 1px solid red; border-radius: 5px;padding-left: 5%; padding-right: 5%; margin-right: 25px" class="text-xl flex justify-content-between">
                <div v-for="i in manualInputBarcodeValue" v-bind:key="i">
                  {{i}}
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="type === 'qr-code'">
            <div class="w-full  flex flex-column justify-content-center align-items-center">
              <div class="h-full" style="border: 5px solid #88cc84; background-color: #88cc84;border-radius: 10px; width: 40vw; max-width: 400px ">
                <div style="height: 100%; border: 5px solid #88cc84; border-radius: 10px; " class="overflow-hidden bg-white">
                  <QrCode style="color: black; object-fit: cover;"></QrCode>
                </div>
                <div class="w-full flex justify-content-center">
                  <div class=" w-fit px-2 text-white text-xl font-bold" style="border: 2px solid red; border-radius: 5px">my_given_id</div>
                </div>
              </div>
            </div>
          </div>
          <p class="text-xl text-center mt-3">
            {{ type === 'qr-code' ? "The given ID is below the qr-code" : "The barcode is on the product's label" }}
          </p>
          <div class="w-full flex align-items-center justify-content-center flex-column">
            <InputText
                style="width: 80%"
                class="mt-3 text-xl"
                :placeholder="type === 'qr-code' ? 'Given ID' : 'Barcode'"
                v-model="manualGivenId"
                name="fridgeID"
            />
            <PrimeButton
                class="mt-2"
                style="width: 80%"
                size="large"
                label="Confirm"
                @click="() => {
              emit('manualData', manualGivenId);
              manualGivenId = ''
            }"
                :disabled="!manualGivenId"
            />
          </div>
        </slot>
        <PButton
            :class="`mt-5 mx-auto font-bold border-2 ${ props.manualInputModalLike ? 'text-white' : 'text-black-alpha-90'}`"
            label="Use camera"
            iconPos="right"
            outlined
            rounded
            @click="async () => {
              //await handleUseCameraClick()
              await handleUseCameraClick()

          }
        "
        >
          <template #icon>
            <ProgressSpinner v-if="useCameraButtonLoading" stroke-width="6" style="margin-right: 10px; height: 20px; padding: 0px; width: 20px"></ProgressSpinner>
          </template>
        </PButton>
        <Dialog v-model:visible="showManualEnablePopup" style="width: 80vw">
          <template #header>Enable Camera</template>
          <template #default>Please go to your browser settings and enable camera access for the webiste!</template>
        </Dialog>
        <Dialog v-model:visible="showReloadBrowserPopup" style="width: 80vw">
          <template #header>Reload Page</template>
          <template #default>Please reload the page!</template>
        </Dialog>
        <Dialog v-model:visible="showPleaseAcceptPopup" style="width: 80vw">
          <template #header>Accept Prompt</template>
          <template #default>Please accept the camera popup!</template>
        </Dialog>
      </div>
      <!--<Toast group="reload-prompt">
        <template #message>
          <PButton label="Reload" @click="windowRef.location.reload()"></PButton>
        </template>
      </Toast>-->
    </div>
  </div>
</template>

<script lang="ts" setup>
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import PrimeButton from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import { Barcode as BarcodeIcon, } from '@vicons/fa';
import { QrCode } from '@vicons/carbon';
import { onMounted, type PropType, ref } from 'vue';
import { BarcodeFormat, BrowserMultiFormatReader } from '@zxing/library';
import { useToast } from 'primevue/usetoast';
import { CameraPermissionHandler, PermissionsRetryable } from '@/components/CameraPermissionHandler';

const useCameraButtonLoading = ref(false);
const manualGivenId = ref('');
const useManualCode = ref(false);
const windowRef = ref(window);
const performanceRef = ref(performance);
const permissionGranted = ref(false);
const permissionLoading = ref(true);
const toast = useToast();
const manualInputBarcodeValue = ref([9,0,3,8,9,4,1,7,2,6,7,2,8]);
const mediaDevices = ref<MediaDeviceInfo[]>([]);
const permissionAsked = ref(false);

const showManualEnablePopup = ref(false);
const showReloadBrowserPopup = ref(false);
const showPleaseAcceptPopup = ref(false);

const handler = new CameraPermissionHandler();
/*
//handler.on('manual-enable', (data) => console.error(data));
handler.on('camera-started', async (stream) => {
  //toast.add({ severity: 'success', summary: String(!!stream) + String(!!elem) });
  if(!elem) return;
  (elem<HTMLVideoElement>).srcObject = stream.requestResult.stream;
  await (elem<HTMLVideoElement>).play();
});*/
handler.on('video-devicelist-update', (devices) => {
  //infoToast('update:devices: '+ JSON.stringify(devices, null, ' '));
  mediaDevices.value = devices;
});
handler.on('log', (data) => {
  infoToast('log-event: ' + data);
});

const infoToast = (input) => {
  toast.add({ severity: 'info', summary: input, });
};
const codeReader = new BrowserMultiFormatReader();
const idealCameraConstraints = { video: { height: { ideal: window.innerHeight * 2 }, facingMode: { ideal: 'environment' } } } as const;
onMounted(async () => {
  try {
    const test = await handler.initHandler(idealCameraConstraints);
    console.log('initResponse', test, handler.videoDevices.length);
    if (!test.permissionGranted) {
      useManualCode.value = true;
      return;
    }
    const elem = getVideoElement();
    elem.srcObject = test.request.result.stream;
    await elem.play();
    return;
  }
  catch(e) {
    infoToast('caught err on init: ' + String(e));
  }
});
async function cycleCamera() {

}
async function stopCamera() {
  for(const [key, value] of handler.activeStreams.entries()) {
    const res = await handler.stopCameraStream(value);
    console.log(res);
  }
  const elem = getVideoElement();
  elem.srcObject = null;
}
function getVideoElement() {
  const elem = document.getElementById('video') as HTMLVideoElement | null;
  if (!elem) throw new Error('Element not found!');
  return elem;
}
const emit = defineEmits({
  'decode': (decodedData: string) => true,
  'manualData': (data: string) => true,
  'cancel': () => true,
  'disallowed-decode': (type: string) => true
});
const props = defineProps({
  type: {
    type: String as PropType<'barcode' | 'qr-code' >,
    default: 'qr-code'
  },
  showSquareOverlay: {
    type:Boolean,
    default: true
  },
  header: {
    type: String,
    required: false,
    default: ''
  },
  manualInputModalLike: {
    type: Boolean,
    required: false,
    default: false
  },
  allowedFormats: {
    type: Object as PropType<BarcodeFormat[]>
  }
});
async function handleUseCameraClick() {
  useCameraButtonLoading.value = true;
  const res = await handler.startCamera(undefined,idealCameraConstraints);
  useCameraButtonLoading.value = false;
  //const res = await handler.handleUseCameraClick();
  console.log(res);
  //infoToast('useCameraClick res: '+ JSON.stringify(res, null, ' '));
  if(!res) return;
  if(res.permissionGranted) {
    useManualCode.value = false;
    const elem = getVideoElement();
    elem.srcObject = res.request.result.stream;
    try {
      await elem.play();
    }
    catch (e) {
      infoToast(String(e));
    }
    return;
  }
  if(res.retryable.value === PermissionsRetryable.No) {
    //infoToast('Manually enable the camera in the settings!');
    showManualEnablePopup.value = true;
    return;
  } else if (res.retryable.value === PermissionsRetryable.Yes) {
    //infoToast('Please accept the popup!');
    showPleaseAcceptPopup.value = true;
    return;
  }
  if(res.retryable.detail === 'any-button') {
    window.location.reload();
    return;
  }
  else if(res.retryable.detail === 'browser-button') {
    showReloadBrowserPopup.value = true;
    //infoToast('Please reload the page via the browser button!');
    return;
  }
}
/*
const onLoadPermissionResult = ref<null | { permissionTime: number, response: GetVideoDevicePermissionResultType, postRequestState: 'denied' | 'granted' | 'prompt' }>(null);
type GetVideoDevicePermissionResultType = { permissionGranted: true; result: MediaDeviceInfo[]; } | { permissionGranted: false, result: CameraInitError}

function initCameraErrorHandler(e) {
  console.log(e);
  const errorClass = e.name;
  const errorDetail = ((String(e).split(':'))[1]).trim();
  console.log(errorClass, errorDetail);
  toast.add({ severity: 'info', summary: String(e) });
  navigator.permissions.query({ name: 'camera' }).then(res => {
    //toast.add({ severity: 'info', summary: res.state });
  });
  if(e.name === 'NotAllowedError' && String(e).includes('denied')){//errorDetail === 'Permission denied'){
    return CameraInitError.PermissionDenied;
  }
  else if(e.name === 'NotAllowedError' && String(e).includes('dismissed')) {// errorDetail === 'Permission dismissed') {
    return CameraInitError.PermissionDismissed;
  }
  else if(e.name === 'NotReadableError' && errorDetail === 'Device in use') {
    return CameraInitError.InUse;
  }
  else {
    return CameraInitError.UnknownError;
  }
}
async function startCamera(deviceId: string) {
  console.log('shouldStart', deviceId);
  try {
    await codeReader.decodeFromVideoDevice(deviceId, 'video', (result, err) => {
      if (!result) return;
      if (err && !(err instanceof NotFoundException)) {
        console.error(err);
        return;
      }
      if (props.allowedFormats?.includes(result.getBarcodeFormat())) {
        emit('decode', result.getText());
      } else {
        emit('disallowed-decode', BarcodeFormat[result.getBarcodeFormat()]);
      }
    });
    console.log(`Started continous decode from camera with id ${deviceId}`);
  }
  catch (e) {
    const errorCause = initCameraErrorHandler(e);
    if(errorCause === CameraInitError.PermissionDenied || errorCause === CameraInitError.PermissionDismissed) {
      useManualCode.value = true;
      toast.removeAllGroups();
      toast.add({
        severity: 'warn',
        summary: 'Camera Permission denied'
      });
    }
  }

}

enum CameraInitError {
  PermissionDenied = 'PermissionDenied',
  PermissionDismissed = 'PermissionDismissed',
  InUse = 'InUse',
  UnknownError = 'UnknownError'
}
enum BrowserType {
  Chromium = 'Chromium',
  Firefox = 'Firefox',
  Safari = 'Safari',
  Unknown = 'Unknown'
}
//or generate random value

defineExpose({
  stopCamera,
  startCamera
});
*/
//get amount of cameras
// 1=> set array to [camera]
// more than 1 => set array to [cameras]
//select ideal camera if available
//start camera


//Chrome (mobile and Desktop):
//ask 3 times for permission without reload
//denied => manually enable

//Safari (mobile)
//ask 3 times for permission without reload
//denied 3 times => reload and repeat

//firefox (mobile)
//ask infinite time without reload
//allow once =>




//onload
//check permission state
//denied => manual code with banner/toast "camera denied"
//  onclick => toast/banner
//granted => camera
//  onlick => start cam
//prompt => prompt user
</script>

<style scoped>
.square {
  width: 70vw;
  max-width: 300px;
  border: 3px solid white;
  border-radius: 10px;
  margin: auto;
  display: flex;
  justify-content: center;
  align-items: center;
}

</style>

