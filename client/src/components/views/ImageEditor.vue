<template>
  <main class="image-editor">
    <h1 class="tw-text-lg tw-font-semibold">Edit Image</h1>

    <div class="cropper-container">
      <Cropper
        ref="cropper"
        :src="imageUrl"
        :stencil-props="{ aspectRatio: undefined }"
        :canvas="{ maxArea: 16777216 }"
        @change="renderEditedImage"
      />
    </div>

    <div class="tw-flex tw-flex-wrap tw-gap-2">
      <LiteButton @click="rotateLeft">Rotate Left</LiteButton>
      <LiteButton @click="rotateRight">Rotate Right</LiteButton>
    </div>

    <div class="tw-grid tw-gap-1">
      <label for="image-resolution">Maximum resolution: {{ maxDimension }} px</label>
      <input
        id="image-resolution"
        v-model.number="maxDimension"
        type="range"
        min="320"
        max="4000"
        step="100"
      />
    </div>

    <div class="tw-grid tw-gap-1">
      <label for="image-quality">JPEG quality: {{ quality }}%</label>
      <input
        id="image-quality"
        v-model.number="quality"
        type="range"
        min="40"
        max="100"
        step="5"
      />
    </div>

    <div class="tw-grid tw-gap-1">
      <div>
        Original: {{ originalWidth }} × {{ originalHeight }} px,
        {{ (originalSize / (1024 * 1024)).toFixed(2) }} MB
      </div>
      <div v-if="outputBlob">
        Result: {{ outputWidth }} × {{ outputHeight }} px,
        {{ (outputBlob.size / (1024 * 1024)).toFixed(2) }} MB
      </div>
      <div v-else>
        Preparing image...
      </div>
      <div v-if="outputBlob && outputBlob.size > maxAttachmentSize" class="tw-text-red-600">
        Image is still too large. Reduce the resolution or quality.
      </div>
    </div>

    <div class="tw-flex tw-flex-wrap tw-justify-end tw-gap-2">
      <LiteButton @click="cancel">Cancel</LiteButton>
      <LiteButton @click="resetEditor">Reset</LiteButton>
      <LiteButton
        variant="primary"
        :disabled="outputBlob === null || outputBlob.size > maxAttachmentSize"
        @click="confirm"
      >
        Confirm
      </LiteButton>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import LiteButton from "@/components/ui/LiteButton.vue";
import {
  clearImageEditorRequest,
  getImageEditorRequest,
} from "@/state/imageEditor";

type CropperInstance = {
  getResult: () => {
    canvas: HTMLCanvasElement | null;
  };
  rotate: (angle: number) => void;
  reset: () => void;
};

const router = useRouter();
const request = getImageEditorRequest();
const cropper = ref<CropperInstance | null>(null);
const imageUrl = ref("");
const originalWidth = ref(0);
const originalHeight = ref(0);
const originalSize = request?.file.size ?? 0;
const maxDimension = ref(2000);
const quality = ref(80);
const outputBlob = ref<Blob | null>(null);
const outputWidth = ref(0);
const outputHeight = ref(0);
const maxAttachmentSize = 3 * 1024 * 1024;
const renderVersion = ref(0);

if (request === null) {
  void router.replace("/");
} else {
  imageUrl.value = URL.createObjectURL(request.file);

  const originalImage = new Image();
  originalImage.onload = () => {
    originalWidth.value = originalImage.naturalWidth;
    originalHeight.value = originalImage.naturalHeight;
  };
  originalImage.src = imageUrl.value;
}

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  imageQuality: number,
): Promise<Blob | null> =>
  new Promise(resolve => {
    canvas.toBlob(resolve, "image/jpeg", imageQuality);
  });

const resizeCanvas = (
  source: HTMLCanvasElement,
  maxSize: number,
): HTMLCanvasElement => {
  const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));

  const context = canvas.getContext("2d");
  if (context !== null) {
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
  }

  return canvas;
};

const scaleCanvas = (
  source: HTMLCanvasElement,
  scale: number,
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));

  const context = canvas.getContext("2d");
  if (context !== null) {
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
  }

  return canvas;
};

const compressCanvas = async (
  canvas: HTMLCanvasElement,
  imageQuality: number,
  attempts = 0,
): Promise<Blob | null> => {
  const blob = await canvasToBlob(canvas, imageQuality);

  if (blob === null) {
    return null;
  }

  if (blob.size <= maxAttachmentSize) {
    return blob;
  }

  if (attempts >= 15) {
    return null;
  }

  if (imageQuality > 0.4) {
    return compressCanvas(
      canvas,
      Math.max(0.4, imageQuality - 0.1),
      attempts + 1,
    );
  }

  if (Math.max(canvas.width, canvas.height) <= 320) {
    return null;
  }

  return compressCanvas(
    scaleCanvas(canvas, 0.8),
    0.8,
    attempts + 1,
  );
};

const renderEditedImage = async (): Promise<void> => {
  const version = ++renderVersion.value;
  const canvas = cropper.value?.getResult().canvas;

  if (canvas === null || canvas === undefined) {
    outputBlob.value = null;
    return;
  }

  const resizedCanvas = resizeCanvas(canvas, maxDimension.value);
  const blob = await compressCanvas(resizedCanvas, quality.value / 100);

  if (version !== renderVersion.value) {
    return;
  }

  outputBlob.value = blob;
  outputWidth.value = resizedCanvas.width;
  outputHeight.value = resizedCanvas.height;
};

const rotateLeft = (): void => {
  cropper.value?.rotate(-90);
};

const rotateRight = (): void => {
  cropper.value?.rotate(90);
};

const resetEditor = (): void => {
  cropper.value?.reset();
  maxDimension.value = 2000;
  quality.value = 80;
  outputBlob.value = null;
  void renderEditedImage();
};

const cancel = async (): Promise<void> => {
  if (request === null) {
    await router.replace("/");
    return;
  }

  clearImageEditorRequest();
  await router.replace(request.returnPath);
};

const confirm = async (): Promise<void> => {
  if (
    request === null
    || outputBlob.value === null
    || outputBlob.value.size > maxAttachmentSize
  ) {
    return;
  }

  const originalName = request.file.name.replace(/\.[^.]+$/, "");
  const file = new File(
    [outputBlob.value],
    `${originalName}.jpg`,
    {
      type: "image/jpeg",
      lastModified: Date.now(),
    },
  );

  request.onConfirm(file);
  clearImageEditorRequest();
  await router.replace(request.returnPath);
};

watch([maxDimension, quality], () => {
  void renderEditedImage();
});

onBeforeUnmount(() => {
  renderVersion.value++;
  if (imageUrl.value !== "") {
    URL.revokeObjectURL(imageUrl.value);
  }
});
</script>

<style scoped>
.image-editor {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 0.5rem 1rem;
  overflow: hidden;
}

.image-editor h1 {
  margin: 0;
  flex-shrink: 0;
}

.cropper-container {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  background: #18181b;
}

.cropper-container :deep(.vue-advanced-cropper) {
  width: 100%;
  height: 100%;
  max-width: 100%;
}

.image-editor > div:not(.cropper-container) {
  flex-shrink: 0;
}
</style>