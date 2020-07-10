import { Log } from "@chairdb/log";
import { Event } from "@chairdb/event";

type ItemStocked = {
  amount: number;
};

type ItemBought = {
  amount: number;
};

type StockItemCommand = {
  name: string;
  amount: number;
};

type BuyItemCommand = {
  name: string;
  amount: number;
};

type AuditItemCommand = {
  name: string;
};

export class Item {
  #name: string;
  #amountInStock: number;
  #version: number;

  private constructor(name: string, amountInStock: number, version: number) {
    this.#name = name;
    this.#amountInStock = amountInStock;
    this.#version = version;
  }

  static create(name: string): Item {
    return new Item(name, 0, 0);
  }

  static isRelevantEvent(
    event: Event
  ): event is Event<ItemBought> | Event<ItemStocked> {
    return event.name === "ItemBought" || event.name === "ItemStocked";
  }

  withEventsApplied(events: readonly Event[]): Item {
    return events.reduce<Item>((acc, curr) => acc.withEventApplied(curr), this);
  }

  withEventApplied(event: Event): Item {
    if (!Item.isRelevantEvent(event)) {
      return this;
    }

    if (event.name === "ItemBought") {
      return new Item(
        this.name,
        this.amountInStock - (event as Event<ItemBought>).payload.amount,
        Math.max(this.version, event.aggregateVersion)
      );
    } else if (event.name === "ItemStocked") {
      return new Item(
        this.name,
        this.amountInStock + (event as Event<ItemStocked>).payload.amount,
        Math.max(this.version, event.aggregateVersion)
      );
    } else {
      return this;
    }
  }

  get name(): string {
    return this.#name;
  }

  get amountInStock(): number {
    return this.#amountInStock;
  }

  get version(): number {
    return this.#version;
  }
}

export class ShopInventory {
  #log: Log;

  constructor(log: Log) {
    this.#log = log;
  }

  async getItem(itemName: string): Promise<Item> {
    const events = await this.#log.allForAggregate(itemName);
    return Item.create(itemName).withEventsApplied(events);
  }

  async stockItem(command: StockItemCommand): Promise<void> {
    const item = await this.getItem(command.name);

    await this.#log.append<ItemStocked>({
      aggregateId: command.name,
      name: "ItemStocked",
      payload: {
        amount: command.amount,
      },
      timestamp: new Date().getTime(),
      aggregateVersion: item.version + 1,
      eventId: `${new Date().getTime()}${Math.round(Math.random() * 1000)}`,
    });
  }

  async buyItem(command: BuyItemCommand): Promise<void> {
    const item = await this.getItem(command.name);

    if (item == null) {
      throw new Error(`Unknown item: ${item}`);
    }

    if (item.amountInStock < command.amount) {
      throw new Error(
        `Not enough in stock for ${item}: you asked for ${command.amount}, but we only have ${item.amountInStock} left.`
      );
    }

    await this.#log.append<ItemBought>({
      aggregateId: command.name,
      name: "ItemBought",
      payload: {
        amount: command.amount,
      },
      timestamp: new Date().getTime(),
      aggregateVersion: item.version + 1,
      eventId: `${new Date().getTime()}${Math.round(Math.random() * 1000)}`,
    });
  }

  async auditItem(command: AuditItemCommand): Promise<readonly string[]> {
    const events = await this.#log.allForAggregate(command.name);

    return events.map((event) => {
      return `${new Date(event.timestamp).toUTCString()} ${
        event.name
      }: ${JSON.stringify(event.payload)}`;
    });
  }
}
