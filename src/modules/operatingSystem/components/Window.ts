import './Window.scss';

/**
 * Interface for window options.
 */
export interface WindowOptions {
    title: string;
    width?: number;
    height?: number;
    content: HTMLElement;
    x?: number;
    y?: number;

    onClose?: () => void;
    onFocus?: () => void;
    onMinimize?: () => void;
}

/**
 * Class for the window component.
 */
export class WindowComponent {
    public element: HTMLElement;
    private options: WindowOptions;

    private isDragging: boolean = false;
    private dragOffsetX: number = 0;
    private dragOffsetY: number = 0;

    private isResizing: boolean = false;
    private resizeDirection: string = '';
    private resizeStartX: number = 0;
    private resizeStartY: number = 0;
    private resizeStartWidth: number = 0;
    private resizeStartHeight: number = 0;
    private resizeStartLeft: number = 0;
    private resizeStartTop: number = 0;

    private isMaximized: boolean = false;
    private preMaximizeState: { left: string; top: string; width: string; height: string } | null =
        null;
    private isMinimized: boolean = false;

    private minWidth = 300;
    private minHeight = 200;

    /**
     * Creates a new WindowComponent instance.
     * @param options - The options for the window.
     */
    public constructor(options: WindowOptions) {
        this.options = options;
        this.element = this.render();
        this.makeDraggable();
        this.center();
    }

    /**
     * Renders the window.
     * @returns The window element.
     */
    private render(): HTMLElement {
        const win = document.createElement('div');
        win.className = 'os-window';
        win.style.width = `${this.options.width || 600}px`;
        win.style.height = `${this.options.height || 400}px`;

        win.style.boxSizing = 'border-box';

        const header = document.createElement('div');
        header.className = 'window-header';

        const controls = document.createElement('div');
        controls.className = 'window-controls';

        const closeBtn = document.createElement('div');
        closeBtn.className = 'control-btn close';
        closeBtn.title = 'Fermer';
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.close();
        };

        const minBtn = document.createElement('div');
        minBtn.className = 'control-btn minimize';
        minBtn.title = 'Réduire';
        minBtn.onclick = (e) => {
            e.stopPropagation();
            this.minimize();
        };

