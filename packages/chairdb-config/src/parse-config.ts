import * as t from "io-ts";
import { Either } from "fp-ts/lib/Either";

export const ChairDBConfigOnDiskCodec = t.type({
  chairdb: t.string,
  events: t.array(
    t.type({
      name: t.string,
      applicableTo: t.union([t.array(t.string), t.string]),
      payload: t.dictionary(
        t.string,
        t.type({
          type: t.union([t.literal("number"), t.literal("string")]),
          required: t.union([t.boolean, t.undefined]),
        })
      ),
    })
  ),
  aggregates: t.array(
    t.type({
      name: t.string,
    })
  ),
});

export type ChairDBConfigOnDisk = t.TypeOf<typeof ChairDBConfigOnDiskCodec>;

export const parseConfig = (
  conf: unknown
): Either<t.Errors, ChairDBConfigOnDisk> =>
  ChairDBConfigOnDiskCodec.decode(conf);
