import { injectStyle } from '../utils/DomUtils';
import { Logger } from '../utils/Logger';
import IApp from './interfaces/IApp';

/**
 * Iframe application class.
 */
export class IframeApp implements IApp {
    private readonly _logger: Logger;

    /**
     * IframeApp constructor.
     */
    public constructor() {
        this._logger = new Logger('IframeApp');
    }

    /**
     * @inheritdoc
     */
    public async start(): Promise<void> {
        this._logger.info('🧼 Applying Chat Cleaner in iframe context...');

        if (window.location.href.endsWith('chat.php')) {
            injectStyle(`
                button.chat-window__close {
                    display: none !important;
                    visibility: hidden !important;
                }

                div.chat-window__header {
                    flex-direction: column !important;
                }

                div#chat-messages {
                    max-height: none !important;
                }
            `);
        }
    }
}
