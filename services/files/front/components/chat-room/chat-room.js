import {HTMLComponent} from "/js/component.js";
import {fetchApi, getAccessToken, getUserInfo, renewAccessToken} from "/js/login-manager.js";

export class ChatRoom extends HTMLComponent {
    /** @type {string} */ room;

    static get observedAttributes() {
        return ["room", "pending"];
    }

    constructor() {
        super("chat-room", ["html", "css"]);
    }

    onSetupCompleted = () => {
        this.messagePanel = this.shadowRoot.getElementById("messages");
        this.messageInput = this.shadowRoot.getElementById("message-input");
        this.sendButton = this.shadowRoot.getElementById("send");
        this.notificationBanner = this.shadowRoot.getElementById("notification-banner");
        this.notificationMessage = this.shadowRoot.getElementById("notification-message");
        this.acceptRequestButton = this.shadowRoot.getElementById("accept-request");
        this.refuseRequestButton = this.shadowRoot.getElementById("refuse-request");
        this.notificationActionButton = this.shadowRoot.getElementById("notification-actions");
        this.sendButton.onclick = () => this.sendMessage();
        this.acceptRequestButton.onclick = () => this.handleFriendRequest("accept");
        this.refuseRequestButton.onclick = () => this.handleFriendRequest("refuse");
    };

    onVisible = () => {
        this.#refresh();
    };

    onHidden = () => {
        if (this.socket) this.socket.disconnect();
        this.socket = null;
    };

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        this.#refresh();
    }

    #refresh() {
        if (!this.messagePanel) return;
        this.getMessages().then(messages => this.#displayMessages(messages));
        this.messageInput.disabled = this.sendButton.disabled = this.pending !== "undefined";
        if (this.pending !== "undefined") {
            this.messageInput.title = this.sendButton.title = "You need to be friends to send messages";
            this.notificationBanner.classList.remove("hidden");
            if (this.pending === getUserInfo()?.username) this.notificationMessage.textContent = `Your friend request has not been accepted yet,  You can't send messages until they accept it.`;
            else {
                this.notificationMessage.textContent = `${this.pending} has sent you a friend request. You can't send messages until you accept it.`;
                this.notificationActionButton.classList.remove("hidden");
            }
        } else this.#openWebSocket().then();
    }

    #displayMessages(messages) {
        this.messagePanel.innerHTML = "";
        for (const message of messages) this.#displayMessage(message);
    }

    #displayMessage(message) {
        const messageElement = document.createElement("app-chat-room-message");
        messageElement.setAttribute("author", message.author);
        messageElement.setAttribute("content", message.content);
        messageElement.setAttribute("date", message.date);
        messageElement.setAttribute("type", message.type);
        messageElement.setAttribute("you", (message.author === getUserInfo()?.username).toString());
        this.messagePanel.appendChild(messageElement);
    }

    async #openWebSocket(retry = true) {
        if (this.socket) this.socket.disconnect();
        this.socket = io("/api/chat", {
            extraHeaders: {authorization: "Bearer " + await getAccessToken()},
            path: "/ws"
        });
        this.socket.on("connect_error", async (err) => {
            if (retry && err.message === "Authentication needed") {
                await renewAccessToken();
                this.#openWebSocket(false).then();
            } else console.error(err.message);
        });
        this.socket.on("message", (message) => this.#displayMessage(message));
        this.socket.emit("join", this.room);
    }

    async getMessages() {
        const response = await fetchApi(`/api/chat/${this.room}`);
        return await response.json();
    }

    async sendMessage() {
        const messageContent = this.messageInput.value;
        if (!messageContent) return;

        const message = {
            type: "text",
            content: messageContent
        };

        const ok = await new Promise(resolve => this.socket.timeout(5000).emit("message", message, (err, ack) => resolve(!err && ack)));
        if (ok) this.messageInput.value = "";
        else alert("Failed to send message");
    }

    #showNotification(message, duration, background, color) {
        const notification = document.createElement("app-notification");
        notification.message = message;
        notification.duration = duration;
        notification.background = background;
        notification.color = color;
        this.shadowRoot.appendChild(notification);
        notification.show();
    }

    async handleFriendRequest(action) {
        this.notificationBanner.classList.add("hidden");
        const endpoint = `/api/user/friends/${action}`;
        const response = await fetchApi(endpoint, {
            method: "POST",
            body: JSON.stringify({
                friends: this.pending,
            })
        });
        if (response.ok)
            this.#showNotification(`Friend request ${action}ed!`, 2000, "#8E24AA", "white");
        else {
            const error = await response.json();
            this.#showNotification(`Error: ${error.error}`, 2000, "red", "white");
        }
        this.dispatchEvent(new CustomEvent('friendRequestHandled', {
            bubbles: true,
            composed: true,
            detail: {friend: this.pending, action: action}
        }));
    }
}
