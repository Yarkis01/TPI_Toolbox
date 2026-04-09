/**
 * Layout-related constant selectors.
 */
export const SELECTORS = {
    NEW_DAY_LINK: 'a.app-sidebar__link--new-day',
} as const;

/**
 * Layout-related ID constants.
 */
export const IDS = {
    SIDEBAR_TOOLBOX_LINK: 'tpi-sidebar-toolbox-link',
    SETTINGS_MODAL: 'tpi-settings-modal',
    UPDATE_TOAST: 'tpi-update-toast',
} as const;

/**
 * Layout-related event constants.
 */
export const EVENTS = {
    TOOLBOX_TOGGLED: 'tpitoolbox:toolbox:toggled',
} as const;
