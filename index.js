const fetch = require("node-fetch");

class Client {
  /**
   * Initiates Class.
   * @param {String} key Custom database URL
   */
  constructor(key) {
    if (key) this.key = key;
    else this.key = process.env.REPLIT_DB_URL;
  }

  // Native Functions
  /**
   * Gets a key
   * @param {String} key Key
   * @param {boolean} [options.raw=false] Makes it so that we return the raw string value. Default is false.
   */
  async get(key, options) {
    return await fetch(this.key + "/" + key)
      .then((e) => e.text())
      .then((strValue) => {
        if (options && options.raw) {
          return strValue;
        }

        if (!strValue) {
          return null;
        }

        let value = strValue;
        try {
          // Try to parse as JSON, if it fails, we throw
          value = JSON.parse(strValue);
        } catch (_err) {
          throw new SyntaxError(
            `Failed to parse value of ${key}, try passing a raw option to get the raw value`
          );
        }

        if (value === null || value === undefined) {
          return null;
        }

        return value;
      });
  }

  /**
   * Sets a key
   * @param {String} key Key
   * @param {any} value Value
   */
  async set(key, value) {
    const strValue = JSON.stringify(value);

    await fetch(this.key, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encodeURIComponent(key) + "=" + encodeURIComponent(strValue),
    });
    return this;
  }

  /**
   * Deletes a key
   * @param {String} key Key
   */
  async delete(key) {
    await fetch(this.key + "/" + key, { method: "DELETE" });
    return this;
  }

  /**
   * List key starting with a prefix or list all.
   * @param {String} prefix Filter keys starting with prefix.
   */
  async list(prefix = "") {
    return await fetch(
      this.key + `?encode=true&prefix=${encodeURIComponent(prefix)}`
    )
      .then((r) => r.text())
      .then((t) => {
        if (t.length === 0) {
          return [];
        }
        return t.split("\n").map(decodeURIComponent);
      });
  }

  // Dynamic Functions
  /**
   * Clears the database.
   */
  async empty() {
    const promises = [];
    for (const key of await this.list()) {
      promises.push(this.delete(key));
    }

    await Promise.all(promises);

    return this;
  }

  /**
   * Get all key/value pairs and return as an object
   */
  async getAll() {
    let output = {};
    for (const key of await this.list()) {
      let value = await this.get(key);
      output[key] = value;
    }
    return output;
  }

  /**
   * Sets the entire database through an object.
   * @param {Object} obj The object.
   */
  async setAll(obj) {
    for (const key in obj) {
      let val = obj[key];
      await this.set(key, val);
    }
    return this;
  }

  /**
   * Delete multiple entries by keys
   * @param {Array<string>} args Keys
   */
  async deleteMultiple(...args) {
    const promises = [];

    for (const arg of args) {
      promises.push(this.delete(arg));
    }

    await Promise.all(promises);

    return this;
  }

  /**
   * Updates a JSON object by it\'s key
   * @param {String} key DB key
   * @param {String} objectKey The key of the saved object in the db.
   * @param {any} value The value to replace the previous value.
   */
  async updateObject(key, objectKey, value) {
    let dbValue = await this.get(key);
    if (typeof dbValue != 'object') {
      throw new SyntaxError(
        `There was not an object saved at the ${key}, please make sure it is an object saved and not an array`
      );
    }
    try {
      dbValue[objectKey] = value;
    } catch (_err) {
      throw new SyntaxError(
        `There was a failure adding or updating the value to the saved object with the key ${objectKey}`
      );
    }
    await this.set(key, dbValue);
    return dbValue;
  }

  /**
   * Pushes to an array object saved in the database
   * @param {String} key DB key
   * @param {any} item the item being pushed into the array.
   */
  async pushArray(key, item) {
    let dbValue = await this.get(key);

    if (!Array.isArray(dbValue)) {
      throw new SyntaxError(
        `There was not an array saved at the ${key}, please make sure it is an array saved and not an object`
      );
    }
    dbValue.push(item);
    await this.set(key, dbValue);
    return dbValue;
  }

  /**
   * Deletes an item in an array object saved in the database
   * @param {String} key DB key
   * @param {any} index the index of the item in the array.
   */
  async deleteArrayItemByIndex(key, index) {
    let dbValue = await this.get(key);

    if (!Array.isArray(dbValue)) {
      throw new SyntaxError(
        `There was not an array saved at the ${key}, please make sure it is an array saved and not an object`
      );
    }
    dbValue.splice(index, 1);

    await this.set(key, dbValue);
    return dbValue;
  }

  /**
   * Deletes an item in an array object saved in the database
   * @param {String} key DB key
   * @param {any} objectKey the key of the object you are looking for
   * @param {any} searchValue the value used to find the object to remove in the array
   */
  async deleteArrayItemByValue(key, objectKey, searchValue) {
    let dbValue = await this.get(key);

    if (!Array.isArray(dbValue)) {
      throw new SyntaxError(
        `There was not an array saved at the ${key}, please make sure it is an array saved and not an object`
      );
    }
    const indexOfObject = dbValue.findIndex(object => {
      return object[objectKey] == searchValue;
    });
    if (indexOfObject == -1) {
      throw new SyntaxError(
        `Was not able to find an object with the search value of ${searchValue}`
      );
    }
    dbValue.splice(indexOfObject, 1);

    await this.set(key, dbValue);
    return dbValue;
  }
}


module.exports = Client;