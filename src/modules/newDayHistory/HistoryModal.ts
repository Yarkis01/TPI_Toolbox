import { DayRecord, ParkDayRecord } from './interfaces';
import { NEW_DAY_STRINGS, NEW_DAY_SELECTORS } from './constants';
import { HistoryStorage } from './HistoryStorage';
import { DetailedView } from './DetailedView';

/**
 * Manages the history modal display and interactions.
 */
export class HistoryModal {
    private _storage: HistoryStorage;
    private _overlay: HTMLElement | null = null;
    private _detailedViewOverlay: HTMLElement | null = null;
    private _expandedItems: Set<string> = new Set();
    private _detailedView: DetailedView;

    /**
     * Creates an instance of HistoryModal.
     * @param storage - The history storage instance.
     */
    constructor(storage: HistoryStorage) {
        this._storage = storage;
        this._detailedView = new DetailedView();
    }

    /**
     * Opens the history modal.
     */
    public open(): void {
        if (this._overlay) {
            return;
        }

        this._overlay = this._createModal();
        document.body.appendChild(this._overlay);
        document.body.style.overflow = 'hidden';

        // Close on escape key
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.close();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Closes the history modal.
     */
    public close(): void {
        if (this._overlay) {
            this._overlay.remove();
            this._overlay = null;
            document.body.style.overflow = '';
        }
    }

    /**
     * Creates the modal structure.
     * @returns The modal overlay element.
     */
    private _createModal(): HTMLElement {
        const overlay = document.createElement('div');
        overlay.className = 'tpi-history-modal-overlay';
        overlay.id = NEW_DAY_SELECTORS.HISTORY_MODAL_ID;

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });

        const modal = document.createElement('div');
        modal.className = 'tpi-history-modal';

        modal.innerHTML = `
            <header class="tpi-history-modal__header">
                <h2 class="tpi-history-modal__title">
                    <span class="tpi-history-modal__title-icon">📜</span>
                    ${NEW_DAY_STRINGS.MODAL_TITLE}
                </h2>
                <button class="tpi-history-modal__close" title="${NEW_DAY_STRINGS.MODAL_CLOSE}">×</button>
            </header>
            <div class="tpi-history-modal__actions">
                <button class="tpi-history-modal__action-btn" data-action="expand-all">
                    <span>📂</span> ${NEW_DAY_STRINGS.EXPAND_ALL}
                </button>
                <button class="tpi-history-modal__action-btn" data-action="collapse-all">
                    <span>📁</span> ${NEW_DAY_STRINGS.COLLAPSE_ALL}
                </button>
                <button class="tpi-history-modal__action-btn" data-action="export-json">
                    <span>📄</span> ${NEW_DAY_STRINGS.EXPORT_JSON}
                </button>
                <button class="tpi-history-modal__action-btn" data-action="export-csv">
                    <span>📊</span> ${NEW_DAY_STRINGS.EXPORT_CSV}
                </button>
                <button class="tpi-history-modal__action-btn tpi-history-modal__action-btn--danger" data-action="clear">
                    <span>🗑️</span> ${NEW_DAY_STRINGS.CLEAR_HISTORY}
                </button>
                <span class="tpi-history-modal__stats"></span>
            </div>
            <div class="tpi-history-modal__content"></div>
            <footer class="tpi-history-modal__footer">
                <button class="tpi-history-modal__footer-btn">${NEW_DAY_STRINGS.MODAL_CLOSE}</button>
            </footer>
        `;

        // Bind events
        modal.querySelector('.tpi-history-modal__close')?.addEventListener('click', () => this.close());
        modal.querySelector('.tpi-history-modal__footer-btn')?.addEventListener('click', () => this.close());

