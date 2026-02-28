import { BaseModule } from '../../core/abstract/BaseModule';
import { StorageService } from '../../services/StorageService';
import { REORDER_SELECTORS, STORAGE_KEYS } from './constants';
import './styles.scss';

/**
 * Module to allow reordering zones vertically via drag-and-drop.
 */
export class ZoneReorderModule extends BaseModule {
    private _draggedElement: HTMLElement | null = null;
    private _listeners: Map<HTMLElement, { type: string; listener: EventListener }[]> = new Map();

    private get _storage(): StorageService {
        return StorageService.getInstance();
    }

    /**
     * @inheritdoc
     */
    public get id(): string {
        return 'zone_reorder';
    }

    /**
     * @inheritdoc
     */
    public get name(): string {
        return 'Réorganisation des zones';
    }

    /**
     * @inheritdoc
     */
    public get description(): string {
        return 'Ajoute une poignée (3 tirets) aux entêtes des zones pour pouvoir les réorganiser verticalement (drag & drop).';
    }

    /**
     * @inheritdoc
     */
    protected onEnable(): void {
        if (this._isTargetPage()) {
            this._setupZoneReorder();
        }
    }

    /**
     * @inheritdoc
     */
    protected onDisable(): void {
        this._listeners.forEach((events, element) => {
            events.forEach(({ type, listener }) => {
                element.removeEventListener(type, listener);
            });
        });

        const listContainer = document.querySelector(REORDER_SELECTORS.ZONE_LIST);
        if (listContainer) {
            this._listeners.get(listContainer as HTMLElement)?.forEach(({ type, listener }) => {
                listContainer.removeEventListener(type, listener);
            });
        }
        this._listeners.clear();

        document.querySelectorAll(REORDER_SELECTORS.HANDLE_CLASS_SELECTOR).forEach((handle) => {
            handle.remove();
        });

        document.querySelectorAll(REORDER_SELECTORS.ZONE_GROUP).forEach((group) => {
            group.removeAttribute('draggable');
            group.classList.remove(REORDER_SELECTORS.DRAGGING_CLASS);
            group.classList.remove(REORDER_SELECTORS.DRAG_OVER_CLASS);
        });
    }

    /**
     * Checks if the current page is the target page.
     */
    private _isTargetPage(): boolean {
        return document.location.href.includes(REORDER_SELECTORS.PAGE_MATCH);
    }

    /**
     * Sets up the zone reorder functionality.
     */
    private _setupZoneReorder(): void {
        const listContainer = document.querySelector(REORDER_SELECTORS.ZONE_LIST);
        if (!listContainer) return;

        const groups = Array.from(listContainer.querySelectorAll<HTMLElement>(REORDER_SELECTORS.ZONE_GROUP));

        // Load order
        const savedOrder = this._storage.load<string[]>(STORAGE_KEYS.ZONE_ORDER, []);
        if (savedOrder && savedOrder.length > 0) {
            this._reorderDOM(listContainer as HTMLElement, groups, savedOrder);
        }

        // Apply drag attributes and UI
        const sortedGroups = Array.from(listContainer.querySelectorAll<HTMLElement>(REORDER_SELECTORS.ZONE_GROUP));
        sortedGroups.forEach((group) => {
            this._setupDraggableGroup(group);
        });

        // Add events to the list container to catch drops in the gaps
        this._setupListContainerEvents(listContainer as HTMLElement);
    }

    /**
     * Reorders the DOM elements based on the saved order.
     * @param container The container element.
     * @param groups The array of group elements.
     * @param savedOrder The saved order array.
     */
    private _reorderDOM(container: HTMLElement, groups: HTMLElement[], savedOrder: string[]): void {
        const map = new Map<string, HTMLElement>();
        groups.forEach(group => {
            const name = this._getZoneName(group);
            if (name) {
                map.set(name, group);
            }
        });

        // Append in saved order
        savedOrder.forEach(name => {
            const group = map.get(name);
            if (group) {
                container.appendChild(group);
                map.delete(name);
            }
        });

        // Append remaining that were not in saved order
        map.forEach(group => {
            container.appendChild(group);
        });
    }

    /**
     * Gets the name of a zone from its group element.
     * @param group The group element.
     * @returns The zone name.
     */
    private _getZoneName(group: HTMLElement): string {
        return group.querySelector(REORDER_SELECTORS.ZONE_NAME)?.textContent?.trim() || '';
    }

    /**
     * Sets up the draggable behavior for a group element.
     * @param group The group element.
     */
    private _setupDraggableGroup(group: HTMLElement): void {
        const titleElement = group.querySelector<HTMLElement>(REORDER_SELECTORS.ZONE_NAME);
        if (!titleElement) return;

        // If exist, prevent double add
        if (titleElement.querySelector(REORDER_SELECTORS.HANDLE_CLASS_SELECTOR)) return;

        const handle = document.createElement('span');
        handle.className = REORDER_SELECTORS.HANDLE_CLASS;
        handle.innerHTML = `
            <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        `;

        // Prepend the handle inside the title
        titleElement.insertBefore(handle, titleElement.firstChild);

        group.setAttribute('draggable', 'true');

        const addEvent = (el: HTMLElement, type: string, listener: EventListener) => {
            el.addEventListener(type, listener);
            if (!this._listeners.has(el)) {
                this._listeners.set(el, []);
            }
            this._listeners.get(el)!.push({ type, listener });
        };

        addEvent(group, 'dragstart', this._handleDragStart.bind(this) as EventListener);
        addEvent(group, 'dragend', this._handleDragEnd.bind(this) as EventListener);

        // We handle dragover, dragenter, dragleave, and drop primarily on the list container now
        // to have smooth gap handling, but we keep individual events for visual feedback.
        addEvent(group, 'dragover', this._handleDragOver.bind(this) as EventListener);
        addEvent(group, 'dragenter', this._handleDragEnter.bind(this) as EventListener);
        addEvent(group, 'dragleave', this._handleDragLeave.bind(this) as EventListener);
        addEvent(group, 'drop', this._handleDrop.bind(this) as EventListener);
    }

