const fetch = require("node-fetch");
const Client = require("./index");

let client;

beforeAll(async () => {
  if (process.env.TEST_URL) {
    const pass = process.env.PASSWORD;
    const resp = await fetch(process.env.TEST_URL, {
      headers: {
        Authorization: "Basic " + btoa("test:" + pass),
      },
    });
    const url = await resp.text();
    client = new Client(url);

  } else {
    client = new Client();
  }
  await client.empty();
});

afterEach(async () => {
  await client.empty();
});


test("create a client with a key", async () => {
  expect(client).toBeTruthy();
  expect(typeof client.key).toBe("string");
});

test("sets a value", async () => {
  expect(await client.set("key", "value")).toEqual(client);
  expect(await client.setAll({ key: "value", second: "secondThing" })).toEqual(
    client
  );
});

test("list keys", async () => {
  await client.setAll({
    key: "value",
    second: "secondThing",
  });

  expect(await client.list()).toEqual(["key", "second"]);
});

test("gets a value", async () => {
  await client.setAll({
    key: "value",
  });

  expect(await client.getAll()).toEqual({ key: "value" });
});

test("delete a value", async () => {
  await client.setAll({
    key: "value",
    deleteThis: "please",
    somethingElse: "in delete multiple",
    andAnother: "again same thing",
  });

  expect(await client.delete("deleteThis")).toEqual(client);
  expect(await client.deleteMultiple("somethingElse", "andAnother")).toEqual(
    client
  );
  expect(await client.list()).toEqual(["key"]);
  expect(await client.empty()).toEqual(client);
  expect(await client.list()).toEqual([]);
});

test("list keys with newline", async () => {
  await client.setAll({
    "key\nwit": "first",
    keywidout: "second",
  });

  expect(await client.list()).toEqual(["keywidout", "key\nwit"]);
});

test("ensure that we escape values when setting", async () => {
  expect(await client.set("a", "1;b=2")).toEqual(client);
  expect(await client.list()).toEqual(["a"])
  expect(await client.get("a")).toEqual("1;b=2")
});

test("updates a value inside of a object", async () => {
  const testDbKey = "TestKey";
  let testValue = {
    hello: "world"
  };
  const testObjectKey = "hello"
  const updateValue = "Repl.it";
  await client.set(testDbKey, testValue);

  let objectReturned = await client.updateObject(testDbKey, testObjectKey, updateValue);
  let expectedResult = testValue;
  expectedResult[testObjectKey] = updateValue;
  expect(objectReturned).toHaveProperty(testObjectKey, updateValue);

  let objectFromDb = await client.get(testDbKey);
  expect(objectFromDb).toHaveProperty(testObjectKey, updateValue);
});

test("can pushe a new item to an array kept in the database", async () => {
  let testKey = "TestArray";
  let testArray = [1, 2, 3];
  let newArrayItem = 4;
  await client.set(testKey, testArray);
  let result = await client.pushArray(testKey, newArrayItem);

  expect(result).toEqual(expect.arrayContaining([newArrayItem]));
  expect(result.length).toEqual(4);

  var resultFromDb = await client.get(testKey);
  expect(resultFromDb).toEqual(expect.arrayContaining([newArrayItem]));
  expect(resultFromDb.length).toEqual(4);
});

test("can remove an item in an array by it's index kept in the database", async () => {
  let testKey = "TestArray";
  let testArray = [1, 2, 3, "3.5", 4];

  await client.set(testKey, testArray);
  let result = await client.deleteArrayItemByIndex(testKey, 3);

  expect(result).toEqual(expect.not.arrayContaining(["3.5"]));
  expect(result.length).toEqual(4);

  var resultFromDb = await client.get(testKey);
  expect(resultFromDb).toEqual(expect.not.arrayContaining(["3.5"]));
  expect(resultFromDb.length).toEqual(4);
});

test("can remove an item in an array by a search value kept in the database", async () => {
  let testKey = "TestArray";
  let testObjectKey = "id";
  let testArray = [
    {
      "id": 1
    },
    {
      "id": 2
    }
  ];

  await client.set(testKey, testArray);
  let result = await client.deleteArrayItemByValue(testKey, testObjectKey, 1);

  expect(result).toEqual(expect.not.arrayContaining([testArray[0]]));
  expect(result.length).toEqual(1);

  var resultFromDb = await client.get(testKey);
  expect(resultFromDb).toEqual(expect.not.arrayContaining([testArray[0]]));
  expect(resultFromDb.length).toEqual(1);
});

