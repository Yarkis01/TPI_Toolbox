import { ModuleManager } from '../../../managers/ModuleManager';
import { SettingsManager } from '../../../managers/SettingsManager';
import { StorageService } from '../../../../services/StorageService';
import { makeBtn, makeToolbar } from '../helpers';

const MAX_HISTORY = 200;

type OutputType = 'result' | 'error' | 'log' | 'info';

/**
 * Debug tab — in-overlay JavaScript REPL with direct access to Toolbox internals.
 *
 * Scope persistence: bare assignments (x = 5) are captured by the Proxy on _scope
 * and remain available in future runs. let/const/var declarations are local to the
 * current run only.
 *
 * Security note: the Function constructor is used intentionally. This tab is only
 * active when import.meta.env.DEV is true and is never bundled in production.
 */
export class ConsoleTab {
    private readonly _moduleManager: ModuleManager;
    private readonly _storage: StorageService;
    private readonly _settingsManager: SettingsManager;
    private _scope: Record<string, unknown>;
    private _history: string[] = [];
    private _historyIndex = -1;
    private _historyEl: HTMLElement | null = null;
    private _inputEl: HTMLTextAreaElement | null = null;
    private _running = false;

    public constructor(
        moduleManager: ModuleManager,
        storage: StorageService,
        settingsManager: SettingsManager,
    ) {
        this._moduleManager = moduleManager;
        this._storage = storage;
        this._settingsManager = settingsManager;
        this._scope = this._buildScope();
    }

    public render(container: HTMLElement): void {
        const toolbar = makeToolbar([
            makeBtn('🧹 Reset scope', () => {
                this._scope = this._buildScope();
                this._appendOutput('Scope r\u00e9initialis\u00e9.', 'info');
            }),
        ]);

        const historyEl = document.createElement('div');
        historyEl.className = 'tdbg-repl-history';
        this._historyEl = historyEl;

        const inputEl = document.createElement('textarea');
        inputEl.className = 'tdbg-repl-input';
        inputEl.placeholder = '// tape ton code ici';
        inputEl.rows = 3;
        this._inputEl = inputEl;

        inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                void this._execute();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this._historyIndex = Math.min(this._historyIndex + 1, this._history.length - 1);
                if (this._historyIndex >= 0) {
                    inputEl.value = this._history[this._history.length - 1 - this._historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this._historyIndex = Math.max(this._historyIndex - 1, -1);
                if (this._historyIndex === -1) {
                    inputEl.value = '';
                } else {
                    inputEl.value = this._history[this._history.length - 1 - this._historyIndex];
                }
            }
        });

        const footer = document.createElement('div');
        footer.className = 'tdbg-repl-footer';
        footer.appendChild(makeBtn('▶ Run', () => void this._execute()));
        const hint = document.createElement('span');
        hint.className = 'tdbg-repl-hint';
        hint.textContent = 'Shift+Enter pour ex\u00e9cuter';
        footer.appendChild(hint);

