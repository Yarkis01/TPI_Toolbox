import { Logger } from '../../utils/Logger';
import { ISiteStatus } from '../interfaces/ISiteStatus';

export class SiteStatusService {
    private readonly _logger: Logger;
    private readonly _endpoint: string = 'https://tpitoolbox.yarkis.top/api/site-status';

    public constructor() {
        this._logger = new Logger('SiteStatusService');
    }

    /**
     * Fetches the site status from the API.
     * @returns A promise that resolves to the site status, or null if an error occurs.
     */
    public async fetchStatus(): Promise<ISiteStatus | null> {
        try {
            const response = await fetch(this._endpoint);
            if (!response.ok) {
                this._logger.error(`Failed to fetch site status. Status: ${response.status}`);
                return null;
            }

            const data: ISiteStatus = await response.json();
            return data;
        } catch (error) {
            this._logger.error(`Error fetching site status: ${error}`);
            return null;
        }
    }
}
