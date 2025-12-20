import { Logger } from '../utils/Logger';

/**
 * Service for saving and loading data to/from local storage.
 */
export class StorageService {
    private readonly _logger: Logger;
    private readonly _prefix: string;

    /**
     * Initializes a new instance of the StorageService class.
     */
    public constructor() {
        this._logger = new Logger('StorageService');
        this._prefix = 'tpitoolbox:';
    }

    /**
     * Saves an item to local storage.
     * @param key The key under which the item will be stored.
     * @param value The item to be stored.
     */
    public save<T>(key: string, value: T): void {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(this._prefix + key, serializedValue);
        } catch (error) {
            this._logger.error(`Failed to save item with key "${key}": ${error}`);
        }
    }

    /**
     * Loads an item from local storage.
     * @param key The key of the item to be loaded.
     * @param defaultValue The default value to return if the item is not found.
     * @returns The loaded item or the default value.
     */
    public load<T>(key: string, defaultValue: T): T {
        let item: T = defaultValue;

        try {
            const serializedValue = localStorage.getItem(this._prefix + key);

            if (serializedValue !== null) {
                item = JSON.parse(serializedValue) as T;
            }
        } catch (error) {
            this._logger.error(`Failed to load item with key "${key}": ${error}`);
        }

        return item;
    }
}
