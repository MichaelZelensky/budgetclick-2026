import { ref, type Ref } from "vue";
import { useRouter } from "vue-router";
import { startImageEditor } from "@/state/imageEditor";

type AttachmentBase = {
  id: string;
  name: string;
  type: string;
  url: string;
};

type Options<T extends AttachmentBase> = {
  attachments: Ref<T[]>;
  createAttachment: (file: File) => T;
  isDuplicate: (attachment: T, file: File) => boolean;
  onAttachmentAdded: () => void;
  prepareAttachments?: () => Promise<void>;
};

const maxAttachmentSize = 5 * 1024 * 1024;
const supportedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
];

export const isSupportedImage = (type: string): boolean =>
  supportedImageTypes.includes(type);

export const useRecordAttachments = <T extends AttachmentBase>(
  options: Options<T>,
) => {
  const router = useRouter();
  const showDuplicateAttachmentModal = ref(false);
  const showAttachmentSizeModal = ref(false);
  const pendingOversizedImage = ref<File | undefined>();

  const addAttachment = (file: File): void => {
    const duplicate = options.attachments.value.some(
      attachment => options.isDuplicate(attachment, file),
    );

    if (duplicate) {
      showDuplicateAttachmentModal.value = true;
      return;
    }

    options.attachments.value = [
      ...options.attachments.value,
      options.createAttachment(file),
    ];

    options.onAttachmentAdded();
  };

  const editImage = (file: File, onEdited: (file: File) => void = addAttachment): void => {
    startImageEditor(
      file,
      router.currentRoute.value.fullPath,
      onEdited,
    );

    void router.push("/editor");
  };

  const closeAttachmentSizeModal = (): void => {
    showAttachmentSizeModal.value = false;
    pendingOversizedImage.value = undefined;
  };

  const editOversizedImage = (): void => {
    if (pendingOversizedImage.value === undefined) {
      return;
    }

    const file = pendingOversizedImage.value;
    showAttachmentSizeModal.value = false;
    pendingOversizedImage.value = undefined;
    editImage(file);
  };

  const selectAttachments = async (event: Event): Promise<void> => {
    const input = event.target as HTMLInputElement;

    if (input.files === null) {
      return;
    }

    await options.prepareAttachments?.();

    const selectedFiles = Array.from(input.files);
    const oversizedImages = selectedFiles.filter(
      file => file.size > maxAttachmentSize
        && supportedImageTypes.includes(file.type),
    );
    const hasOversizedNonImage = selectedFiles.some(
      file => file.size > maxAttachmentSize
        && !supportedImageTypes.includes(file.type),
    );

    const selectedAttachments = selectedFiles.filter(file => {
      if (file.size > maxAttachmentSize) {
        return false;
      }

      const duplicate = options.attachments.value.some(
        attachment => options.isDuplicate(attachment, file),
      );

      if (duplicate) {
        showDuplicateAttachmentModal.value = true;
      }

      return !duplicate;
    });

    options.attachments.value = [
      ...options.attachments.value,
      ...selectedAttachments.map(options.createAttachment),
    ];

    if (hasOversizedNonImage || oversizedImages.length > 0) {
      showAttachmentSizeModal.value = true;
    }

    if (oversizedImages.length > 0) {
      pendingOversizedImage.value = oversizedImages[0];
    }

    input.value = "";
  };

  return {
    showDuplicateAttachmentModal,
    showAttachmentSizeModal,
    pendingOversizedImage,
    closeAttachmentSizeModal,
    editOversizedImage,
    editImage,
    selectAttachments,
  };
};