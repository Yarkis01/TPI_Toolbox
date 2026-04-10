/**
 * Shared DOM helpers for the debug overlay.
 */

export function makeBtn(label: string, onClick: () => void, extraClass = ''): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = `tdbg-btn${extraClass ? ` ${extraClass}` : ''}`;
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
}

export function makeToolbar(children: HTMLElement[]): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'tdbg-toolbar';
    children.forEach((c) => bar.appendChild(c));
    return bar;
}

export function makeCheckbox(
    label: string,
    checked: boolean,
    onChange: (v: boolean) => void,
): HTMLElement {
    const wrap = document.createElement('label');
    wrap.className = 'tdbg-checkbox';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.addEventListener('change', () => onChange(input.checked));
    wrap.appendChild(input);
    wrap.appendChild(document.createTextNode(` ${label}`));
    return wrap;
}

export function makeTable(headers: string[]): {
    table: HTMLTableElement;
    tbody: HTMLTableSectionElement;
} {
    const table = document.createElement('table');
    table.className = 'tdbg-table';

    const thead = table.createTHead();
    const hr = thead.insertRow();
    headers.forEach((h) => {
        const th = document.createElement('th');
        th.textContent = h;
        hr.appendChild(th);
    });

    return { table, tbody: table.createTBody() };
}
