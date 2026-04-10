import { createElement, injectStyle } from '../../utils/DomUtils';
import IBootstrap from '../interfaces/IBootstrap';

const GITHUB_ISSUES_URL = 'https://github.com/Yarkis01/TPI_Toolbox/issues';
const PAGE_MATCH = 'support.php';
const BLOCK_ID = 'tpi-support-warning';

/**
 * Bootstrap that injects a warning block on the support page to inform
 * the user that bugs may originate from TPI Toolbox rather than the game.
 */
export class SupportWarning implements IBootstrap {
    /**
     * @inheritdoc
     */
    public run(): void {
        if (!window.location.href.includes(PAGE_MATCH) || document.getElementById(BLOCK_ID)) {
            return;
        }

        const actionsDiv = document.querySelector<HTMLElement>('.support-actions');
        if (!actionsDiv) {
            return;
        }

        injectStyle(
            `#${BLOCK_ID}.dash-block { border-color: #c0392b; }` +
                `#${BLOCK_ID} .dash-block__head { background-color: #c0392b; }`,
        );

        const block = this._createWarningBlock();
        actionsDiv.insertAdjacentElement('beforebegin', block);
    }

    /**
     * Builds the warning block element using the game's native CSS classes.
     */
    private _createWarningBlock(): HTMLElement {
        const issuesBtn = createElement(
            'a',
            {
                href: GITHUB_ISSUES_URL,
                target: '_blank',
                rel: 'noopener noreferrer',
                class: 'btn btn--primary',
            },
            ['Signaler un bug sur GitHub'],
        );

        const paragraph = createElement('p', { class: 'support-hint', style: 'font-size: 1rem;' }, [
            'Vous utilisez ',
            createElement('strong', {}, ['TPI Toolbox']),
            '. Certains bugs que vous constatez peuvent provenir de la Toolbox et non du jeu. ' +
                "Si c'est le cas, merci de ne pas ouvrir de ticket ici.",
        ]);

        const body = createElement('div', { class: 'dash-block__body' }, [paragraph, issuesBtn]);

        const block = createElement(
            'section',
            {
                id: BLOCK_ID,
                class: 'dash-block dash-block--teal',
            },
            [
                createElement('header', { class: 'dash-block__head' }, [
                    createElement('h2', { class: 'dash-block__title' }, ['⚠️ TPI Toolbox détecté']),
                ]),
                body,
            ],
        );

        return block;
    }
}
