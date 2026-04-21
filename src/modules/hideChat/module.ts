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
        return 'Tchat';
    }

    /** @inheritdoc */
    public get description(): string {
        return "Gère l'affichage des différents tchats : masquage complet, réduction en bouton compact, et plus encore.";
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
                    label: 'Affichage du tchat global',
                    description:
                        'Choisissez comment le tchat global apparaît sur toutes les pages.',
                    type: 'select',
                    defaultValue: MODES.MINI,
                    options: [
                        { value: MODES.DISABLED, label: 'Affiché normalement' },
                        { value: MODES.MINI, label: 'Réduit en bouton compact' },
                        { value: MODES.HIDDEN, label: 'Masqué complètement' },
                    ],
                },
                {
                    key: CONFIG_KEYS.HIDE_GLOBAL_BADGE,
                    label: 'Masquer le badge de notification du tchat global',
                    description: 'Cache le compteur de nouveaux messages sur le bouton du tchat global.',
                    type: 'boolean',
                    defaultValue: false,
                },
                {
                    key: CONFIG_KEYS.HIDE_HOLDING_BADGE,
                    label: 'Masquer le badge de notification du tchat holding',
                    description: 'Cache le compteur de nouveaux messages dans la barre latérale pour le tchat de la holding.',
                    type: 'boolean',
                    defaultValue: false,
                    dependsOn: CONFIG_KEYS.HIDE_HOLDING_CHAT,
                },
                {
                    key: CONFIG_KEYS.HIDE_HOLDING_CHAT,
                    label: 'Masquer le tchat de la holding',
                    description: 'Cache le bloc de tchat de la holding sur les pages où il apparaît.',
                    type: 'boolean',
                    defaultValue: false,
                },
                {
                    key: CONFIG_KEYS.HIDE_POLITIQUE_BADGE,
                    label: 'Masquer le badge du tchat politique',
                    description:
                        "Cache l'indicateur de nouveau message sur le lien vers le tchat politique dans la barre latérale.",
                    type: 'boolean',
                    defaultValue: false,
                    dependsOn: CONFIG_KEYS.HIDE_POLITIQUE_CHAT,
                },
                {
                    key: CONFIG_KEYS.HIDE_POLITIQUE_CHAT,
                    label: 'Masquer le tchat politique',
                    description: 'Cache le bloc de tchat sur la page politique.',
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
        this._applyGlobalBadge();
        this._applyHoldingBadge();
        this._applyHoldingChat();
        this._applyPolitiqueBadge();
        this._applyPolitiqueChat();
    }

    /** @inheritdoc */
    protected onDisable(): void {
        document.body.classList.remove(
            HIDE_CHAT_SELECTORS.ENABLED_CLASS,
            HIDE_CHAT_SELECTORS.HIDDEN_CLASS,
            HIDE_CHAT_SELECTORS.MINI_CLASS,
            HIDE_CHAT_SELECTORS.HIDE_GLOBAL_BADGE_CLASS,
            HIDE_CHAT_SELECTORS.HIDE_HOLDING_BADGE_CLASS,
            HIDE_CHAT_SELECTORS.HIDE_HOLDING_CHAT_CLASS,
            HIDE_CHAT_SELECTORS.HIDE_POLITIQUE_BADGE_CLASS,
            HIDE_CHAT_SELECTORS.HIDE_POLITIQUE_CHAT_CLASS,
        );
    }

    /** @inheritdoc */
    protected override onConfigChanged(key: string, value: string | number | boolean): void {
        super.onConfigChanged(key, value);
        if (key === CONFIG_KEYS.MODE) {
            this._applyMode();
        } else if (key === CONFIG_KEYS.HIDE_GLOBAL_BADGE) {
            document.body.classList.toggle(
                HIDE_CHAT_SELECTORS.HIDE_GLOBAL_BADGE_CLASS,
                value as boolean,
            );
        } else if (key === CONFIG_KEYS.HIDE_HOLDING_BADGE) {
            document.body.classList.toggle(
                HIDE_CHAT_SELECTORS.HIDE_HOLDING_BADGE_CLASS,
                value as boolean,
            );
        } else if (key === CONFIG_KEYS.HIDE_HOLDING_CHAT) {
            document.body.classList.toggle(
                HIDE_CHAT_SELECTORS.HIDE_HOLDING_CHAT_CLASS,
                value as boolean,
            );
        } else if (key === CONFIG_KEYS.HIDE_POLITIQUE_BADGE) {
            document.body.classList.toggle(
                HIDE_CHAT_SELECTORS.HIDE_POLITIQUE_BADGE_CLASS,
                value as boolean,
            );
        } else if (key === CONFIG_KEYS.HIDE_POLITIQUE_CHAT) {
            document.body.classList.toggle(
                HIDE_CHAT_SELECTORS.HIDE_POLITIQUE_CHAT_CLASS,
                value as boolean,
            );
        }
    }

    /** Toggles the global chat notification badge visibility based on the current config. */
    private _applyGlobalBadge(): void {
        const hide = this.getConfigValue<boolean>(CONFIG_KEYS.HIDE_GLOBAL_BADGE, false);
        document.body.classList.toggle(HIDE_CHAT_SELECTORS.HIDE_GLOBAL_BADGE_CLASS, hide);
    }

    /** Toggles the holding chat badge visibility based on the current config. */
    private _applyHoldingBadge(): void {
        const hide = this.getConfigValue<boolean>(CONFIG_KEYS.HIDE_HOLDING_BADGE, false);
        document.body.classList.toggle(HIDE_CHAT_SELECTORS.HIDE_HOLDING_BADGE_CLASS, hide);
    }

    /** Toggles the holding chat block visibility based on the current config. */
    private _applyHoldingChat(): void {
        const hide = this.getConfigValue<boolean>(CONFIG_KEYS.HIDE_HOLDING_CHAT, false);
        document.body.classList.toggle(HIDE_CHAT_SELECTORS.HIDE_HOLDING_CHAT_CLASS, hide);
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

        document.body.classList.remove(
            HIDE_CHAT_SELECTORS.HIDDEN_CLASS,
            HIDE_CHAT_SELECTORS.MINI_CLASS,
        );

        if (mode === MODES.HIDDEN) {
            document.body.classList.add(HIDE_CHAT_SELECTORS.HIDDEN_CLASS);
        } else if (mode === MODES.MINI) {
            document.body.classList.add(HIDE_CHAT_SELECTORS.MINI_CLASS);
        }
    }
}
