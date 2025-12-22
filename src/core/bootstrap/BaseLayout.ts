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
            :root {
                --tpi-chat-offset: 0px;
            }

            body.${SELECTORS.CHAT_OPENED} {
                --tpi-chat-offset: ${CHAT_IFRAME.WIDTH}px;
            }

            header, footer, main, main > * {
                transition: width 0.3s, margin-right 0.3s !important;
            }

            body.${SELECTORS.CHAT_OPENED} > header,
            body.${SELECTORS.CHAT_OPENED} > footer {
                width: calc(100% - var(--tpi-chat-offset)) !important;
                left: 0 !important;
            }

            body.${SELECTORS.CHAT_OPENED} > main {
                margin-right: var(--tpi-chat-offset) !important;
                margin-left: 0 !important; 
                width: auto !important; 
            }

            body.${SELECTORS.CHAT_OPENED} > main > * {
                width: auto !important; 
                max-width: 100% !important;
                box-sizing: border-box !important;
            }

            @media (max-width: 1024px) {
                :root { --tpi-chat-offset: 0px !important; }
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
