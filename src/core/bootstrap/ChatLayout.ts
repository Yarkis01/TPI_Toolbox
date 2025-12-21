import { createElement } from '../../utils/DomUtils';
import { Logger } from '../../utils/Logger';
import { CHAT_IFRAME, EVENTS, IDS } from '../constants/LayoutConstants';
import IBootstrap from '../interfaces/IBootstrap';

/**
 * Chat layout bootstrap process.
 */
export class ChatLayout implements IBootstrap {
    private readonly _logger: Logger;
    private _chatContainer: HTMLElement | null;

    /**
     * ChatLayout constructor.
     */
    public constructor() {
        this._logger = new Logger('ChatLayout');
        this._chatContainer = null;
    }

    /**
     * @inheritdoc
     */
    public run(): void {
        this._logger.info('💬 Setting up Chat Layout...');

        this._chatContainer = this._createChatOverlay();
        document.body.appendChild(this._chatContainer);

        this._registerEvents();
    }

    /**
     * Creates the chat overlay element.
     * @returns The chat overlay HTMLElement.
     */
    private _createChatOverlay(): HTMLElement {
        return createElement(
            'aside',
            {
                id: IDS.CHAT_OVERLAY,
                style: {
                    position: 'fixed',
                    top: '0',
                    right: '0',
                    width: CHAT_IFRAME.WIDTH + 'px',
                    height: '100vh',
                    zIndex: '9999',
                    display: 'none',
                    borderLeft: '1px solid #202225',
                    boxShadow: '-4px 0 15px rgba(0,0,0,0.3)',
                },
            },
            [
                createElement('iframe', {
                    src: CHAT_IFRAME.SRC,
                    width: '100%',
                    height: '100%',
                    frameborder: '0',
                }),
            ],
        );
    }

    /**
     * Registers event listeners for the chat overlay.
     */
    private _registerEvents(): void {
        document.addEventListener(EVENTS.CHAT_TOGGLED, (e: Event) => {
            const customEvent = e as CustomEvent<{ isOpen: boolean }>;

            if (this._chatContainer) {
                this._toggleVisibility(customEvent.detail.isOpen);
            }
        });
    }

    /**
     * Toggles the visibility of the chat overlay.
     * @param shouldShow - Whether to show or hide the chat overlay.
     */
    private _toggleVisibility(shouldShow: boolean): void {
        this._chatContainer!.style.display = shouldShow ? 'block' : 'none';
        this._logger.debug(`Chat overlay visibility set to: ${shouldShow ? 'VISIBLE' : 'HIDDEN'}`);
    }
}
