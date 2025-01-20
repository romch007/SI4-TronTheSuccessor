export class GameChoice extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: "open"});
        fetch("/components/game-choice/app-game-choice/game-choice.html")
            .then(response => response.text())
            .then(text => {
                this.shadowRoot.innerHTML = text;
                this.shadowRoot.getElementById("local-game").addEventListener("click", () => {
                    document.dispatchEvent(new CustomEvent("menu-selection", {detail: "help"}));
                });
            });
    }
}
