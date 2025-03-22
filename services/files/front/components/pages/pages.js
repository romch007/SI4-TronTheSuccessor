import {HTMLComponent} from "/js/component.js";

/**
 * Component that manages the pages of the website.
 * It reads the URL and shows the corresponding page.
 */
export class Pages extends HTMLComponent {
    level = 1;

    static get observedAttributes() {
        return ["level"];
    }

    constructor() {
        super("/components/pages", "pages.html");
        window.addEventListener("popstate", this.onVisible);
    }

    onSetupCompleted = () => {
        this.pageSlot = this.shadowRoot.getElementById("pages-slot");
        this.errorPage = this.shadowRoot.getElementById("404");
    }

    onVisible = () => this.#showElement(location.pathname.split("/")[this.level] ?? "");

    /**
     * @param {string} elementId The id of the page to show.
     * @param {{string: string}} attr The attributes to set to the page.
     */
    #showElement(elementId, attr = undefined) {
        const elements = this.pageSlot.assignedElements();
        const idExists = elements.some(el => el.id === elementId);
        if (!idExists) elementId = "404";

        [...elements, this.errorPage].forEach(element => {
            if (element.id === elementId) {
                element.style.display = "block";
                if (attr) Object.entries(attr).forEach(([k, v]) => element.setAttribute(k, v));
            } else element.style.display = "none";
        });
    }
}

/**
 * Change the page without reloading the website.
 * @param {string} page URL of the page to show
 */
export function changePage(page) {
    const state = page;
    if (history.state === state) return;
    history.pushState(state, "", page);
    window.dispatchEvent(new PopStateEvent("popstate", {state: state}));
}
