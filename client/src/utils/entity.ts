export const generateEntityId = (prefix: string): string => {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, byte => byte.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 8);

  return `${prefix}_${id}`;
};