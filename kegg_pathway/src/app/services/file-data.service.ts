import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FileDataService {
  private fileData: { [fileName: string]: string[][] } = {};

  setFileData(fileName: string, data: string[][]): void {
    this.fileData[fileName] = data;
  }

  getFileData(): { [fileName: string]: string[][] } {
    return this.fileData;
  }

  clearFileData(): void {
    this.fileData = {}; // Clears all file data
  }
}