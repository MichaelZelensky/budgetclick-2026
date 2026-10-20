const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const generateEntityId = (prefix: string): string => {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, byte => alphabet[byte % alphabet.length]).join("");

  return `${prefix}_${id}`;
};