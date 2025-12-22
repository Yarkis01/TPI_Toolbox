import { createElement } from '../../utils/DomUtils';
import { Logger } from '../../utils/Logger';
import { APP_INFORMATIONS } from '../constants/AppConstants';
import { EVENTS, IDS, SELECTORS, STRINGS } from '../constants/LayoutConstants';
import IBootstrap from '../interfaces/IBootstrap';
import './styles/_header.scss';

/**
 * Bootstrap class to modify the header layout.
 */
export class HeaderLayout implements IBootstrap {
    private readonly _logger: Logger;
    private _isChatOpen: boolean = false;

    /**
     * Creates an instance of the HeaderLayout class.
     */
    public constructor() {
        this._logger = new Logger('HeaderLayout');
        this._isChatOpen = false;
    }

    /**
     * @inheritdoc
     */
    public run(): void {
        this._logger.info('🏗️ Applying Header Layout...');

        const header = this._getHeaderContainer();
        header.appendChild(
            createElement(
                'div',
                {
                    id: IDS.HEADERS_WIDGETS,
                },
                [this._createToolboxButton(), this._createChatButton()],
            ),
        );
    }

    /**
     * Gets the header container element.
     * @returns The header container HTMLDivElement.
     * @throws Error if the header container is not found.
     */
    private _getHeaderContainer(): HTMLDivElement {
        const header = document.querySelector<HTMLDivElement>(SELECTORS.HEADER);

        if (!header) {
            this._logger.warn('Header container not found in the DOM.');
            throw new Error('Header container not found.');
        }

        return header;
    }

    /**
     * Creates the toolbox button.
     * @returns The toolbox HTMLButtonElement.
     */
    private _createToolboxButton(): HTMLButtonElement {
        return createElement(
            'button',
            {
                id: IDS.TOOLBOX_BUTTON,
                onclick: () => {
                    document.dispatchEvent(new CustomEvent(EVENTS.TOOLBOX_TOGGLED));
                },
                style: {
                    marginRight: '1em',
                },
            },
            [APP_INFORMATIONS.APP_NAME],
        );
    }

    /**
     * Creates the chat toggle button.
     * @returns The chat toggle HTMLButtonElement.
     */
    private _createChatButton(): HTMLButtonElement {
        return createElement(
            'button',
            {
                id: IDS.CHAT_BUTTON,
                class: 'footer__chat-btn',
                onclick: () => {
                    this._isChatOpen = !this._isChatOpen;

                    const chatButton = document.getElementById(IDS.CHAT_BUTTON);
                    if (chatButton) {
                        chatButton.textContent = this._isChatOpen
                            ? STRINGS.CLOSE_CHAT_BUTTON
                            : STRINGS.OPEN_CHAT_BUTTON;
                    }

                    document.dispatchEvent(
                        new CustomEvent(EVENTS.CHAT_TOGGLED, {
                            detail: { isOpen: this._isChatOpen },
                        }),
                    );

                    document.body.classList.toggle(SELECTORS.CHAT_OPENED, this._isChatOpen);

                    this._logger.debug(
                        `Chat toggled. New state: ${this._isChatOpen ? 'OPEN' : 'CLOSED'}`,
                    );
                },
            },
            [this._isChatOpen ? STRINGS.CLOSE_CHAT_BUTTON : STRINGS.OPEN_CHAT_BUTTON],
        );
    }
}
