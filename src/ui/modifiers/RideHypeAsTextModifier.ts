import { Logger } from '../../utils/Logger';
import { IModifier } from '../interfaces/IModifier';

/**
 * Modifier to display ride hype as text instead of dots.
 */
export class RideHypeAsTextModifier implements IModifier {
    private readonly _logger: Logger;
    private _observer: MutationObserver | null = null;

    /**
     * Creates an instance of RideHypeAsTextModifier.
     */
    public constructor() {
        this._logger = new Logger('RideHypeAsTextModifier');
    }

    /**
     * @inheritdoc
     */
    public apply(): void {
        if (!window.location.href.includes('attractions.php')) {
            return;
        }

        this._logger.debug('Applying RideHypeAsTextModifier...');

        this._processExistingNodes();
        this._startObserving();
    }

    /**
     * Starts observing the DOM for changes to process new nodes.
     */
    private _startObserving(): void {
        this._observer = new MutationObserver((mutations) => {
            let i = 0;
            let needsProcessing = false;

            while (i < mutations.length && !needsProcessing) {
                if (mutations[i].addedNodes.length > 0) {
                    needsProcessing = true;
                }

                i++;
            }

            if (needsProcessing) {
                this._processExistingNodes();
            }
        });

        this._observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    /**
     * Processes existing nodes to transform hype dots into text.
     */
    private _processExistingNodes(): void {
        const hypeContainers = document.querySelectorAll<HTMLElement>(
            '.attraction-card__hype:not([data-processed="true"])',
        );

        if (hypeContainers.length > 0) {
            hypeContainers.forEach((container) => {
                this._transformContainer(container);
                container.setAttribute('data-processed', 'true');
            });
        }
    }

    /**
     * Transforms a container of hype dots into text representation.
     * @param container The container element with hype dots.
     */
    private _transformContainer(container: HTMLElement): void {
        const totalDots = container.querySelectorAll('.attraction-card__hype-dot').length;
        const activeDots = container.querySelectorAll('.attraction-card__hype-dot--on').length;

        if (totalDots > 0) {
            let colorStyle = '#ffffff';

            if (activeDots >= 8) colorStyle = '#4cd137';
            else if (activeDots >= 5) colorStyle = '#fbc531';
            else colorStyle = '#e84118';

            container.innerHTML = `Hype : <span style="font-weight: bold; color: ${colorStyle}; margin-left: 5px;">${activeDots} / ${totalDots}</span>`;
        }
    }
}
