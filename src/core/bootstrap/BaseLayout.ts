import { injectStyle } from '../../utils/DomUtils';
import { Logger } from '../../utils/Logger';
import { CHAT_IFRAME, SELECTORS } from '../constants/LayoutConstants';
import IBootstrap from '../interfaces/IBootstrap';

/**
 * Bootstrap class to apply the base layout modifications.
 */
export class BaseLayout implements IBootstrap {
    private readonly _logger: Logger;

    /**
     * Creates an instance of the BaseLayout class.
     */
    public constructor() {
        this._logger = new Logger('BaseLayout');
    }

    /**
     * @inheritdoc
     */
    public run(): void {
        this._logger.info('🏗️ Applying Base Layout...');

        this._editBodyClass();
        this._removeUnnecessaryElements();
    }

    /**
     * Edits the body class to adjust layout when chat is opened.
     */
    private _editBodyClass(): void {
        this._logger.debug('🔧 Editing body class for base layout...');

        injectStyle(`
            body.${SELECTORS.CHAT_OPENED} {
                --tpi-chat-offset: ${CHAT_IFRAME.WIDTH}px;
            }

            body.${SELECTORS.CHAT_OPENED} .play-main {
                transition: margin-right 0.3s ease-in-out, width 0.3s ease-in-out;
                margin-right: var(--tpi-chat-offset) !important;
                width: auto !important;
                max-width: calc(100% - var(--tpi-chat-offset)) !important;
            }

            body.${SELECTORS.CHAT_OPENED} .play-main > * {
                max-width: 100% !important;
                box-sizing: border-box !important;
            }
        `);
    }

    /**
     * Removes unnecessary elements from the layout.
     */
    private _removeUnnecessaryElements(): void {
        this._logger.debug('🧹 Removing unnecessary elements from the layout...');

        injectStyle(`
            ${SELECTORS.LINK_TUTORIAL}, ${SELECTORS.DISCORD_BUTTON}, ${SELECTORS.CHAT_BUTTON}, ${SELECTORS.LOGOUT_BUTTON} {
                display: none !important;
                visibility: hidden !important;
            }
        `);
    }
}
