import { CONFIG, IDS, STRINGS } from '../../core/Config';
import { IUpdateNotifier, UpdateInfo } from '../../core/update/interfaces/IUpdateNotifier';
import { createElement } from '../../utils/DomUtils';
import { Logger } from '../../utils/Logger';
import './styles/_update-toast.scss';

export class SlideInToastUpdateNotifier implements IUpdateNotifier {
    private readonly _logger: Logger;

    public constructor() {
        this._logger = new Logger('SlideInToastUpdateNotifier');
    }

    public notify(update: UpdateInfo): void {
        this._logger.info(
            `Update available: local=${update.localVersion}, remote=${update.remoteVersion}`,
        );

        // Ensure only one toast exists
        const existing = document.getElementById(IDS.UPDATE_TOAST);
        existing?.remove();

        const title = STRINGS.UPDATE_AVAILABLE_TITLE(update.remoteVersion);

        const toast = createElement('div', { id: IDS.UPDATE_TOAST, class: 'tpi-update-toast' }, [
            // Header: Title + Close
            createElement('div', { class: 'tpi-update-toast__header' }, [
                createElement('div', { class: 'tpi-update-toast__title' }, [title]),
                createElement(
                    'button',
                    {
                        class: 'tpi-update-toast__close',
                        type: 'button',
                        onclick: () => this._dismiss(toast),
                        title: STRINGS.UPDATE_AVAILABLE_CLOSE,
                        'aria-label': STRINGS.UPDATE_AVAILABLE_CLOSE,
                    },
                    ['✕'],
                ),
            ]),

            // Description
            createElement('div', { class: 'tpi-update-toast__meta' }, [
                update.isRemoteNewer
                    ? 'Votre script est obsolète.'
                    : 'Le pluggin TPI Toolbox à une mise à jour de disponible',
            ]),

            // GitHub button (full row)
            createElement('div', { class: 'tpi-update-toast__footer' }, [
                createElement(
                    'a',
                    {
                        class: 'tpi-update-toast__btn tpi-update-toast__btn--primary',
                        href: CONFIG.DEVELOPER_WEBSITE,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        title: STRINGS.UPDATE_AVAILABLE_ACTION,
                    },
                    [STRINGS.UPDATE_AVAILABLE_ACTION],
                ),
            ]),
        ]);

        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => toast.classList.add('tpi-update-toast--visible'));
    }

    private _dismiss(toast: HTMLElement): void {
        toast.classList.remove('tpi-update-toast--visible');
        toast.classList.add('tpi-update-toast--hiding');

        window.setTimeout(() => toast.remove(), 250);
    }
}
