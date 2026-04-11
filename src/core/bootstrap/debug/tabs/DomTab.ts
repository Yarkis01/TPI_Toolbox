import { makeBtn, makeCheckbox, makeToolbar } from '../helpers';

/** Represents a single captured DOM mutation event. */
export interface DomMutationLog {
    /** Timestamp (HH:MM:SS.mmm) at which the mutation was observed. */
    timestamp: string;
    /** Type of the mutation: attribute change, node added/removed, or text change. */
    type: 'attributes' | 'childList' | 'characterData';
    /** A short, human-readable summary of the mutation. */
    summary: string;
    /** CSS selector-like path to the mutated element. */
    target: string;
    /** The attribute name that changed (for 'attributes' type only). */
    attribute?: string;
    /** The old value before the mutation (if available). */
    oldValue?: string | null;
}

const MAX_LOGS = 300;

/**
 * Returns a short CSS-selector-like string that identifies a DOM node.
 * E.g. "div#my-id.class-a.class-b"
 */
function describeNode(node: Node): string {
    if (!(node instanceof Element)) return node.nodeName.toLowerCase();
    const tag = node.tagName.toLowerCase();
    const id = node.id ? `#${node.id}` : '';
    const classes = Array.from(node.classList)
        .slice(0, 3) // Limit to 3 classes for readability
        .map((c) => `.${c}`)
        .join('');
    return `${tag}${id}${classes}`;
}

/**
 * Formats the current time as HH:MM:SS.mmm.
 */
