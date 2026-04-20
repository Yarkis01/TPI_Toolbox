export const HIDE_CHAT_SELECTORS = {
    ENABLED_CLASS: 'tpi-hide-chat',
    HIDDEN_CLASS: 'tpi-hide-chat--hidden',
    MINI_CLASS: 'tpi-hide-chat--mini',
    HIDE_POLITIQUE_BADGE_CLASS: 'tpi-hide-chat--hide-politique-badge',
    HIDE_POLITIQUE_CHAT_CLASS: 'tpi-hide-chat--hide-politique-chat',
};

export const CONFIG_KEYS = {
    MODE: 'mode',
    HIDE_POLITIQUE_BADGE: 'hidePolitiqueBadge',
    HIDE_POLITIQUE_CHAT: 'hidePolitiqueChat',
} as const;

export const MODES = {
    DISABLED: 'disabled',
    MINI: 'mini',
    HIDDEN: 'hidden',
} as const;
