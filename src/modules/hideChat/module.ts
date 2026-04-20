import { BaseModule } from '../../core/abstract/BaseModule';
import { IModuleConfigSchema } from '../../core/interfaces/IModuleConfig';
import { CONFIG_KEYS, HIDE_CHAT_SELECTORS, MODES } from './constants';
import './styles.scss';

export class HideChatModule extends BaseModule {
    /** @inheritdoc */
    public get id(): string {
        return 'hide_chat';
    }

    /** @inheritdoc */
    public get name(): string {
        return 'Chat';
    }

    /** @inheritdoc */
    public get description(): string {
        return 'Gère l\'affichage des différents tchats : masquage complet, réduction en bouton compact, et plus encore.';
    }

    /** @inheritdoc */
    public override canRunOnPage(_url: string): boolean {
        return true;
    }

    /** @inheritdoc */
    public getConfigSchema(): IModuleConfigSchema {
        return {
            options: [
                {
                    key: CONFIG_KEYS.MODE,
                    label: 'Affichage du chat global',
                    description: 'Choisissez comment le chat global apparaît sur toutes les pages.',
                    type: 'select',
                    defaultValue: MODES.MINI,
                    options: [
                        { value: MODES.DISABLED, label: 'Affiché normalement' },
                        { value: MODES.MINI, label: 'Réduit en bouton compact' },
                        { value: MODES.HIDDEN, label: 'Masqué complètement' },
                    ],
                },
                {
                    key: CONFIG_KEYS.HIDE_POLITIQUE_BADGE,
                    label: 'Masquer le badge du chat politique',
                    description: 'Cache l\'indicateur de nouveau message sur le lien vers le chat politique dans la barre latérale.',
                    type: 'boolean',
                    defaultValue: false,
                },
                {
                    key: CONFIG_KEYS.HIDE_POLITIQUE_CHAT,
                    label: 'Masquer le chat politique',
                    description: 'Cache le bloc de chat sur la page politique.',
                    type: 'boolean',
                    defaultValue: false,
                },
            ],
        };
    }

    /** @inheritdoc */
    protected onEnable(): void {
        document.body.classList.add(HIDE_CHAT_SELECTORS.ENABLED_CLASS);
        this._applyMode();
        this._applyPolitiqueBadge();
        this._applyPolitiqueChat();
    }

    /** @inheritdoc */
    protected onDisable(): void {
        document.body.classList.remove(
            HIDE_CHAT_SELECTORS.ENABLED_CLASS,
            HIDE_CHAT_SELECTORS.HIDDEN_CLASS,
            HIDE_CHAT_SELECTORS.MINI_CLASS,
            HIDE_CHAT_SELECTORS.HIDE_POLITIQUE_BADGE_CLASS,
            HIDE_CHAT_SELECTORS.HIDE_POLITIQUE_CHAT_CLASS,
        );
    }

    /** @inheritdoc */
    protected override onConfigChanged(key: string, value: string | number | boolean): void {
        super.onConfigChanged(key, value);
        if (key === CONFIG_KEYS.MODE) {
            this._applyMode();
        } else if (key === CONFIG_KEYS.HIDE_POLITIQUE_BADGE) {
            document.body.classList.toggle(HIDE_CHAT_SELECTORS.HIDE_POLITIQUE_BADGE_CLASS, value as boolean);
        } else if (key === CONFIG_KEYS.HIDE_POLITIQUE_CHAT) {
            document.body.classList.toggle(HIDE_CHAT_SELECTORS.HIDE_POLITIQUE_CHAT_CLASS, value as boolean);
        }
    }

    /** Toggles the politique chat badge visibility based on the current config. */
    private _applyPolitiqueBadge(): void {
        const hide = this.getConfigValue<boolean>(CONFIG_KEYS.HIDE_POLITIQUE_BADGE, false);
        document.body.classList.toggle(HIDE_CHAT_SELECTORS.HIDE_POLITIQUE_BADGE_CLASS, hide);
    }

    /** Toggles the politique chat block visibility based on the current config. */
    private _applyPolitiqueChat(): void {
        const hide = this.getConfigValue<boolean>(CONFIG_KEYS.HIDE_POLITIQUE_CHAT, false);
        document.body.classList.toggle(HIDE_CHAT_SELECTORS.HIDE_POLITIQUE_CHAT_CLASS, hide);
    }

    /** Applies the global chat display mode (hidden, mini, or default) based on the current config. */
    private _applyMode(): void {
        const mode = this.getConfigValue<string>(CONFIG_KEYS.MODE, MODES.MINI);

        document.body.classList.remove(HIDE_CHAT_SELECTORS.HIDDEN_CLASS, HIDE_CHAT_SELECTORS.MINI_CLASS);

        if (mode === MODES.HIDDEN) {
            document.body.classList.add(HIDE_CHAT_SELECTORS.HIDDEN_CLASS);
        } else if (mode === MODES.MINI) {
            document.body.classList.add(HIDE_CHAT_SELECTORS.MINI_CLASS);
        }
    }
}
