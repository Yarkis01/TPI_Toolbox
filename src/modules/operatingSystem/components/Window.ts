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
    onMoveOrResize?: () => void;
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

    private minWidth = 300;
    private minHeight = 200;

    private iframeFocusOverlay: HTMLElement | null = null;

    private boundMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
    private boundMouseUpHandler: (() => void) | null = null;

    /**
     * Creates a new WindowComponent instance.
     * @param options - The options for the window.
     */
    private snapPreview: HTMLElement | null = null;
    private activeSnapType: 'left' | 'right' | 'top' | null = null;
    private snapThreshold = 20; // px distance from edge to trigger snap

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

        const maxBtn = document.createElement('div');
        maxBtn.className = 'control-btn maximize';
        maxBtn.title = 'Agrandir';
        maxBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleMaximize();
        };

        controls.appendChild(closeBtn);
        controls.appendChild(maxBtn);

        const title = document.createElement('div');
        title.className = 'window-title';
        title.innerText = this.options.title;

        header.appendChild(controls);
        header.appendChild(title);

        const content = document.createElement('div');
        content.className = 'window-content';
        content.appendChild(this.options.content);

        this.iframeFocusOverlay = document.createElement('div');
        this.iframeFocusOverlay.className = 'iframe-focus-overlay';
        this.iframeFocusOverlay.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.focus();
        });
        content.appendChild(this.iframeFocusOverlay);

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
        this.cleanup();
        this.element.remove();
        if (this.snapPreview) this.snapPreview.remove();
        if (this.options.onClose) this.options.onClose();
    }

    /**
     * Focuses the window.
     */
    public focus(): void {
        if (this.options.onFocus) this.options.onFocus();
    }

    /**
     * Gets the current state of the window for persistence.
     * @returns The window state object.
     */
    public getWindowState(): {
        x: number;
        y: number;
        width: number;
        height: number;
        zIndex: number;
        isMaximized: boolean;
    } {
        return {
            x: this.element.offsetLeft,
            y: this.element.offsetTop,
            width: this.element.offsetWidth,
            height: this.element.offsetHeight,
            zIndex: parseInt(this.element.style.zIndex || '100', 10),
            isMaximized: this.isMaximized,
        };
    }

    /**
     * Applies a saved state to the window.
     * @param state - The state to apply.
     */
    public applyState(state: {
        x: number;
        y: number;
        width: number;
        height: number;
        isMaximized: boolean;
    }): void {
        if (state.isMaximized) {
            this.maximize();
        } else {
            this.element.style.left = `${state.x}px`;
            this.element.style.top = `${state.y}px`;
            this.element.style.width = `${state.width}px`;
            this.element.style.height = `${state.height}px`;
        }
    }

    /**
     * Toggles the maximized state of the window.
     */
    public toggleMaximize(): void {
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

        this.saveState();

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
     * Saves the current window state (position and size).
     */
    private saveState(): void {
        this.preMaximizeState = {
            left: this.element.style.left,
            top: this.element.style.top,
            width: this.element.style.width,
            height: this.element.style.height,
        };
    }

    private dragStartX = 0;
    private dragStartY = 0;
    private wasMaximizedOnDragStart = false;
    private hasMovedEnough = false;
    private readonly dragThreshold = 5;

    /**
     * Makes the window draggable.
     */
    private makeDraggable(): void {
        const header = this.element.querySelector('.window-header') as HTMLElement;

        header.addEventListener('mousedown', (e) => {
            if ((e.target as HTMLElement).closest('.window-controls')) return;

            this.wasMaximizedOnDragStart = this.isMaximized;
            this.hasMovedEnough = false;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;

            this.isDragging = true;
            this.dragOffsetX = e.clientX - this.element.offsetLeft;
            this.dragOffsetY = e.clientY - this.element.offsetTop;
            this.element.classList.add('resizing');

            this.focus();
        });

        this.boundMouseMoveHandler = this.handleMouseMove.bind(this);
        this.boundMouseUpHandler = this.handleMouseUp.bind(this);

        document.addEventListener('mousemove', this.boundMouseMoveHandler);
        document.addEventListener('mouseup', this.boundMouseUpHandler);
    }

    /**
     * Handles mouse move events for dragging and resizing.
     * @param e - The mouse event.
     */
    private handleMouseMove(e: MouseEvent): void {
        if (this.isDragging) {
            e.preventDefault();

            if (!this.hasMovedEnough) {
                const deltaX = Math.abs(e.clientX - this.dragStartX);
                const deltaY = Math.abs(e.clientY - this.dragStartY);
                if (deltaX > this.dragThreshold || deltaY > this.dragThreshold) {
                    this.hasMovedEnough = true;

                    if (this.wasMaximizedOnDragStart && this.isMaximized) {
                        const ratio = this.dragStartX / this.element.offsetWidth;
                        this.restore();

                        const newWidth = parseFloat(this.element.style.width);
                        this.element.style.left = `${e.clientX - newWidth * ratio}px`;
                        this.element.style.top = `${e.clientY - 10}px`;

                        this.dragOffsetX = newWidth * ratio;
                        this.dragOffsetY = 10;
                    }
                } else {
                    return;
                }
            }

            this.element.style.left = `${e.clientX - this.dragOffsetX}px`;
            this.element.style.top = `${e.clientY - this.dragOffsetY}px`;

            this.checkSnapZone(e);
        }

        if (this.isResizing) {
            this.handleResize(e);
        }
    }

    /**
     * Handles mouse up events for dragging and resizing.
     */
    private handleMouseUp(): void {
        let didMoveOrResize = false;

        if (this.isDragging) {
            this.isDragging = false;
            this.element.classList.remove('resizing');
            didMoveOrResize = true;

            if (this.activeSnapType) {
                this.snapTo(this.activeSnapType);
                this.hideSnapPreview();
            }
        }
        if (this.isResizing) {
            this.stopResize();
            didMoveOrResize = true;
        }

        if (didMoveOrResize && this.options.onMoveOrResize) {
            this.options.onMoveOrResize();
        }
    }

    /**
     * Cleans up event listeners when the window is destroyed.
     */
    private cleanup(): void {
        if (this.boundMouseMoveHandler) {
            document.removeEventListener('mousemove', this.boundMouseMoveHandler);
            this.boundMouseMoveHandler = null;
        }
        if (this.boundMouseUpHandler) {
            document.removeEventListener('mouseup', this.boundMouseUpHandler);
            this.boundMouseUpHandler = null;
        }
    }

    /**
     * Creates or retrieves the snap preview element.
     * @returns The snap preview element.
     */
    private getPreviewElement(): HTMLElement {
        if (!this.snapPreview) {
            this.snapPreview = document.createElement('div');
            this.snapPreview.className = 'window-snap-preview';
            document.body.appendChild(this.snapPreview);
        }
        return this.snapPreview;
    }

    /**
     * Checks if the window is within a snap zone.
     * @param e - The mouse event.
     */
    private checkSnapZone(e: MouseEvent): void {
        const x = e.clientX;
        const y = e.clientY;
        const w = window.innerWidth;
        const h = window.innerHeight;

        if (y < this.snapThreshold) {
            this.showSnapPreview('top');
        } else if (x < this.snapThreshold) {
            this.showSnapPreview('left');
        } else if (x > w - this.snapThreshold) {
            this.showSnapPreview('right');
        } else {
            this.hideSnapPreview();
        }
    }

    /**
     * Shows the snap preview for a specific zone.
     * @param type - The type of snap zone (left, right, top).
     */
    private showSnapPreview(type: 'left' | 'right' | 'top'): void {
        if (this.activeSnapType === type) return;

        this.activeSnapType = type;
        const preview = this.getPreviewElement();
        preview.classList.add('active');

        preview.style.top = '';
        preview.style.left = '';
        preview.style.right = '';
        preview.style.bottom = '';
        preview.style.width = '';
        preview.style.height = '';

        if (type === 'top') {
            preview.style.top = '10px';
            preview.style.left = '10px';
            preview.style.width = 'calc(100% - 20px)';
            preview.style.height = 'calc(100% - 20px)';
        } else if (type === 'left') {
            preview.style.top = '10px';
            preview.style.left = '10px';
            preview.style.width = 'calc(50% - 15px)';
            preview.style.height = 'calc(100% - 20px)';
        } else if (type === 'right') {
            preview.style.top = '10px';
            preview.style.right = '10px';
            preview.style.width = 'calc(50% - 15px)';
            preview.style.height = 'calc(100% - 20px)';
        }
    }

    /**
     * Hides the snap preview.
     */
    private hideSnapPreview(): void {
        this.activeSnapType = null;
        if (this.snapPreview) {
            this.snapPreview.classList.remove('active');
        }
    }

    /**
     * Snaps the window to a specific zone.
     * @param type - The type of snap zone (left, right, top).
     */
    private snapTo(type: 'left' | 'right' | 'top'): void {
        if (type === 'top') {
            this.maximize();
            return;
        }
        this.element.style.top = '0';
        this.element.style.height = '100%';
        this.element.style.width = '50%';
        this.element.style.borderRadius = '0';
        if (type === 'left') {
            this.element.style.left = '0';
        } else if (type === 'right') {
            this.element.style.left = '50%';
        }
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
