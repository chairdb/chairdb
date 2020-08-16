import { ChairDBConfigOnDisk, parseConfig } from "./parse-config";
import { Either, left, right, mapLeft, chain } from "fp-ts/lib/Either";
import { pipe, flow } from "fp-ts/lib/function";
import { parseYaml } from "./parse-yaml";
import { PathReporter } from "io-ts/lib/PathReporter";
import t from "io-ts";

const CHAIRDB_CONF_VERSION = "v1";

export class ChairDBConfigError extends Error {
  inner?: Error | t.Errors;

  constructor(m: string, inner?: Error | t.Errors) {
    super(m);
    this.inner = inner;
    Object.setPrototypeOf(this, ChairDBConfigError.prototype);
  }
}

export class Config {
  #aggregates: readonly { name: string }[];

  private constructor(conf: ChairDBConfigOnDisk) {
    this.#aggregates = conf.aggregates;
  }

  static fromYamlString(yaml: string): Either<ChairDBConfigError, Config> {
    return pipe(
      yaml,
      parseYaml,
      mapLeft(
        (e) =>
          new ChairDBConfigError(`Error in YAML configuration: ${e.message}`, e)
      ),
      chain(
        flow(
          parseConfig,
          mapLeft(
            (e) =>
              new ChairDBConfigError(
                `YAML was not valid according to the schema. ${PathReporter.report(
                  left(e)
                )}`,
                e
              )
          )
        )
      ),
      chain(Config.fromOnDiskConfig)
    );
  }

  static fromOnDiskConfig(
    conf: ChairDBConfigOnDisk
  ): Either<ChairDBConfigError, Config> {
    const eventNames = conf.events.map((event) => event.name);
    const duplicateEventNames = new Set(
      eventNames.filter(
        (name) => eventNames.filter((n) => n === name).length > 1
      )
    );

    const aggregateNamesInEvents = conf.events.flatMap((event) => {
      if (Array.isArray(event.applicableTo)) {
        return event.applicableTo;
      } else {
        return [event.applicableTo];
      }
    });
    const unknownAggregateNamesInEvents = aggregateNamesInEvents.filter(
      (event) => !conf.aggregates.map((agg) => agg.name).includes(event)
    );

    if (duplicateEventNames.size > 0) {
      return left(
        new ChairDBConfigError(
          `The following event names are duplicated: ${[
            ...duplicateEventNames,
          ].join(", ")}. You cannot define an event with a duplicate name.`
        )
      );
    }

    if (unknownAggregateNamesInEvents.length > 0) {
      return left(
        new ChairDBConfigError(
          `The following aggregate names were mentioned in events (applicableTo), but they were not registered: ${unknownAggregateNamesInEvents.join(
            ", "
          )}`
        )
      );
    }

    if (conf.chairdb !== CHAIRDB_CONF_VERSION) {
      return left(
        new ChairDBConfigError(
          `Version in config does not match: expected ${CHAIRDB_CONF_VERSION}, but got ${conf.chairdb}`
        )
      );
    }

    return right(new Config(conf));
  }

  get aggregateNames(): readonly string[] {
    return this.#aggregates.map((agg) => agg.name);
  }
}
