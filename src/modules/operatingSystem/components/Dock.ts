import { APP_IDS, OS_CONFIG } from '../constants';
import './Dock.scss';

/**
 * Interface for a dock item configuration.
 */
export interface DockItemConfig {
    id: string;
    icon: string;
    label: string;
    isActive?: boolean;
    isOpen?: boolean;
    onClick?: () => void;
}

/**
 * Class for the dock component.
 */
export class Dock {
    private container: HTMLElement;
    private items: DockItemConfig[];
    private onItemClick?: (id: string) => void;

    /**
     * Creates a new Dock instance.
     * @param onItemClick - Callback function for when a dock item is clicked.
     */
    public constructor(onItemClick?: (id: string) => void) {
        this.onItemClick = onItemClick;
        this.items = this.getDockItems();
        this.container = this.render();
    }

    /**
     * Gets the dock items configuration.
     * @returns An array of DockItemConfig objects.
     */
    private getDockItems(): DockItemConfig[] {
        const userIcon = `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
        const webIcon = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
        const chatIcon = `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
        const mailIcon = `<svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
        const investIcon = `<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`;
        const parkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 19V8C2 6.34315 3.34315 5 5 5C5.85772 5 6.63136 5.35995 7.17812 5.93703M6 5.17071V19M22.0001 10.5C22.0001 12.9853 19.9854 15 17.5001 15C16.2057 15 15.039 14.4535 14.2181 13.5788L7.1792 5.93817M22.0001 10.5C22.0001 8.01472 19.9854 6 17.5001 6C16.0864 6 14.825 6.65184 14 7.67134M22.0001 10.5L22 19M10 9.00011V19M14 13.3421V19M18 14.9725V19M18 6.02746V11"></path></svg>`;
        const toolsIcon = `<svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;

        return [
            { id: APP_IDS.PROFILE, icon: userIcon, label: OS_CONFIG.DOCK.LABELS.PROFILE },
            { id: APP_IDS.INVEST, icon: investIcon, label: OS_CONFIG.DOCK.LABELS.INVEST },
            { id: APP_IDS.MAIL, icon: mailIcon, label: OS_CONFIG.DOCK.LABELS.MAIL },
            { id: APP_IDS.BROWSER, icon: webIcon, label: OS_CONFIG.DOCK.LABELS.BROWSER },
            { id: APP_IDS.MY_PARK, icon: parkIcon, label: OS_CONFIG.DOCK.LABELS.MY_PARK },
            { id: APP_IDS.CHAT, icon: chatIcon, label: OS_CONFIG.DOCK.LABELS.CHAT },
            { id: APP_IDS.TOOLS, icon: toolsIcon, label: OS_CONFIG.DOCK.LABELS.TOOLS },
        ];
    }

    /**
     * Renders the dock component.
     * @returns The dock component.
     */
    private render(): HTMLElement {
        const dockContainer = document.createElement('div');
        dockContainer.className = 'os-dock-container';

        this.items.forEach((item) => {
            const itemElement = document.createElement('div');
            itemElement.className = `dock-item ${item.isActive ? 'active' : ''}`;
            itemElement.dataset.id = item.id;
            itemElement.title = item.label;
            itemElement.innerHTML = item.icon;

            const indicator = document.createElement('div');
            indicator.className = 'dock-indicator';
            itemElement.appendChild(indicator);

            itemElement.addEventListener('click', () => this.handleItemClick(item, itemElement));

            dockContainer.appendChild(itemElement);
        });

        return dockContainer;
    }

    /**
     * Handles the click event for a dock item.
     * @param item - The dock item that was clicked.
     * @param element - The element that was clicked.
     */
    private handleItemClick(item: DockItemConfig, element: HTMLElement) {
        if (item.onClick) item.onClick();
        if (this.onItemClick) this.onItemClick(item.id);
    }

    /**
     * Sets the active state of a dock item.
     * @param id - The ID of the dock item to set as active.
     */
    public setActive(id: string): void {
        const el = this.container.querySelector(`.dock-item[data-id="${id}"]`);
        if (el) {
            this.container
                .querySelectorAll('.dock-item')
                .forEach((e) => e.classList.remove('active'));
            el.classList.add('active');
        }
    }

    /**
     * Removes the active state from a dock item.
     * @param id - The ID of the dock item to remove active state from.
     */
    public removeActive(id: string): void {
        const el = this.container.querySelector(`.dock-item[data-id="${id}"]`);
        if (el) {
            el.classList.remove('active');
        }
    }

    /**
     * Sets the open state of a dock item.
     * @param id - The ID of the dock item to set as open.
     * @param isOpen - Whether the dock item should be open.
     */
    public setAppOpen(id: string, isOpen: boolean): void {
        const el = this.container.querySelector(`.dock-item[data-id="${id}"]`);
        if (el) {
            if (isOpen) el.classList.add('open');
            else el.classList.remove('open');
        }
    }

    /**
     * Mounts the dock component to the parent element.
     * @param parent - The parent element to mount the dock component to.
     */
    public mount(parent: HTMLElement): void {
        parent.appendChild(this.container);
    }

    /**
     * Unmounts the dock component from the parent element.
     */
    public unmount(): void {
        this.container.remove();
    }
}
