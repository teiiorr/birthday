/**
 * Telegram IDs are stored as PostgreSQL BIGINT and surface in JS as `bigint`.
 * `JSON.stringify` throws on bigint by default, which would break structured
 * logging and any accidental serialization. Importing this module once patches
 * bigint to serialize as a string. The operation is idempotent.
 */
if (typeof (BigInt.prototype as unknown as { toJSON?: unknown }).toJSON !== 'function') {
  Object.defineProperty(BigInt.prototype, 'toJSON', {
    value: function toJSON(this: bigint): string {
      return this.toString();
    },
    writable: true,
    configurable: true,
  });
}

export {};
