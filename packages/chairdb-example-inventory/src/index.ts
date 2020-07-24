import { ShopInventory } from "./shop-inventory";
import { InMemoryLog } from "@chairdb/log-inmemory";

const reportStock = async (
  inventory: ShopInventory,
  itemName: string
): Promise<void> => {
  const runningShoes = await inventory.getItem(itemName);
  console.log(
    `We currently have ${runningShoes.amountInStock} ${itemName} in stock`
  );
};

(async () => {
  const log = new InMemoryLog();
  const inventory = new ShopInventory(log);

  await inventory.stockItem({
    amount: 4,
    name: "Therm-a-rest NeoAir UberLite Long",
  });
  await inventory.stockItem({
    amount: 100,
    name: "Chocolate Bar",
  });
  await inventory.stockItem({
    amount: 12,
    name: "Running shoes",
  });

  await reportStock(inventory, "Running shoes");

  await inventory.buyItem({
    name: "Running shoes",
    amount: 5,
  });

  await reportStock(inventory, "Running shoes");

  await inventory.buyItem({
    name: "Running shoes",
    amount: 3,
  });

  await reportStock(inventory, "Running shoes");

  await inventory.stockItem({
    amount: 2,
    name: "Running shoes",
  });
  await inventory.stockItem({
    amount: 20,
    name: "Chocolate Bar",
  });

  await reportStock(inventory, "Running shoes");

  await inventory.buyItem({
    name: "Running shoes",
    amount: 6,
  });

  await reportStock(inventory, "Running shoes");

  console.log(await inventory.auditItem("Running shoes"));
  console.log(await inventory.auditItem("Chocolate Bar"));
})();
