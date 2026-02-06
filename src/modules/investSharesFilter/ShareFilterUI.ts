import { createElement } from '../../utils/DomUtils';
import { CSS_CLASSES, STRINGS, DEFAULTS } from './constants';
import { IShareFilterCriteria, IShareFilterUI } from './types';
import './styles.scss';

/**
 * UI component for share filtering.
 */
export class ShareFilterUI implements IShareFilterUI {
    private _container: HTMLElement | null = null;
    private _filterContainer: HTMLElement | null = null;
    private _changeCallback: (() => void) | null = null;

    private _holdingSelect: HTMLSelectElement | null = null;
    private _minIndexInput: HTMLInputElement | null = null;
    private _maxIndexInput: HTMLInputElement | null = null;
    private _minPriceInput: HTMLInputElement | null = null;
    private _maxPriceInput: HTMLInputElement | null = null;
    private _positiveOnlyCheckbox: HTMLInputElement | null = null;
    private _negativeOnlyCheckbox: HTMLInputElement | null = null;
    private _statsDisplay: HTMLElement | null = null;

    /**
     * Renders the filter UI.
     * @param container The container to render into.
     * @param availableTags Available holding tags for filtering.
     */
    public render(container: HTMLElement, availableTags: string[]): void {
        this._container = container;
        this._createFilterUI(availableTags);
    }

    /**
     * Gets the current filter criteria from the UI.
     * @returns The current filter criteria.
     */
    public getCriteria(): IShareFilterCriteria {
        const criteria: IShareFilterCriteria = {};

        const holdingValue = this._holdingSelect?.value;
        if (holdingValue) {
            criteria.holdingTag = holdingValue;
        }

        const minIndex = parseFloat(this._minIndexInput?.value || '');
        if (!isNaN(minIndex)) {
            criteria.minIndex = minIndex;
        }

        const maxIndex = parseFloat(this._maxIndexInput?.value || '');
        if (!isNaN(maxIndex)) {
            criteria.maxIndex = maxIndex;
        }

        const minPrice = parseFloat(this._minPriceInput?.value || '');
        if (!isNaN(minPrice)) {
            criteria.minPrice = minPrice;
        }

        const maxPrice = parseFloat(this._maxPriceInput?.value || '');
        if (!isNaN(maxPrice)) {
            criteria.maxPrice = maxPrice;
        }

        if (this._positiveOnlyCheckbox?.checked) {
            criteria.positiveIndexOnly = true;
        }

        if (this._negativeOnlyCheckbox?.checked) {
            criteria.negativeIndexOnly = true;
        }

        return criteria;
    }

    /**
     * Sets a callback for when filters change.
     * @param callback The callback function.
     */
    public onFilterChange(callback: () => void): void {
        this._changeCallback = callback;
    }

    /**
     * Sets the filter criteria in the UI.
     * @param criteria The criteria to set.
     */
    public setCriteria(criteria: IShareFilterCriteria): void {
        if (this._holdingSelect && criteria.holdingTag !== undefined) {
            this._holdingSelect.value = criteria.holdingTag;
        }

        if (this._minIndexInput && criteria.minIndex !== undefined) {
            this._minIndexInput.value = criteria.minIndex.toString();
        }

        if (this._maxIndexInput && criteria.maxIndex !== undefined) {
            this._maxIndexInput.value = criteria.maxIndex.toString();
        }

        if (this._minPriceInput && criteria.minPrice !== undefined) {
            this._minPriceInput.value = criteria.minPrice.toString();
        }

        if (this._maxPriceInput && criteria.maxPrice !== undefined) {
            this._maxPriceInput.value = criteria.maxPrice.toString();
        }

        if (this._positiveOnlyCheckbox) {
            this._positiveOnlyCheckbox.checked = criteria.positiveIndexOnly ?? false;
        }

        if (this._negativeOnlyCheckbox) {
            this._negativeOnlyCheckbox.checked = criteria.negativeIndexOnly ?? false;
        }
    }

    /**
     * Updates the stats display.
     * @param visible Number of visible shares.
     * @param total Total number of shares.
     */
    public updateStats(visible: number, total: number): void {
        if (this._statsDisplay) {
            this._statsDisplay.textContent = STRINGS.STATS_TEMPLATE
                .replace('{visible}', visible.toString())
                .replace('{total}', total.toString());
        }
    }

    /**
     * Destroys the UI and cleans up.
     */
    public destroy(): void {
        this._filterContainer?.remove();

        this._filterContainer = null;
        this._holdingSelect = null;
        this._minIndexInput = null;
        this._maxIndexInput = null;
        this._minPriceInput = null;
        this._maxPriceInput = null;
        this._positiveOnlyCheckbox = null;
        this._negativeOnlyCheckbox = null;
        this._statsDisplay = null;
        this._changeCallback = null;
    }

