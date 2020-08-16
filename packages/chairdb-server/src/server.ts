import { Config } from "@chairdb/config";
import { Log } from "@chairdb/log";

export class ChairDB {
  #config: Config;
  #log: Log;

  constructor(config: Config, log: Log) {
    this.#config = config;
    this.#log = log;

    console.log(this.#log, this.#config);
  }
}
