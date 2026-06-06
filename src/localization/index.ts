/**
 * Localization entry point. Only Uzbek (Latin) is required today, but routing
 * every string through `t` keeps the door open for additional locales later.
 */
import { uz, type Localization } from './uz';

export const t: Localization = uz;
export type { Localization };
