import '../../../core/bootstrap/styles/_toolbox.scss';
import { APP_INFORMATIONS } from '../../../core/constants/AppConstants';
import IModule from '../../../core/interfaces/IModule';
import { ModuleManager } from '../../../core/managers/ModuleManager';
import { StorageService } from '../../../services/StorageService';
import { createElement } from '../../../utils/DomUtils';
import { SETTINGS_KEYS } from '../constants';

/**
 * Class for the settings app.
 */
export class SettingsApp {
    private moduleManager: ModuleManager;
    private storageService: StorageService;

    /**
     * Creates a new SettingsApp instance.
     * @param moduleManager - The module manager.
     */
    public constructor(moduleManager: ModuleManager) {
        this.moduleManager = moduleManager;
        this.storageService = new StorageService();
    }

    /**
     * Renders the settings app.
     * @returns The settings app.
     */
    public render(): HTMLElement {
        const container = createElement('div', {
            class: 'tpi-modal-card os-settings-override',
            style: { display: 'flex', flexDirection: 'column', height: '100%' },
        });

        container.appendChild(this.createSearchBar());
        container.appendChild(this.createBody());
        container.appendChild(this.createFooter());

        return container;
    }

    /**
     * Creates the search bar of the settings app.
     * @returns The search bar.
     */
    private createSearchBar(): HTMLElement {
        const searchInput = createElement('input', {
            type: 'text',
            placeholder: 'Chercher un module...',
            class: 'tpi-search-input',
            oninput: (e: Event) => {
                const query = (e.target as HTMLInputElement).value.toLowerCase();
                this.filterModules(query);
            },
        });

        return createElement('div', { class: 'tpi-search-bar' }, [
            createElement('span', { class: 'tpi-search-icon' }, ['🔍']),
            searchInput,
        ]);
    }

    /**
     * Creates the body of the settings app.
     * @returns The body.
     */
    private createBody(): HTMLElement {
        const modules = this.moduleManager
            .getModules()
            .sort((a, b) => a.name.localeCompare(b.name));
        const list = createElement('div', {
            id: 'os-settings-list',
            class: 'tpi-modal-card__body',
        });

        list.appendChild(this.createGeneralSettingsSection());
        list.appendChild(
            createElement('div', { class: 'tpi-settings-section-header' }, ['Modules'])
        );

        if (modules.length === 0) {
            list.appendChild(
                createElement('div', { class: 'tpi-modal-empty' }, ['Aucun module disponible 😢']),
            );
            return list;
        }

        modules.forEach((mod) => {
            list.appendChild(this.createModuleRow(mod));
        });

        return list;
    }