    /**
     * Creates the filter UI elements.
     * @param availableTags Available holding tags.
     */
    private _createFilterUI(availableTags: string[]): void {
        const title = createElement('h2', {}, [STRINGS.FILTER_TITLE]);

        this._holdingSelect = this._createSelect(
            'tpi-holding-filter',
            availableTags.map((tag) => ({ value: tag, label: tag })),
            STRINGS.ALL_HOLDINGS,
        );
        const holdingGroup = this._createLabeledElement(STRINGS.HOLDING_LABEL, this._holdingSelect);

        this._minIndexInput = this._createNumberInput('tpi-min-index', DEFAULTS.MIN_INDEX, -100, 100);
        const minIndexGroup = this._createLabeledElement(STRINGS.MIN_INDEX_LABEL, this._minIndexInput);

        this._maxIndexInput = this._createNumberInput('tpi-max-index', DEFAULTS.MAX_INDEX, -100, 100);
        const maxIndexGroup = this._createLabeledElement(STRINGS.MAX_INDEX_LABEL, this._maxIndexInput);

        this._minPriceInput = this._createNumberInput('tpi-min-price', DEFAULTS.MIN_PRICE, 0, 10000);
        const minPriceGroup = this._createLabeledElement(STRINGS.MIN_PRICE_LABEL, this._minPriceInput);

        this._maxPriceInput = this._createNumberInput('tpi-max-price', undefined, 0, 10000);
        const maxPriceGroup = this._createLabeledElement(STRINGS.MAX_PRICE_LABEL, this._maxPriceInput);

        this._positiveOnlyCheckbox = createElement('input', {
            type: 'checkbox',
            id: 'tpi-positive-only',
        }) as HTMLInputElement;
        const positiveOnlyGroup = this._createCheckboxElement(
            STRINGS.POSITIVE_ONLY_LABEL,
            this._positiveOnlyCheckbox,
        );

        this._negativeOnlyCheckbox = createElement('input', {
            type: 'checkbox',
            id: 'tpi-negative-only',
        }) as HTMLInputElement;
        const negativeOnlyGroup = this._createCheckboxElement(
            STRINGS.NEGATIVE_ONLY_LABEL,
            this._negativeOnlyCheckbox,
        );

        const resetBtn = createElement(
            'button',
            { type: 'button', class: CSS_CLASSES.RESET_BTN },
            [STRINGS.RESET_BTN],
        );
        resetBtn.addEventListener('click', () => this._resetFilters());

        this._statsDisplay = createElement('div', { class: CSS_CLASSES.STATS_DISPLAY }, ['0 / 0 parts affichées']);

        const filterGroup = createElement(
            'div',
            { class: CSS_CLASSES.FILTER_GROUP },
            [
                holdingGroup,
                minIndexGroup,
                maxIndexGroup,
                minPriceGroup,
                maxPriceGroup,
                positiveOnlyGroup,
                negativeOnlyGroup,
                resetBtn,
                this._statsDisplay,
            ],
        );

        this._filterContainer = createElement(
            'div',
            { class: CSS_CLASSES.FILTER_CONTAINER },
            [title, filterGroup],
        );

        this._container?.appendChild(this._filterContainer);
        this._setupEventListeners();
    }

    /**
     * Creates a labeled element wrapper.
     * @param labelText The label text.
     * @param element The form element.
     * @returns The wrapper element.
     */
    private _createLabeledElement(labelText: string, element: HTMLElement): HTMLElement {
        const label = createElement(
            'label',
            { class: CSS_CLASSES.FILTER_LABEL },
            [labelText, element],
        );
        return label;
    }

    /**
     * Creates a checkbox element with label.
     * @param labelText The label text.
     * @param checkbox The checkbox input.
     * @returns The wrapper element.
     */
    private _createCheckboxElement(labelText: string, checkbox: HTMLInputElement): HTMLElement {
        const label = createElement(
            'label',
            { class: CSS_CLASSES.FILTER_CHECKBOX },
            [checkbox, labelText],
        );
        return label;
    }

    /**
     * Creates a select element.
     * @param id The element ID.
     * @param options The options array.
     * @param defaultLabel The default option label.
     * @returns The select element.
     */
    private _createSelect(
        id: string,
        options: Array<{ value: string; label: string }>,
        defaultLabel: string,
    ): HTMLSelectElement {
        const select = createElement('select', {
            id,
            class: CSS_CLASSES.FILTER_SELECT,
        }) as HTMLSelectElement;

        select.add(new Option(defaultLabel, ''));
        options.forEach((opt) => {
            select.add(new Option(opt.label, opt.value));
        });

        return select;
    }

    /**
     * Creates a number input element.
     * @param id The element ID.
     * @param defaultValue The default value.
     * @param min The minimum value.
     * @param max The maximum value.
     * @returns The input element.
     */
    private _createNumberInput(
        id: string,
        defaultValue: number | undefined,
        min: number,
        max: number,
    ): HTMLInputElement {
        const input = createElement('input', {
            type: 'number',
            id,
            class: CSS_CLASSES.FILTER_INPUT,
            min: min.toString(),
            max: max.toString(),
            step: '0.01',
        }) as HTMLInputElement;

        if (defaultValue !== undefined) {
            input.value = defaultValue.toString();
        }

        return input;
    }

    /**
     * Sets up event listeners for filter changes.
     */
    private _setupEventListeners(): void {
        const handleChange = () => {
            this._changeCallback?.();
        };

        this._holdingSelect?.addEventListener('change', handleChange);
        this._minIndexInput?.addEventListener('input', handleChange);
        this._maxIndexInput?.addEventListener('input', handleChange);
        this._minPriceInput?.addEventListener('input', handleChange);
        this._maxPriceInput?.addEventListener('input', handleChange);
        this._positiveOnlyCheckbox?.addEventListener('change', handleChange);
        this._negativeOnlyCheckbox?.addEventListener('change', handleChange);
    }

    /**
     * Resets all filters to default values.
     */
    private _resetFilters(): void {
        if (this._holdingSelect) this._holdingSelect.value = '';
        if (this._minIndexInput) this._minIndexInput.value = DEFAULTS.MIN_INDEX.toString();
        if (this._maxIndexInput) this._maxIndexInput.value = DEFAULTS.MAX_INDEX.toString();
        if (this._minPriceInput) this._minPriceInput.value = DEFAULTS.MIN_PRICE.toString();
        if (this._maxPriceInput) this._maxPriceInput.value = '';
        if (this._positiveOnlyCheckbox) this._positiveOnlyCheckbox.checked = false;
        if (this._negativeOnlyCheckbox) this._negativeOnlyCheckbox.checked = false;

        this._changeCallback?.();
    }
}
