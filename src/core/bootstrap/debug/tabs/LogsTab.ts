import { DebugLogEntry } from '../../../../utils/Logger';
import { makeBtn, makeCheckbox, makeToolbar } from '../helpers';

const MAX_LOGS = 200;

/**
 * Debug tab — live log stream captured from Logger._debugHook.
 * Logs are buffered even when the tab is not visible.
 */
export class LogsTab {
    private _logs: DebugLogEntry[] = [];
    private _logsEl: HTMLElement | null = null;
    private _autoScroll = true;

    /**
     * Called by DebugOverlay on every log entry, regardless of active tab.
     */
    public receiveEntry(entry: DebugLogEntry): void {
        this._logs.push(entry);
        if (this._logs.length > MAX_LOGS) this._logs.shift();

        if (this._logsEl) {
            this._appendRow(entry);
            if (this._autoScroll) this._logsEl.scrollTop = this._logsEl.scrollHeight;
        }
    }

    public render(container: HTMLElement): void {
        const toolbar = makeToolbar([
            makeBtn('🗑️ Vider', () => {
                this._logs = [];
                this._logsEl?.replaceChildren();
            }),
            makeCheckbox('Auto-scroll', this._autoScroll, (v) => {
                this._autoScroll = v;
            }),
        ]);

        const list = document.createElement('div');
        list.className = 'tdbg-logs';
        this._logsEl = list;

        this._logs.forEach((e) => this._appendRow(e));
        if (this._autoScroll) list.scrollTop = list.scrollHeight;

        container.appendChild(toolbar);
        container.appendChild(list);
    }

    public destroy(): void {
        this._logsEl = null;
    }

    private _appendRow(entry: DebugLogEntry): void {
        if (!this._logsEl) return;

        const row = document.createElement('div');
        row.className = `tdbg-log tdbg-log--${entry.level.toLowerCase()}`;

        const ts = document.createElement('span');
        ts.className = 'tdbg-log-ts';
        ts.textContent = `[${entry.timestamp}]`;

        const ctx = document.createElement('span');
        ctx.className = 'tdbg-log-ctx';
        ctx.textContent = `[${entry.context}]`;

        row.appendChild(ts);
        row.appendChild(document.createTextNode(' '));
        row.appendChild(ctx);
        row.appendChild(document.createTextNode(` ${entry.message}`));

        this._logsEl.appendChild(row);

        if (this._logsEl.children.length > MAX_LOGS) {
            this._logsEl.removeChild(this._logsEl.firstChild!);
        }
    }
}
