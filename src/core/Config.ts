/**
 * Selectors used in the application.
 */
export const SELECTORS = {
    LINK_TUTORIAL: 'a.game-header__link[href*="tutoriel.php"]',
    LOGOUT_BUTTON: 'a.game-header__link[href*="logout.php"]',
    DISCORD_BUTTON: 'a.game-header__discord-btn',
    HEADER: 'div.game-header__content',
    HEADER_PARENT: 'header.game-header',
    OLD_CHAT_BUTTON: 'div.footer__col--chat',
    CHAT_CLOSER: 'button.chat-window__close',
    CHAT_HEADER: 'div.chat-window__header',
    CHAT_OPENED: 'tpi-chat-opened',
    CHAT_MESSAGES: 'div#chat-messages',
    ATTRACTIONS_HYPE: 'span.attraction-card__hype',
    ATTRACTIONS_HYPE_DOTS: 'span.attraction-card__hype-dot',
} as const;

/**
 * IDs used in the application.
 */
export const IDS = {
    HEADERS_WIDGETS: 'tpi-header-widgets',
    CHAT_BUTTON: 'tpi-chat-button',
    CHAT_OVERLAY: 'tpi-chat-overlay',
    TOOLBOX_BUTTON: 'tpi-toolbox-button',
    SETTINGS_MODAL: 'tpi-settings-modal',
    UPDATE_TOAST: 'tpi-update-toast',
} as const;

/**
 * Event names used in the application.
 */
export const EVENTS = {
    CHAT_TOGGLED: 'tpitoolbox:chat:toggled',
    TOOLBOX_TOGGLED: 'tpitoolbox:toolbox:toggled',
} as const;

/**
 * Strings used in the application.
 */
export const STRINGS = {
    OPEN_CHAT_BUTTON: 'Ouvrir le Chat',
    CLOSE_CHAT_BUTTON: 'Fermer le Chat',
    SAVE_SETTINGS_BUTTON: 'Sauvegarder & Recharger',

    UPDATE_AVAILABLE_TITLE: (remoteVersion: string) => `Mise à jour ${remoteVersion} disponible`,
    UPDATE_AVAILABLE_ACTION: 'Ouvrir GitHub',
    UPDATE_AVAILABLE_CLOSE: 'Fermer',
} as const;

/**
 * Configuration constants for the application.
 */
export const CONFIG = {
    // Constants about the application
    APP_NAME: 'TPI Toolbox',
    APP_VERSION: __APP_VERSION__,
    DEVELOPER_NAME: 'Yarkis01',
    DEVELOPER_WEBSITE: 'https://github.com/Yarkis01',
    // JSON remote contenant la dernière version publiée (GitHub)
    REMOTE_VERSION_URL: __REMOTE_VERSION_URL__,
    // Intervalle entre deux checks réseau (en ms)
    UPDATE_CHECK_INTERVAL_MS: 6 * 60 * 60 * 1000, // 6h

    CHAT_IFRAME_SRC: 'https://www.themeparkindustries.com/tpiv4/game/chat.php',
    CHAT_IFRAME_WIDTH: 400,
} as const;
