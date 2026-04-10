/**
 * CSS selectors used for the zone reorder module.
 */
export const REORDER_SELECTORS = {
    PAGE_MATCHES: [
        'park/attractions.php',
        'park/spectacles.php',
        'park/boutiques.php',
        'park/restaurants.php',
    ],
    ZONE_LIST:
        '.park-attractions-main, .park-spectacles-main, .park-boutiques-main, .park-restaurants-main',
    ZONE_GROUP:
        '.park-attractions-group, .park-spectacles-group, .park-boutiques-group, .park-restaurants-group',
    ZONE_HEADER: '.dash-block__head',
    ZONE_NAME: '.dash-block__title',
    DRAGGING_CLASS: 'tpi-zone-group-dragging',
    DRAG_OVER_CLASS: 'tpi-zone-group-drag-over',
    HANDLE_CLASS: 'tpi-zone-reorder-handle',
    HANDLE_CLASS_SELECTOR: '.tpi-zone-reorder-handle',
    HEADER_CONTENT: '.dash-block__head',
    ENABLED_CLASS: 'tpi-reorder-enabled',
};

/**
 * Storage keys used for the zone reorder module.
 */
export const STORAGE_KEYS = {
    ZONE_ORDER: 'tpi_zone_order',
};
