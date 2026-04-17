import { BaseModule } from '../../core/abstract/BaseModule';
import { SurfaceFilterInstance } from './SurfaceFilterInstance';
import { SURFACE_SELECTORS, ATTRACTIONS_PAGE_MATCHES } from './constants';

/**
 * Module to filter attractions by surface area in the marketplace.
 */
export class AttractionSurfaceFilterModule extends BaseModule {
    private _instances: SurfaceFilterInstance[] = [];
    private _styleElement: HTMLStyleElement | null = null;
    private _containerObserver: MutationObserver | null = null;

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
    public override canRunOnPage(url: string): boolean {
        return ATTRACTIONS_PAGE_MATCHES.some((match) => url.includes(match));
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        this._injectStyles();
        this._waitForContainers();
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._styleElement?.remove();
        this._styleElement = null;

        this._containerObserver?.disconnect();
        this._containerObserver = null;

        this._instances.forEach((instance) => instance.destroy());
        this._instances = [];
    }

    /**
     * Waits for attraction store containers (modals or buy pages) to appear.
     */
    private _waitForContainers(): void {
        this._containerObserver = new MutationObserver((mutations) => {
            let hasRemovedElements = false;

            for (const m of mutations) {
                // Check newly added nodes
                m.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const el = node as HTMLElement;

                        // Check if the added node itself is a root container
                        if (el.matches && el.matches(SURFACE_SELECTORS.ROOT)) {
                            this._initInstance(el);
                        }

                        // Check if a root container is inside the newly added subtree
                        if (el.querySelectorAll) {
                            const childRoots = el.querySelectorAll<HTMLElement>(
                                SURFACE_SELECTORS.ROOT,
                            );
                            childRoots.forEach((child) => this._initInstance(child));
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

            // Clean up instances for removed containers
            if (hasRemovedElements && this._instances.length > 0) {
                this._instances = this._instances.filter((instance) => {
                    const root = (instance as any)._root;
                    if (!document.contains(root)) {
                        instance.destroy();
                        return false;
                    }
                    return true;
                });
            }
        });

        this._containerObserver.observe(document.body, { childList: true, subtree: true });

        // Initial check for existing containers
        const roots = document.querySelectorAll(SURFACE_SELECTORS.ROOT);
        roots.forEach((root) => {
            this._initInstance(root as HTMLElement);
        });
    }

    /**
     * Initializes a filter instance if not already initialized.
     * @param root The root element
     */
    private _initInstance(root: HTMLElement): void {
        if (!root.hasAttribute('data-surface-filter-initialized')) {
            const instance = new SurfaceFilterInstance(root);
            this._instances.push(instance);
            root.setAttribute('data-surface-filter-initialized', 'true');
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
