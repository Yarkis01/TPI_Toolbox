/**
 * Selectors and IDs for the attraction surface filter module.
 */
export const SURFACE_SELECTORS = {
    MODAL: '.attraction-store-modal', // Changed to class to match any modal (e.g., primary and second-hand)
    FILTER_CONTAINER: '.attraction-store-modal__filters',
    FILTER_GROUP: '.attraction-store-modal__filter-group',
    TYPE_FILTER: 'select[id$="-filter-type"], #attraction-filter-type, #second-hand-filter-type',
    CONSTRUCTOR_FILTER: 'select[id$="-filter-constructor"], #attraction-filter-constructor, #second-hand-filter-constructor',
    CARD: '.attraction-card',
    CARD_DESCRIPTION: '.attraction-card__description, .attraction-card__details',
    COUNTER: '[id$="-filter-count"], #attraction-filter-count, #second-hand-filter-count',
    RESET_BTN: 'button[id$="-reset-btn"], #attraction-filter-reset-btn, #second-hand-filter-reset-btn',
    HIDDEN_CLASS: 'attraction-card--hidden-by-surface',
};

/**
 * Strings used in the attraction surface filter module.
 */
export const SURFACE_STRINGS = {
    LABEL: 'Superficie Max (m²)',
    UNIT: 'm²',
    ALL: 'Tous',
};

/**
 * Default configuration values for the surface filter slider.
 */
export const SURFACE_DEFAULTS = {
    MIN: 0,
    MAX: 5000,
    STEP: 50,
};
