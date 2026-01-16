/**
 * Constants for the Entity Status Colorizer module.
 */
export const CAPACITY_COLORS = {
    ENOUGTH: '2px solid #4cd137',
    WARNING: '2px dashed #fbc531',
    FILLED: '2px solid #dd700aff',
    OVERFILLED: '2px solid #ff0000ff',
};

/**
 * Constants for the Entity Status Colorizer module.
 */
export const CAPACITY_EVALUATION = {
    ENOUGTH: 10,
};

/**
 * Page configurations for entity status colorization.
 */
export const PAGE_CONFIGS = [
    {
        urlFragment: 'backstage.php',
        selector: '.backstage-card',
        getStatus: (el: HTMLElement) => el.dataset.status?.toLowerCase() || '',
    },
];
