import { IModifier } from "../interfaces/IModifier";

/**
 * Modifier that colorizes entity statuses on specific pages.
 */
export class EntityStatusColorizerModifier implements IModifier {
    private readonly _allowedPages: string[] = ["attractions.php", "restaurants.php"];

    public apply(): void {
        if(window.location.href.endsWith(this._allowedPages[0]))
            this._colorizeAttractionStatuses();
        else if(window.location.href.endsWith(this._allowedPages[1]))
            this._colorizeRestaurantStatuses();
    }

    /**
     * Colorizes attraction cards based on their status.
     */
    private _colorizeAttractionStatuses(): void {
        const elements = document.querySelectorAll<HTMLElement>('article[class="owned-attraction-card"]');
        elements.forEach(element => {
            switch (element.dataset.status) {
                case 'en travaux':
                    element.style.border = '2px dashed orange';
                    break;
                case 'ferme':
                    element.style.border = '2px solid red';
                    break;
                case 'ouvert':
                    element.style.border = '2px solid green';
                    break;
                default:
                    break;
            }            
        });
    }

    /**
     * Colorizes restaurant cards based on their status.
     */
    private _colorizeRestaurantStatuses(): void {
        const elements = document.querySelectorAll<HTMLElement>('article[class="owned-restaurant-card"]');

        elements.forEach(element => {
            const status = element.querySelector<HTMLElement>('span.owned-restaurant-card__status')?.textContent?.toLowerCase();

            if(status) {
                if(status.includes("ouvert"))
                    element.style.border = '2px solid green';
                else if(status.includes("fermé"))
                    element.style.border = '2px solid red';
                else if(status.includes("en travaux"))
                    element.style.border = '2px dashed orange';
            }
        });
    }
}