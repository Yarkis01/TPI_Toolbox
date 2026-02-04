/**
 * Selectors used in the New Day History module.
 */
export const NEW_DAY_SELECTORS = {
    // Page matching
    PAGE_MATCH: 'new_day.php',

    // Main elements
    ADVANCE_BUTTON: '#new-day-advance-btn',
    RECAP_SECTION: '#new-day-recap',
    RECAP_CONTENT: '#new-day-recap-content',
    RECAP_MESSAGE: '.new-day-recap__message',

    // Park card elements
    PARK_CARD: '.new-day-recap__park-card',
    PARK_NAME: '.new-day-modal__park-name',
    PARK_STATUS: '.new-day-modal__park-status',
    PARK_RESULT: '.new-day-modal__park-extra > span:first-child',
    PARK_WARNING: '.new-day-modal__park-warning-badge',
    PARK_DETAILS: '.new-day-modal__park-details',

    // HR Section
    HR_SECTION: '.new-day-modal__park-rh',
    HR_EMPLOYEE_LIST: '.new-day-modal__park-rh-employee-list',
    HR_AVAILABLE_COUNT: '.new-day-modal__park-rh-available-count',
    HR_FINANCE_LIST: '.new-day-modal__park-rh-finance-list',
    HR_FOOTER_TOTAL: '.new-day-modal__park-rh-footer-left .new-day-modal__park-rh-footer-value',
    HR_FOOTER_RESULT: '.new-day-modal__park-rh-footer-right .new-day-modal__park-rh-footer-value',

    // Visitors Section
    VISITORS_SECTION: '.new-day-modal__park-visitors',
    VISITORS_PARKING_INFO: '.new-day-modal__park-visitors-parking-info',
    VISITORS_ENTRANCE_LIST: '.new-day-modal__park-visitors-entrance-list',
    VISITORS_LIST: '.new-day-modal__park-visitors-visitors-list',
    VISITORS_OPINION_LIST: '.new-day-modal__park-visitors-opinion-list',
    VISITORS_REVENUE_LIST: '.new-day-modal__park-visitors-revenue-list',
    VISITORS_FOOTER_TOTAL: '.new-day-modal__park-visitors-revenue-footer-left .new-day-modal__park-visitors-revenue-footer-value',
    VISITORS_FOOTER_RESULT: '.new-day-modal__park-visitors-revenue-footer-right .new-day-modal__park-visitors-revenue-footer-value',

    // Attractions Section
    ATTRACTIONS_SECTION: '.new-day-modal__park-attractions:not(.new-day-modal__park-attractions--spectacles):not(.new-day-modal__park-attractions--restaurants):not(.new-day-modal__park-attractions--boutiques):not(.new-day-modal__park-attractions--taxes)',
    ATTRACTIONS_TABLE: '.new-day-modal__attractions-table',
    ATTRACTIONS_WAIT_ALERT: '.new-day-modal__park-attractions-wait-time-alert',
    ATTRACTIONS_RATIO: '.new-day-modal__park-attractions-ratio-section',
    ATTRACTIONS_WORKS_LIST: '.new-day-modal__park-attractions-works-list',

    // Spectacles Section
    SPECTACLES_SECTION: '.new-day-modal__park-attractions--spectacles',

    // Restaurants Section
    RESTAURANTS_SECTION: '.new-day-modal__park-attractions--restaurants',

    // Boutiques Section
    BOUTIQUES_SECTION: '.new-day-modal__park-attractions--boutiques',

    // Taxes Section
    TAXES_SECTION: '.new-day-modal__park-attractions--taxes',

    // Summary Section
    SUMMARY_SECTION: '.new-day-modal__park-attractions:last-of-type',
    SUMMARY_PARK_NOTE: '.new-day-modal__park-summary-item-block:nth-child(1) .new-day-modal__park-summary-item-value',
    SUMMARY_XP: '.new-day-modal__park-summary-item-block:nth-child(2) .new-day-modal__park-summary-item-value',
    SUMMARY_RESULT: '.new-day-modal__park-summary-item-block:nth-child(3) .new-day-modal__park-summary-item-value',

    // Note detail
    NOTE_DETAIL_TABLE: '.new-day-modal__park-note-detail-table',

    // Generic footer values
    FOOTER_LEFT_VALUE: '.new-day-modal__park-attractions-revenue-footer-left .new-day-modal__park-attractions-revenue-footer-value',
    FOOTER_RIGHT_VALUE: '.new-day-modal__park-attractions-revenue-footer-right .new-day-modal__park-attractions-revenue-footer-value',

    // History button
    HISTORY_BTN_ID: 'tpi-history-btn',
    HISTORY_MODAL_ID: 'tpi-history-modal',
    HISTORY_CONTAINER: '.new-day-card__actions',
};

/**
 * Strings used in the New Day History module.
 */
export const NEW_DAY_STRINGS = {
    BTN_LABEL: 'Historique',
    BTN_TITLE: 'Consulter l\'historique des journées passées',
    MODAL_TITLE: 'Historique des journées',
    MODAL_CLOSE: 'Fermer',
    NO_HISTORY: 'Aucun historique disponible.',
    EXPORT_JSON: 'Exporter JSON',
    EXPORT_CSV: 'Exporter CSV',
    CLEAR_HISTORY: 'Vider l\'historique',
    CONFIRM_CLEAR: 'Êtes-vous sûr de vouloir supprimer tout l\'historique ?',
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