        const maxBtn = document.createElement('div');
        maxBtn.className = 'control-btn maximize';
        maxBtn.title = 'Agrandir';
        maxBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleMaximize();
        };

        controls.appendChild(closeBtn);
        controls.appendChild(minBtn);
        controls.appendChild(maxBtn);

        const title = document.createElement('div');
        title.className = 'window-title';
        title.innerText = this.options.title;
        header.addEventListener('dblclick', () => this.toggleMaximize());

        header.appendChild(controls);
        header.appendChild(title);

        const content = document.createElement('div');
        content.className = 'window-content';
        content.appendChild(this.options.content);

        win.appendChild(header);
        win.appendChild(content);

        this.createResizeHandles(win);

        if (this.options.x !== undefined && this.options.y !== undefined) {
            win.style.left = `${this.options.x}px`;
            win.style.top = `${this.options.y}px`;
        }

        return win;
    }

    /**
     * Creates resize handles for the window.
     * @param win - The window element.
     */
    private createResizeHandles(win: HTMLElement): void {
        const directions = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

        directions.forEach((dir) => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${dir}`;
            handle.addEventListener('mousedown', (e) => this.startResize(e, dir));
            win.appendChild(handle);
        });
    }

    /**
     * Centers the window on the screen.
     */
    private center(): void {
        const x = (window.innerWidth - (this.options.width || 600)) / 2;
        const y = (window.innerHeight - (this.options.height || 400)) / 2;
        this.element.style.left = `${Math.max(0, x)}px`;
        this.element.style.top = `${Math.max(0, y)}px`;
    }

    /**
     * Closes the window.
     */
    public close(): void {
        this.element.remove();
        if (this.options.onClose) this.options.onClose();
    }

    /**
     * Focuses the window.
     */
    public focus(): void {
        if (this.options.onFocus) this.options.onFocus();
    }

    /**
     * Toggles the maximized state of the window.
     */
    public toggleMaximize(): void {
        if (this.isMinimized) this.unminimize();

        if (this.isMaximized) {
            this.restore();
        } else {
            this.maximize();
        }
    }

    /**
     * Maximizes the window.
     */
    public maximize(): void {
        if (this.isMaximized) return;

        this.preMaximizeState = {
            left: this.element.style.left,
            top: this.element.style.top,
            width: this.element.style.width,
            height: this.element.style.height,
        };

        this.element.style.left = '0';
        this.element.style.top = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.borderRadius = '0';
        this.element.classList.add('maximized');
        this.isMaximized = true;
    }

    /**
     * Restores the window to its previous state.
     */
    public restore(): void {
        if (!this.isMaximized) return;

        if (this.preMaximizeState) {
            this.element.style.left = this.preMaximizeState.left;
            this.element.style.top = this.preMaximizeState.top;
            this.element.style.width = this.preMaximizeState.width;
            this.element.style.height = this.preMaximizeState.height;
        }
        this.element.style.borderRadius = '';
        this.element.classList.remove('maximized');
        this.isMaximized = false;
        this.preMaximizeState = null;
    }

    /**
     * Minimizes the window.
     */
    public minimize(): void {
        if (this.isMinimized) return;

        this.isMinimized = true;
        this.element.classList.add('minimized');
        if (this.options.onMinimize) this.options.onMinimize();
    }

    /**
     * Unminimizes the window.
     */
    public unminimize(): void {
        if (!this.isMinimized) return;

        this.isMinimized = false;
        this.element.classList.remove('minimized');
        this.focus();
    }

    /**
     * Makes the window draggable.
     */
    private makeDraggable(): void {
        const header = this.element.querySelector('.window-header') as HTMLElement;

        header.addEventListener('mousedown', (e) => {
            if ((e.target as HTMLElement).closest('.window-controls')) return;
            if (this.isMaximized) return;

            this.isDragging = true;
            this.dragOffsetX = e.clientX - this.element.offsetLeft;
            this.dragOffsetY = e.clientY - this.element.offsetTop;
            this.element.classList.add('resizing');

            this.focus();
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                if (this.isMaximized) {
                    this.isDragging = false;
                    this.element.classList.remove('resizing');
                    return;
                }
                e.preventDefault();
                this.element.style.left = `${e.clientX - this.dragOffsetX}px`;
                this.element.style.top = `${e.clientY - this.dragOffsetY}px`;
            }

            if (this.isResizing) {
                this.handleResize(e);
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.element.classList.remove('resizing');
            }
            if (this.isResizing) {
                this.stopResize();
            }
        });
    }

    /**
     * Starts the resize operation.
     * @param e - The mouse event.
     * @param direction - The direction of the resize.
     */
    private startResize(e: MouseEvent, direction: string): void {
        if (this.isMaximized) return;

        e.preventDefault();
        e.stopPropagation();

        this.isResizing = true;
        this.resizeDirection = direction;
        this.resizeStartX = e.clientX;
        this.resizeStartY = e.clientY;
        this.resizeStartWidth = this.element.offsetWidth;
        this.resizeStartHeight = this.element.offsetHeight;
        this.resizeStartLeft = this.element.offsetLeft;
        this.resizeStartTop = this.element.offsetTop;

        this.element.classList.add('resizing');
        this.focus();
    }

    /**
     * Handles the resize operation.
     * @param e - The mouse event.
     */
    private handleResize(e: MouseEvent): void {
        e.preventDefault();

        const deltaX = e.clientX - this.resizeStartX;
        const deltaY = e.clientY - this.resizeStartY;

        let newWidth = this.resizeStartWidth;
        let newHeight = this.resizeStartHeight;
        let newLeft = this.resizeStartLeft;
        let newTop = this.resizeStartTop;

        const dir = this.resizeDirection;

        if (dir.includes('e')) {
            newWidth = this.resizeStartWidth + deltaX;
        } else if (dir.includes('w')) {
            newWidth = this.resizeStartWidth - deltaX;
            newLeft = this.resizeStartLeft + deltaX;
        }

        if (dir.includes('s')) {
            newHeight = this.resizeStartHeight + deltaY;
        } else if (dir.includes('n')) {
            newHeight = this.resizeStartHeight - deltaY;
            newTop = this.resizeStartTop + deltaY;
        }

        if (newWidth < this.minWidth) {
            newWidth = this.minWidth;
            if (dir.includes('w'))
                newLeft = this.resizeStartLeft + (this.resizeStartWidth - this.minWidth);
        }

        if (newHeight < this.minHeight) {
            newHeight = this.minHeight;
            if (dir.includes('n'))
                newTop = this.resizeStartTop + (this.resizeStartHeight - this.minHeight);
        }

        if (dir.includes('e') || dir.includes('w')) {
            this.element.style.width = `${newWidth}px`;
            if (dir.includes('w')) this.element.style.left = `${newLeft}px`;
        }

        if (dir.includes('n') || dir.includes('s')) {
            this.element.style.height = `${newHeight}px`;
            if (dir.includes('n')) this.element.style.top = `${newTop}px`;
        }
    }

    /**
     * Stops the resize operation.
     */
    private stopResize(): void {
        this.isResizing = false;
        this.element.classList.remove('resizing');
    }
}
