import {
    IUpdateStateRepository,
    UpdateState,
} from '../../core/update/interfaces/IUpdateStateRepository';
import { StorageService } from '../StorageService';

const STORAGE_KEY = 'update:state';

const DEFAULT_STATE: UpdateState = {
    lastCheckedAt: 0,
    lastKnownRemoteVersion: null,
    lastNotifiedRemoteVersion: null,
};

export class UpdateStateRepository implements IUpdateStateRepository {
    private readonly _storage: StorageService;

    public constructor(storage: StorageService) {
        this._storage = storage;
    }

    public load(): UpdateState {
        const state = this._storage.load<UpdateState>(STORAGE_KEY, DEFAULT_STATE);
        return {
            ...DEFAULT_STATE,
            ...state,
        };
    }

    public save(state: UpdateState): void {
        this._storage.save(STORAGE_KEY, state);
    }
}
