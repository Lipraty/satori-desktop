export function generateId(inputStr: string) {
  const hash = (str: string) => {
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i)
    }
    return (hash >>> 0)
  }
  const max36 = 36 ** 6 - 1
  const numericHash = hash(inputStr) % (max36 + 1)
  return numericHash.toString(36)
    .padStart(6, '0')
    .slice(0, 6);
}
