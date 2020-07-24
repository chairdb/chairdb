import { Log } from "@chairdb/log";
import { Event } from "@chairdb/event";

type CreateBoardCommand = {
  boardId: string;
  boardName: string;
};

type BoardCreated = {
  boardName: string;
};

type AddListToBoardCommand = {
  boardId: string;
  listName: string;
};

type ListAddedToBoard = {
  listName: string;
};

type RenameCardCommand = {
  cardId: string;
  newTitle: string;
};

type CardRenamed = {
  newTitle: string;
};

type AddNewCardToListCommand = {
  cardId: string;
  boardId: string;
  listName: string;
  title: string;
  body: string;
};

type NewCardAddedToList = {
  boardId: string;
  listName: string;
  title: string;
  body: string;
};

type MoveCardToListCommand = {
  cardId: string;
  listName: string;
};

type CardMovedToList = {
  listName: string;
};

type BoardEvent =
  | Event<BoardCreated, "BoardCreated">
  | Event<ListAddedToBoard, "ListAddedToBoard">;
type CardEvent =
  | Event<NewCardAddedToList, "NewCardAddedToList">
  | Event<CardRenamed, "CardRenamed">
  | Event<CardMovedToList, "CardMovedToList">;

export class Board {
  #name: string;
  #lists: readonly string[];

  private constructor(name: string, lists: readonly string[]) {
    this.#name = name;
    this.#lists = lists;
  }

  static isApplicableEvent(event: Event<unknown>): event is BoardEvent {
    return event.name === "BoardCreated" || event.name === "ListAddedToBoard";
  }

  static reconstitute(events: readonly Event[]): Board | null {
    const applicableEvents = events.filter(Board.isApplicableEvent);

    if (applicableEvents.length === 0) {
      return null;
    }

    const board = applicableEvents.reduce(
      (acc, curr) => acc.withEventApplied(curr),
      new Board("", [])
    );

    if (board.#name === "") {
      return null;
    }

    return board;
  }

  withEventApplied(event: BoardEvent): Board {
    switch (event.name) {
      case "BoardCreated":
        return new Board(event.payload.boardName, []);
      case "ListAddedToBoard":
        return new Board(this.name, [...this.lists, event.payload.listName]);
      default:
        return this;
    }
  }

  get name(): string {
    return this.#name;
  }

  get lists(): readonly string[] {
    return this.#lists;
  }

  hasListWithName(name: string): boolean {
    return this.lists.includes(name);
  }
}

export class Card {
  #id: string;
  #title: string;
  #body: string;
  #version: number;
  #boardId: string;
  #listName: string;

  private constructor(
    id: string,
    title: string,
    body: string,
    version: number,
    boardId: string,
    listName: string
  ) {
    this.#id = id;
    this.#title = title;
    this.#body = body;
    this.#version = version;
    this.#boardId = boardId;
    this.#listName = listName;
  }

  static reconstitute(events: readonly Event<unknown>[]): Card | null {
    const applicableEvents: readonly CardEvent[] = events.filter(
      Card.isApplicableEvent
    );

    if (applicableEvents.length === 0) {
      return null;
    }

    const card = new Card(events[0].aggregateId, "", "", 0, "", "");

    return applicableEvents.reduce((acc, ev) => acc.withEventApplied(ev), card);
  }

  withEventApplied(event: CardEvent): Card {
    switch (event.name) {
      case "NewCardAddedToList":
        return new Card(
          this.id,
          event.payload.title,
          event.payload.body,
          event.aggregateVersion,
          event.payload.boardId,
          event.payload.listName
        );

      case "CardRenamed":
        return new Card(
          this.id,
          event.payload.newTitle,
          this.body,
          event.aggregateVersion,
          this.boardId,
          this.listName
        );

      case "CardMovedToList":
        return new Card(
          this.id,
          this.title,
          this.body,
          event.aggregateVersion,
          this.boardId,
          event.payload.listName
        );

      default:
        return this;
    }
  }

