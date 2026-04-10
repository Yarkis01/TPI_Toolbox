import { StorageService } from '../../../services/StorageService';
import { Logger } from '../../../utils/Logger';
import IBootstrap from '../../interfaces/IBootstrap';
import { ModuleManager } from '../../managers/ModuleManager';
import { LogsTab } from './tabs/LogsTab';
import { ModulesTab } from './tabs/ModulesTab';
import { PerfTab } from './tabs/PerfTab';
import { StorageTab } from './tabs/StorageTab';

type TabId = 'modules' | 'logs' | 'perf' | 'storage';

const TAB_DEFS: { id: TabId; label: string }[] = [
    { id: 'modules', label: '📦 Modules' },
    { id: 'logs',    label: '📋 Logs' },
    { id: 'perf',    label: '⚡ Perf' },
    { id: 'storage', label: '💾 Storage' },
];

/**
 * Dev-only debug overlay (loaded only when import.meta.env.DEV is true).
 * Toggle with Ctrl+Shift+D or the 🐛 button.
 */
export class DebugOverlay implements IBootstrap {
    private readonly _modulesTab: ModulesTab;
    private readonly _logsTab: LogsTab;
    private readonly _perfTab: PerfTab;
    private readonly _storageTab: StorageTab;

    private _panel: HTMLElement | null = null;
    private _body: HTMLElement | null = null;
    private _toggleBtn: HTMLElement | null = null;
    private _activeTab: TabId = 'modules';
    private _currentTabInstance: { destroy?(): void } | null = null;

    private _isDragging = false;
    private _dragDx = 0;
    private _dragDy = 0;

    public constructor(moduleManager: ModuleManager) {
        this._modulesTab = new ModulesTab(moduleManager);
        this._logsTab    = new LogsTab();
        this._perfTab    = new PerfTab(performance.now());
        this._storageTab = new StorageTab(StorageService.getInstance());
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
        Logger._debugHook = (entry) => this._logsTab.receiveEntry(entry);
    }

    // ─── Visibility ──────────────────────────────────────────────────────────

    private _togglePanel(): void {
        const isHidden = this._panel!.hidden;
        this._panel!.hidden = !isHidden;
        this._toggleBtn!.style.display = isHidden ? 'none' : 'flex';

        if (isHidden) {
            this._renderTab(this._activeTab);
        } else {
            this._destroyCurrentTab();
        }
    }

    // ─── Toggle button ───────────────────────────────────────────────────────

    private _buildToggleBtn(): void {
        this._toggleBtn = document.createElement('button');
        this._toggleBtn.id = 'tpi-debug-toggle';
        this._toggleBtn.textContent = '🐛';
        this._toggleBtn.title = 'Ouvrir le débogueur (Ctrl+Shift+D)';
        this._toggleBtn.style.display = 'none';
        this._toggleBtn.addEventListener('click', () => this._togglePanel());
        document.body.appendChild(this._toggleBtn);
    }

    // ─── Panel ───────────────────────────────────────────────────────────────

    private _buildPanel(): void {
        this._panel = document.createElement('div');
        this._panel.id = 'tpi-debug-overlay';

        this._panel.appendChild(this._buildHeader());
        this._panel.appendChild(this._buildTabBar());

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

    private _buildTabBar(): HTMLElement {
        const bar = document.createElement('div');
        bar.className = 'tdbg-tabs';

        TAB_DEFS.forEach(({ id, label }) => {
            const btn = document.createElement('button');
            btn.className = `tdbg-tab${id === this._activeTab ? ' tdbg-tab--active' : ''}`;
            btn.dataset.tab = id;
            btn.textContent = label;
            btn.addEventListener('click', () => {
                this._activeTab = id;
                bar.querySelectorAll<HTMLElement>('.tdbg-tab').forEach((t) =>
                    t.classList.toggle('tdbg-tab--active', t.dataset.tab === id),
                );
                this._renderTab(id);
            });
            bar.appendChild(btn);
        });

        return bar;
    }

    // ─── Tab rendering ───────────────────────────────────────────────────────

    private _renderTab(tab: TabId): void {
        if (!this._body) return;

        this._destroyCurrentTab();
        this._body.replaceChildren();

        switch (tab) {
            case 'modules':
                this._modulesTab.render(this._body);
                this._currentTabInstance = null;
                break;
            case 'logs':
                this._logsTab.render(this._body);
                this._currentTabInstance = this._logsTab;
                break;
            case 'perf':
                this._perfTab.render(this._body);
                this._currentTabInstance = this._perfTab;
                break;
            case 'storage':
                this._storageTab.render(this._body);
                this._currentTabInstance = null;
                break;
        }
    }

    private _destroyCurrentTab(): void {
        this._currentTabInstance?.destroy?.();
        this._currentTabInstance = null;
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

    // ─── Styles ───────────────────────────────────────────────────────────────

    private _injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            #tpi-debug-toggle {
                position: fixed; bottom: 16px; right: 16px; z-index: 999998;
                width: 36px; height: 36px; border-radius: 50%;
                background: #1e1e2e; border: 1px solid #45475a;
                cursor: pointer; font-size: 18px;
                align-items: center; justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,.5);
            }
            #tpi-debug-overlay[hidden] { display: none !important; }
            #tpi-debug-overlay {
                position: fixed; bottom: 16px; right: 16px; z-index: 999999;
                width: 520px; max-height: 580px;
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
            .tdbg-toggle--on  { background: #1e3a2e; color: #a6e3a1; border-color: #2d5a3d; }
            .tdbg-toggle--on:hover  { background: #2d5a3d; }
            .tdbg-toggle--off { background: #3a1e1e; color: #f38ba8; border-color: #5a2d2d; }
            .tdbg-toggle--off:hover { background: #5a2d2d; }
            .tdbg-checkbox { color: #a6adc8; font-size: 11px; cursor: pointer; }
            .tdbg-table {
                width: 100%; border-collapse: collapse; font-size: 11px;
            }
            .tdbg-table th, .tdbg-table td {
                padding: 4px 8px; text-align: left;
                border-bottom: 1px solid #313244; vertical-align: middle;
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
                max-width: 320px; color: #a6e3a1; font: inherit;
            }
        `;
        document.head.appendChild(style);
    }
}
