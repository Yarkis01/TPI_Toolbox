import { Logger } from '../utils/Logger';

/**
 * Service for saving and loading data.
 */
export class StorageService {
    private readonly _logger: Logger;
    private readonly _prefix: string;
    private readonly _useTamperMonkey: boolean;

    /**
     * Initializes a new instance of the StorageService class.
     */
    public constructor() {
        this._logger = new Logger('StorageService');
        this._prefix = 'tpitoolbox:';
        
        this._useTamperMonkey = typeof GM_getValue !== 'undefined';
        if (!this._useTamperMonkey) {
            this._logger.warn('Tampermonkey environment not detected. Falling back to localStorage.');
        }
    }

    /**
     * Saves an item to the storage engine.
     * @param key The key under which the item will be stored.
     * @param value The item to be stored.
     */
    public save<T>(key: string, value: T): void {
        const fullKey = this._prefix + key;

        try {
            if (this._useTamperMonkey) {
                GM_setValue(fullKey, value);
            } else {
                const serializedValue = JSON.stringify(value);
                localStorage.setItem(fullKey, serializedValue);
            }
        } catch (error) {
            this._logger.error(`Failed to save item with key "${key}": ${error}`);
        }
    }

    /**
     * Loads an item from the storage engine.
     * @param key The key of the item to be loaded.
     * @param defaultValue The default value to return if the item is not found.
     * @returns The loaded item or the default value.
     */
    public load<T>(key: string, defaultValue: T): T {
        const fullKey = this._prefix + key;

        try {
            if (this._useTamperMonkey) {
                return GM_getValue<T>(fullKey, defaultValue);
            } else {
                const serializedValue = localStorage.getItem(fullKey);
                
                if (serializedValue === null) {
                    return defaultValue;
                }

                return JSON.parse(serializedValue) as T;
            }
        } catch (error) {
            this._logger.error(`Failed to load item with key "${key}": ${error}`);
            return defaultValue;
        }
    }

    /**
     * Removes an item from storage.
     * @param key The key to remove.
     */
    public remove(key: string): void {
        const fullKey = this._prefix + key;

        try {
            if (this._useTamperMonkey) {
                GM_deleteValue(fullKey);
            } else {
                localStorage.removeItem(fullKey);
            }
        } catch (error) {
            this._logger.error(`Failed to delete item with key "${key}": ${error}`);
        }
    }
}