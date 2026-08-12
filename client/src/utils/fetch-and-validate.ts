export type ValidationError = {
  instancePath?: string;
  message?: string;
};

export type Validator<T> = ((value: unknown) => value is T) & {
  errors?: ValidationError[] | null;
};

export const fetchAndValidate = async <T>(
  url: string,
  validator: Validator<T>,
  label: string,
): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${label} (${response.status})`);
  }
  const data: unknown = await response.json();
  if (!validator(data)) {
    const errors = validator.errors
      ?.map(x => `${x.instancePath || "/"}: ${x.message}`)
      .join("\n");
    throw new Error(`Invalid ${label}\n${errors}`);
  }
  return data;
};