    /**
     * Sets up the event listeners on the list container for gap drops.
     * @param container The list container element.
     */
    private _setupListContainerEvents(container: HTMLElement): void {
        const addEvent = (el: HTMLElement, type: string, listener: EventListener) => {
            el.addEventListener(type, listener);
            if (!this._listeners.has(el)) {
                this._listeners.set(el, []);
            }
            this._listeners.get(el)!.push({ type, listener });
        };

        addEvent(container, 'dragover', this._handleContainerDragOver.bind(this) as EventListener);
        addEvent(container, 'drop', this._handleContainerDrop.bind(this) as EventListener);
    }

    /**
     * Handles the dragstart event on a group element.
     * @param e The drag event.
     */
    private _handleDragStart(e: DragEvent): void {
        const target = e.currentTarget as HTMLElement;
        this._draggedElement = target;

        e.dataTransfer!.effectAllowed = 'move';
        e.dataTransfer!.setData('text/html', target.innerHTML); // Required in Firefox

        setTimeout(() => {
            target.classList.add(REORDER_SELECTORS.DRAGGING_CLASS);
        }, 0);
    }

    /**
     * Handles the dragend event on a group element.
     * @param e The drag event.
     */
    private _handleDragEnd(e: DragEvent): void {
        const target = e.currentTarget as HTMLElement;
        target.classList.remove(REORDER_SELECTORS.DRAGGING_CLASS);

        document.querySelectorAll(REORDER_SELECTORS.ZONE_GROUP).forEach(g => {
            g.classList.remove(REORDER_SELECTORS.DRAG_OVER_CLASS);
        });

        this._draggedElement = null;
    }

    /**
     * Handles the dragover event on a group element.
     * @param e The drag event.
     */
    private _handleDragOver(e: DragEvent): void {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
        return false as any;
    }

    /**
     * Handles the dragenter event on a group element.
     * @param e The drag event.
     */
    private _handleDragEnter(e: DragEvent): void {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        if (target !== this._draggedElement) {
            target.classList.add(REORDER_SELECTORS.DRAG_OVER_CLASS);
        }
    }

    /**
     * Handles the dragleave event on a group element.
     * @param e The drag event.
     */
    private _handleDragLeave(e: DragEvent): void {
        const target = e.currentTarget as HTMLElement;
        // Check if we are actually leaving the group (not just entering a child node)
        // A simple way is to check the related target, but dragleave events fire on children too
        // The safest way is to clear it, it will re-add on next dragenter inside
        target.classList.remove(REORDER_SELECTORS.DRAG_OVER_CLASS);
    }

    /**
     * Handles the drop event on a group element.
     * @param e The drag event.
     */
    private _handleDrop(e: DragEvent): void {
        e.stopPropagation();
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        target.classList.remove(REORDER_SELECTORS.DRAG_OVER_CLASS);

        // Default drop on an element itself
        if (this._draggedElement && this._draggedElement !== target) {
            const listContainer = target.parentNode;
            if (listContainer) {
                // Drop in the middle of a card. Use mouse position to decide before/after.
                const rect = target.getBoundingClientRect();
                const dropY = e.clientY;
                const threshold = rect.top + rect.height / 2;

                if (dropY < threshold) {
                    listContainer.insertBefore(this._draggedElement, target);
                } else {
                    listContainer.insertBefore(this._draggedElement, target.nextSibling);
                }

                this._saveOrder();
            }
        }
        return false as any;
    }

    /**
     * Handles the dragover event on the list container.
     * @param e The drag event.
     */
    private _handleContainerDragOver(e: DragEvent): void {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
    }

    /**
     * Handles the drop event on the list container.
     * @param e The drag event.
     */
    private _handleContainerDrop(e: DragEvent): void {
        // If the event was already handled by a children group, do nothing
        if (e.defaultPrevented || !this._draggedElement) return;

        e.preventDefault();

        const container = e.currentTarget as HTMLElement;
        const dropY = e.clientY;

        let targetBefore: HTMLElement | null = null;
        const groups = Array.from(container.querySelectorAll<HTMLElement>(REORDER_SELECTORS.ZONE_GROUP));

        // Find the group just below the mouse pointer
        for (const group of groups) {
            if (group === this._draggedElement) continue;
            const rect = group.getBoundingClientRect();
            // If the mouse is above the center of this group, we want to insert before it
            if (dropY < rect.top + rect.height / 2) {
                targetBefore = group;
                break;
            }
        }

        if (targetBefore) {
            container.insertBefore(this._draggedElement, targetBefore);
        } else {
            // If we didn't find any element below the mouse, append to the end
            container.appendChild(this._draggedElement);
        }

        this._saveOrder();
    }

    /**
     * Saves the current order to the storage service.
     */
    private _saveOrder(): void {
        const listContainer = document.querySelector(REORDER_SELECTORS.ZONE_LIST);
        if (!listContainer) return;

        const groups = Array.from(listContainer.querySelectorAll<HTMLElement>(REORDER_SELECTORS.ZONE_GROUP));
        const order = groups.map(g => this._getZoneName(g)).filter(n => n !== '');

        this._storage.save(STORAGE_KEYS.ZONE_ORDER, order);
    }
}
