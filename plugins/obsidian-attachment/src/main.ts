import { Plugin } from 'obsidian';
import {
  type AttachmentCoreSettings,
  DEFAULT_SETTINGS,
  AttachmentCoreSettingTab,
} from './settings';
import { createSaveAttachment } from './attachment-handler';
import { runCleanup, silentClean } from './cleanup';

type SaveAttachmentFn = (name: string, ext: string, data: ArrayBuffer) => Promise<unknown>;
type AppWithSaveAttachment = Plugin['app'] & {
  saveAttachment: SaveAttachmentFn;
};

export default class ObsidianAttachmentCorePlugin extends Plugin {
  settings!: AttachmentCoreSettings;

  private originalSaveAttachment: SaveAttachmentFn | null = null;

  onload = async (): Promise<void> => {
    await this.loadSettings();

    this.addSettingTab(new AttachmentCoreSettingTab(this.app, this));

    const app = this.app as AppWithSaveAttachment;
    this.originalSaveAttachment = app.saveAttachment.bind(app);
    app.saveAttachment = createSaveAttachment(this);

    this.addCommand({
      id: 'clean-orphaned-assets',
      name: 'Clean orphaned assets',
      callback: () => runCleanup(this),
    });

    let startupCleaned = false;
    this.registerEvent(
      this.app.metadataCache.on('resolved', () => {
        if (startupCleaned) return;
        startupCleaned = true;
        silentClean(this);
      }),
    );
  };

  onunload = (): void => {
    if (this.originalSaveAttachment) {
      const app = this.app as AppWithSaveAttachment;
      app.saveAttachment = this.originalSaveAttachment;
      this.originalSaveAttachment = null;
    }
  };

  loadSettings = async (): Promise<void> => {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  };

  saveSettings = async (): Promise<void> => {
    await this.saveData(this.settings);
  };
}
