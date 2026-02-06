/**
 * Constants for the Invest Shares Filter module.
 */

/**
 * DOM Selectors for the invest page.
 */
export const SELECTORS = {
    PAGE_MATCH: 'invest.php',
    FILTER_CONTAINER: '.invest-metrics-section',
    SHARE_ITEM: '.invest-shares-market-item',
    HOLDING_TAG: '.invest-shares-market-item__tag',
    HOLDING_NAME: '.invest-shares-market-item__name',
    INDEX_VALUE: '.invest-shares-market-item__indice-value',
    PRICE: '.invest-shares-market-item__price',
    MARKET_COLUMNS: '.invest-columns',
    LEFT_COLUMN: '.invest-column--left',
    RIGHT_COLUMN: '.invest-column--right',
} as const;

/**
 * CSS classes used by the module.
 */
export const CSS_CLASSES = {
    HIDDEN: 'tpi-shares-hidden',
    FILTER_CONTAINER: 'tpi-shares-filter',
    FILTER_GROUP: 'tpi-shares-filter__group',
    FILTER_LABEL: 'tpi-shares-filter__label',
    FILTER_INPUT: 'tpi-shares-filter__input',
    FILTER_SELECT: 'tpi-shares-filter__select',
    FILTER_CHECKBOX: 'tpi-shares-filter__checkbox',
    RESET_BTN: 'tpi-shares-filter__reset',
    STATS_DISPLAY: 'tpi-shares-filter__stats',
    HIGHLIGHTED: 'tpi-shares-highlighted',
} as const;

/**
 * UI Strings (French).
 */
export const STRINGS = {
    FILTER_TITLE: 'Filtres des parts',
    HOLDING_LABEL: 'Holding :',
    ALL_HOLDINGS: 'Toutes les holdings',
    MIN_INDEX_LABEL: 'Indice min (%) :',
    MAX_INDEX_LABEL: 'Indice max (%) :',
    MIN_PRICE_LABEL: 'Prix min (€) :',
    MAX_PRICE_LABEL: 'Prix max (€) :',
    POSITIVE_ONLY_LABEL: 'Positif uniquement',
    NEGATIVE_ONLY_LABEL: 'Négatif uniquement',
    RESET_BTN: 'Réinitialiser',
    STATS_TEMPLATE: '{visible} / {total} parts affichées',
} as const;

/**
 * Default configuration values.
 */
export const DEFAULTS = {
    MIN_INDEX: -100,
    MAX_INDEX: 100,
    MIN_PRICE: 0,
    MAX_PRICE: 1000,
} as const;

/**
 * Storage key for filter persistence.
 */
export const STORAGE_KEY = 'tpi_invest_shares_filter_state';
