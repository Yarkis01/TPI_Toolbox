import { CONFIG, SELECTORS } from '../../Config';
import { injectStyle } from '../../../utils/DomUtils';
import { Logger } from '../../../utils/Logger';

/**
 * Class representing the layout modifier.
 */
export class LayoutModifier {
    private readonly _logger: Logger;

    /**
     * Creates an instance of LayoutModifier.
     */
    public constructor() {
        this._logger = new Logger('LayoutModifier');
    }

    /**
     * @inheritdoc
     */
    public apply(): void {
        this._logger.debug('Applying layout modifications...');

        injectStyle(`
            :root {
                --tpi-chat-offset: 0px;
            }

            body.${SELECTORS.CHAT_OPENED} {
                --tpi-chat-offset: ${CONFIG.CHAT_IFRAME_WIDTH}px;
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

            ${SELECTORS.LINK_TUTORIAL}, ${SELECTORS.DISCORD_BUTTON}, ${SELECTORS.OLD_CHAT_BUTTON}, ${SELECTORS.LOGOUT_BUTTON} {
                display: none !important;
                visibility: hidden !important;
            }
        `);

        this._logger.info('✅ Layout modifications applied successfully.');
    }
}
