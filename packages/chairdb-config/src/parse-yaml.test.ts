import { readFileSync } from "fs";
import { join } from "path";
import { parseYaml } from "./parse-yaml";
import { isLeft, isRight, getOrElse } from "fp-ts/lib/Either";

const FIXTURES_DIR = join(__dirname, "..", "fixtures");
const getFixture = (name: string): string =>
  readFileSync(join(FIXTURES_DIR, name)).toString();

test("Invalid YAML file", () => {
  const invalid = getFixture("invalid-yml.yml");

  expect(isLeft(parseYaml(invalid))).toBeTruthy();
});

test("Valid YAML file", () => {
  const invalid = getFixture("basic.yml");

  expect(isRight(parseYaml(invalid))).toBeTruthy();
  expect(getOrElse<Error, unknown>(() => null)(parseYaml(invalid)))
    .toMatchInlineSnapshot(`
    Object {
      "aggregates": Array [
        Object {
          "name": "InventoryItem",
        },
        Object {
          "name": "Person",
        },
        Object {
          "name": "MyAggregate",
        },
      ],
      "chairdb": "v1",
      "events": Array [
        Object {
          "applicableTo": Array [
            "InventoryItem",
            "Person",
          ],
          "name": "BlahEvent",
          "payload": Object {
            "newName": Object {
              "required": true,
              "type": "string",
            },
          },
        },
        Object {
          "applicableTo": "MyAggregate",
          "name": "MyOtherEvent",
          "payload": Object {
            "amount": Object {
              "required": false,
              "type": "number",
            },
            "cashierName": Object {
              "type": "string",
            },
          },
        },
      ],
    }
  `);
});
