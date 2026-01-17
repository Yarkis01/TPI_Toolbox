/**
 * Selectors and strings for the restaurant zone filters module.
 */
export const ZONE_SELECTORS = {
    PAGE_MATCH: 'restaurants.php',
    FILTER_CONTAINER: '.owned-restaurants__filters-container', // Hypothetical, to be verified or adapted
    CARD: '.owned-restaurant-card',
    BADGE: '.owned-restaurant-card__zone-badge',
    FILTER_ID: 'tpi-restaurent-zone-filter',
    HIDDEN_CLASS: 'tpi-hidden-by-zone',
    // Reusing TPI classes if possible
    SITE_LABEL: 'tpi-checkbox-label',
    // Reusing attraction style for consistency
    SITE_SELECT: 'owned-attractions__filter-select',
    // Reusing attraction style
    SITE_FILTER_GROUP: 'owned-attractions__filter-group',
    // Reusing global counter if it exists
    COUNTER: '#owned-filter-count',
    // Reusing global reset if it exists
    RESET_BTN: '#owned-filter-reset-btn',
    STATUS_FILTER_ID: 'tpi-restaurant-status-filter',
    // New Classes for Refactoring
    ZONE_HEADER: 'tpi-zone-header',
    ZONE_HEADER_OVERLAY: 'tpi-zone-header-overlay',
    ZONE_HEADER_CONTENT: 'tpi-zone-header-content',
    ZONE_NAME: 'tpi-zone-name',
    ZONE_ATTRACTIONS_CONTAINER: 'tpi-zone-attractions',
    FILTER_ACTIONS: 'tpi-filter-actions',
    NO_ZONE_GROUP: 'tpi-restaurant-no-zone-group', // Already used string, checking consistency
    FILTERS_CONTAINER_HEADER: 'tpi-filters-container--header',
    FILTERS_CONTAINER_SECTION: 'tpi-filters-container--section',
};

/**
 * Strings used in the status filters module.
 */
export const STATUS_STRINGS = {
    LABEL: 'Filtrer par statut',
    DEFAULT_OPTION: 'Tous les statuts',
    OPEN: 'Ouvert',
    CLOSED: 'Fermé',
    WORK: 'En travaux',
};

/**
 * Strings used in the zone filters module.
 */
export const ZONE_STRINGS = {
    LABEL: 'Filtrer par zone',
    DEFAULT_OPTION: 'Toutes les zones',
};

/**
 * Images URLs used in the zone filters module.
 */
export const ZONE_IMAGES_URL = {
    FUTURISTE: 'https://www.themeparkindustries.com/tpiv4/game/assets/img/futuriste.png',
    AVANTURE: 'https://www.themeparkindustries.com/tpiv4/game/assets/img/aventure.png',
    FANTASY: 'https://www.themeparkindustries.com/tpiv4/game/assets/img/fantasy.png',
    PIRATE: 'https://www.themeparkindustries.com/tpiv4/game/assets/img/pirate.png',
    FARWEST: 'https://www.themeparkindustries.com/tpiv4/game/assets/img/farwest.png',
    MYTHOLOGIE: 'https://www.themeparkindustries.com/tpiv4/game/assets/img/mythologie.png',
    CONTES: 'https://www.themeparkindustries.com/tpiv4/game/assets/img/contes.png',
    JUNGLE: 'https://www.themeparkindustries.com/tpiv4/game/assets/img/jungle.png',
    OCEAN: 'https://www.themeparkindustries.com/tpiv4/game/assets/img/ocean.png',
    HORREUR: 'https://www.themeparkindustries.com/tpiv4/game/assets/img/horreur.png',
};