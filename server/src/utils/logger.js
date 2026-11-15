/** Небольшая обёртка над console, чтобы формат логов был единым. */
const stamp = () => new Date().toISOString();

export const log = {
  info: (...args) => console.log(`[${stamp()}] [info]`, ...args),
  warn: (...args) => console.warn(`[${stamp()}] [warn]`, ...args),
  error: (...args) => console.error(`[${stamp()}] [error]`, ...args),
};
