import { Log } from "@chairdb/log";
import { Event } from "@chairdb/event";

export class InMemoryLog implements Log {
  #events: readonly Event[] = [];

  async append(event: Event): Promise<void> {
    this.#events = [...this.#events, event];
  }

  async all(): Promise<readonly Event[]> {
    return [...this.#events];
  }

  async allForAggregate(aggregateId: string): Promise<readonly Event[]> {
    return [
      ...this.#events.filter((event) => event.aggregateId === aggregateId),
    ];
  }
}
