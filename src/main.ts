import { App } from './core/App';
import { IframeApp } from './core/IframeApp';
import IApp from './core/interfaces/IApp';

(async () => {
    const app: IApp = window.top === window.self ? new App() : new IframeApp();
    await app.start();
})();
