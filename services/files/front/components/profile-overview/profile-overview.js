import {HTMLComponent} from "/js/component.js";
import {fetchApi} from "/js/login-manager.js";

export class ProfileOverview extends HTMLComponent {
    constructor() {
        super("profile-overview", ["html", "css"]);
    }

    static get observedAttributes() {
        return ["stats"];
    }

    onVisible = () => this.#refresh();

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        this.#refresh();
    }

    #showNotification(message, duration, background, color) {
        document.dispatchEvent(new CustomEvent("show-notification", {
            detail: {
                message: message,
                duration: duration,
                background: background,
                color: color
            }
        }));
    }

    async #sendFriendRequest(friend) {
        const response = await fetchApi(`/api/user/friends/${friend}`, {
            method: "POST"
        });

        if (response.ok)
            this.#showNotification("Friend request sent!", 2000, "#8E24AA", "white");
        else {
            const error = await response.json();
            this.#showNotification(`Error: ${error.error}`, 2000, "red", "white");
        }
    }

    onSetupCompleted = async () => {
        this.rank = this.shadowRoot.getElementById("profile-rank");
        this.profileStats = this.shadowRoot.getElementById("profiles-stats");
        this.profilePfp = this.shadowRoot.getElementById("profile-pfp");

        this.shadowRoot.getElementById("modify-password").addEventListener("click", () => {
            // TODO: implement password change
        });
        this.shadowRoot.getElementById("share").addEventListener("click", () => {
            navigator.clipboard.writeText(location.href).then(() => {
                this.#showNotification("Profile URL copied to clipboard!", 2000, "#8E24AA", "white");
            });
        });
    };

    #refresh() {
        if (!this.rank) return;
        this.stats = JSON.parse(this.stats);

        if (this.stats.loggedusername && this.stats.loggedusername === this.stats.username)
            this.shadowRoot.getElementById("profile-buttons-container").classList.toggle("logged-in");
        this.shadowRoot.getElementById("add-friend").addEventListener("click", async () => {
            if (!this.stats.loggedusername) {
                // TODO: open login modal
            } else await this.#sendFriendRequest(this.stats.username);
        });

        this.profilePfp.setAttribute("src", "/assets/profile.svg");
        this.profilePfp.setAttribute("username", this.stats.username);
        this.rank.setAttribute("rank", this.stats.rank);
        this.rank.setAttribute("points", this.stats.eloInRank);
        this.rank.setAttribute("baserank", this.stats.baseRank);
        this.profileStats.setAttribute("games", this.stats.games);
        this.profileStats.setAttribute("time", this.stats.timePlayed);
        this.profileStats.setAttribute("streak", this.stats.winStreak);
        const totalGames = this.stats.games - this.stats.draws;
        if (totalGames === 0) this.profileStats.setAttribute("winrate", "-");
        else this.profileStats.setAttribute("winrate", Math.round((this.stats.wins * 100 / totalGames)));
    }
}
