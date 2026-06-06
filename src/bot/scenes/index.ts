/** Assembles all scenes into a single Telegraf Stage. */
import { Scenes } from 'telegraf';
import type { BotContext } from '../context';
import { addEmployeeScene } from './addEmployee.scene';
import { editFieldScene } from './editField.scene';
import { searchScene } from './search.scene';
import { settingsEditScene } from './settingsEdit.scene';
import { wishScene } from './wish.scene';

export function createStage(): Scenes.Stage<BotContext> {
  return new Scenes.Stage<BotContext>([
    wishScene,
    addEmployeeScene,
    editFieldScene,
    settingsEditScene,
    searchScene,
  ]);
}
