import { BaseModule } from '../../core/abstract/BaseModule';
import { HYPE_COLORS, HYPE_SELECTORS } from './constants';

/**
 * Module that transforms ride hype dots into textual representation.
 */
export class RideHypeAsTextModule extends BaseModule {
    private _observer: MutationObserver | null = null;

    /**
     * @inheritdoc
     */
    public get id() {
        return 'ride_hype_as_text';
    }

    /**
     * @inheritdoc
     */
    public get name() {
        return 'Hype Textuelle';
    }

    /**
     * @inheritdoc
     */
    public get description() {
        return 'Remplace les points de hype par un texte précis (ex: 8/10).';
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        if (!window.location.href.includes(HYPE_SELECTORS.PAGE_MATCH)) {
            this._logger.debug('Module ignored on this page.');
            return;
        }

        this._processExistingNodes();
        this._startObserving();
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
    }

    /**
     * Starts observing DOM changes to update hype displays.
     */
    private _startObserving(): void {
        this._observer = new MutationObserver((mutations) => {
            const shouldProcess = mutations.some((m) => m.addedNodes.length > 0);
            if (shouldProcess) {
                this._processExistingNodes();
            }
        });

        this._observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    /**
     * Processes existing hype containers on the page.
     */
    private _processExistingNodes(): void {
        const containers = document.querySelectorAll<HTMLElement>(
            `${HYPE_SELECTORS.CONTAINER}:not([data-tpi-processed="true"])`,
        );

        containers.forEach((container) => {
            this._transformContainer(container);
            container.setAttribute('data-tpi-processed', 'true');
        });
    }

    /**
     * Transforms a hype container from dots to text.
     * @param container The hype container element.
     */
    private _transformContainer(container: HTMLElement): void {
        const totalDots = container.querySelectorAll(HYPE_SELECTORS.DOTS).length;
        const activeDots = container.querySelectorAll(HYPE_SELECTORS.DOT_ON).length;

        if (totalDots > 0) {
            let color = HYPE_COLORS.LOW;
            if (activeDots >= 8) color = HYPE_COLORS.HIGH;
            else if (activeDots >= 5) color = HYPE_COLORS.MEDIUM;

            container.innerHTML = `Hype : <span style="font-weight: bold; color: ${color}; margin-left: 5px;">${activeDots} / ${totalDots}</span>`;
        }
    }
}
