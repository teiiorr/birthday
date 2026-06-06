/**
 * Custom Telegraf context with scene + wizard session support.
 */
import { Context, Scenes } from 'telegraf';

/** Per-update flags we attach in middleware. */
export interface BotContextExtras {
  isAdmin?: boolean;
}

export type BotSession = Scenes.WizardSession<Scenes.WizardSessionData>;

export interface BotContext extends Context, BotContextExtras {
  session: BotSession;
  scene: Scenes.SceneContextScene<BotContext, Scenes.WizardSessionData>;
  wizard: Scenes.WizardContextWizard<BotContext>;
}

/** Typed state bag for the anonymous-wish scene. */
export interface WishSceneState {
  employeeId: string;
  firstName: string;
  message?: string;
  awaitingDuplicateChoice?: boolean;
}

/** Typed state bag for the single-field edit scenes. */
export interface EditFieldState {
  employeeId: string;
  field: string;
}

/** Typed state bag for the settings-edit scene. */
export interface SettingsEditState {
  field: string;
}

/** Typed state bag for the employee-search scene. */
export interface SearchState {
  fromPanel?: boolean;
}
