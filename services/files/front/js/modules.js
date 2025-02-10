import {GameBoard} from "/components/game-board/game-board.js";
import {GameChoice} from "/components/game-choice/game-choice.js";
import {HomePage} from "/components/home-page/home-page.js";
import {ProfilPage} from "/components/profil-page/app-profil-page/profil-page.js";
import {Pages} from "/components/pages/pages.js";
import {Button} from "/components/button/button.js";
import {ProfilPageButton} from "/components/profil-page/profil-page-button/profil-page-button.js";
import {HelpPage} from "/components/help-page/help-page.js";
import {Control} from "/components/control/control.js";
import {GameMaster} from "/components/game-master/game-master.js";
import {GamePopup} from "/components/game-popup/game-popup.js";
import {Login} from "/components/login/login.js";

customElements.define("app-game-board", GameBoard);
customElements.define("app-game-choice", GameChoice);
customElements.define("app-home-page", HomePage);
customElements.define("app-profil-page", ProfilPage);
customElements.define("app-pages", Pages);
customElements.define("app-button", Button);
customElements.define("app-profil-page-button", ProfilPageButton);
customElements.define("app-help-page", HelpPage);
customElements.define("app-control", Control);
customElements.define("app-game-master", GameMaster);
customElements.define("app-game-popup", GamePopup);
customElements.define("app-login", Login);
