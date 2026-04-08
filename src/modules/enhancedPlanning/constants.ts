/**
 * Constants and DOM selectors for the Enhanced Planning module.
 */
export const PLANNING_SELECTORS = {
    /** URL match to identify the planning page */
    PAGE_MATCH: 'planning.php',

    /** Main planning content section */
    PLANNING_CONTENT: '.planning-content',

    /** Filters container */
    FILTERS: '.planning-filters',

    /** Employee type selector */
    TYPE_SELECT: '#planning-type',

    /** Secondary selectors (boutique, restaurant, spectacle, attraction) */
    BOUTIQUE_WRAP: '#planning-boutique-wrap',
    BOUTIQUE_SELECT: '#planning-boutique',
    RESTAURANT_WRAP: '#planning-restaurant-wrap',
    RESTAURANT_SELECT: '#planning-restaurant',
    SPECTACLE_WRAP: '#planning-spectacle-wrap',
    SPECTACLE_SELECT: '#planning-spectacle',
    ATTRACTION_WRAP: '#planning-attraction-wrap',
    ATTRACTION_SELECT: '#planning-attraction',

    /** Planning grid */
    PLANNING_GRID: '.planning-grid',
    PLANNING_GRID_WRAP: '.planning-grid-wrap',
    PLANNING_RESULT: '#planning-result-content',
} as const;

/**
 * CSS class prefix for the module.
 */
export const CSS_PREFIX = 'enhanced-planning' as const;
