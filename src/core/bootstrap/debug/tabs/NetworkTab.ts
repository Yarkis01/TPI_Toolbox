import { StorageService } from '../../../../services/StorageService';
import { makeBtn, makeToolbar } from '../helpers';

/**
 * Interface representing a captured network request log.
 */
export interface NetworkRequestLog {
    /** Unique identifier for the intercepted request. */
    id: number;
    /** HTTP method (e.g., GET, POST). */
    method: string;
    /** Full URL of the request. */
    url: string;
    /** Type of request interceptor (Fetch API or XMLHttpRequest). */
    type: 'fetch' | 'xhr' | 'nav';
    /** HTTP status code, 'PENDING' if running, or 'ERROR' if it failed. */
    status: number | 'PENDING' | 'ERROR' | 'NAV';
    /** Duration in milliseconds from start to completion. */
    duration?: number;
    /** Start time based on performance.now(). */
    startTime: number;
    /** Parsed or raw request body, if any. */
    reqBody?: any;
    /** Parsed or raw response body, if any. */
    resBody?: any;
}

const MAX_REQUESTS = 100;
let requestCounter = 0;

/**
 * Debug tab — live network stream intercepting fetch and XHR.
 */
export class NetworkTab {
    /** List of intercepted network request logs. */
    private _requests: NetworkRequestLog[] = [];
    /** DOM element containing the list grid. */
    private _listEl: HTMLElement | null = null;
    /** Currently selected request for viewing details. */
    private _selectedRequest: NetworkRequestLog | null = null;
    /** DOM element containing the selected request's details view. */
    private _detailsEl: HTMLElement | null = null;

    /** Reference to the native window.fetch method. */
    private _originalFetch: typeof window.fetch | null = null;
    /** Reference to the native XMLHttpRequest.prototype.open method. */
    private _originalXhrOpen: any = null;
    /** Reference to the native XMLHttpRequest.prototype.send method. */
    private _originalXhrSend: any = null;

    /**
     * Initializes the NetworkTab and immediately hooks into global network APIs.
     */
    public constructor() {
        this._loadPersistedRequests();
        this._hookNetwork();
    }

    private _persistRequests(): void {
        StorageService.getInstance().save('debug_network_logs', this._requests);
    }

    private _loadPersistedRequests(): void {
        const stored = StorageService.getInstance().load<NetworkRequestLog[]>('debug_network_logs', []);
        if (stored && stored.length > 0) {
            this._requests = stored;

            // Add a NAV entry representing the page reload
            const navLog: NetworkRequestLog = {
                id: Date.now(), // timestamp prevents ID collision
                method: '---',
                url: window.location.href,
                type: 'nav',
                status: 'NAV',
                startTime: performance.now()
            };
            this._requests.unshift(navLog);
            if (this._requests.length > MAX_REQUESTS) this._requests.pop();

            // Ensure ID continuity
            const maxId = Math.max(...stored.map(r => r.id), requestCounter);
            requestCounter = 1000 + maxId; // Avoid collisions locally
        }
    }

    /**
     * Renders the network tab UI inside the provided container.
     * @param container The parent element to insert the tab into.
     */
    public render(container: HTMLElement): void {
        const toolbar = makeToolbar([
            makeBtn('🗑️ Vider', () => {
                this._requests = [];
                this._selectedRequest = null;
                this._persistRequests();
                this._renderList();
                this._renderDetails();
            }),
        ]);

        const splitLayout = document.createElement('div');
        splitLayout.style.display = 'flex';
        splitLayout.style.flexDirection = 'column';
        splitLayout.style.height = '420px';
        splitLayout.style.gap = '8px';

        const listContainer = document.createElement('div');
        listContainer.style.flex = '1';
        listContainer.style.overflowY = 'auto';
        listContainer.style.borderBottom = '1px solid #45475a';
        this._listEl = listContainer;

        const detailsContainer = document.createElement('div');
        detailsContainer.style.flex = '1';
        detailsContainer.style.overflowY = 'auto';
        detailsContainer.style.background = '#181825';
        detailsContainer.style.padding = '8px';
        detailsContainer.style.borderRadius = '4px';
        detailsContainer.style.fontFamily = 'monospace';
        detailsContainer.style.fontSize = '11px';
        detailsContainer.style.whiteSpace = 'pre-wrap';
        detailsContainer.style.wordBreak = 'break-all';
        this._detailsEl = detailsContainer;

        splitLayout.appendChild(listContainer);
        splitLayout.appendChild(detailsContainer);

        container.appendChild(toolbar);
        container.appendChild(splitLayout);

        this._renderList();
        this._renderDetails();
    }

