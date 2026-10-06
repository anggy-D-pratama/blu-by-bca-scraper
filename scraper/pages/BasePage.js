import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Action } = require("@payscrap/actions");

export class BasePage {
  constructor(client, config) {
    this.client = client;
    this.config = config;
    this.actions = new Action(this.client);
  }
}