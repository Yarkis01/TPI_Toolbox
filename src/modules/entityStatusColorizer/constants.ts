/**
 * Constants for the Entity Status Colorizer module.
 */
export const STATUS_COLORS = {
    OPEN: '2px solid #4cd137',
    CLOSED: '2px solid #e84118',
    WORK: '2px dashed #fbc531',
    SALE: '2px solid #fbc531',
    UNKNOWN: '2px solid #bdc3c7',
};

/**
 * Page configurations for entity status colorization.
 */
export const PAGE_CONFIGS = [
    {
        urlFragment: 'attractions.php',
        selector: 'article.park-attractions-card',
        getStatus: (el: HTMLElement) => el.dataset.status?.toLowerCase() || '',
    },
    {
        urlFragment: 'restaurants.php',
        selector: 'article.park-restaurants-card',
        getStatus: (el: HTMLElement) => el.dataset.status?.toLowerCase() || '',
    },
    {
        urlFragment: 'spectacles.php',
        selector: 'article.park-spectacles-card',
        getStatus: (el: HTMLElement) => el.dataset.status?.toLowerCase() || '',
    },
    {
        urlFragment: 'boutiques.php',
        selector: 'article.park-boutiques-card',
        getStatus: (el: HTMLElement) => el.dataset.status?.toLowerCase() || '',
    },
];
