export const encodeData = (data: unknown): Uint8Array => {
  return new TextEncoder().encode(JSON.stringify(data));
};

export const decodeData = <T>(body: ArrayBuffer): T => {
  return JSON.parse(new TextDecoder().decode(body)) as T;
};

export const encodeBlob = (blob: ArrayBuffer): string => {
  const bytes = new Uint8Array(blob);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
};

export const decodeBlob = (blob: string): ArrayBuffer => {
  const binary = atob(blob);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
};