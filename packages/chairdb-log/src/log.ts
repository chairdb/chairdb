import { Event } from "@chairdb/event";

export type Log = {
  append: <T = unknown>(event: Event<T>) => Promise<void>;
  allForAggregate(aggregateId: string): Promise<readonly Event[]>;
  all(): Promise<readonly Event[]>;
};
