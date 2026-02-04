/**
 * Selectors and IDs for the attraction surface filter module.
 */
export const SURFACE_SELECTORS = {
    MODAL: '#attraction-store-modal',
    FILTER_CONTAINER: '.attraction-store-modal__filters',
    FILTER_GROUP: '.attraction-store-modal__filter-group',
    TYPE_FILTER: '#attraction-filter-type',
    CARD: '.attraction-card',
    CARD_DESCRIPTION: '.attraction-card__description',
    COUNTER: '#attraction-filter-count',
    RESET_BTN: '#attraction-filter-reset-btn',
    SLIDER_ID: 'attraction-filter-surface',
    SLIDER_VALUE_ID: 'attraction-filter-surface-value',
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
