export const format = (template: string, ...values: any[]): string => {
  return values.reduce((result, value) => {
    const str = value !== null && value !== undefined ? value.toString() : "";
    return result.replace(/%s/, str);
  }, template);
};
