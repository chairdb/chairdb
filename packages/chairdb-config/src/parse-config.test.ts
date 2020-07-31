import { parseConfig, ChairDBConfigOnDisk } from "./parse-config";
import { isRight, isLeft, getOrElseW } from "fp-ts/lib/Either";

test("parsing invalid config", () => {
  const parsed = parseConfig({});

  expect(isLeft(parsed)).toBeTruthy();
});

test("parsing minimal config", () => {
  const config: ChairDBConfigOnDisk = {
    chairdb: "v1",
    events: [],
    aggregates: [],
  };
  const parsed = parseConfig(config);

  expect(isRight(parsed)).toBeTruthy();
  expect(getOrElseW(() => null)(parsed)).toEqual(config);
});

test("parsing extended config", () => {
  const config: ChairDBConfigOnDisk = {
    chairdb: "v1",
    events: [
      {
        name: "MyEvent",
        applicableTo: "MyAggregate",
        payload: {},
      },
      {
        name: "MyOtherEvent",
        applicableTo: ["MyOtherAggregate", "MyAggregate"],
        payload: {},
      },
    ],
    aggregates: [
      {
        name: "MyAggregate",
      },
      {
        name: "MyOtherAggregrate",
      },
    ],
  };
  const parsed = parseConfig(config);

  expect(isRight(parsed)).toBeTruthy();
  expect(getOrElseW(() => null)(parsed)).toEqual(config);
});
