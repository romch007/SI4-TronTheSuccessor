import {HTMLComponent} from "/js/component.js";
import {fakePageReload, loginFetch} from "/js/login-manager.js";

export class SignUpPopup extends HTMLComponent {
    firstQuestion;
    firstAnswer;
    secondQuestion;
    secondAnswer;
    username;
    password;
    confirmPassword;

    constructor() {
        super("sign-up-popup", ["html", "css"]);
    }

    onSetupCompleted = async () => {
        this.firstQuestion = this.shadowRoot.getElementById("first-security-question");
        this.firstAnswer = this.shadowRoot.getElementById("first-answer-input").shadowRoot.getElementById("answer");
        this.secondQuestion = this.shadowRoot.getElementById("second-security-question");
        this.secondAnswer = this.shadowRoot.getElementById("second-answer-input").shadowRoot.getElementById("answer");
        this.username = this.shadowRoot.getElementById("username-input").shadowRoot.getElementById("answer");
        this.password = this.shadowRoot.getElementById("password-input").shadowRoot.getElementById("answer");
        this.confirmPassword = this.shadowRoot.getElementById("confirm-password-input").shadowRoot.getElementById("answer");

        await this.#injectSecurityQuestions();

        this.shadowRoot.getElementById("right-arrow").addEventListener("click", () => {
            if (!this.#checkFirstPageInputs()) return;
            this.#showPage("second-page");
        });

        this.shadowRoot.getElementById("left-arrow").addEventListener("click", () => {
            this.#showPage("first-page");
        });

        this.shadowRoot.getElementById("login").addEventListener("click", async () => {
            if (!this.#checkFirstPageInputs()) return;
            if (!this.#checkSecondPageInputs()) return;
            await this.#fetchLogin();
        });

        this.shadowRoot.getElementById("link").addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent("change-popup", {
                detail: {
                    name: "sign-in",
                    display: true
                }
            }));
        });

        this.firstQuestion.addEventListener("change", () => this.#updateSecondQuestionOptions());
        this.secondQuestion.addEventListener("change", () => this.#updateFirstQuestionOptions());
    };

    async #fetchLogin() {
        const firstQuestionText = this.firstQuestion.options[this.firstQuestion.selectedIndex].text;
        const secondQuestionText = this.secondQuestion.options[this.secondQuestion.selectedIndex].text;
        const body = JSON.stringify({
            username: this.username.value,
            password: this.password.value,
            securityQuestions: [
                {
                    question: firstQuestionText,
                    answer: this.firstAnswer.value
                },
                {
                    question: secondQuestionText,
                    answer: this.secondAnswer.value
                }
            ]
        });
        const data = await loginFetch("sign-up", body);
        if (data) {
            document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=${60 * 60 * 24 * 7};`;
            document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${60 * 60};`;
            fakePageReload();
            this.#clearInputs();
        }
    }

    #checkFirstPageInputs() {
        this.username.setCustomValidity("");
        this.password.setCustomValidity("");
        this.confirmPassword.setCustomValidity("");

        if (!this.username.validity.valid)
            this.username.setCustomValidity("this.username must be at least 3 characters long and less than 20.");

        if (!this.password.validity.valid)
            this.password.setCustomValidity("Password must be at least 6 characters long and less than 20.");

        if (!this.confirmPassword.validity.valid)
            this.confirmPassword.setCustomValidity("Please confirm your password.");

        if (this.password.value !== this.confirmPassword.value)
            this.confirmPassword.setCustomValidity("Passwords do not match.");

        if (!this.username.checkValidity() || !this.password.checkValidity() || !this.confirmPassword.checkValidity())
            this.#showPage("first-page");

        this.confirmPassword.reportValidity();
        this.password.reportValidity();
        this.username.reportValidity();

        return this.username.validity.valid &&
            this.password.validity.valid &&
            this.confirmPassword.validity.valid;
    }

    #checkSecondPageInputs() {
        if (this.firstAnswer == null || this.secondAnswer == null) {
            this.#showPage("second-page");
            return;
        }

        this.firstAnswer.setCustomValidity("");
        this.secondAnswer.setCustomValidity("");
        this.firstQuestion.setCustomValidity("");

        if (!this.firstAnswer.validity.valid)
            this.firstAnswer.setCustomValidity("Please provide an answer to the first security question.");

        if (!this.secondAnswer.validity.valid)
            this.secondAnswer.setCustomValidity("Please provide an answer to the second security question.");

        if (!this.firstAnswer.checkValidity() || !this.secondAnswer.checkValidity())
            this.#showPage("second-page");

        if (this.shadowRoot.getElementById("first-security-question").value === this.shadowRoot.getElementById("second-security-question").value)
            this.firstQuestion.setCustomValidity("Please choose two different questions");

        this.firstQuestion.reportValidity();
        this.secondAnswer.reportValidity();
        this.firstAnswer.reportValidity();

        return this.firstAnswer.validity.valid && this.secondAnswer.validity.valid && this.firstQuestion.validity.valid;
    }

    #showPage(page_name) {
        this.shadowRoot.querySelectorAll("#popup-body .page").forEach(element => {
            element.classList.toggle("active", element.id === page_name);
        });
    }

    async #injectSecurityQuestions() {
        const securityQuestions = await loginFetch("security-questions", null);

        for (let i = 0; i < securityQuestions.length; i++) {
            let opt = document.createElement("option");
            opt.value = i.toString();
            opt.innerHTML = securityQuestions[i];
            this.firstQuestion.appendChild(opt);
            this.secondQuestion.appendChild(opt.cloneNode(true));
        }

        this.secondQuestion.selectedIndex = 1;
        this.#updateFirstQuestionOptions();
        this.#updateSecondQuestionOptions();
    }

    #updateSecondQuestionOptions() {
        const selectedValue = this.firstQuestion.value;
        Array.from(this.secondQuestion.options).forEach(option => {
            option.style.display = option.value === selectedValue ? "none" : "block";
        });
    }

    #updateFirstQuestionOptions() {
        const selectedValue = this.secondQuestion.value;
        Array.from(this.firstQuestion.options).forEach(option => {
            option.style.display = option.value === selectedValue ? "none" : "block";
        });
    }

    #clearInputs() {
        this.username.value = "";
        this.password.value = "";
        this.confirmPassword.value = "";
        this.firstAnswer.value = "";
        this.secondAnswer.value = "";
    }
}
