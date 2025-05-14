export const format = (
  template: string,
  ...values: (string | number)[]
): string => {
  return values.reduce<string>((result, value) => {
    const str = value !== null && value !== undefined ? value.toString() : "";
    return result.replace(/%s/, str);
  }, template);
};
