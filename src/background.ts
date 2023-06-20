import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import { z } from "zod";

export const sqlite = {
  db: undefined,
};

export const AddVideoSchema = z.object({
  url: z.string().url(),
});

const main = async () => {
  const sqlite3 = await sqlite3InitModule();

  const capi = sqlite3.capi; /*C-style API*/
  const oo = sqlite3.oo1; /*high-level OO API*/
  console.log("sqlite3", capi.sqlite3_libversion(), capi.sqlite3_sourceid());

  if (sqlite3.opfs) {
    sqlite.db = new sqlite3.opfs.OpfsDb("/mydb.sqlite3");
    console.log("The OPFS is available.");
  } else {
    sqlite.db = new oo.DB("/mydb.sqlite3", "ct");
    console.log("The OPFS is not available.");
  }
  console.log("transient db =", sqlite.db.filename);

  try {
    console.log("Create a table...");
    sqlite.db.exec(`CREATE TABLE IF NOT EXISTS VideoQueue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      create_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log("Query data with exec() using rowMode 'array'...");
    sqlite.db.exec({
      sql: "SELECT a FROM VideoQueue ORDER BY a LIMIT 3",
      rowMode: "array", // 'array' (default), 'object', or 'stmt'
      callback: function (row) {
        console.log("row ", ++this.counter, "=", row);
      }.bind({ counter: 0 }),
    });
  } catch (err) {
    console.error(err);
    sqlite.db.close();
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "add") {
      const { url } = AddVideoSchema.parse(request);
      console.log("add", url);
    }
  });
};

main()
  .then(() => console.log("done"))
  .catch((err) => console.error(err));
