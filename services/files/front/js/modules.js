import {GameBoard} from "/components/game-board/game-board.js";
import {HelpPage} from "/components/help-page/help-page.js";
import {Control} from "/components/control/control.js";
import {GameMaster} from "/components/game-master/game-master.js";

customElements.define("app-game-board", GameBoard);
customElements.define("app-help-page", HelpPage);
customElements.define("app-control", Control);
customElements.define("app-game-master", GameMaster);