        container.appendChild(toolbar);
        container.appendChild(historyEl);
        container.appendChild(inputEl);
        container.appendChild(footer);
    }

    public destroy(): void {
        this._historyEl = null;
        this._inputEl = null;
    }

    private _buildScope(): Record<string, unknown> {
        return {
            moduleManager: this._moduleManager,
            storage: this._storage,
            settingsManager: this._settingsManager,
            getModule: (id: string) => this._moduleManager.getModules().find((m) => m.id === id),
            help: () => {
                const helpText = [
                    'Variables disponibles :',
                    '  moduleManager   \u2014 ModuleManager',
                    '  storage         \u2014 StorageService',
                    '  settingsManager \u2014 SettingsManager',
                    '  getModule(id)   \u2014 IModule | undefined',
                    "  help()          \u2014 affiche cette aide",
                    "  clear()         \u2014 vide l'historique affich\u00e9",
                    '',
                    'Persistance : les assignations directes (x = 5) persistent.',
                    'let / const / var sont locaux au run courant.',
                ].join('\n');
                this._appendOutput(helpText, 'info');
            },
            clear: () => {
                this._historyEl?.replaceChildren();
            },
        };
    }

    private async _execute(): Promise<void> {
        if (this._running) return;
        this._running = true;
        const code = this._inputEl?.value.trim();
        if (!code) {
            this._running = false;
            return;
        }

        this._appendInput(code);
        this._history.push(code);
        if (this._history.length > MAX_HISTORY) this._history.shift();
        this._historyIndex = -1;
        if (this._inputEl) this._inputEl.value = '';

        const logs: string[] = [];
        const origLog = console.log;
        console.log = (...args: unknown[]) => {
            logs.push(args.map((a) => this._format(a)).join(' '));
            origLog.apply(console, args);
        };

        const proxy = new Proxy(this._scope, {
            has: () => true,
            get: (target, prop: string) => target[prop],
            set: (target, prop: string, value: unknown) => {
                target[prop] = value;
                return true;
            },
        });

        try {
            const isAsync = /\bawait\b/.test(code);
            let result: unknown;

            if (isAsync) {
                const AsyncFn = Object.getPrototypeOf(async function () {})
                    .constructor as new (...a: string[]) => (scope: Record<string, unknown>) => Promise<unknown>;
                let fn: (scope: Record<string, unknown>) => Promise<unknown>;
                try {
                    fn = new AsyncFn('scope', `with(scope){ return (${code}) }`);
                } catch {
                    fn = new AsyncFn('scope', `with(scope){ ${code} }`);
                }
                result = await fn(proxy);
            } else {
                // Security: intentional — debug REPL, DEV-only, never in production build
                let fn: (scope: Record<string, unknown>) => unknown;
                try {
                    fn = new Function('scope', `with(scope){ return (${code}) }`) as typeof fn;
                } catch {
                    fn = new Function('scope', `with(scope){ ${code} }`) as typeof fn;
                }
                result = fn(proxy);
            }

            for (const log of logs) {
                this._appendOutput(log, 'log');
            }

            if (result !== undefined) {
                this._appendOutput(this._format(result), 'result');
            } else if (logs.length === 0) {
                this._appendOutput('undefined', 'result');
            }
        } catch (err) {
            for (const log of logs) {
                this._appendOutput(log, 'log');
            }
            this._appendOutput(String(err), 'error');
        } finally {
            console.log = origLog;
            this._running = false;
            if (this._historyEl) {
                this._historyEl.scrollTop = this._historyEl.scrollHeight;
            }
        }
    }

    private _format(value: unknown): string {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') return value;
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    }

    private _appendInput(code: string): void {
        const entry = document.createElement('div');
        entry.className = 'tdbg-repl-entry tdbg-repl-entry--input';
        const prompt = document.createElement('span');
        prompt.className = 'tdbg-repl-prompt';
        prompt.textContent = '> ';
        entry.appendChild(prompt);
        entry.appendChild(document.createTextNode(code));
        this._historyEl?.appendChild(entry);
    }

    private _appendOutput(text: string, type: OutputType): void {
        const entry = document.createElement('div');
        entry.className = `tdbg-repl-entry tdbg-repl-entry--${type}`;
        const prefix = document.createElement('span');
        prefix.className = 'tdbg-repl-prefix';
        if (type === 'error') {
            prefix.textContent = '✕ ';
        } else if (type === 'log') {
            prefix.textContent = '· ';
        } else if (type === 'info') {
            prefix.textContent = 'ℹ ';
        } else {
            prefix.textContent = '← ';
        }
        entry.appendChild(prefix);
        entry.appendChild(document.createTextNode(text));
        this._historyEl?.appendChild(entry);
        if (this._historyEl) this._historyEl.scrollTop = this._historyEl.scrollHeight;
    }
}
