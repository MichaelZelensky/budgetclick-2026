
export type ImageEditorRequest = {
  file: File;
  returnPath: string;
  onConfirm: (file: File) => void;
};

const imageEditorState: {
  request: ImageEditorRequest | null;
} = {
  request: null,
};

export const startImageEditor = (
  file: File,
  returnPath: string,
  onConfirm: (file: File) => void,
): void => {
  imageEditorState.request = {
    file,
    returnPath,
    onConfirm,
  };
};

export const getImageEditorRequest = (): ImageEditorRequest | null =>
  imageEditorState.request;

export const clearImageEditorRequest = (): void => {
  imageEditorState.request = null;
};
