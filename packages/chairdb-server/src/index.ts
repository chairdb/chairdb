#!/usr/bin/env node

import yargs from "yargs";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { Config } from "@chairdb/config";
import { InMemoryLog } from "@chairdb/log-inmemory";
import { isLeft } from "fp-ts/lib/Either";
import { ChairDB } from "./server";

const args = yargs.options({
  config: {
    type: "string",
    demandOption: true,
    default: "./chairdb.yml",
    description: "Configuration file location",
  },
}).argv;

const configFilePath = resolve(args.config);

if (!existsSync(configFilePath)) {
  throw new Error(`Config file not found - expected at ${configFilePath}`);
}

const config = Config.fromYamlString(readFileSync(configFilePath).toString());

if (isLeft(config)) {
  throw new Error(`Could not load config file: ${config.left}`);
}

const server = new ChairDB(config.right, new InMemoryLog());

console.log(server);
