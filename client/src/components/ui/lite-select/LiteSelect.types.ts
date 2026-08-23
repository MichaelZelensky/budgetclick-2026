export type Option<V = string, T = string> = {
  value: V;
  text: T;
  disabled?: boolean;
  /**
   * String for style property; combination of letters:
   * b - bold
   * i - italic
   */
  style?: string;
}

export type Optgroup = {
  label: string;
  disabled?: boolean;
  options: Option<string | number>[];
}

export type ChangeEventDataType<T> = T | undefined;