  static isApplicableEvent(event: Event<unknown>): event is CardEvent {
    return (
      event.name === "NewCardAddedToList" ||
      event.name === "CardRenamed" ||
      event.name === "CardMovedToList"
    );
  }

  get id(): string {
    return this.#id;
  }

  get title(): string {
    return this.#title;
  }

  get body(): string {
    return this.#body;
  }

  get version(): number {
    return this.#version;
  }

  get listName(): string {
    return this.#listName;
  }

  get boardId(): string {
    return this.#boardId;
  }
}

export class Trello {
  #log: Log;

  constructor(log: Log) {
    this.#log = log;
  }

  async getCard(cardId: string): Promise<Card | null> {
    return Card.reconstitute(await this.#log.allForAggregate(cardId));
  }

  async getBoard(boardId: string): Promise<Board | null> {
    return Board.reconstitute(await this.#log.allForAggregate(boardId));
  }

  async createBoard(command: CreateBoardCommand): Promise<void> {
    if ((await this.getBoard(command.boardId)) != null) {
      throw new Error("Board already exists");
    }

    return this.#log.append<BoardCreated>({
      aggregateId: command.boardId,
      aggregateVersion: 0,
      eventId: `create-board-${command.boardId}-${command.boardName}`,
      name: "BoardCreated",
      payload: {
        boardName: command.boardName,
      },
      timestamp: new Date().getTime(),
    });
  }

  async addListToBoard(command: AddListToBoardCommand): Promise<void> {
    const board = await this.getBoard(command.boardId);

    if (board == null) {
      throw new Error("Board does not exist");
    }

    if (board.hasListWithName(command.listName)) {
      throw new Error("Board already has a list with this name");
    }

    return this.#log.append<ListAddedToBoard>({
      aggregateId: command.boardId,
      aggregateVersion: 0,
      eventId: `add-list-${command.listName}-to-board-${command.boardId}`,
      name: "ListAddedToBoard",
      payload: {
        listName: command.listName,
      },
      timestamp: new Date().getTime(),
    });
  }

  async addNewCard(command: AddNewCardToListCommand): Promise<void> {
    const board = await this.getBoard(command.boardId);

    if (board == null) {
      throw new Error("Board does not exist");
    }

    if (!board.hasListWithName(command.listName)) {
      throw new Error("Board has no list with this name");
    }

    return this.#log.append<NewCardAddedToList>({
      aggregateId: command.cardId,
      aggregateVersion: 0,
      eventId: `add-list-${command.listName}-to-board-${command.boardId}`,
      name: "NewCardAddedToList",
      payload: {
        listName: command.listName,
        boardId: command.boardId,
        body: command.body,
        title: command.title,
      },
      timestamp: new Date().getTime(),
    });
  }

  async renameCard(command: RenameCardCommand): Promise<void> {
    const card = await this.getCard(command.cardId);

    if (card == null) {
      throw new Error("Card not found");
    }

    return this.#log.append<CardRenamed>({
      aggregateId: command.cardId,
      aggregateVersion: card.version + 1,
      eventId: `rename-card-${command.cardId}-to-${command.newTitle}`,
      name: "CardRenamed",
      payload: {
        newTitle: command.newTitle,
      },
      timestamp: new Date().getTime(),
    });
  }

  async moveCardToList(command: MoveCardToListCommand): Promise<void> {
    const card = await this.getCard(command.cardId);

    if (card == null) {
      throw new Error("Card not found");
    }

    const board = await this.getBoard(card.boardId);

    if (board == null) {
      throw new Error("Board not found");
    }

    if (!board.hasListWithName(command.listName)) {
      throw new Error("Board has no list by that name");
    }

    return this.#log.append<CardMovedToList>({
      aggregateId: command.cardId,
      aggregateVersion: card.version + 1,
      eventId: `move-card-${command.cardId}-to-${command.listName}`,
      name: "CardMovedToList",
      payload: {
        listName: command.listName,
      },
      timestamp: new Date().getTime(),
    });
  }
}
