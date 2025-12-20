import { CONFIG, EVENTS, IDS, SELECTORS } from '../../core/Config';
import { createElement } from '../../utils/DomUtils';
import { Logger } from '../../utils/Logger';
import { IComponent } from '../interfaces/IComponent';

/**
 * Class representing the chat overlay component.
 */
export class ChatOverlay implements IComponent {
    private readonly _logger: Logger;
    private _container: HTMLElement | null;

    /**
     * Creates an instance of ChatOverlay.
     */
    public constructor() {
        this._logger = new Logger('ChatOverlay');
        this._container = null;
    }

    /**
     * @inheritdoc
     */
    public inject(): void {
        this._logger.debug('Injecting chat overlay into the UI.');

        this._container = this._createChatOverlay();
        document.body.appendChild(this._container);

        this._registerEvents();

        this._logger.info('✅ Chat overlay injected successfully.');
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
                    width: CONFIG.CHAT_IFRAME_WIDTH + 'px',
                    height: '100vh',
                    zIndex: '9999',
                    display: 'none',
                    borderLeft: '1px solid #202225',
                    boxShadow: '-4px 0 15px rgba(0,0,0,0.3)',
                },
            },
            [
                createElement('iframe', {
                    src: CONFIG.CHAT_IFRAME_SRC,
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

            if (this._container) {
                this._toggleVisibility(customEvent.detail.isOpen);
            }
        });
    }

    /**
     * Toggles the visibility of the chat overlay.
     * @param shouldShow - Whether to show or hide the chat overlay.
     */
    private _toggleVisibility(shouldShow: boolean): void {
        this._container!.style.display = shouldShow ? 'block' : 'none';
        this._logger.debug(`Chat overlay visibility set to: ${shouldShow ? 'VISIBLE' : 'HIDDEN'}`);
    }
}