    /**
     * Clears DOM references when the tab is hidden or destroyed.
     */
    public destroy(): void {
        this._listEl = null;
        this._detailsEl = null;
    }

    /**
     * Monkey-patches `window.fetch` and `XMLHttpRequest` prototype methods
     * to intercept network traffic and log them into `_requests`.
     */
    private _hookNetwork(): void {
        if (this._originalFetch) return;

        this._originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const reqUrl = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : String(args[0]));
            const reqMethod = (args[1]?.method || (args[0] instanceof Request ? args[0].method : 'GET')).toUpperCase();

            const reqLog: NetworkRequestLog = {
                id: ++requestCounter,
                method: reqMethod,
                url: reqUrl,
                type: 'fetch',
                status: 'PENDING',
                startTime: performance.now(),
                reqBody: args[1]?.body,
            };
            this._addRequest(reqLog);

            try {
                const response = await this._originalFetch!.call(window, ...args);
                reqLog.status = response.status;
                reqLog.duration = Math.round(performance.now() - reqLog.startTime);

                try {
                    const clonedResponse = response.clone();
                    const text = await clonedResponse.text();
                    try {
                        reqLog.resBody = JSON.parse(text);
                    } catch {
                        reqLog.resBody = text;
                    }
                } catch {
                    reqLog.resBody = '[CORS or Response completely blocked]';
                }

                this._updateRequest(reqLog);
                return response;
            } catch (err) {
                reqLog.status = 'ERROR';
                reqLog.duration = Math.round(performance.now() - reqLog.startTime);
                reqLog.resBody = String(err);
                this._updateRequest(reqLog);
                throw err;
            }
        };

        // --- Hook XHR ---
        this._originalXhrOpen = XMLHttpRequest.prototype.open;
        this._originalXhrSend = XMLHttpRequest.prototype.send;
        const self = this;

        XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
            (this as any)._reqLog = {
                id: ++requestCounter,
                method: method.toUpperCase(),
                url: String(url),
                type: 'xhr',
                status: 'PENDING',
                startTime: performance.now(),
            };
            return self._originalXhrOpen.call(this, method, url, ...rest);
        };

        XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
            const reqLog = (this as any)._reqLog as NetworkRequestLog | undefined;
            if (reqLog) {
                reqLog.startTime = performance.now();
                if (body) {
                    try {
                        reqLog.reqBody = typeof body === 'string' ? JSON.parse(body) : body;
                    } catch {
                        reqLog.reqBody = body;
                    }
                }
                self._addRequest(reqLog);

                this.addEventListener('load', () => {
                    reqLog.status = this.status;
                    reqLog.duration = Math.round(performance.now() - reqLog.startTime);
                    try {
                        reqLog.resBody = JSON.parse(this.responseText);
                    } catch {
                        reqLog.resBody = this.responseText;
                    }
                    self._updateRequest(reqLog);
                });

                this.addEventListener('error', () => {
                    reqLog.status = 'ERROR';
                    reqLog.duration = Math.round(performance.now() - reqLog.startTime);
                    self._updateRequest(reqLog);
                });
            }
            return self._originalXhrSend.call(this, body);
        };
    }

    /**
     * Prepends a new request log to the list and updates the UI if visible.
     * Implements a maximum list size limit to avoid memory leaks.
     * @param reqLog The network request details object.
     */
    private _addRequest(reqLog: NetworkRequestLog): void {
        this._requests.unshift(reqLog);
        if (this._requests.length > MAX_REQUESTS) {
            this._requests.pop();
        }
        this._persistRequests();
        if (this._listEl) {
            this._renderList();
        }
    }

    /**
     * Performs a fast UI update on a specific request row in the list
     * without triggering a full re-render of the list.
     * @param reqLog The network request details object that has been updated.
     */
    private _updateRequest(reqLog: NetworkRequestLog): void {
        this._persistRequests();
        if (!this._listEl) return;

        // Fast UI update without re-rendering everything
        const row = this._listEl.querySelector(`[data-req-id="${reqLog.id}"]`);
        if (row) {
            const statusEl = row.querySelector('.net-status') as HTMLElement;
            if (statusEl) {
                statusEl.textContent = String(reqLog.status);
                statusEl.style.color = this._getStatusColor(reqLog.status);
            }
            const durationEl = row.querySelector('.net-duration') as HTMLElement;
            if (durationEl && reqLog.duration !== undefined) {
                durationEl.textContent = `${reqLog.duration}ms`;
            }
        }

        // If it's the selected request, update details
        if (this._selectedRequest?.id === reqLog.id) {
            this._renderDetails();
        }
    }

    /**
     * Determines the display color based on the HTTP status code.
     * @param status The status code (or PENDING/ERROR string).
     * @returns A hex color string.
     */
    private _getStatusColor(status: number | 'PENDING' | 'ERROR' | 'NAV'): string {
        if (status === 'NAV') return '#cba6f7';
        if (status === 'PENDING') return '#f9e2af';
        if (status === 'ERROR') return '#f38ba8';
        if (status >= 200 && status < 300) return '#a6e3a1';
        if (status >= 300 && status < 400) return '#89b4fa';
        return '#f38ba8'; // 400+
    }

    /**
     * Completely re-renders the list table with the current requests.
     */
    private _renderList(): void {
        if (!this._listEl) return;
        this._listEl.replaceChildren();

        const table = document.createElement('table');
        table.className = 'tdbg-table';
        table.style.marginTop = '0';

        const thead = document.createElement('thead');
        thead.innerHTML = `<tr>
            <th style="width: 40px;">Stat</th>
            <th style="width: 50px;">Meth</th>
            <th>URL</th>
            <th style="width: 60px; text-align: right;">Temps</th>
        </tr>`;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        this._requests.forEach(req => {
            const tr = document.createElement('tr');
            tr.dataset.reqId = String(req.id);
            tr.style.cursor = 'pointer';

            if (this._selectedRequest?.id === req.id) {
                tr.style.background = '#313244';
            }

            tr.addEventListener('click', () => {
                this._selectedRequest = req;
                this._renderList();
                this._renderDetails();
            });

            // Extract path for cleaner display
            let pathUrl = req.url;
            try {
                if (req.type === 'nav') {
                    pathUrl = 'PAGE RELOAD / NAV';
                } else {
                    const urlObj = new URL(req.url, window.location.origin);
                    pathUrl = urlObj.pathname + urlObj.search;
                }
            } catch { }

            tr.innerHTML = `
                <td class="net-status" style="color: ${this._getStatusColor(req.status)}">${req.status}</td>
                <td style="color: #cba6f7">${req.method}</td>
                <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${req.url}">${pathUrl}</td>
                <td class="net-duration" style="text-align: right; color: #a6adc8">${req.duration !== undefined ? req.duration + 'ms' : '...'}</td>
            `;
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);

        if (this._requests.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'tdbg-empty';
            empty.textContent = "Aucune requête interceptée";
            this._listEl.appendChild(empty);
        } else {
            this._listEl.appendChild(table);
        }
    }

    /**
     * Completely re-renders the details pane for the selected request.
     */
    private _renderDetails(): void {
        if (!this._detailsEl) return;
        this._detailsEl.replaceChildren();

        if (!this._selectedRequest) {
            this._detailsEl.innerHTML = '<div class="tdbg-empty">Sélectionnez une requête pour voir les détails</div>';
            return;
        }

        const req = this._selectedRequest;

        const urlHeader = document.createElement('div');
        urlHeader.style.marginBottom = '8px';
        urlHeader.style.borderBottom = '1px solid #313244';
        urlHeader.style.paddingBottom = '4px';
        urlHeader.innerHTML = `<strong style="color: #cba6f7;">${req.method}</strong> ${req.url}<br>
                               <span style="color: #6c7086;">Status: <span style="color: ${this._getStatusColor(req.status)}">${req.status}</span> 
                               | Type: ${req.type} | Duration: ${req.duration !== undefined ? req.duration + 'ms' : '...'}</span>`;
        this._detailsEl.appendChild(urlHeader);

        if (req.reqBody) {
            const reqTitle = document.createElement('div');
            reqTitle.style.color = '#89b4fa';
            reqTitle.style.marginTop = '8px';
            reqTitle.textContent = '--- Request Body ---';
            this._detailsEl.appendChild(reqTitle);

            const reqBody = document.createElement('div');
            reqBody.textContent = typeof req.reqBody === 'object' ? JSON.stringify(req.reqBody, null, 2) : String(req.reqBody);
            this._detailsEl.appendChild(reqBody);
        }

        const resTitle = document.createElement('div');
        resTitle.style.color = '#a6e3a1';
        resTitle.style.marginTop = '8px';
        resTitle.textContent = '--- Response Body ---';
        this._detailsEl.appendChild(resTitle);

        const resBody = document.createElement('div');
        if (req.status === 'PENDING') {
            resBody.style.color = '#f9e2af';
            resBody.textContent = 'En attente...';
        } else {
            resBody.textContent = typeof req.resBody === 'object' ? JSON.stringify(req.resBody, null, 2) : String(req.resBody);
        }
        this._detailsEl.appendChild(resBody);
    }
}