    /**
     * Creates the general settings section.
     * @returns The general settings section.
     */
    private createGeneralSettingsSection(): HTMLElement {
        const section = createElement('div', { class: 'tpi-settings-section' });

        section.appendChild(
            createElement('div', { class: 'tpi-settings-section-header' }, ['Performances'])
        );

        // Reduce visual effects toggle
        const reduceEffectsEnabled = this.storageService.load<boolean>(SETTINGS_KEYS.REDUCE_EFFECTS, false);

        const reduceCheckbox = createElement('input', {
            type: 'checkbox',
            onchange: (e: Event) => {
                const isChecked = (e.target as HTMLInputElement).checked;
                this.storageService.save(SETTINGS_KEYS.REDUCE_EFFECTS, isChecked);
                this.applyReducedEffects(isChecked);
            },
        }) as HTMLInputElement;

        reduceCheckbox.checked = reduceEffectsEnabled;

        const reduceSwitchLabel = createElement('label', { class: 'tpi-switch' }, [
            reduceCheckbox,
            createElement('span', { class: 'tpi-slider' }),
        ]);

        const reduceTextContainer = createElement('div', { class: 'tpi-setting-info' }, [
            createElement('div', { class: 'tpi-setting-label' }, ['Réduire les effets visuels']),
            createElement('div', { class: 'tpi-setting-desc' }, [
                'Désactive les effets de flou et transparence pour améliorer les performances.',
            ]),
        ]);

        const reduceRow = createElement(
            'div',
            {
                class: 'tpi-setting-row',
                'data-search': 'réduire effets visuels performance flou transparence blur',
            },
            [reduceTextContainer, reduceSwitchLabel],
        );

        section.appendChild(reduceRow);

        // Restore session toggle
        const restoreSessionEnabled = this.storageService.load<boolean>(SETTINGS_KEYS.RESTORE_SESSION, true);

        const restoreCheckbox = createElement('input', {
            type: 'checkbox',
            onchange: (e: Event) => {
                const isChecked = (e.target as HTMLInputElement).checked;
                this.storageService.save(SETTINGS_KEYS.RESTORE_SESSION, isChecked);
            },
        }) as HTMLInputElement;

        restoreCheckbox.checked = restoreSessionEnabled;

        const restoreSwitchLabel = createElement('label', { class: 'tpi-switch' }, [
            restoreCheckbox,
            createElement('span', { class: 'tpi-slider' }),
        ]);

        const restoreTextContainer = createElement('div', { class: 'tpi-setting-info' }, [
            createElement('div', { class: 'tpi-setting-label' }, ['Restaurer les fenêtres']),
            createElement('div', { class: 'tpi-setting-desc' }, [
                'Sauvegarde et restaure automatiquement les fenêtres ouvertes au rechargement.',
            ]),
        ]);

        const restoreRow = createElement(
            'div',
            {
                class: 'tpi-setting-row',
                'data-search': 'restaurer fenêtres session sauvegarde reload',
            },
            [restoreTextContainer, restoreSwitchLabel],
        );

        section.appendChild(restoreRow);

        return section;
    }

    /**
     * Applies or removes reduced visual effects.
     * @param enabled - Whether to enable reduced effects.
     */
    private applyReducedEffects(enabled: boolean): void {
        if (enabled) {
            document.body.classList.add('os-reduce-effects');
        } else {
            document.body.classList.remove('os-reduce-effects');
        }
    }

    /**
     * Creates a row for a module.
     * @param module - The module to create a row for.
     * @returns The module row.
     */
    private createModuleRow(module: IModule): HTMLElement {
        const checkbox = createElement('input', {
            type: 'checkbox',
            onchange: (e: Event) => {
                const isChecked = (e.target as HTMLInputElement).checked;
                this.moduleManager.toggleModule(module.id, isChecked);
            },
        }) as HTMLInputElement;

        if (module.isEnabled()) checkbox.checked = true;

        const switchLabel = createElement('label', { class: 'tpi-switch' }, [
            checkbox,
            createElement('span', { class: 'tpi-slider' }),
        ]);

        const textContainer = createElement('div', { class: 'tpi-setting-info' }, [
            createElement('div', { class: 'tpi-setting-label' }, [module.name]),
            createElement('div', { class: 'tpi-setting-desc' }, [module.description]),
        ]);

        const row = createElement(
            'div',
            {
                class: 'tpi-setting-row',
                'data-search': `${module.name} ${module.description}`.toLowerCase(),
            },
            [textContainer, switchLabel],
        );

        return row;
    }

    /**
     * Creates the footer of the settings app.
     * @returns The footer.
     */
    private createFooter(): HTMLElement {
        return createElement('div', { class: 'tpi-modal-card__footer' }, [
            createElement('span', { class: 'tpi-version' }, [`v${APP_INFORMATIONS.APP_VERSION}`]),
            createElement(
                'button',
                {
                    class: 'tpi-btn-primary',
                    onclick: () => window.location.reload(),
                },
                ['Recharger la page ↻'],
            ),
        ]);
    }

    /**
     * Filters the modules based on the search query.
     * @param query - The search query.
     */
    private filterModules(query: string): void {
        const list = document.getElementById('os-settings-list');
        if (!list) return;

        const rows = list.querySelectorAll('.tpi-setting-row');
        rows.forEach((row) => {
            const el = row as HTMLElement;
            const text = el.getAttribute('data-search') || '';
            el.style.display = text.includes(query) ? 'flex' : 'none';
        });
    }
}
