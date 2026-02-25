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
        selector: 'article.owned-attraction-card',
        getStatus: (el: HTMLElement) => el.dataset.status?.toLowerCase() || '',
    },
    {
        urlFragment: 'restaurants.php',
        selector: 'article.owned-restaurant-card',
        getStatus: (el: HTMLElement) => el.dataset.status?.toLowerCase() || '',
    },
    {
        urlFragment: 'entrance.php',
        selector: 'li.booth-row',
        getStatus: (el: HTMLElement) =>
            el.querySelector('.booth-row__status')?.textContent?.toLowerCase() || '',
    },
    {
        urlFragment: 'spectacles.php',
        selector: 'article.spectacle-card',
        getStatus: (el: HTMLElement) =>
            el
                .querySelector('.spectacle-card__manage-btn')
                ?.getAttribute('data-status')
                ?.toLowerCase() || '',
    },
    {
        urlFragment: 'boutiques.php',
        selector: 'article.owned-boutique-card',
        getStatus: (el: HTMLElement) => el.dataset.status?.toLowerCase() || '',
    },
];
