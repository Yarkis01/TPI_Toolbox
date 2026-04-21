import { ModuleStatusService } from '../../../../services/ModuleStatusService';
import { ModuleManager } from '../../../managers/ModuleManager';
import { makeBtn, makeTable, makeToolbar } from '../helpers';

/**
 * Debug tab — lists all modules with their state and a toggle button.
 */
export class ModulesTab {
    private readonly _moduleManager: ModuleManager;

    public constructor(moduleManager: ModuleManager) {
        this._moduleManager = moduleManager;
    }

    public render(container: HTMLElement): void {
        const refresh = () => {
            container.replaceChildren();
            this.render(container);
        };

        const isOsMode = this._moduleManager.isModuleEnabled('operating_system');

        const toolbar = makeToolbar([makeBtn('🔄 Rafraîchir', refresh)]);

        if (isOsMode) {
            const notice = document.createElement('div');
            notice.style.cssText =
                'padding:6px 10px;margin-bottom:8px;background:#3a2e1e;color:#f9c74f;border-radius:6px;font-size:11px;';
            notice.textContent =
                "⚠️ Mode OS actif : les modules s'exécutent dans des iframes. L'état runtime n'est pas disponible ici, seul l'état des paramètres est affiché.";
            container.appendChild(notice);
        }

        const { table, tbody } = makeTable(['Nom', 'ID', 'État', '']);

        this._moduleManager.getModules().forEach((m) => {
            const isEnabledInSettings = this._moduleManager.isModuleEnabled(m.id);
            const isActive = m.isEnabled();

            const tr = tbody.insertRow();
            tr.insertCell().textContent = m.name;
            tr.insertCell().textContent = m.id;

            const statusCell = tr.insertCell();
            const badge = document.createElement('span');
            if (isOsMode) {
                badge.className = `tdbg-badge tdbg-badge--${isEnabledInSettings ? 'ok' : 'off'}`;
                badge.textContent = isEnabledInSettings ? 'Activé' : 'Inactif';
            } else if (isActive) {
                badge.className = 'tdbg-badge tdbg-badge--ok';
                badge.textContent = 'Actif';
            } else if (isEnabledInSettings) {
                badge.className = 'tdbg-badge tdbg-badge--warn';
                badge.textContent = 'Activé (hors page)';
            } else {
                badge.className = 'tdbg-badge tdbg-badge--off';
                badge.textContent = 'Inactif';
            }
            statusCell.appendChild(badge);

            const status = ModuleStatusService.getInstance().getStatus(m.id);
            const isBlocked =
                !isEnabledInSettings &&
                (status.effectiveStatus === 'broken' ||
                    status.effectiveStatus === 'update_required');

            const actionCell = tr.insertCell();
            const toggleBtn = makeBtn(
                isEnabledInSettings ? 'Désactiver' : isBlocked ? '⚠️ Forcer' : 'Activer',
                () => {
                    if (isBlocked) {
                        this._moduleManager.forceToggleModule(m.id, !isEnabledInSettings);
                    } else {
                        this._moduleManager.toggleModule(m.id, !isEnabledInSettings);
                    }
                    refresh();
                },
                isEnabledInSettings ? 'tdbg-toggle--off' : 'tdbg-toggle--on',
            );
            actionCell.appendChild(toggleBtn);
        });

        container.appendChild(toolbar);
        container.appendChild(table);
    }
}