function now(): string {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${hh}:${mm}:${ss}.${ms}`;
}

/**
 * Debug tab — observes and lists all DOM mutations on document.body,
 * excluding the debug overlay panel itself to avoid noise.
 */
export class DomTab {
    /** Buffer of captured mutation log entries. */
    private _logs: DomMutationLog[] = [];
    /** The active MutationObserver instance, or null when not watching. */
    private _observer: MutationObserver | null = null;
    /** Whether the observer is currently active. */
    private _isWatching = false;
    /** Whether to auto-scroll the log list. */
    private _autoScroll = true;

    /** The DOM element rendering the log list (only set while the tab is visible). */
    private _logsEl: HTMLElement | null = null;
    /** The DOM element for the status counter badge. */
    private _counterEl: HTMLElement | null = null;

    /** The node to exclude from observation (the debug panel itself). */
    private _excludeNode: HTMLElement | null = null;

    /**
     * Provides a reference to the debug overlay panel so that its own mutations
     * are ignored by the observer.
     * @param panel The root element of the debug overlay.
     */
    public setExcludeNode(panel: HTMLElement): void {
        this._excludeNode = panel;
    }

    /**
     * Renders the DOM tab UI into the given container.
     * @param container The parent element to render into.
     */
    public render(container: HTMLElement): void {
        const watchBtn = makeBtn(this._isWatching ? '⏹ Stop' : '▶ Observer', () => {
            if (this._isWatching) {
                this._stopObserving();
            } else {
                this._startObserving();
            }
            watchBtn.textContent = this._isWatching ? '⏹ Stop' : '▶ Observer';
        });

        const clearBtn = makeBtn('🗑️ Vider', () => {
            this._logs = [];
            this._logsEl?.replaceChildren();
            this._updateCounter();
        });

        const toolbar = makeToolbar([
            watchBtn,
            clearBtn,
            makeCheckbox('Auto-scroll', this._autoScroll, (v) => {
                this._autoScroll = v;
            }),
        ]);

        // Counter badge showing how many mutations have been captured
        const counterWrapper = document.createElement('div');
        counterWrapper.style.cssText =
            'display:flex; align-items:center; gap:6px; margin-bottom:6px; font-size:10px; color:#6c7086;';

        this._counterEl = document.createElement('span');
        this._updateCounter();
        counterWrapper.appendChild(this._counterEl);

        // Filter bar
        const filterWrapper = document.createElement('div');
        filterWrapper.style.cssText =
            'margin-bottom:6px; display:flex; gap:6px; align-items:center;';
        const filterLabel = document.createElement('span');
        filterLabel.textContent = 'Filtre :';
        filterLabel.style.color = '#6c7086';
        filterLabel.style.fontSize = '10px';

        const filterInput = document.createElement('input');
        filterInput.type = 'text';
        filterInput.placeholder = 'ex: div, #id, .class, attributes…';
        filterInput.className = 'tdbg-storage-input';
        filterInput.style.flex = '1';
        filterInput.addEventListener('input', () => {
            this._reRenderRows(filterInput.value.trim().toLowerCase());
        });

        filterWrapper.appendChild(filterLabel);
        filterWrapper.appendChild(filterInput);

        const logsEl = document.createElement('div');
        logsEl.className = 'tdbg-logs';
        this._logsEl = logsEl;

        // Populate existing buffered entries
        this._logs.forEach((entry) => this._appendRow(entry));
        if (this._autoScroll) logsEl.scrollTop = logsEl.scrollHeight;

        container.appendChild(toolbar);
        container.appendChild(counterWrapper);
        container.appendChild(filterWrapper);
        container.appendChild(logsEl);
    }

    /**
     * Clears the DOM reference to the log list when the tab is hidden.
     */
    public destroy(): void {
        this._logsEl = null;
        this._counterEl = null;
    }

    // ─── Observer lifecycle ─────────────────────────────────────────────────

    /**
     * Starts the MutationObserver on `document.body`, watching for all
     * child additions/removals, attribute changes, and text changes.
     */
    private _startObserving(): void {
        if (this._isWatching) return;
        this._isWatching = true;

        this._observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                // Skip mutations originating from the debug overlay itself
                if (this._excludeNode?.contains(mutation.target)) continue;

                const entry = this._buildEntry(mutation);
                if (entry) this._receiveEntry(entry);
            }
        });

        this._observer.observe(document.body, {
            childList: true, // Nodes added / removed
            subtree: true, // Watch the entire DOM tree
            attributes: true, // Attribute changes (class, style, data-*, etc.)
            characterData: true, // Text node content changes
            attributeOldValue: true,
            characterDataOldValue: true,
        });
    }

    /**
     * Disconnects the MutationObserver and stops capturing mutations.
     */
    private _stopObserving(): void {
        this._observer?.disconnect();
        this._observer = null;
        this._isWatching = false;
    }

    // ─── Entry building ────────────────────────────────────────────────────

    /**
     * Converts a raw `MutationRecord` into a `DomMutationLog` entry.
     * @param mutation The raw mutation record from the observer callback.
     * @returns A structured log entry, or null if the mutation is not meaningful.
     */
    private _buildEntry(mutation: MutationRecord): DomMutationLog | null {
        const target = describeNode(mutation.target);
        const ts = now();

        if (mutation.type === 'childList') {
            const added = mutation.addedNodes.length;
            const removed = mutation.removedNodes.length;
            if (added === 0 && removed === 0) return null;

            // Build a short description of what was added/removed
            const parts: string[] = [];
            if (added > 0) {
                const names = Array.from(mutation.addedNodes)
                    .slice(0, 2)
                    .map(describeNode)
                    .join(', ');
                parts.push(`+${added} [${names}${added > 2 ? '…' : ''}]`);
            }
            if (removed > 0) {
                const names = Array.from(mutation.removedNodes)
                    .slice(0, 2)
                    .map(describeNode)
                    .join(', ');
                parts.push(`-${removed} [${names}${removed > 2 ? '…' : ''}]`);
            }

            return { timestamp: ts, type: 'childList', summary: parts.join(', '), target };
        }

        if (mutation.type === 'attributes') {
            const attr = mutation.attributeName ?? '?';
            const newVal = (mutation.target as Element).getAttribute(attr);
            const summary = `${attr}: "${mutation.oldValue ?? ''}" → "${newVal ?? ''}"`;
            return {
                timestamp: ts,
                type: 'attributes',
                summary,
                target,
                attribute: attr,
                oldValue: mutation.oldValue,
            };
        }

        if (mutation.type === 'characterData') {
            const old = mutation.oldValue?.slice(0, 40) ?? '';
            const newText = mutation.target.textContent?.slice(0, 40) ?? '';
            if (old === newText) return null; // No real change
            return {
                timestamp: ts,
                type: 'characterData',
                summary: `"${old}" → "${newText}"`,
                target,
                oldValue: old,
            };
        }

        return null;
    }

    // ─── Rendering ─────────────────────────────────────────────────────────

    /**
     * Buffers an entry and appends it to the live list if the tab is visible.
     * @param entry The mutation log entry to record.
     */
    private _receiveEntry(entry: DomMutationLog): void {
        this._logs.push(entry);
        if (this._logs.length > MAX_LOGS) this._logs.shift();

        if (this._logsEl) {
            this._appendRow(entry);
            if (this._autoScroll) this._logsEl.scrollTop = this._logsEl.scrollHeight;
        }
        this._updateCounter();
    }

    /**
     * Appends a single log row to the visible log container.
     * @param entry The mutation log entry to render.
     * @param filter Optional filter string to apply; hides the row if it doesn't match.
     */
    private _appendRow(entry: DomMutationLog, filter = ''): void {
        if (!this._logsEl) return;

        const row = document.createElement('div');
        row.className = `tdbg-log tdbg-dom-row`;

        if (filter && !this._matchesFilter(entry, filter)) {
            row.style.display = 'none';
        }

        const colorMap: Record<DomMutationLog['type'], string> = {
            childList: '#89dceb',
            attributes: '#f9e2af',
            characterData: '#a6adc8',
        };

        const ts = document.createElement('span');
        ts.className = 'tdbg-log-ts';
        ts.textContent = `[${entry.timestamp}]`;

        const typeTag = document.createElement('span');
        typeTag.className = 'tdbg-log-ctx';
        typeTag.style.color = colorMap[entry.type];
        typeTag.textContent = entry.type;

        const targetTag = document.createElement('span');
        targetTag.style.color = '#cba6f7';
        targetTag.textContent = ` ${entry.target}`;

        const msg = document.createElement('span');
        msg.style.color = '#a6adc8';
        msg.textContent = `  ${entry.summary}`;

        row.appendChild(ts);
        row.appendChild(document.createTextNode(' '));
        row.appendChild(typeTag);
        row.appendChild(targetTag);
        row.appendChild(msg);

        this._logsEl.appendChild(row);

        // Keep list within max size
        if (this._logsEl.children.length > MAX_LOGS) {
            this._logsEl.removeChild(this._logsEl.firstChild!);
        }
    }

    /**
     * Fully re-renders all rows applying the given filter string.
     * Called when the user updates the filter input.
     * @param filter The current filter string.
     */
    private _reRenderRows(filter: string): void {
        if (!this._logsEl) return;
        this._logsEl.replaceChildren();
        this._logs.forEach((entry) => this._appendRow(entry, filter));
        if (this._autoScroll) this._logsEl.scrollTop = this._logsEl.scrollHeight;
    }

    /**
     * Whether the given entry matches the filter string (checks type, target, summary).
     * @param entry The log entry to check.
     * @param filter The lowercase filter string.
     */
    private _matchesFilter(entry: DomMutationLog, filter: string): boolean {
        return (
            entry.type.includes(filter) ||
            entry.target.toLowerCase().includes(filter) ||
            entry.summary.toLowerCase().includes(filter)
        );
    }

    /**
     * Updates the counter badge showing the total number of captured mutations.
     */
    private _updateCounter(): void {
        if (!this._counterEl) return;
        this._counterEl.textContent = `${this._logs.length} mutation(s) capturée(s)`;
    }
}
