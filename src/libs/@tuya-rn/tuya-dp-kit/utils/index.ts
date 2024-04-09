export function isPlainObject(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;

  let proto = value;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }

  return Object.getPrototypeOf(value) === proto;
}

export function logger(text: string) {
  console.log('%c [tuya-dp-kit]', 'color: #fe5332; font-weight: bold', text);
}
