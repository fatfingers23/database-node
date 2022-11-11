export class Client {
  constructor(key?: string);

  // Native
  public get(key: string, options?: { raw?: boolean }): Promise<unknown>;
  public set(key: string, value: any): Client;
  public delete(key: string): Client;
  public list(prefix?: string): Promise<string[]>;
  public updateObject(key: string, objectKey: string, value: string): Object
  public deleteArrayItemByIndex(key: string, index: string): Array
  public deleteArrayItemByValue(key: string, objectKey: string, searchValue: Any): Array

  // Dynamic
  public empty(): Client;
  public getAll(): Record<any, any>;
  public setAll(obj: Record<any, any>): Client;
  public deleteMultiple(...args: string[]): Client;
}
