/**
 * Selectors used in the New Day History module.
 */
export const NEW_DAY_SELECTORS = {
    // Page matching
    PAGE_MATCH: 'new_day.php',

    // Main elements
    ADVANCE_BUTTON: '#new-day-advance-btn',

    // Multi-day confirm modal
    MULTI_CONFIRM_MODAL_BODY: '#new-day-multi-confirm-modal .app-modal__body',
    MULTI_CONFIRM_WARNING_ID: 'tpi-history-multi-warning',

    // History UI
    HISTORY_BTN_ID: 'tpi-history-btn',
    HISTORY_MODAL_ID: 'tpi-history-modal',
    HISTORY_CONTAINER: '.new-day-card__actions',
};

/**
 * Strings used in the New Day History module.
 */
export const NEW_DAY_STRINGS = {
    BTN_LABEL: 'Historique',
    BTN_TITLE: "Consulter l'historique des journées passées",
    MODAL_TITLE: 'Historique des journées',
    MODAL_CLOSE: 'Fermer',
    NO_HISTORY: 'Aucun historique disponible.',
    EXPORT_JSON: 'Exporter JSON',
    EXPORT_CSV: 'Exporter CSV',
    CLEAR_HISTORY: "Vider l'historique",
    CONFIRM_CLEAR: "Êtes-vous sûr de vouloir supprimer tout l'historique ?",
    DAY_LABEL: 'Jour',
    DAYS_REMAINING: 'jour(s) restant(s)',
    TOTAL_RESULT: 'Résultat total',
    DETAILS: 'Détails',
    FULL_DETAIL: 'Voir le détail complet',
};

/**
 * Storage configuration for the New Day History module.
 */
export const STORAGE_CONFIG = {
    STORAGE_KEY: 'tpi_day_history',
    MAX_RECORDS: 365,
};
