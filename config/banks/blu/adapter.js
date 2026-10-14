import { BluAuth } from "../../../scraper/pages/bluAuth.js";
import { BluStatement } from "../../../scraper/pages/bluStatement.js";
import { BluTransfer } from "../../../scraper/pages/bluTransfer.js";
import { BluTopup } from "../../../scraper/pages/bluTopup.js";
import { mapBLUStatements } from "../../../services/statementMapper.js";
import { ELEMENTS } from "./elements.js";

export default {
  appPackage: "com.bcadigital.blu",
  appActivity: "com.bcadigital.blu.ui.start.BluStartActivity",
  AuthPage: BluAuth,
  StatementPage: BluStatement,
  TransferPage: BluTransfer,
  TopupPage: BluTopup,
  mapStatements: mapBLUStatements,
  elements: ELEMENTS,
};
