import { StorageService } from '../../services/StorageService';
import { DebugLogEntry, LogLevel, Logger } from '../../utils/Logger';
import IBootstrap from '../interfaces/IBootstrap';
import { ModuleManager } from '../managers/ModuleManager';

const MAX_LOGS = 200;

/**
 * Dev-only debug overlay (loaded only when import.meta.env.DEV is true).
 * Toggle with Ctrl+Shift+D or the 🐛 button.
 */
export class DebugOverlay implements IBootstrap {
    private readonly _moduleManager: ModuleManager;
    private readonly _appStart = performance.now();

    private _panel: HTMLElement | null = null;
    private _body: HTMLElement | null = null;
    private _logsEl: HTMLElement | null = null;
    private _toggleBtn: HTMLElement | null = null;

    private _activeTab = 'modules';
    private _logs: DebugLogEntry[] = [];
    private _autoScroll = true;
    private _fpsRaf: number | null = null;

    private _isDragging = false;
    private _dragDx = 0;
    private _dragDy = 0;

    public constructor(moduleManager: ModuleManager) {
        this._moduleManager = moduleManager;
    }

    /**
     * @inheritdoc
     */
    public run(): void {
        this._hookLogger();
        this._injectStyles();
        this._buildToggleBtn();
        this._buildPanel();

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this._togglePanel();
            }
        });
    }

    // ─── Logger hook ────────────────────────────────────────────────────────

    private _hookLogger(): void {
        Logger._debugHook = (entry) => {
            this._logs.push(entry);
            if (this._logs.length > MAX_LOGS) this._logs.shift();

            if (this._activeTab === 'logs' && this._logsEl) {
                this._appendLogRow(entry);
                if (this._autoScroll) this._logsEl.scrollTop = this._logsEl.scrollHeight;
            }
        };
    }

    // ─── Panel visibility ────────────────────────────────────────────────────

    private _togglePanel(): void {
        const hidden = this._panel!.hidden;
        this._panel!.hidden = !hidden;
        this._toggleBtn!.style.display = hidden ? 'none' : 'flex';

        if (hidden) {
            this._renderTab(this._activeTab);
        } else if (this._fpsRaf !== null) {
            cancelAnimationFrame(this._fpsRaf);
            this._fpsRaf = null;
        }
    }

    // ─── Toggle button ───────────────────────────────────────────────────────

    private _buildToggleBtn(): void {
        this._toggleBtn = document.createElement('button');
        this._toggleBtn.id = 'tpi-debug-toggle';
        this._toggleBtn.textContent = '🐛';
        this._toggleBtn.title = 'Ouvrir le débogueur (Ctrl+Shift+D)';
        this._toggleBtn.style.display = 'none'; // caché tant que le panel est ouvert
        this._toggleBtn.addEventListener('click', () => this._togglePanel());
        document.body.appendChild(this._toggleBtn);
    }

    // ─── Panel ───────────────────────────────────────────────────────────────

    private _buildPanel(): void {
        this._panel = document.createElement('div');
        this._panel.id = 'tpi-debug-overlay';
        this._panel.hidden = false;

        this._panel.appendChild(this._buildHeader());
        this._panel.appendChild(this._buildTabs());

        this._body = document.createElement('div');
        this._body.className = 'tdbg-body';
        this._panel.appendChild(this._body);

        document.body.appendChild(this._panel);
        this._renderTab(this._activeTab);
    }

    private _buildHeader(): HTMLElement {
        const header = document.createElement('div');
        header.className = 'tdbg-header';

        const title = document.createElement('span');
        title.className = 'tdbg-title';
        title.textContent = '🐛 TPI Debug';

        const close = document.createElement('button');
        close.className = 'tdbg-close';
        close.textContent = '✕';
        close.addEventListener('click', () => this._togglePanel());

        header.appendChild(title);
        header.appendChild(close);
        this._makeDraggable(header);
        return header;
    }

    private _buildTabs(): HTMLElement {
        const tabs = document.createElement('div');
        tabs.className = 'tdbg-tabs';

        const defs = [
            { id: 'modules', label: '📦 Modules' },
            { id: 'logs',    label: '📋 Logs' },
            { id: 'perf',    label: '⚡ Perf' },
            { id: 'storage', label: '💾 Storage' },
        ];

        defs.forEach(({ id, label }) => {
            const btn = document.createElement('button');
            btn.className = `tdbg-tab${id === this._activeTab ? ' tdbg-tab--active' : ''}`;
            btn.dataset.tab = id;
            btn.textContent = label;
            btn.addEventListener('click', () => {
                if (this._fpsRaf !== null) {
                    cancelAnimationFrame(this._fpsRaf);
                    this._fpsRaf = null;
                }
                this._activeTab = id;
                tabs.querySelectorAll<HTMLElement>('.tdbg-tab').forEach((t) => {
                    t.classList.toggle('tdbg-tab--active', t.dataset.tab === id);
                });
                this._renderTab(id);
            });
            tabs.appendChild(btn);
        });

        return tabs;
    }

    // ─── Drag ────────────────────────────────────────────────────────────────

    private _makeDraggable(handle: HTMLElement): void {
        handle.addEventListener('mousedown', (e) => {
            this._isDragging = true;
            const rect = this._panel!.getBoundingClientRect();
            this._dragDx = e.clientX - rect.left;
            this._dragDy = e.clientY - rect.top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!this._isDragging || !this._panel) return;
            this._panel.style.right = 'auto';
            this._panel.style.bottom = 'auto';
            this._panel.style.left = `${e.clientX - this._dragDx}px`;
            this._panel.style.top = `${e.clientY - this._dragDy}px`;
        });

        document.addEventListener('mouseup', () => {
            this._isDragging = false;
        });
    }

    // ─── Tab routing ─────────────────────────────────────────────────────────

    private _renderTab(tab: string): void {
        if (!this._body) return;
        this._logsEl = null;
        this._body.replaceChildren();

        switch (tab) {
            case 'modules': this._renderModules(); break;
            case 'logs':    this._renderLogs();    break;
            case 'perf':    this._renderPerf();    break;
            case 'storage': this._renderStorage(); break;
        }
    }

    // ─── Modules tab ─────────────────────────────────────────────────────────

    private _renderModules(): void {
        const modules = this._moduleManager.getModules();

        const toolbar = this._makeToolbar([
            this._makeBtn('🔄 Rafraîchir', () => this._renderTab('modules')),
        ]);

        const table = document.createElement('table');
        table.className = 'tdbg-table';

        const thead = table.createTHead();
        const hr = thead.insertRow();
        ['Nom', 'ID', 'État'].forEach((h) => {
            const th = document.createElement('th');
            th.textContent = h;
            hr.appendChild(th);
        });

        const tbody = table.createTBody();
        modules.forEach((m) => {
            const tr = tbody.insertRow();
            tr.insertCell().textContent = m.name;
            tr.insertCell().textContent = m.id;

            const statusCell = tr.insertCell();
            const badge = document.createElement('span');
            badge.className = `tdbg-badge tdbg-badge--${m.isEnabled() ? 'ok' : 'off'}`;
            badge.textContent = m.isEnabled() ? 'Actif' : 'Inactif';
            statusCell.appendChild(badge);
        });

        this._body!.appendChild(toolbar);
        this._body!.appendChild(table);
    }

    // ─── Logs tab ─────────────────────────────────────────────────────────────

    private _renderLogs(): void {
        const toolbar = this._makeToolbar([
            this._makeBtn('🗑️ Vider', () => {
                this._logs = [];
                this._logsEl?.replaceChildren();
            }),
            this._makeCheckbox('Auto-scroll', this._autoScroll, (v) => {
                this._autoScroll = v;
            }),
        ]);

        const list = document.createElement('div');
        list.className = 'tdbg-logs';
        this._logsEl = list;

        this._logs.forEach((e) => this._appendLogRow(e));
        if (this._autoScroll) list.scrollTop = list.scrollHeight;

        this._body!.appendChild(toolbar);
        this._body!.appendChild(list);
    }

    private _appendLogRow(entry: DebugLogEntry): void {
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

    // ─── Perf tab ─────────────────────────────────────────────────────────────

    private _renderPerf(): void {
        const nav = performance.getEntriesByType(
            'navigation',
        )[0] as PerformanceNavigationTiming | undefined;

        const rows: [string, string][] = [];

        if (nav) {
            rows.push(['DNS', `${(nav.domainLookupEnd - nav.domainLookupStart).toFixed(1)} ms`]);
            rows.push(['TCP', `${(nav.connectEnd - nav.connectStart).toFixed(1)} ms`]);
            rows.push(['TTFB', `${(nav.responseStart - nav.requestStart).toFixed(1)} ms`]);
            rows.push(['DOM interactif', `${nav.domInteractive.toFixed(1)} ms`]);
            rows.push(['DOM complet', `${nav.domComplete.toFixed(1)} ms`]);
            rows.push(['Chargement total', `${nav.loadEventEnd.toFixed(1)} ms`]);
        }

        rows.push(['Init Toolbox', `${(performance.now() - this._appStart).toFixed(1)} ms`]);

        const mem = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        if (mem) {
            rows.push(['Heap utilisé', `${(mem.usedJSHeapSize / 1048576).toFixed(1)} Mo`]);
            rows.push(['Heap total', `${(mem.totalJSHeapSize / 1048576).toFixed(1)} Mo`]);
            rows.push(['Heap limite', `${(mem.jsHeapSizeLimit / 1048576).toFixed(1)} Mo`]);
        }

        const table = document.createElement('table');
        table.className = 'tdbg-table';
        const tbody = table.createTBody();
        rows.forEach(([label, value]) => {
            const tr = tbody.insertRow();
            const th = document.createElement('th');
            th.textContent = label;
            tr.appendChild(th);
            tr.insertCell().textContent = value;
        });

        const fpsRow = document.createElement('div');
        fpsRow.className = 'tdbg-perf-fps';
        fpsRow.textContent = 'FPS : ';
        const fpsVal = document.createElement('strong');
        fpsVal.textContent = '—';
        fpsRow.appendChild(fpsVal);

        this._body!.appendChild(table);
        this._body!.appendChild(fpsRow);

        let frames = 0;
        let last = performance.now();
        const loop = (now: number) => {
            frames++;
            if (now - last >= 1000) {
                const fps = frames;
                fpsVal.textContent = String(fps);
                fpsVal.style.color =
                    fps >= 55 ? '#a6e3a1' : fps >= 30 ? '#f9e2af' : '#f38ba8';
                frames = 0;
                last = now;
            }
            this._fpsRaf = requestAnimationFrame(loop);
        };
        this._fpsRaf = requestAnimationFrame(loop);
    }

    // ─── Storage tab ──────────────────────────────────────────────────────────

    private _renderStorage(): void {
        const toolbar = this._makeToolbar([
            this._makeBtn('🔄 Rafraîchir', () => this._renderTab('storage')),
        ]);

        const entries = StorageService.getInstance().listAll();

        const table = document.createElement('table');
        table.className = 'tdbg-table';

        const thead = table.createTHead();
        const hr = thead.insertRow();
        ['Clé', 'Valeur'].forEach((h) => {
            const th = document.createElement('th');
            th.textContent = h;
            hr.appendChild(th);
        });

        const tbody = table.createTBody();

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
                    typeof value === 'string'
                        ? value
                        : JSON.stringify(value, null, 2);
                valCell.appendChild(pre);
            });
        }

        this._body!.appendChild(toolbar);
        this._body!.appendChild(table);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private _makeToolbar(children: HTMLElement[]): HTMLElement {
        const bar = document.createElement('div');
        bar.className = 'tdbg-toolbar';
        children.forEach((c) => bar.appendChild(c));
        return bar;
    }

    private _makeBtn(label: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.className = 'tdbg-btn';
        btn.textContent = label;
        btn.addEventListener('click', onClick);
        return btn;
    }

    private _makeCheckbox(
        label: string,
        checked: boolean,
        onChange: (v: boolean) => void,
    ): HTMLElement {
        const wrap = document.createElement('label');
        wrap.className = 'tdbg-checkbox';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = checked;
        input.addEventListener('change', () => onChange(input.checked));
        wrap.appendChild(input);
        wrap.appendChild(document.createTextNode(` ${label}`));
        return wrap;
    }

    // ─── Styles ───────────────────────────────────────────────────────────────

    private _injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            #tpi-debug-toggle {
                position: fixed; bottom: 16px; right: 16px; z-index: 999998;
                width: 36px; height: 36px; border-radius: 50%;
                background: #1e1e2e; border: 1px solid #45475a;
                cursor: pointer; font-size: 18px;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,.5);
            }
            #tpi-debug-overlay[hidden] { display: none !important; }
            #tpi-debug-overlay {
                position: fixed; bottom: 16px; right: 16px; z-index: 999999;
                width: 500px; max-height: 580px;
                display: flex; flex-direction: column;
                background: #1e1e2e; border: 1px solid #45475a; border-radius: 8px;
                font: 12px/1.4 'Consolas','Fira Code',monospace; color: #cdd6f4;
                box-shadow: 0 8px 32px rgba(0,0,0,.6); overflow: hidden;
            }
            .tdbg-header {
                display: flex; align-items: center; justify-content: space-between;
                padding: 8px 12px; background: #181825;
                border-bottom: 1px solid #45475a;
                cursor: grab; user-select: none;
            }
            .tdbg-title { font-weight: bold; font-size: 13px; color: #cba6f7; }
            .tdbg-close {
                background: none; border: none; color: #6c7086;
                cursor: pointer; font-size: 14px; padding: 0 4px; line-height: 1;
            }
            .tdbg-close:hover { color: #f38ba8; }
            .tdbg-tabs {
                display: flex; background: #181825;
                border-bottom: 1px solid #45475a;
            }
            .tdbg-tab {
                flex: 1; padding: 6px 0;
                background: none; border: none; border-bottom: 2px solid transparent;
                color: #6c7086; cursor: pointer; font: inherit; font-size: 11px;
                transition: color .15s, border-color .15s;
            }
            .tdbg-tab:hover { color: #cdd6f4; }
            .tdbg-tab--active { color: #cba6f7; border-bottom-color: #cba6f7; }
            .tdbg-body {
                flex: 1; overflow-y: auto; overflow-x: hidden;
                padding: 8px; min-height: 0; max-height: 500px;
            }
            .tdbg-toolbar {
                display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
            }
            .tdbg-btn {
                background: #313244; border: 1px solid #45475a; border-radius: 4px;
                color: #cdd6f4; cursor: pointer; font: inherit; font-size: 11px;
                padding: 3px 8px;
            }
            .tdbg-btn:hover { background: #45475a; }
            .tdbg-checkbox { color: #a6adc8; font-size: 11px; cursor: pointer; }
            .tdbg-table {
                width: 100%; border-collapse: collapse; font-size: 11px;
            }
            .tdbg-table th, .tdbg-table td {
                padding: 4px 8px; text-align: left;
                border-bottom: 1px solid #313244; vertical-align: top;
            }
            .tdbg-table thead th {
                background: #181825; color: #7f849c;
                font-weight: normal; text-transform: uppercase;
                font-size: 10px; letter-spacing: .5px;
                position: sticky; top: 0;
            }
            .tdbg-table tbody tr:hover { background: #262637; }
            .tdbg-empty { opacity: .5; text-align: center; padding: 12px !important; }
            .tdbg-badge {
                display: inline-block; padding: 1px 6px;
                border-radius: 10px; font-size: 10px; font-weight: bold;
            }
            .tdbg-badge--ok  { background: #1e3a2e; color: #a6e3a1; }
            .tdbg-badge--off { background: #3a1e1e; color: #f38ba8; }
            .tdbg-logs {
                height: 420px; overflow-y: auto;
                display: flex; flex-direction: column; gap: 1px;
            }
            .tdbg-log {
                padding: 2px 4px; border-radius: 2px;
                white-space: pre-wrap; word-break: break-all;
                font-size: 11px; line-height: 1.5;
            }
            .tdbg-log-ts  { color: #585b70; }
            .tdbg-log-ctx { color: #cba6f7; background: #2a2240; padding: 0 3px; border-radius: 2px; }
            .tdbg-log--info  { color: #89dceb; }
            .tdbg-log--warn  { color: #f9e2af; background: #2a2513; }
            .tdbg-log--error { color: #f38ba8; background: #2a1313; }
            .tdbg-log--debug { color: #585b70; }
            .tdbg-perf-fps {
                margin-top: 12px; padding: 10px 12px;
                background: #181825; border-radius: 6px; font-size: 13px;
            }
            .tdbg-storage-val {
                margin: 0; white-space: pre-wrap; word-break: break-all;
                max-width: 300px; color: #a6e3a1; font: inherit;
            }
        `;
        document.head.appendChild(style);
    }
}
