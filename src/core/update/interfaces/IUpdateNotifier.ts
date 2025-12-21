export interface UpdateInfo {
    localVersion: string;
    remoteVersion: string;
    isRemoteNewer: boolean;
}

/**
 * Abstraction responsible for presenting update information to the user.
 */
export interface IUpdateNotifier {
    notify(update: UpdateInfo): void;
}
