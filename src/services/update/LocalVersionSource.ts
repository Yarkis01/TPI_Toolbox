import { CONFIG } from '../../core/Config';
import { IVersionSource } from '../../core/update/interfaces/IVersionSource';

export class LocalVersionSource implements IVersionSource {
    public async getVersion(): Promise<string> {
        return CONFIG.APP_VERSION;
    }
}
