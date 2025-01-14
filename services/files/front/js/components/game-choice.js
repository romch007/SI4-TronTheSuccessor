export class GameChoice extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: "open"});
        fetch("/js/components/game-choice.html")
            .then(response => response.text())
            .then(text => {
                this.shadowRoot.innerHTML = text;
            });
    }
}