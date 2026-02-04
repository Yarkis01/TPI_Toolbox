/**
 * Constants for the Park Website Redesign module.
 */

/**
 * CSS class selectors used to identify park website pages.
 */
export const PARK_SELECTORS = {
    /**
     * Main container class that identifies a park website page.
     */
    WEBSITE_CONTAINER: '.park-website',
};

/**
 * Local storage keys used by the module.
 */
export const STORAGE_KEYS = {
    /**
     * Key for storing the user's theme preference (light/dark).
     */
    THEME: 'tpi-park-theme',
};

/**
 * DOM element identifiers.
 */
export const ELEMENT_IDS = {
    /**
     * ID of the theme toggle button.
     */
    THEME_TOGGLE: 'tpi-theme-toggle',
};

/**
 * Data attributes used by the module.
 */
export const DATA_ATTRIBUTES = {
    /**
     * Attribute to mark the injected style element.
     */
    STYLE_MARKER: 'data-tpi-park-redesign',

    /**
     * Attribute to indicate the current theme.
     */
    THEME: 'data-theme',
};

/**
 * Theme icons.
 */
export const THEME_ICONS = {
    /**
     * Sun icon (shown in dark mode).
     */
    SUN: '☀️',

    /**
     * Moon icon (shown in light mode).
     */
    MOON: '🌙',
};
