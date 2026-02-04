import { BaseModule } from '../../core/abstract/BaseModule';
import { createElement } from '../../utils/DomUtils';
import { NEW_DAY_SELECTORS, NEW_DAY_STRINGS } from './constants';
import { DataExtractor } from './DataExtractor';
import { HistoryStorage } from './HistoryStorage';
import { HistoryModal } from './HistoryModal';
import './styles.scss';

/**
 * Module for tracking and displaying new day history.
 */
export class NewDayHistoryModule extends BaseModule {
    private _historyBtn: HTMLButtonElement | null = null;
    private _storage: HistoryStorage;
    private _extractor: DataExtractor;
    private _modal: HistoryModal;
    private _observer: MutationObserver | null = null;
    private _advanceBtn: HTMLElement | null = null;
    private _boundHandleAdvance: () => void;

    /**
     * Creates an instance of NewDayHistoryModule.
     */
    constructor() {
        super();
        this._storage = new HistoryStorage();
        this._extractor = new DataExtractor();
        this._modal = new HistoryModal(this._storage);
        this._boundHandleAdvance = this._handleAdvanceClick.bind(this);
    }

    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'new_day_history';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return 'Historique des journées';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return 'Enregistre et affiche l\'historique des résumés de journée.';
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        if (!window.location.href.includes(NEW_DAY_SELECTORS.PAGE_MATCH)) {
            return;
        }

        // Inject history button
        this._injectHistoryButton();

        // Setup advance button listener
        this._setupAdvanceButtonListener();

        // Setup mutation observer to detect recap display
        this._setupRecapObserver();
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._historyBtn?.remove();
        this._historyBtn = null;

        if (this._advanceBtn) {
            this._advanceBtn.removeEventListener('click', this._boundHandleAdvance);
            this._advanceBtn = null;
        }

        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }

        this._modal.close();
    }

    /**
     * Creates and appends the history button.
     */
    private _injectHistoryButton(): void {
        const container = document.querySelector(NEW_DAY_SELECTORS.HISTORY_CONTAINER);
        if (!container) {
            // Try to find the advance button and add next to it
            const advanceBtn = document.querySelector(NEW_DAY_SELECTORS.ADVANCE_BUTTON);
            if (advanceBtn?.parentElement) {
                this._createAndInsertButton(advanceBtn.parentElement);
            }
            return;
        }

        this._createAndInsertButton(container);
    }

    /**
     * Creates the history button and inserts it into the container.
     * @param container - The container element.
     */
    private _createAndInsertButton(container: Element): void {
        this._historyBtn = createElement(
            'button',
            {
                type: 'button',
                id: NEW_DAY_SELECTORS.HISTORY_BTN_ID,
                title: NEW_DAY_STRINGS.BTN_TITLE,
            },
            [NEW_DAY_STRINGS.BTN_LABEL],
        ) as HTMLButtonElement;

        this._historyBtn.addEventListener('click', () => this._openHistoryModal());

        container.appendChild(this._historyBtn);
    }

    /**
     * Opens the history modal.
     */
    private _openHistoryModal(): void {
        this._modal.open();
    }

    /**
     * Sets up the listener for the advance day button.
     */
    private _setupAdvanceButtonListener(): void {
        this._advanceBtn = document.querySelector(NEW_DAY_SELECTORS.ADVANCE_BUTTON);

        if (this._advanceBtn) {
            this._advanceBtn.addEventListener('click', this._boundHandleAdvance);
            this._logger.info('Advance button listener attached');
        } else {
            this._logger.warn('Advance button not found');
        }
    }

    /**
     * Handles the click on the advance day button.
     */
    private _handleAdvanceClick(): void {
        this._logger.info('Advance button clicked, waiting for recap...');
        // The actual extraction happens via the mutation observer
        // when the recap section becomes visible
    }

    /**
     * Sets up a mutation observer to detect when the recap is displayed.
     */
    private _setupRecapObserver(): void {
        const recapSection = document.querySelector(NEW_DAY_SELECTORS.RECAP_SECTION);

        if (!recapSection) {
            this._logger.warn('Recap section not found');
            return;
        }

        this._observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const target = mutation.target as HTMLElement;
                    const isVisible = target.style.display !== 'none';

                    if (isVisible) {
                        // Small delay to ensure content is fully rendered
                        setTimeout(() => this._extractAndSaveData(), 500);
                    }
                }

                // Also watch for content changes within the recap
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    const recapContent = document.querySelector(NEW_DAY_SELECTORS.RECAP_CONTENT);
                    if (recapContent && recapContent.children.length > 0) {
                        setTimeout(() => this._extractAndSaveData(), 500);
                    }
                }
            }
        });

        this._observer.observe(recapSection, {
            attributes: true,
            attributeFilter: ['style'],
            childList: true,
            subtree: true,
        });

        this._logger.info('Recap observer attached');
    }

    /**
     * Extracts data from the recap and saves it to storage.
     */
    private _extractAndSaveData(): void {
        try {
            const data = this._extractor.extract();

            if (data && data.parks.length > 0) {
                // Check if we already have a recent record
                // (to avoid duplicate saves within the same minute)
                const existingRecords = this._storage.getAll();
                const recentRecord = existingRecords.find(
                    (r) =>
                        r.daysRemaining === data.daysRemaining &&
                        Date.now() - r.timestamp < 60000, // Within 1 minute
                );

                if (recentRecord) {
                    this._logger.info('Recent record already exists, skipping save');
                    return;
                }

                this._storage.save(data);
                this._logger.info(
                    `Record saved with ${data.parks.length} park(s), ${data.daysRemaining} days remaining, total: ${data.totalResult}€`,
                );
            } else {
                this._logger.warn('No data extracted from recap');
            }
        } catch (error) {
            this._logger.error(`Failed to extract/save data: ${(error as Error).message}`);
        }
    }
}
