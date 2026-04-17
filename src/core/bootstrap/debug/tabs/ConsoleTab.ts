import { StorageService } from '../../../../services/StorageService';
import { ModuleManager } from '../../../managers/ModuleManager';
import { SettingsManager } from '../../../managers/SettingsManager';
import { makeBtn, makeToolbar } from '../helpers';

const MAX_HISTORY = 200;
const STORAGE_KEY_CMD = 'debug:repl:cmdHistory';
const STORAGE_KEY_OUTPUT = 'debug:repl:output';

type OutputType = 'result' | 'error' | 'log' | 'info';

/** Serializable entry stored in StorageService to replay the displayed output on re-render. */
type PersistedEntry = { kind: 'input'; code: string } | { kind: OutputType; text: string };

/**
 * Debug tab — in-overlay JavaScript REPL with direct access to Toolbox internals.
 *
 * Scope persistence: bare assignments (x = 5) are captured by the Proxy on _scope
 * and remain available in future runs. let/const/var declarations are local to the
 * current run only.
 *
 * History persistence: the command history (↑/↓) and the displayed output are saved
 * in StorageService and restored across tab switches and page reloads.
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
    private _entries: PersistedEntry[] = [];

    private _historyEl: HTMLElement | null = null;
    private _inputEl: HTMLTextAreaElement | null = null;
    private _running = false;

    /**
     * Creates the tab and restores history from storage.
     * @param moduleManager Main module manager instance.
     * @param storage StorageService instance used for persistence.
     * @param settingsManager Settings manager instance.
     */
    public constructor(
        moduleManager: ModuleManager,
        storage: StorageService,
        settingsManager: SettingsManager,
    ) {
        this._moduleManager = moduleManager;
        this._storage = storage;
        this._settingsManager = settingsManager;
        this._history = this._storage.load<string[]>(STORAGE_KEY_CMD, []);
        this._entries = this._storage.load<PersistedEntry[]>(STORAGE_KEY_OUTPUT, []);
        this._scope = this._buildScope();
    }

    /**
     * Builds the REPL UI inside the given container.
     * Replays persisted entries to restore the previous output.
     * @param container Parent element to inject the REPL into.
     */
    public render(container: HTMLElement): void {
        const toolbar = makeToolbar([
            makeBtn('🧹 Reset scope', () => {
                this._scope = this._buildScope();
                this._appendOutput('Scope réinitialisé.', 'info');
            }),
        ]);

        const historyEl = document.createElement('div');
        historyEl.className = 'tdbg-repl-history';
        this._historyEl = historyEl;

        // Replay persisted entries to restore the previous output
        for (const entry of this._entries) {
            if (entry.kind === 'input') {
                this._renderInputRow(entry.code);
            } else {
                this._renderOutputRow(entry.text, entry.kind);
            }
        }
        historyEl.scrollTop = historyEl.scrollHeight;

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
                inputEl.value =
                    this._historyIndex === -1
                        ? ''
                        : this._history[this._history.length - 1 - this._historyIndex];
            }
        });

        const footer = document.createElement('div');
        footer.className = 'tdbg-repl-footer';
        footer.appendChild(makeBtn('▶ Run', () => void this._execute()));
        const hint = document.createElement('span');
        hint.className = 'tdbg-repl-hint';
        hint.textContent = 'Shift+Enter pour exécuter';
        footer.appendChild(hint);

        container.appendChild(toolbar);
        container.appendChild(historyEl);
        container.appendChild(inputEl);
        container.appendChild(footer);
    }

    /**
     * Releases DOM references when the tab is hidden or the overlay is closed.
     * In-memory and persisted history are intentionally kept.
     */
    public destroy(): void {
        this._historyEl = null;
        this._inputEl = null;
    }

    /**
     * Builds the initial scope object injected into every run.
     * Exposes Toolbox instances and helpers (help, clear, getModule).
     */
    private _buildScope(): Record<string, unknown> {
        return {
            moduleManager: this._moduleManager,
            storage: this._storage,
            settingsManager: this._settingsManager,
            getModule: (id: string) => this._moduleManager.getModules().find((m) => m.id === id),
            help: () => {
                const helpText = [
                    'Variables disponibles :',
                    '  moduleManager   — ModuleManager',
                    '  storage         — StorageService',
                    '  settingsManager — SettingsManager',
                    '  getModule(id)   — IModule | undefined',
                    '  help()          — affiche cette aide',
                    "  clear()         — vide l'historique affiché",
                    '',
                    'Persistance : les assignations directes (x = 5) persistent.',
                    'let / const / var sont locaux au run courant.',
                ].join('\n');
                this._appendOutput(helpText, 'info');
            },
            clear: () => {
                this._entries = [];
                this._storage.save(STORAGE_KEY_OUTPUT, this._entries);
                this._historyEl?.replaceChildren();
            },
        };
    }

    /**
     * Reads, compiles and executes the code in the textarea.
     * Captures console.log output during execution and displays the return value or error.
     * Persists the command and its output to StorageService.
     */
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
        this._storage.save(STORAGE_KEY_CMD, this._history);
        if (this._inputEl) this._inputEl.value = '';

        const logs: string[] = [];
        const origLog = console.log;
        console.log = (...args: unknown[]) => {
            logs.push(args.map((a) => this._format(a)).join(' '));
            origLog.apply(console, args);
        };

        // The Proxy captures bare assignments (x = 5) into _scope so they persist across runs.
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
                const AsyncFn = Object.getPrototypeOf(async function () {}).constructor as new (
                    ...a: string[]
                ) => (scope: Record<string, unknown>) => Promise<unknown>;
                let fn: (scope: Record<string, unknown>) => Promise<unknown>;
                try {
                    fn = new AsyncFn('scope', `with(scope){ return (${code}) }`);
                } catch {
                    fn = new AsyncFn('scope', `with(scope){ ${code} }`);
                }
                result = await fn(proxy);
            } else {
                let fn: (scope: Record<string, unknown>) => unknown;
                try {
                    fn = new Function('scope', `with(scope){ return (${code}) }`) as typeof fn;
                } catch {
                    fn = new Function('scope', `with(scope){ ${code} }`) as typeof fn;
                }
                result = fn(proxy);
            }

            for (const log of logs) this._appendOutput(log, 'log');

            if (result !== undefined) {
                this._appendOutput(this._format(result), 'result');
            } else if (logs.length === 0) {
                this._appendOutput('undefined', 'result');
            }
        } catch (err) {
            for (const log of logs) this._appendOutput(log, 'log');
            this._appendOutput(String(err), 'error');
        } finally {
            console.log = origLog;
            this._running = false;
            if (this._historyEl) this._historyEl.scrollTop = this._historyEl.scrollHeight;
        }
    }

    /**
     * Serializes a value to a human-readable string for display in the REPL.
     * Attempts JSON.stringify for objects, falls back to String() on error.
     * @param value The value to format.
     */
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

    /**
     * Persists and renders an input line (code typed by the user).
     * @param code The executed code string.
     */
    private _appendInput(code: string): void {
        this._entries.push({ kind: 'input', code });
        if (this._entries.length > MAX_HISTORY) this._entries.shift();
        this._storage.save(STORAGE_KEY_OUTPUT, this._entries);
        this._renderInputRow(code);
    }

    /**
     * Persists and renders an output line (result, error, log or info).
     * @param text The text to display.
     * @param type Output type — determines the color and prefix symbol.
     */
    private _appendOutput(text: string, type: OutputType): void {
        this._entries.push({ kind: type, text });
        if (this._entries.length > MAX_HISTORY) this._entries.shift();
        this._storage.save(STORAGE_KEY_OUTPUT, this._entries);
        this._renderOutputRow(text, type);
    }

    /**
     * Creates and injects an input row into the DOM without touching storage.
     * Used by both _appendInput() and the replay loop in render().
     * @param code The code to display.
     */
    private _renderInputRow(code: string): void {
        if (!this._historyEl) return;
        const entry = document.createElement('div');
        entry.className = 'tdbg-repl-entry tdbg-repl-entry--input';
        const prompt = document.createElement('span');
        prompt.className = 'tdbg-repl-prompt';
        prompt.textContent = '> ';
        entry.appendChild(prompt);
        entry.appendChild(document.createTextNode(code));
        this._historyEl.appendChild(entry);
    }

    /**
     * Creates and injects an output row into the DOM without touching storage.
     * Used by both _appendOutput() and the replay loop in render().
     * @param text The text to display.
     * @param type Output type.
     */
    private _renderOutputRow(text: string, type: OutputType): void {
        if (!this._historyEl) return;
        const entry = document.createElement('div');
        entry.className = `tdbg-repl-entry tdbg-repl-entry--${type}`;
        const prefix = document.createElement('span');
        prefix.className = 'tdbg-repl-prefix';
        prefix.textContent =
            type === 'error' ? '✕ ' : type === 'log' ? '· ' : type === 'info' ? 'ℹ ' : '← ';
        entry.appendChild(prefix);
        entry.appendChild(document.createTextNode(text));
        this._historyEl.appendChild(entry);
        this._historyEl.scrollTop = this._historyEl.scrollHeight;
    }
}
