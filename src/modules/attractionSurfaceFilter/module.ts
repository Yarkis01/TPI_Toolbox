import { BaseModule } from '../../core/abstract/BaseModule';
import { SURFACE_SELECTORS } from './constants';
import { ModalFilterInstance } from './ModalFilterInstance';

/**
 * Module to filter attractions by surface area in the marketplace.
 */
export class AttractionSurfaceFilterModule extends BaseModule {
    private _instances: ModalFilterInstance[] = [];
    private _styleElement: HTMLStyleElement | null = null;
    private _modalObserver: MutationObserver | null = null;

    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'attraction_surface_filter';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return 'Filtre de Surface';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return 'Ajoute un slider pour filtrer les attractions par superficie maximum.';
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        this._injectStyles();
        this._waitForModal();
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._styleElement?.remove();
        this._styleElement = null;

        this._modalObserver?.disconnect();
        this._modalObserver = null;

        this._instances.forEach(instance => instance.destroy());
        this._instances = [];
    }

    /**
     * Waits for attraction store modals to appear.
     */
    private _waitForModal(): void {
        this._modalObserver = new MutationObserver((mutations) => {
            let hasRemovedElements = false;

            for (const m of mutations) {
                // Check newly added nodes
                m.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const el = node as HTMLElement;

                        // Check if the added node itself is the modal
                        if (el.matches && el.matches(SURFACE_SELECTORS.MODAL)) {
                            this._initModal(el);
                        }

                        // Check if the modal is inside the newly added subtree
                        if (el.querySelectorAll) {
                            const childModals = el.querySelectorAll<HTMLElement>(SURFACE_SELECTORS.MODAL);
                            childModals.forEach(child => this._initModal(child));
                        }
                    }
                });

                // Detect if any element was removed for cleanup
                if (!hasRemovedElements && m.removedNodes.length > 0) {
                    for (let i = 0; i < m.removedNodes.length; i++) {
                        if (m.removedNodes[i].nodeType === Node.ELEMENT_NODE) {
                            hasRemovedElements = true;
                            break;
                        }
                    }
                }
            }

            // Clean up instances for removed modals
            if (hasRemovedElements && this._instances.length > 0) {
                this._instances = this._instances.filter(instance => {
                    const modal = (instance as any)._modal;
                    if (!document.contains(modal)) {
                        instance.destroy();
                        return false;
                    }
                    return true;
                });
            }
        });

        this._modalObserver.observe(document.body, { childList: true, subtree: true });

        // Initial check
        const modals = document.querySelectorAll(SURFACE_SELECTORS.MODAL);
        modals.forEach((modal) => {
            this._initModal(modal as HTMLElement);
        });
    }

    /**
     * Initializes a modal instance if not already initialized.
     * @param modal The modal element
     */
    private _initModal(modal: HTMLElement): void {
        if (!modal.hasAttribute('data-surface-filter-initialized')) {
            const instance = new ModalFilterInstance(modal);
            this._instances.push(instance);
            modal.setAttribute('data-surface-filter-initialized', 'true');
        }
    }

    /**
     * Injects custom styles for the slider.
     */
    private _injectStyles(): void {
        if (this._styleElement) return;
        this._styleElement = document.createElement('style');
        this._styleElement.innerHTML = `
            .attraction-surface-slider {
                -webkit-appearance: none;
                width: 100%;
                height: 6px;
                background: #2a2a2a;
                border-radius: 3px;
                outline: none;
                margin-top: 10px;
                margin-bottom: 5px;
            }

            .attraction-surface-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #35b3af;
                cursor: pointer;
                transition: background .15s ease-in-out, transform .15s ease-in-out;
                border: 2px solid #1a1a1a;
            }

            .attraction-surface-slider::-webkit-slider-thumb:hover {
                background: #2a8f8c;
                transform: scale(1.1);
            }

            .${SURFACE_SELECTORS.HIDDEN_CLASS} {
                display: none !important;
            }
        `;
        document.head.appendChild(this._styleElement);
    }
}

