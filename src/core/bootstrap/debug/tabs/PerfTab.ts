/**
 * Debug tab — page navigation timing, memory and live FPS counter.
 */
export class PerfTab {
    private readonly _appStart: number;
    private _fpsRaf: number | null = null;

    public constructor(appStart: number) {
        this._appStart = appStart;
    }

    public render(container: HTMLElement): void {
        const nav = performance.getEntriesByType('navigation')[0] as
            | PerformanceNavigationTiming
            | undefined;

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

        const mem = (
            performance as unknown as {
                memory?: {
                    usedJSHeapSize: number;
                    totalJSHeapSize: number;
                    jsHeapSizeLimit: number;
                };
            }
        ).memory;

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

        container.appendChild(table);
        container.appendChild(fpsRow);

        this._startFps(fpsVal);
    }

    public destroy(): void {
        if (this._fpsRaf !== null) {
            cancelAnimationFrame(this._fpsRaf);
            this._fpsRaf = null;
        }
    }

    private _startFps(fpsVal: HTMLElement): void {
        let frames = 0;
        let last = performance.now();

        const loop = (now: number) => {
            frames++;
            if (now - last >= 1000) {
                const fps = frames;
                fpsVal.textContent = String(fps);
                fpsVal.style.color = fps >= 55 ? '#a6e3a1' : fps >= 30 ? '#f9e2af' : '#f38ba8';
                frames = 0;
                last = now;
            }
            this._fpsRaf = requestAnimationFrame(loop);
        };

        this._fpsRaf = requestAnimationFrame(loop);
    }
}
