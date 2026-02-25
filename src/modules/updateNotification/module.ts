import { version as localVersion } from '../../../package.json';
import { BaseModule } from '../../core/abstract/BaseModule';
import { IModuleConfigSchema } from '../../core/interfaces/IModuleConfig';
import { injectStyle } from '../../utils/DomUtils';
import { FORCE_DISPLAY_POPUP, UPDATE_CHECK_URL } from './constants';
/**
 * Interface for the API response
 */

// Import styles
// @ts-ignore
import styles from './style.scss?inline';

/**
 * Interface for the API response
 */
interface IUpdateResponse {
    version: string;
    Description: string;
}

/**
 * UpdateNotificationModule
 * Checks for updates and displays a notification if a new version is available.
 */
export class UpdateNotificationModule extends BaseModule {
    public get id(): string {
        return 'update_notification';
    }

    public get name(): string {
        return 'Notificateur de mise à jour';
    }

    public get description(): string {
        return "Affiche une notification lorsqu'une nouvelle version de la toolbox est disponible.";
    }

    public getConfigSchema(): IModuleConfigSchema {
        return {
            options: [],
        };
    }

    /**
     * Key for storing the ignored version in local storage.
     */
    private readonly IGNORED_VERSION_KEY = 'tpi_toolbox_ignored_version';

    protected onEnable(): void {
        injectStyle(styles);
        this.checkForUpdate();
    }

    protected onDisable(): void {
        const popup = document.querySelector('.tpi-update-notif');
        if (popup) {
            popup.remove();
        }
    }

    /**
     * Checks if an update is available.
     */
    private async checkForUpdate(): Promise<void> {
        try {
            const response = await fetch(UPDATE_CHECK_URL);
            if (!response.ok) {
                console.error('Update check failed:', response.statusText);
                return;
            }

            const data: IUpdateResponse = await response.json();
            const remoteVersion = data.version;
            // const localVersion matches the imported name

            const ignoredVersion = localStorage.getItem(this.IGNORED_VERSION_KEY);

            const isNewer = this.compareVersions(remoteVersion, localVersion) > 0;
            const isIgnored = ignoredVersion === remoteVersion;

            const shouldDisplay = FORCE_DISPLAY_POPUP || (isNewer && !isIgnored);

            if (shouldDisplay) {
                this.showNotification(localVersion, remoteVersion, data.Description);
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    }

    /**
     * Compares two semantic version strings.
     * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal.
     */
    private compareVersions(v1: string, v2: string): number {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);

        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;

            if (p1 > p2) return 1;
            if (p1 < p2) return -1;
        }

        return 0;
    }

    /**
     * Creates and displays the notification popup.
     */
    private showNotification(
        localVersion: string,
        remoteVersion: string,
        description: string,
    ): void {
        // Avoid duplicate popups
        if (document.querySelector('.tpi-update-notif')) return;

        const popup = document.createElement('div');
        popup.className = 'tpi-update-notif';
        popup.innerHTML = `
            <button class="tpi-update-notif__close" aria-label="Fermer">&times;</button>
            <div class="tpi-update-notif__title">Mise à jour disponible !</div>
            <div class="tpi-update-notif__versions">
                Version actuelle : ${localVersion} -> Nouvelle version : ${remoteVersion}
            </div>
            <div class="tpi-update-notif__content">
                ${description}
                <br>
                <a href="https://github.com/Yarkis01/TPI_Toolbox" target="_blank" class="tpi-update-notif__link">
                    Télécharger la mise à jour
                </a>
            </div>
        `;

        document.body.appendChild(popup);

        // Add close event listener
        const closeBtn = popup.querySelector('.tpi-update-notif__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                // Save ignored version to local storage
                localStorage.setItem(this.IGNORED_VERSION_KEY, remoteVersion);

                popup.style.opacity = '0';
                popup.style.transform = 'translateY(6px)';
                setTimeout(() => popup.remove(), 200); // Wait for animation
            });
        }
    }
}
