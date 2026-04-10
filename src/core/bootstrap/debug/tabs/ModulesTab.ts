import { ModuleManager } from '../../../managers/ModuleManager';
import { ModuleStatusService } from '../../../../services/ModuleStatusService';
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

        const toolbar = makeToolbar([makeBtn('🔄 Rafraîchir', refresh)]);

        const { table, tbody } = makeTable(['Nom', 'ID', 'État', '']);

        this._moduleManager.getModules().forEach((m) => {
            const tr = tbody.insertRow();
            tr.insertCell().textContent = m.name;
            tr.insertCell().textContent = m.id;

            const statusCell = tr.insertCell();
            const badge = document.createElement('span');
            badge.className = `tdbg-badge tdbg-badge--${m.isEnabled() ? 'ok' : 'off'}`;
            badge.textContent = m.isEnabled() ? 'Actif' : 'Inactif';
            statusCell.appendChild(badge);

            const status = ModuleStatusService.getInstance().getStatus(m.id);
            const isBlocked =
                !m.isEnabled() &&
                (status.effectiveStatus === 'broken' ||
                    status.effectiveStatus === 'update_required');

            const actionCell = tr.insertCell();
            const toggleBtn = makeBtn(
                m.isEnabled() ? 'Désactiver' : isBlocked ? '⚠️ Forcer' : 'Activer',
                () => {
                    if (isBlocked) {
                        this._moduleManager.forceToggleModule(m.id, !m.isEnabled());
                    } else {
                        this._moduleManager.toggleModule(m.id, !m.isEnabled());
                    }
                    refresh();
                },
                m.isEnabled() ? 'tdbg-toggle--off' : 'tdbg-toggle--on',
            );
            actionCell.appendChild(toggleBtn);
        });

        container.appendChild(toolbar);
        container.appendChild(table);
    }
}
