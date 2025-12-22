import { APP_INFORMATIONS } from '../constants/AppConstants';
import { IDS } from '../constants/LayoutConstants';
import { createElement } from '../../utils/DomUtils';

export type UpdateToastOptions = {
    latestVersion: string;
    onDismiss: () => void;
    onOpenGitHub: () => void;
};

/**
 * Simple top-right toast used to notify the user of an available update.
 */
export class UpdateToast {
    private _container: HTMLElement | null = null;

    /**
     * Shows the toast.
     */
    public show(options: UpdateToastOptions): void {
        // Avoid duplicates.
        if (this._container || document.getElementById(IDS.UPDATE_TOAST)) return;

        const title = `Mise à jour ${options.latestVersion} disponible`;
        const message = `Le pluggin ${APP_INFORMATIONS.APP_NAME} à une mise à jour de disponible`;

        const closeBtn = createElement(
            'button',
            {
                class: 'tpi-update-toast__close',
                type: 'button',
                title: 'Fermer',
                onclick: () => this.hide(options.onDismiss),
            },
            ['×'],
        );

        const header = createElement('div', { class: 'tpi-update-toast__header' }, [
            createElement('h3', { class: 'tpi-update-toast__title' }, [title]),
            closeBtn,
        ]);

        const openBtn = createElement(
            'button',
            {
                class: 'tpi-update-toast__button',
                type: 'button',
                onclick: () => options.onOpenGitHub(),
            },
            ['Ouvrir GitHub'],
        );

        const content = createElement('div', { class: 'tpi-update-toast__content' }, [
            header,
            createElement('p', { class: 'tpi-update-toast__message' }, [message]),
            createElement('div', { class: 'tpi-update-toast__actions' }, [openBtn]),
        ]);

        this._container = createElement('div', { id: IDS.UPDATE_TOAST }, [content]);
        document.body.appendChild(this._container);
    }

    /**
     * Hides the toast and runs the optional callback.
     */
    public hide(onDismiss?: () => void): void {
        this._container?.remove();
        this._container = null;
        if (onDismiss) onDismiss();
    }
}
