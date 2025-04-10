



export class GlobalDataStore {
    private static _ALLpathwayData: ReadonlyArray<any> | null = null;
  
    static get ALLpathwayData(): ReadonlyArray<any> {
      if (this._ALLpathwayData === null) {
        throw new Error('ALLpathwayData not initialized.');
      }
      return this._ALLpathwayData;
    }
  
    static setALLpathwayDataOnce(data: any[]): void {
      if (this._ALLpathwayData !== null) {
        console.warn('Attempted to overwrite ALLpathwayData — operation ignored.');
        return;
      }
      this._ALLpathwayData = Object.freeze([...data]); // Make array immutable
      console.log('ALLpathwayData has been initialized.');
    }
  }