        // Action buttons
        modal.querySelectorAll('[data-action]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const action = (e.currentTarget as HTMLElement).dataset.action;
                this._handleAction(action || '', modal);
            });
        });

        // Render content
        this._renderContent(modal);

        overlay.appendChild(modal);
        return overlay;
    }

    /**
     * Handles action button clicks.
     * @param action - The action to perform.
     * @param modal - The modal element.
     */
    private _handleAction(action: string, modal: HTMLElement): void {
        switch (action) {
            case 'expand-all':
                this._expandAll(modal);
                break;
            case 'collapse-all':
                this._collapseAll(modal);
                break;
            case 'export-json':
                this._exportJson();
                break;
            case 'export-csv':
                this._exportCsv();
                break;
            case 'clear':
                this._clearHistory(modal);
                break;
        }
    }

    /**
     * Expands all history items.
     * @param modal - The modal element.
     */
    private _expandAll(modal: HTMLElement): void {
        modal.querySelectorAll('.tpi-history-item').forEach((item) => {
            item.classList.add('tpi-history-item--expanded');
            const id = item.getAttribute('data-id');
            if (id) {
                this._expandedItems.add(id);
            }
        });
    }

    /**
     * Collapses all history items.
     * @param modal - The modal element.
     */
    private _collapseAll(modal: HTMLElement): void {
        modal.querySelectorAll('.tpi-history-item').forEach((item) => {
            item.classList.remove('tpi-history-item--expanded');
        });
        this._expandedItems.clear();
    }

    /**
     * Exports history as JSON.
     */
    private _exportJson(): void {
        const json = this._storage.exportAsJson();
        this._downloadFile('tpi_history.json', json, 'application/json');
    }

    /**
     * Exports history as CSV.
     */
    private _exportCsv(): void {
        const csv = this._storage.exportDetailedCsv();
        this._downloadFile('tpi_history.csv', csv, 'text/csv');
    }

    /**
     * Downloads a file.
     * @param filename - The file name.
     * @param content - The file content.
     * @param mimeType - The MIME type.
     */
    private _downloadFile(filename: string, content: string, mimeType: string): void {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Clears all history.
     * @param modal - The modal element.
     */
    private _clearHistory(modal: HTMLElement): void {
        if (confirm(NEW_DAY_STRINGS.CONFIRM_CLEAR)) {
            this._storage.clear();
            this._renderContent(modal);
        }
    }

    /**
     * Renders the modal content.
     * @param modal - The modal element.
     */
    private _renderContent(modal: HTMLElement): void {
        const content = modal.querySelector('.tpi-history-modal__content');
        const stats = modal.querySelector('.tpi-history-modal__stats');
        if (!content) return;

        const records = this._storage.getAll();

        // Update stats
        if (stats) {
            stats.textContent = `${records.length} entrée(s) enregistrée(s)`;
        }

        if (records.length === 0) {
            content.innerHTML = `
                <div class="tpi-history-modal__empty">
                    <div class="tpi-history-modal__empty-icon">📭</div>
                    <p>${NEW_DAY_STRINGS.NO_HISTORY}</p>
                </div>
            `;
            return;
        }

        const list = document.createElement('div');
        list.className = 'tpi-history-list';

        records.forEach((record) => {
            list.appendChild(this._createHistoryItem(record));
        });

        content.innerHTML = '';
        content.appendChild(list);
    }

    /**
     * Creates a history item element.
     * @param record - The day record.
     * @returns The history item element.
     */
    private _createHistoryItem(record: DayRecord): HTMLElement {
        const item = document.createElement('div');
        item.className = 'tpi-history-item';
        item.setAttribute('data-id', record.id);

        if (this._expandedItems.has(record.id)) {
            item.classList.add('tpi-history-item--expanded');
        }

        const date = new Date(record.timestamp).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        const resultClass = record.totalResult >= 0 ? 'positive' : 'negative';
        const resultSign = record.totalResult >= 0 ? '+' : '';
        const formattedResult = this._formatNumber(record.totalResult);

        item.innerHTML = `
            <div class="tpi-history-item__header">
                <div class="tpi-history-item__info">
                    <span class="tpi-history-item__date">${date}</span>
                    <span class="tpi-history-item__day">${record.daysRemaining} ${NEW_DAY_STRINGS.DAYS_REMAINING}</span>
                </div>
                <span class="tpi-history-item__result tpi-history-item__result--${resultClass}">
                    ${resultSign}${formattedResult} €
                </span>
                <button class="tpi-history-item__toggle" title="${NEW_DAY_STRINGS.DETAILS}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </button>
            </div>
            <div class="tpi-history-item__details">
                ${record.parks.map((park, index) => this._createParkSummary(park, index)).join('')}
            </div>
        `;

        // Toggle expansion
        const header = item.querySelector('.tpi-history-item__header');
        header?.addEventListener('click', () => {
            item.classList.toggle('tpi-history-item--expanded');
            if (item.classList.contains('tpi-history-item--expanded')) {
                this._expandedItems.add(record.id);
            } else {
                this._expandedItems.delete(record.id);
            }
        });

        // Park detail buttons
        const parkDetailBtns = item.querySelectorAll('.tpi-history-park__detail-btn');
        parkDetailBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const parkIndex = parseInt((btn as HTMLElement).dataset.parkIndex || '0', 10);
                const park = record.parks[parkIndex];
                if (park) {
                    this._openParkDetailedView(park, record);
                }
            });
        });

        return item;
    }

    /**
     * Opens the detailed view for a single park.
     * @param park - The park to display.
     * @param record - The parent record for context.
     */
    private _openParkDetailedView(park: ParkDayRecord, record: DayRecord): void {
        // Create overlay for detailed view
        this._detailedViewOverlay = document.createElement('div');
        this._detailedViewOverlay.className = 'tpi-detailed-view';

        // Generate content for single park
        const content = this._detailedView.generateParkDetailedView(park, {
            timestamp: record.timestamp,
            daysRemaining: record.daysRemaining,
        });
        this._detailedViewOverlay.innerHTML = content;

        // Add back button
        const backBtn = document.createElement('button');
        backBtn.className = 'tpi-detailed-view__back-btn';
        backBtn.innerHTML = '← Retour à l\'historique';
        backBtn.addEventListener('click', () => this._closeDetailedView());

        const header = this._detailedViewOverlay.querySelector('.tpi-detailed-view__header');
        if (header) {
            header.appendChild(backBtn);
        }

        document.body.appendChild(this._detailedViewOverlay);

        // Close on escape
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this._closeDetailedView();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Opens the detailed view for a record.
     * @param record - The day record to display.
     */
    private _openDetailedView(record: DayRecord): void {
        // Create overlay for detailed view
        this._detailedViewOverlay = document.createElement('div');
        this._detailedViewOverlay.className = 'tpi-detailed-view';

        // Generate content
        const content = this._detailedView.generateDetailedView(record);
        this._detailedViewOverlay.innerHTML = content;

        // Add back button
        const backBtn = document.createElement('button');
        backBtn.className = 'tpi-detailed-view__back-btn';
        backBtn.innerHTML = '← Retour à l\'historique';
        backBtn.addEventListener('click', () => this._closeDetailedView());

        const header = this._detailedViewOverlay.querySelector('.tpi-detailed-view__header');
        if (header) {
            header.appendChild(backBtn);
        }

        document.body.appendChild(this._detailedViewOverlay);

        // Close on escape
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this._closeDetailedView();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Closes the detailed view.
     */
    private _closeDetailedView(): void {
        if (this._detailedViewOverlay) {
            this._detailedViewOverlay.remove();
            this._detailedViewOverlay = null;
        }
    }

    /**
     * Creates a park summary element.
     * @param park - The park day record.
     * @param parkIndex - The index of the park in the record.
     * @returns The HTML string for the park summary.
     */
    private _createParkSummary(park: ParkDayRecord, parkIndex: number): string {
        const statusClass = park.status === 'open' ? 'open' : 'closed';
        const statusText = park.status === 'open' ? 'Ouvert' : 'Fermé';
        const resultClass = park.finalResult >= 0 ? 'positive' : 'negative';
        const resultSign = park.finalResult >= 0 ? '+' : '';

        const warningBadge = park.hasWarning
            ? '<span class="tpi-history-park__warning">⚠️ Attention</span>'
            : '';

        return `
            <div class="tpi-history-park">
                <div class="tpi-history-park__header">
                    <div>
                        <span class="tpi-history-park__name">${park.name}</span>
                        <span class="tpi-history-park__status tpi-history-park__status--${statusClass}">${statusText}</span>
                        ${warningBadge}
                    </div>
                    <span class="tpi-history-park__result tpi-history-park__stat-value--${resultClass}">
                        ${resultSign}${this._formatNumber(park.finalResult)} €
                    </span>
                </div>
                <div class="tpi-history-park__grid">
                    <div class="tpi-history-park__stat">
                        <div class="tpi-history-park__stat-label">Visiteurs</div>
                        <div class="tpi-history-park__stat-value">${this._formatNumber(park.visitors.totalVisitors)}</div>
                    </div>
                    <div class="tpi-history-park__stat">
                        <div class="tpi-history-park__stat-label">Adultes / Enfants</div>
                        <div class="tpi-history-park__stat-value">${this._formatNumber(park.visitors.adults)} / ${this._formatNumber(park.visitors.children)}</div>
                    </div>
                    <div class="tpi-history-park__stat">
                        <div class="tpi-history-park__stat-label">Revenu entrées</div>
                        <div class="tpi-history-park__stat-value tpi-history-park__stat-value--positive">+${this._formatNumber(park.visitors.totalEntryRevenue)} €</div>
                    </div>
                    <div class="tpi-history-park__stat">
                        <div class="tpi-history-park__stat-label">Restaurants (net)</div>
                        <div class="tpi-history-park__stat-value ${this._getValueClass(park.restaurants.netRevenue)}">${this._formatSignedNumber(park.restaurants.netRevenue)} €</div>
                    </div>
                    <div class="tpi-history-park__stat">
                        <div class="tpi-history-park__stat-label">Boutiques (net)</div>
                        <div class="tpi-history-park__stat-value ${this._getValueClass(park.boutiques.netRevenue)}">${this._formatSignedNumber(park.boutiques.netRevenue)} €</div>
                    </div>
                    <div class="tpi-history-park__stat">
                        <div class="tpi-history-park__stat-label">Coût attractions</div>
                        <div class="tpi-history-park__stat-value tpi-history-park__stat-value--negative">-${this._formatNumber(park.attractions.totalCost)} €</div>
                    </div>
                    <div class="tpi-history-park__stat">
                        <div class="tpi-history-park__stat-label">Masse salariale</div>
                        <div class="tpi-history-park__stat-value tpi-history-park__stat-value--negative">-${this._formatNumber(park.hr.salary)} €</div>
                    </div>
                    <div class="tpi-history-park__stat">
                        <div class="tpi-history-park__stat-label">Taxes</div>
                        <div class="tpi-history-park__stat-value tpi-history-park__stat-value--negative">-${this._formatNumber(park.taxes.taxAmount)} €</div>
                    </div>
                    <div class="tpi-history-park__stat">
                        <div class="tpi-history-park__stat-label">Note du parc</div>
                        <div class="tpi-history-park__stat-value">${this._formatNumber(park.summary.parkNote)}</div>
                    </div>
                    <div class="tpi-history-park__stat">
                        <div class="tpi-history-park__stat-label">XP gagnée</div>
                        <div class="tpi-history-park__stat-value">${this._formatNumber(park.summary.experienceGained)} pts</div>
                    </div>
                    <div class="tpi-history-park__stat">
                        <div class="tpi-history-park__stat-label">Attractions ouvertes</div>
                        <div class="tpi-history-park__stat-value">${park.attractions.openCount}</div>
                    </div>
                    <div class="tpi-history-park__stat">
                        <div class="tpi-history-park__stat-label">Propreté</div>
                        <div class="tpi-history-park__stat-value">${park.visitors.cleanliness}%</div>
                    </div>
                </div>
                <button class="tpi-history-park__detail-btn" data-park-index="${parkIndex}">
                    📊 ${NEW_DAY_STRINGS.FULL_DETAIL}
                </button>
            </div>
        `;
    }

    /**
     * Formats a number with French locale.
     * @param value - The number to format.
     * @returns The formatted string.
     */
    private _formatNumber(value: number): string {
        return Math.abs(value).toLocaleString('fr-FR');
    }

    /**
     * Formats a signed number with French locale.
     * @param value - The number to format.
     * @returns The formatted string with sign.
     */
    private _formatSignedNumber(value: number): string {
        const sign = value >= 0 ? '+' : '-';
        return `${sign}${this._formatNumber(value)}`;
    }

    /**
     * Gets the CSS class for a value.
     * @param value - The number value.
     * @returns The CSS class string.
     */
    private _getValueClass(value: number): string {
        return value >= 0
            ? 'tpi-history-park__stat-value--positive'
            : 'tpi-history-park__stat-value--negative';
    }
}
