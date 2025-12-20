import { CONFIG, EVENTS, IDS, SELECTORS, STRINGS } from '../../core/Config';
import { createElement } from '../../utils/DOMUtils';
import { Logger } from '../../utils/Logger';
import { IComponent } from '../interfaces/IComponent';
import './styles/_header-widgets.scss';

/**
 * Class representing header widgets in the UI.
 */
export class HeaderWidgets implements IComponent {
    private readonly _logger: Logger;
    private _isChatOpen: boolean;

    /**
     * Creates an instance of HeaderWidgets.
     */
    public constructor() {
        this._logger = new Logger('HeaderWidgets');
        this._isChatOpen = false;
    }

    /**
     * @inheritdoc
     */
    public inject(): void {
        this._logger.debug('Injecting header widgets into the UI.');
        const header = this._getHeaderContainer();

        const container = createElement(
            'div',
            {
                id: IDS.HEADERS_WIDGETS,
            },
            [this._createToolboxButton(), this._createChatButton()],
        );

        header.appendChild(container);

        this._logger.info('✅ Header widgets injected successfully.');
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
            [CONFIG.APP_NAME],
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
