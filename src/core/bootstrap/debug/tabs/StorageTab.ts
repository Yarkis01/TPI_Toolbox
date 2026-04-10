import { StorageService } from '../../../../services/StorageService';
import { makeBtn, makeTable, makeToolbar } from '../helpers';

/**
 * Debug tab — lists all key/value pairs stored by the Toolbox via StorageService.
 */
export class StorageTab {
    private readonly _storage: StorageService;

    public constructor(storage: StorageService) {
        this._storage = storage;
    }

    public render(container: HTMLElement): void {
        const refresh = () => {
            container.replaceChildren();
            this.render(container);
        };

        const toolbar = makeToolbar([makeBtn('🔄 Rafraîchir', refresh)]);

        const entries = this._storage.listAll();
        const { table, tbody } = makeTable(['Clé', 'Valeur']);

        if (entries.length === 0) {
            const tr = tbody.insertRow();
            const td = tr.insertCell();
            td.colSpan = 2;
            td.textContent = 'Aucune donnée trouvée.';
            td.className = 'tdbg-empty';
        } else {
            entries.forEach(({ key, value }) => {
                const tr = tbody.insertRow();
                tr.insertCell().textContent = key;

                const valCell = tr.insertCell();
                const pre = document.createElement('pre');
                pre.className = 'tdbg-storage-val';
                pre.textContent =
                    typeof value === 'string' ? value : JSON.stringify(value, null, 2);
                valCell.appendChild(pre);
            });
        }

        container.appendChild(toolbar);
        container.appendChild(table);
    }
}
