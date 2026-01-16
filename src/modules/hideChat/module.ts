import { BaseModule } from '../../core/abstract/BaseModule';
import { CHAT_SELECTORS, CHAT_STRINGS } from './constants';

/**
 * HideChatModule, visually hides the chat only
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
     * Removes the dashboard chat container.
     */
    private removeChatBox(): void {
        document
            .querySelectorAll<HTMLElement>(CHAT_SELECTORS.CHAT_DIV)
            .forEach((el) => el.remove());
    }

    /**
     * Removes the <script> tag responsible for loading the dashboard chat to keep things clean,
     * but remains ineffective at stopping network requests since the logic is already running
     * inside a setInterval.
     */
    private removeDashboardChatScriptTag(): void {
        document.querySelectorAll<HTMLScriptElement>('script[src]').forEach((s) => {
            const src = s.getAttribute('src') || '';
            if (src === '/tpiv4/game/assets/js/dashboard-chat.js') {
                s.remove();
            }
        });
    }

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
        return 'Hide chat';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return 'Visually hides the dashboard chat';
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        // Immediate removal on enable
        this.removeChatBox();
        this.removeDashboardChatScriptTag();

        // Observer: if the page re-injects the chat/script, remove them again.
        this.observer = new MutationObserver(() => {
            this.removeChatBox();
            this.removeDashboardChatScriptTag();
        });
        this.observer.observe(document.documentElement, { childList: true, subtree: true });

        // Safety sweep: some pages re-add elements via timers or microtasks.
        this.intervalId = window.setInterval(() => {
            this.removeChatBox();
            this.removeDashboardChatScriptTag();
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
