const words = [
  "amber",
  "blue",
  "bright",
  "calm",
  "clear",
  "cloud",
  "forest",
  "green",
  "lake",
  "light",
  "lion",
  "moon",
  "ocean",
  "quiet",
  "river",
  "silver",
  "sky",
  "stone",
  "sun",
  "wolf",
];

const getRandomIndex = (length: number): number => {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % length;
};

export const generateClientId = (): string => {
  const firstWord = words[getRandomIndex(words.length)];
  const secondWord = words[getRandomIndex(words.length)];
  const thirdWord = words[getRandomIndex(words.length)];
  const number = getRandomIndex(100);
  return `${firstWord}-${secondWord}-${thirdWord}-${number}`;
};