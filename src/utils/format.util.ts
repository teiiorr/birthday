/**
 * Small formatting helpers for building Telegram messages (HTML parse mode).
 */

/** Escape the five characters that are significant in Telegram HTML mode. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Normalize apostrophe-like characters to correct Uzbek (Latin) orthography so
 * they are preserved and "face the right way":
 *   - oʻ / gʻ          -> U+02BB (MODIFIER LETTER TURNED COMMA)   e.g. tugʻilgan
 *   - tutuq belgisi    -> U+02BC (MODIFIER LETTER APOSTROPHE)     e.g. aʼzo, eʼlon
 *
 * Source data often uses ASCII ' or the typographic quotes ‘ ’ ` ´; this maps
 * all of them to the proper Uzbek letters. Idempotent (already-correct text is
 * left untouched).
 */
export function normalizeUzbekApostrophes(input: string): string {
  if (!input) return input;
  return (
    input
      // oʻ, gʻ, Oʻ, Gʻ — the turned comma (U+02BB)
      .replace(/([oOgG])['‘’`´′ʹʼ]/g, '$1ʻ')
      // tutuq belgisi after a vowel — the modifier apostrophe (U+02BC)
      .replace(/([aeiouAEIOU])['‘’`´′ʹ]/g, '$1ʼ')
  );
}

/** Bold an already-escaped string. */
export function bold(text: string): string {
  return `<b>${text}</b>`;
}

/** Italicize an already-escaped string. */
export function italic(text: string): string {
  return `<i>${text}</i>`;
}

/** Compose an employee's full name from first + last. */
export function fullName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

/** Truncate text to a max length, appending an ellipsis when cut. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1))}…`;
}
