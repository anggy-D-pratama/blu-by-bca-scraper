import { start, reportStartupError } from "./scraper/start.js";

start().catch(reportStartupError);