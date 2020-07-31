import { ChairDBConfigOnDisk } from "./parse-config";
import { Either, left, right } from "fp-ts/lib/Either";

const CHAIRDB_CONF_VERSION = "v1";

export class ChairDBConfigError extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, ChairDBConfigError.prototype);
  }
}

export class Config {
  #aggregates: readonly { name: string }[];

  private constructor(conf: ChairDBConfigOnDisk) {
    this.#aggregates = conf.aggregates;
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
