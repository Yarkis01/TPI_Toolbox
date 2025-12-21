export interface UpdateState {
    lastCheckedAt: number;
    lastKnownRemoteVersion: string | null;
    lastNotifiedRemoteVersion: string | null;
}

/**
 * Abstraction for persisting update-check state (cooldown, last-notified version, etc.).
 */
export interface IUpdateStateRepository {
    load(): UpdateState;
    save(state: UpdateState): void;
}
