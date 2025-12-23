import { BaseModule } from '../../core/abstract/BaseModule';
import { createElement, injectStyle } from '../../utils/DomUtils';
import { STAFF_SELECTORS, STAFF_STRINGS } from './constants';
import './styles.scss';

/**
 * Module to hide warehousemen from staff lists.
 */
export class HideWarehousemanModule extends BaseModule {
    private _styleElement: HTMLStyleElement | null = null;
    private _checkbox: HTMLInputElement | null = null;
    private _wrapper: HTMLElement | null = null;

    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'hide_warehouseman';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return 'Masquer les manutentionnaires';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return 'Masque les manutentionnaires par défaut pour alléger la vue.';
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        if (
            document.location.href.includes(STAFF_SELECTORS.PAGE_MATCH) &&
            document.querySelector(STAFF_SELECTORS.TABLE)
        ) {
            this._injectStyles();

            const container = document.querySelector(STAFF_SELECTORS.FILTER_CONTAINER);
            if (container) {
                this._injectToggle(container as HTMLElement);
            }

            this._applyFilter();
            this._setupNativeHooks();
        }
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._styleElement?.remove();
        this._wrapper?.remove();

        document.querySelectorAll(`.${STAFF_SELECTORS.HIDDEN_CLASS}`).forEach((el) => {
            el.classList.remove(STAFF_SELECTORS.HIDDEN_CLASS);
        });

        this._updateCounter();

        this._styleElement = null;
        this._checkbox = null;
        this._wrapper = null;
    }

    /**
     * Injects necessary styles into the document.
     */
    private _injectStyles(): void {
        injectStyle(`
            .${STAFF_SELECTORS.HIDDEN_CLASS} {
                display: none !important;
            }
        `);
    }

    /**
     * Injects the toggle checkbox into the filter container.
     * @param container The filter container element.
     */
    private _injectToggle(container: HTMLElement): void {
        this._checkbox = createElement('input', {
            type: 'checkbox',
            id: STAFF_SELECTORS.TOGGLE_ID,
            checked: 'true',
        }) as HTMLInputElement;

        const label = createElement(
            'label',
            {
                class: 'tpi-checkbox-label',
                for: STAFF_SELECTORS.TOGGLE_ID,
            },
            [this._checkbox, STAFF_STRINGS.TOGGLE_LABEL],
        );

        this._wrapper = createElement(
            'div',
            {
                class: 'rh-filters__group tpi-custom-filter-group',
            },
            [label],
        );

        container.appendChild(this._wrapper);

        this._checkbox.addEventListener('change', () => {
            this._applyFilter();
        });
    }

    /**
     * Sets up hooks for native filter controls to update the staff counter.
     */
    private _setupNativeHooks(): void {
        const nativeSelects = document.querySelectorAll('.rh-filters__select');
        nativeSelects.forEach((select) => {
            select.addEventListener('change', () => {
                setTimeout(() => this._updateCounter(), 50);
            });
        });

        const resetBtn = document.getElementById('filter-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                setTimeout(() => this._updateCounter(), 50);
            });
        }
    }

    /**
     * Applies the filter to hide/show warehousemen based on the checkbox state.
     */
    private _applyFilter(): void {
        const shouldHide = this._checkbox?.checked ?? false;
        const rows = document.querySelectorAll<HTMLElement>(STAFF_SELECTORS.ROWS);

        rows.forEach((row) => {
            const poste = row.dataset.poste?.toLowerCase() || '';

            if (shouldHide && poste === 'manutentionnaire') {
                row.classList.add(STAFF_SELECTORS.HIDDEN_CLASS);
            } else {
                row.classList.remove(STAFF_SELECTORS.HIDDEN_CLASS);
            }
        });

        this._updateCounter();
    }

    /**
     * Updates the visible staff counter.
     */
    private _updateCounter(): void {
        const counterEl = document.querySelector(STAFF_SELECTORS.COUNTER);
        const rows = document.querySelectorAll<HTMLElement>(STAFF_SELECTORS.ROWS);

        if (counterEl) {
            let visibleCount = 0;
            rows.forEach((row) => {
                const style = window.getComputedStyle(row);
                if (style.display !== 'none') {
                    visibleCount++;
                }
            });

            counterEl.textContent = visibleCount.toString();
            this._logger.debug(`Staff counter updated: ${visibleCount}`);
        }
    }
}
