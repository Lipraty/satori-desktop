// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const css = (strings: TemplateStringsArray, ...values: any[]) => {
  let result = '';
  strings.forEach((string, i) => {
    result += string + (values[i] || '');
  });
  return result;
}
