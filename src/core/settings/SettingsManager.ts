import { StorageService } from '../../services/StorageService';
import { Logger } from '../../utils/Logger';
import { SETTINGS_DEF, SettingDefinition } from './SettingsSchema';

export class SettingsManager {
    private readonly _logger: Logger;
    private _storageService: StorageService;
    private _cache: Map<string, boolean>;

    public constructor() {
        this._logger = new Logger('SettingsManager');
        this._storageService = new StorageService();
        this._cache = new Map<string, boolean>();
        this._loadAllSettings();
    }

    private _loadAllSettings(): void {
        SETTINGS_DEF.forEach((setting) => {
            const value = this._storageService.load<boolean>(setting.key, setting.defaultValue);
            this._cache.set(setting.key, value);
        });
    }

    public isEnabled(key: string): boolean {
        return this._cache.get(key) ?? false;
    }

    public set(key: string, value: boolean): void {
        this._cache.set(key, value);
        this._storageService.save(key, value);
        this._logger.info(`Setting '${key}' changé à : ${value}`);
    }

    public getAllSettings(): Map<SettingDefinition, boolean> {
        return SETTINGS_DEF.reduce((acc, def) => {
            acc.set(def, this.isEnabled(def.key));
            return acc;
        }, new Map<SettingDefinition, boolean>());
    }
}
