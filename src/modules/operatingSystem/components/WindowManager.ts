import { WindowComponent, WindowOptions } from "./Window";

/**
 * Class for the window manager.
 */
export class WindowManager {
    private windows: WindowComponent[] = [];
    private container: HTMLElement;
    private highestZ: number = 100;

    /**
     * Creates a new WindowManager instance.
     * @param container - The container for the windows.
     */
    public constructor(container: HTMLElement) {
        this.container = container;
    }

    /**
     * Opens a new window.
     * @param options - The options for the window.
     * @returns The window component.
     */
    public openWindow(options: WindowOptions): WindowComponent {
        const win = new WindowComponent({
            ...options,
            onClose: () => {
                this.removeWindow(win);
                if (options.onClose) options.onClose();
            },
            onFocus: () => {
                this.focusWindow(win);
                if (options.onFocus) options.onFocus();
            }
        });

        this.windows.push(win);
        this.container.appendChild(win.element);
        this.focusWindow(win);

        win.element.addEventListener('mousedown', () => this.focusWindow(win));

        return win;
    }

    /**
     * Closes all windows.
     */
    public closeAll(): void {
        [...this.windows].forEach(w => w.close());
        this.windows = [];
    }

    /**
     * Removes a window from the window manager.
     * @param win - The window component to remove.
     */
    private removeWindow(win: WindowComponent): void {
        this.windows = this.windows.filter(w => w !== win);
    }

    /**
     * Focuses a window.
     * @param win - The window component to focus.
     */
    public focusWindow(win: WindowComponent): void {
        this.highestZ++;
        win.element.style.zIndex = this.highestZ.toString();

        this.windows.forEach(w => {
            if (w === win) w.element.classList.add('active-window');
            else w.element.classList.remove('active-window');
        });
    }
}
