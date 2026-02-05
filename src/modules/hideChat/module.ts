import { BaseModule } from '../../core/abstract/BaseModule';
import { IModuleConfigSchema } from '../../core/interfaces/IModuleConfig';
import { CHAT_SELECTORS } from './constants';

/** Configuration keys for this module */
const CONFIG_KEYS = {
    HIDE_DASHBOARD_CHAT: 'hideDashboardChat',
    HIDE_POLITIQUE_CHAT: 'hidePolitiqueChat',
    HIDE_CHAT_BADGE: 'hideChatBadge',
} as const;

/**
 * HideChatModule, visually hides the chat based on configuration
 */
export class HideChatModule extends BaseModule {
    /**
     * DOM observer allowing the chat to be removed again if the page re-injects it.
     */
    private observer?: MutationObserver;

    /**
     * "Sweep" interval (safety) to periodically remove elements.
     * Useful if some DOM insertions escape the observer or are done via timers.
     */
    private intervalId?: number;

    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'hide_and_desactivate_chat';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return 'Cacher le chat';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return 'Cache le chat sur différentes pages et le badge de notification.';
    }

    /**
     * @inheritdoc
     */
    public override getConfigSchema(): IModuleConfigSchema {
        return {
            options: [
                {
                    key: CONFIG_KEYS.HIDE_DASHBOARD_CHAT,
                    label: 'Cacher le chat du dashboard',
                    description: 'Masque la boîte de chat général sur la page du dashboard.',
                    type: 'boolean',
                    defaultValue: true,
                },
                {
                    key: CONFIG_KEYS.HIDE_POLITIQUE_CHAT,
                    label: 'Cacher le chat de politique',
                    description: 'Masque la section de chat sur la page de politique du parc.',
                    type: 'boolean',
                    defaultValue: false,
                },
                {
                    key: CONFIG_KEYS.HIDE_CHAT_BADGE,
                    label: 'Cacher le badge de notification',
                    description: 'Masque le badge indiquant de nouveaux messages dans le menu.',
                    type: 'boolean',
                    defaultValue: false,
                },
            ],
        };
    }

    /**
     * Removes the dashboard chat container.
     */
    private removeDashboardChat(): void {
        if (!this.getConfigValue(CONFIG_KEYS.HIDE_DASHBOARD_CHAT, true)) return;
        if (!window.location.href.includes(CHAT_SELECTORS.DASHBOARD_PAGE)) return;

        document
            .querySelectorAll<HTMLElement>(CHAT_SELECTORS.CHAT_DIV)
            .forEach((el) => el.remove());
    }

    /**
     * Removes the <script> tag responsible for loading the dashboard chat to keep things clean.
     */
    private removeDashboardChatScriptTag(): void {
        if (!this.getConfigValue(CONFIG_KEYS.HIDE_DASHBOARD_CHAT, true)) return;
        if (!window.location.href.includes(CHAT_SELECTORS.DASHBOARD_PAGE)) return;

        document.querySelectorAll<HTMLScriptElement>('script[src]').forEach((s) => {
            const src = s.getAttribute('src') || '';
            if (src === '/tpiv4/game/assets/js/dashboard-chat.js') {
                s.remove();
            }
        });
    }

    /**
     * Removes the politique page chat container.
     */
    private removePolitiqueChat(): void {
        if (!this.getConfigValue(CONFIG_KEYS.HIDE_POLITIQUE_CHAT, false)) return;
        if (!window.location.href.includes(CHAT_SELECTORS.POLITIQUE_PAGE)) return;

        document
            .querySelectorAll<HTMLElement>(CHAT_SELECTORS.POLITIQUE_CHAT)
            .forEach((el) => (el.style.display = 'none'));
    }

    /**
     * Removes the chat badge from the left menu.
     */
    private removeChatBadge(): void {
        if (!this.getConfigValue(CONFIG_KEYS.HIDE_CHAT_BADGE, false)) return;

        document
            .querySelectorAll<HTMLElement>(CHAT_SELECTORS.CHAT_BADGE)
            .forEach((el) => el.remove());
    }

    /**
     * Performs all configured removals.
     */
    private performRemovals(): void {
        this.removeDashboardChat();
        this.removeDashboardChatScriptTag();
        this.removePolitiqueChat();
        this.removeChatBadge();
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        // Immediate removal on enable
        this.performRemovals();

        // Observer: if the page re-injects elements, remove them again.
        this.observer = new MutationObserver(() => {
            this.performRemovals();
        });
        this.observer.observe(document.documentElement, { childList: true, subtree: true });

        // Safety sweep: some pages re-add elements via timers or microtasks.
        this.intervalId = window.setInterval(() => {
            this.performRemovals();
        }, 1000);
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        // Stop observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = undefined;
        }

        // Stop sweep
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }
}
