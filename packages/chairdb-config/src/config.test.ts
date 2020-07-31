import { ChairDBConfigOnDisk } from "./parse-config";
import { Config } from "./config";
import { isLeft } from "fp-ts/lib/Either";

test("version does not match", () => {
  const conf: ChairDBConfigOnDisk = {
    aggregates: [],
    chairdb: "v100",
    events: [],
  };

  const either = Config.fromOnDiskConfig(conf);
  expect(isLeft(either));

  if (isLeft(either)) {
    expect(either.left.message).toEqual(
      "Version in config does not match: expected v1, but got v100"
    );
  }
});

test("aggregate names in events that were not registered", () => {
  const conf: ChairDBConfigOnDisk = {
    aggregates: [
      {
        name: "MyAggregate",
      },
    ],
    chairdb: "v1",
    events: [
      {
        name: "MyEvent",
        applicableTo: ["MyAggregate", "MyOtherAggregate"],
        payload: {},
      },
      {
        name: "MyOtherEvent",
        applicableTo: "MyThirdAggregate",
        payload: {},
      },
      {
        name: "ThirdEvent",
        applicableTo: "MyAggregate",
        payload: {},
      },
    ],
  };

  const either = Config.fromOnDiskConfig(conf);
  expect(isLeft(either));

  if (isLeft(either)) {
    expect(either.left.message).toEqual(
      "The following aggregate names were mentioned in events (applicableTo), but they were not registered: MyOtherAggregate, MyThirdAggregate"
    );
  }
});

test("duplicate event names", () => {
  const conf: ChairDBConfigOnDisk = {
    aggregates: [
      {
        name: "MyAggregate",
      },
    ],
    chairdb: "v1",
    events: [
      {
        name: "MyEvent",
        applicableTo: ["MyAggregate"],
        payload: {},
      },
      {
        name: "MyOtherEvent",
        applicableTo: "MyAggregate",
        payload: {},
      },
      {
        name: "MyEvent",
        applicableTo: "MyAggregate",
        payload: {},
      },
    ],
  };

  const either = Config.fromOnDiskConfig(conf);
  expect(isLeft(either));

  if (isLeft(either)) {
    expect(either.left.message).toEqual(
      "The following event names are duplicated: MyEvent. You cannot define an event with a duplicate name."
    );
  }
});
