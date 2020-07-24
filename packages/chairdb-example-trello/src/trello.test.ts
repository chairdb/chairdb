import { Trello } from "./trello";
import { InMemoryLog } from "@chairdb/log-inmemory";

test("creating a board and adding lists", async () => {
  const trello = new Trello(new InMemoryLog());

  await trello.createBoard({
    boardId: "my-board-1",
    boardName: "My Board Name",
  });

  await trello.addListToBoard({
    boardId: 'my-board-1',
    listName: 'TODO'
})
await trello.addListToBoard({
    boardId: 'my-board-1',
    listName: 'Doing'
})
await trello.addListToBoard({
    boardId: 'my-board-1',
    listName: 'Done'
})

  const result = await trello.getBoard("my-board-1")
  expect(result?.name).toEqual('My Board Name')
  expect(result?.lists).toHaveLength(3)
});

test("adding a card to a list and performing operations on it", async () => {
  const trello = new Trello(new InMemoryLog());

  await trello.createBoard({
    boardId: "my-board-1",
    boardName: "My Board Name",
  });

  await trello.addListToBoard({
    boardId: 'my-board-1',
    listName: 'TODO'
})
await trello.addListToBoard({
    boardId: 'my-board-1',
    listName: 'Doing'
})

await trello.addNewCard({
    boardId: 'my-board-1',
    body: 'This is a description of a task to be performed',
    cardId: 'my-card-1',
    listName: 'TODO',
    title: 'My card title'
})

await trello.renameCard({
    cardId: 'my-card-1',
    newTitle: 'My New Title'
})

    await trello.moveCardToList({
        cardId: 'my-card-1',
        listName: 'Doing'
    })

  const card = await trello.getCard("my-card-1")
  expect(card?.title).toEqual('My New Title')
  expect(card?.listName).toEqual('Doing')
  
});
