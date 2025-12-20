import { SELECTORS } from '../../core/Config';
import { injectStyle } from '../../utils/DomUtils';
import { Logger } from '../../utils/Logger';
import { IModifier } from '../interfaces/IModifier';

/**
 * Modifier to hide old chat UI elements.
 */
export class ChatModifier implements IModifier {
    private readonly _logger: Logger;

    /**
     * Creates an instance of the ChatModifier class.
     */
    public constructor() {
        this._logger = new Logger('ChatModifier');
    }

    /**
     * @inheritdoc
     */
    public apply(): void {
        this._logger.debug('Cleaning chat UI elements...');

        injectStyle(`
            ${SELECTORS.CHAT_CLOSER} {
                display: none !important;
                visibility: hidden !important;
            }

            ${SELECTORS.CHAT_HEADER} {
                flex-direction: column !important;
            }

            ${SELECTORS.CHAT_MESSAGES} {
                max-height: none !important;
            }
        `);

        this._logger.debug('Chat UI elements cleaned.');
    }
}
