import { StorageService } from '../../../../services/StorageService';
import { makeBtn, makeTable, makeToolbar } from '../helpers';

/**
 * Debug tab — lists all key/value pairs stored by the Toolbox via StorageService.
 * Click ✏️ to edit a key or value inline, 🗑️ to delete.
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
        const { table, tbody } = makeTable(['Clé', 'Valeur', '']);

        const colgroup = document.createElement('colgroup');
        [30, 55, 15].forEach((pct) => {
            const col = document.createElement('col');
            col.style.width = `${pct}%`;
            colgroup.appendChild(col);
        });
        table.prepend(colgroup);

        if (entries.length === 0) {
            const tr = tbody.insertRow();
            const td = tr.insertCell();
            td.colSpan = 3;
            td.textContent = 'Aucune donnée trouvée.';
            td.className = 'tdbg-empty';
        } else {
            entries.forEach(({ key, value }) => {
                const displayValue =
                    typeof value === 'string' ? value : JSON.stringify(value, null, 2);

                const tr = tbody.insertRow();

                // ── Key cell ──────────────────────────────────────────────
                const keyCell = tr.insertCell();
                const keyText = document.createElement('span');
                keyText.className = 'tdbg-storage-key';
                keyText.textContent = key;
                const keyInput = document.createElement('input');
                keyInput.className = 'tdbg-storage-input';
                keyInput.value = key;
                keyInput.style.display = 'none';
                keyCell.appendChild(keyText);
                keyCell.appendChild(keyInput);

                // ── Value cell ────────────────────────────────────────────
                const valCell = tr.insertCell();
                const valPre = document.createElement('pre');
                valPre.className = 'tdbg-storage-val';
                valPre.textContent = displayValue;
                const valInput = document.createElement('textarea');
                valInput.className = 'tdbg-storage-input tdbg-storage-textarea';
                valInput.value = displayValue;
                valInput.style.display = 'none';
                valCell.appendChild(valPre);
                valCell.appendChild(valInput);

                // ── Action cell ───────────────────────────────────────────
                const actionCell = tr.insertCell();
                actionCell.className = 'tdbg-storage-actions';

                let editing = false;

                const editBtn = makeBtn('✏️', () => {
                    editing = !editing;

                    keyText.style.display = editing ? 'none' : '';
                    keyInput.style.display = editing ? '' : 'none';
                    valPre.style.display = editing ? 'none' : '';
                    valInput.style.display = editing ? '' : 'none';
                    saveBtn.style.display = editing ? '' : 'none';
                    editBtn.title = editing ? 'Annuler' : 'Modifier';
                    editBtn.textContent = editing ? '✕' : '✏️';
                });
                editBtn.title = 'Modifier';

                const saveBtn = makeBtn('💾', () => {
                    const newKey = keyInput.value.trim();
                    const rawVal = valInput.value.trim();
                    if (!newKey) return;

                    let parsed: unknown = rawVal;
                    try {
                        parsed = JSON.parse(rawVal);
                    } catch {
                        /* keep as string */
                    }

                    if (newKey !== key) this._storage.remove(key);
                    this._storage.save(newKey, parsed);
                    refresh();
                });
                saveBtn.title = 'Sauvegarder';
                saveBtn.style.display = 'none';

                const delBtn = makeBtn('🗑️', () => {
                    this._storage.remove(key);
                    refresh();
                });
                delBtn.title = 'Supprimer';
                delBtn.classList.add('tdbg-btn--danger');

                actionCell.appendChild(editBtn);
                actionCell.appendChild(saveBtn);
                actionCell.appendChild(delBtn);
            });
        }

        container.appendChild(toolbar);
        container.appendChild(table);
    }
}
