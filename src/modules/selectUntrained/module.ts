import { BaseModule } from '../../core/abstract/BaseModule';
import { createElement } from '../../utils/DomUtils';
import { TRAINING_SELECTORS, TRAINING_STRINGS } from './constants';

/**
 * Module to select employees not fully trained.
 */
export class SelectUntrainedModule extends BaseModule {
    private _btn: HTMLButtonElement | null = null;

    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'select_untrained';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return 'Sélecteur de formation';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return 'Ajoute un bouton pour sélectionner les employés non formés au max.';
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        const container: HTMLElement | null = document.querySelector(TRAINING_SELECTORS.BUTTON_CONTAINER);
        if (window.location.href.includes(TRAINING_SELECTORS.PAGE_MATCH) && container) {
            this._injectButton(container);
        }
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._btn?.remove();
        this._btn = null;
    }

    /**
     * Creates and appends the selection button.
     */
    private _injectButton(container: HTMLElement): void {
        this._btn = createElement('button', {
            type: 'button',
            id: TRAINING_SELECTORS.BTN_ID,
            class: 'rh-filters__reset',
            title: TRAINING_STRINGS.BTN_TITLE,
        }, [TRAINING_STRINGS.BTN_LABEL]) as HTMLButtonElement;

        this._btn.addEventListener('click', async () => this._handleSelectionClick());
        
        container.appendChild(this._btn);
    }

    /**
     * Orchestrates the activation of multi-select mode if needed.
     */
    private async _handleSelectionClick(): Promise<void> {
        try {
            await this._ensureMultiSelectMode();
            this._performSelection();
        } catch (error) {
            this._logger.error('Impossible d\'activer le mode multi-sélection');
        }
    }

    /**
     * Ensures the multi-select mode is active.
     * If not, activates it and waits for confirmation.
     */
    private async _ensureMultiSelectMode(): Promise<void> {
        const container = document.querySelector(TRAINING_SELECTORS.TABLE_CONTAINER);
        const toggleBtn = document.querySelector<HTMLElement>(TRAINING_SELECTORS.MULTI_SELECT_BTN);

        if (!container || !toggleBtn || container.classList.contains(TRAINING_SELECTORS.MULTI_SELECT_ACTIVE_CLASS)) {
            return; 
        }

        const activationPromise = this._waitForClass(
            container, 
            TRAINING_SELECTORS.MULTI_SELECT_ACTIVE_CLASS
        );

        toggleBtn.click();

        await activationPromise;
    }

    /**
     * Waits for a specific class to be added to an element or times out.
     */
    private _waitForClass(element: Element, className: string, timeoutMs: number = 2000): Promise<void> {
        return new Promise((resolve, reject) => {
            let timer: number;

            const observer = new MutationObserver((mutations) => {
                const hasClass = mutations.some(m => 
                    (m.target as Element).classList.contains(className)
                );

                if (hasClass) {
                    observer.disconnect();
                    clearTimeout(timer);
                    resolve();
                }
            });

            observer.observe(element, { 
                attributes: true, 
                attributeFilter: ['class'] 
            });

            timer = window.setTimeout(() => {
                observer.disconnect();
            }, timeoutMs);
        });
    }

    /**
     * Executes the actual logic of checking boxes.
     */
    private _performSelection(): void {
        const rows = document.querySelectorAll<HTMLTableRowElement>(TRAINING_SELECTORS.ROW);
        let count = 0;

        rows.forEach((row) => {
            if (row.style.display === 'none') return;

            if (this._isNotFullyTrained(row)) {
                this._toggleRowCheckbox(row, true);
                count++;
            }
        });
        
        this._logger.info(`${count} employés non formés sélectionnés.`);
    }

    /**
     * Parses the stars aria-label to determine if training is needed.
     */
    private _isNotFullyTrained(row: HTMLTableRowElement): boolean {
        let result = false;

        const starsEl = row.querySelector(TRAINING_SELECTORS.STARS_CONTAINER);
        if (starsEl) {
            const ariaLabel = starsEl.getAttribute('aria-label') || '';
            const match = ariaLabel.match(/(\d+)\s+sur\s+(\d+)/);

            if (match) {
                const currentLevel = parseInt(match[1], 10);
                const maxLevel = parseInt(match[2], 10);
                result = currentLevel < maxLevel;
            }
        }

        return result;
    }

    /**
     * Checks the box and dispatches a change event so the game UI reacts.
     */
    private _toggleRowCheckbox(row: HTMLTableRowElement, checked: boolean): void {
        const checkbox = row.querySelector<HTMLInputElement>(TRAINING_SELECTORS.CHECKBOX);
        
        if (checkbox && checkbox.checked !== checked) {
            checkbox.checked = checked;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}