import { BaseModule } from '../../core/abstract/BaseModule';
import { StorageService } from '../../services/StorageService';
import { ShareFilterEngine } from './ShareFilterEngine';
import { ShareFilterUI } from './ShareFilterUI';
import { ShareParser } from './ShareParser';
import { CSS_CLASSES, SELECTORS, STORAGE_KEY } from './constants';
import { IShare, IShareFilterCriteria, IShareFilterEngine, IShareParser } from './types';

/**
 * Module to filter investment shares on the invest.php page.
 */
export class InvestSharesFilterModule extends BaseModule {
    private _parserInstance: IShareParser | null = null;
    private _filterEngineInstance: IShareFilterEngine | null = null;
    private _uiInstance: ShareFilterUI | null = null;
    private _shares: IShare[] = [];
    private _mutationObserver: MutationObserver | null = null;
    private _isModuleInitialized: boolean = false;
    private _debounceTimeout: ReturnType<typeof setTimeout> | null = null;

    private get _parser(): IShareParser {
        if (!this._parserInstance) this._parserInstance = new ShareParser();
        return this._parserInstance;
    }

    private get _filterEngine(): IShareFilterEngine {
        if (!this._filterEngineInstance) this._filterEngineInstance = new ShareFilterEngine();
        return this._filterEngineInstance;
    }

    private get _ui(): ShareFilterUI {
        if (!this._uiInstance) this._uiInstance = new ShareFilterUI();
        return this._uiInstance;
    }

    private get _storageService(): StorageService {
        return StorageService.getInstance();
    }

    /**
     * Creates an instance of InvestSharesFilterModule.
     * @param parser Optional custom parser.
     * @param filterEngine Optional custom filter engine.
     * @param ui Optional custom UI component.
     */
    public constructor(
        parser?: IShareParser,
        filterEngine?: IShareFilterEngine,
        ui?: ShareFilterUI,
    ) {
        super();
        if (parser) this._parserInstance = parser;
        if (filterEngine) this._filterEngineInstance = filterEngine;
        if (ui) this._uiInstance = ui;
    }

    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'invest_shares_filter';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return 'Filtre des Parts';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return "Ajoute des filtres avancés pour les parts sur la page d'investissement.";
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        if (!this._isOnInvestPage()) {
            this._logger.debug('Not on invest page, skipping module activation.');
            return;
        }

        this._initializeModule();
        this._setupMutationObserver();
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._mutationObserver?.disconnect();
        this._mutationObserver = null;

        if (this._debounceTimeout) {
            clearTimeout(this._debounceTimeout);
            this._debounceTimeout = null;
        }

        this._shares.forEach((share) => {
            share.element.classList.remove(CSS_CLASSES.HIDDEN);
            share.element.classList.remove(CSS_CLASSES.HIGHLIGHTED);
        });
        this._ui.destroy();
        this._shares = [];
        this._isModuleInitialized = false;
    }

    /**
     * Initializes or reinitializes the module.
     */
    private _initializeModule(): void {
        const container = document.querySelector<HTMLElement>(SELECTORS.FILTER_CONTAINER);
        if (!container) {
            this._logger.warn('Filter container not found on page.');
            return;
        }

        this._shares = this._parser.parseAll();
        this._logger.info(`Parsed ${this._shares.length} shares from the page.`);

        if (this._shares.length === 0) {
            this._logger.warn('No shares found on the page.');
            return;
        }

        const tags = this._filterEngine.getUniqueTags(this._shares);

        if (!this._isModuleInitialized) {
            this._ui.render(container, tags);
            this._ui.onFilterChange(() => this._handleFilterChange());

            this._restoreFilterState();
            this._isModuleInitialized = true;
        }
        this._applyFilters();
    }

    /**
     * Checks if the current page is the invest page.
     * @returns True if on the invest page.
     */
    private _isOnInvestPage(): boolean {
        return window.location.href.includes(SELECTORS.PAGE_MATCH);
    }

    /**
     * Sets up a MutationObserver to detect DOM changes.
     */
    private _setupMutationObserver(): void {
        const marketColumns = document.querySelector(SELECTORS.MARKET_COLUMNS);
        if (!marketColumns) {
            this._logger.warn('Market columns container not found for MutationObserver.');
            return;
        }

        this._mutationObserver = new MutationObserver((mutations) => {
            const hasRelevantChanges = mutations.some((mutation) => {
                if (mutation.type === 'childList') {
                    const hasShareChanges =
                        Array.from(mutation.addedNodes).some(
                            (node) =>
                                node instanceof HTMLElement &&
                                (node.matches(SELECTORS.SHARE_ITEM) ||
                                    node.querySelector(SELECTORS.SHARE_ITEM)),
                        ) ||
                        Array.from(mutation.removedNodes).some(
                            (node) =>
                                node instanceof HTMLElement &&
                                (node.matches(SELECTORS.SHARE_ITEM) ||
                                    node.querySelector(SELECTORS.SHARE_ITEM)),
                        );

                    return hasShareChanges;
                }
                return false;
            });

            if (hasRelevantChanges) {
                this._handleDomChanges();
            }
        });

        this._mutationObserver.observe(marketColumns, {
            childList: true,
            subtree: true,
        });

        this._logger.debug('MutationObserver set up for market columns.');
    }

    /**
     * Handles DOM changes detected by MutationObserver.
     * Uses debouncing to avoid excessive updates.
     */
    private _handleDomChanges(): void {
        if (this._debounceTimeout) {
            clearTimeout(this._debounceTimeout);
        }

        this._debounceTimeout = setTimeout(() => {
            this._logger.debug('DOM changes detected, refreshing shares...');
            this._refreshShares();
        }, 100);
    }

    /**
     * Refreshes the shares list and reapplies filters.
     */
    private _refreshShares(): void {
        this._shares = this._parser.parseAll();
        this._logger.debug(`Refreshed: ${this._shares.length} shares found.`);

        this._applyFilters();
    }

    /**
     * Handles filter changes from the UI.
     */
    private _handleFilterChange(): void {
        this._saveFilterState();
        this._applyFilters();
    }

    /**
     * Applies the current filters to the shares.
     */
    private _applyFilters(): void {
        const criteria = this._ui.getCriteria();
        const filteredShares = this._filterEngine.filter(this._shares, criteria);
        const filteredIds = new Set(filteredShares.map((s) => s.id));

        this._shares.forEach((share) => {
            if (filteredIds.has(share.id)) {
                share.element.classList.remove(CSS_CLASSES.HIDDEN);
            } else {
                share.element.classList.add(CSS_CLASSES.HIDDEN);
            }
        });

        this._ui.updateStats(filteredShares.length, this._shares.length);

        this._logger.debug(
            `Filtered: ${filteredShares.length}/${this._shares.length} shares visible.`,
        );
    }

    /**
     * Saves the current filter state using StorageService.
     */
    private _saveFilterState(): void {
        const criteria = this._ui.getCriteria();
        this._storageService.save(STORAGE_KEY, criteria);
        this._logger.debug('Filter state saved via StorageService.');
    }

    /**
     * Restores the filter state from StorageService.
     */
    private _restoreFilterState(): void {
        const defaultCriteria: IShareFilterCriteria = {};
        const criteria = this._storageService.load<IShareFilterCriteria>(
            STORAGE_KEY,
            defaultCriteria,
        );

        if (Object.keys(criteria).length > 0) {
            this._ui.setCriteria(criteria);
            this._logger.debug('Filter state restored from StorageService.');
        }
    }
}
