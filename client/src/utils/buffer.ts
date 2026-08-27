export const getArrayBuffer = (body: Uint8Array): ArrayBuffer => {
  const arrayBuffer = new ArrayBuffer(body.byteLength);
  new Uint8Array(arrayBuffer).set(body);
  return arrayBuffer;
};