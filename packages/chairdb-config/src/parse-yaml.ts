import YAML from "yaml";
import {
  YAMLSemanticError,
  YAMLReferenceError,
  YAMLError,
  YAMLSyntaxError,
  YAMLWarning,
} from "yaml/util";
import { Either, left, right } from "fp-ts/lib/Either";

export const parseYaml = (str: string): Either<YAMLError, unknown> => {
  try {
    const parsed = YAML.parse(str, { prettyErrors: true });
    return right(parsed);
  } catch (err) {
    if (
      err instanceof YAMLSemanticError ||
      err instanceof YAMLReferenceError ||
      err instanceof YAMLSyntaxError ||
      err instanceof YAMLWarning
    ) {
      return left(err);
    }

    throw err;
  }
};
