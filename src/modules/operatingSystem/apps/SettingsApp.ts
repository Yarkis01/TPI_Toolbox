import '../../../core/bootstrap/styles/_toolbox.scss';
import { APP_INFORMATIONS } from '../../../core/constants/AppConstants';
import IModule from '../../../core/interfaces/IModule';
import { ModuleManager } from '../../../core/managers/ModuleManager';
import { ModuleConfigRenderer } from '../../../core/utils/ModuleConfigRenderer';
import { createElement } from '../../../utils/DomUtils';

/**
 * Class for the settings app.
 */
export class SettingsApp {
    private moduleManager: ModuleManager;
    private configRenderer: ModuleConfigRenderer;

    /**
     * Creates a new SettingsApp instance.
     * @param moduleManager - The module manager.
     */
    public constructor(moduleManager: ModuleManager) {
        this.moduleManager = moduleManager;
        this.configRenderer = new ModuleConfigRenderer();
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

        list.appendChild(
            createElement('div', { class: 'tpi-settings-section-header' }, ['Modules']),
        );

        if (modules.length === 0) {
            list.appendChild(
                createElement('div', { class: 'tpi-modal-empty' }, ['Aucun module disponible 😢']),
            );
            return list;
        }

        modules.forEach((mod) => {
            list.appendChild(this.configRenderer.createModuleRow(
                mod,
                (isChecked) => this.moduleManager.toggleModule(mod.id, isChecked)
            ));
        });

        return list;
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
