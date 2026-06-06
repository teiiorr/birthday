/** Small async/array helpers. */

/** Resolve after `ms` milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Split an array into fixed-size chunks. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size <= 0) return [items.slice()];
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}
