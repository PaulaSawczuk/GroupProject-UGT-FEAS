// file-data.service.ts

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FileDataService {
  private fileData: { [fileName: string]: string[][] } = {};
  private pathways: string[] = []; // Add pathways property
  private expressionData: { [fileName: string]: string[][] } = {};
  private countMatrixData: { [fileName: string]: string[][] } = {};

  setFileData(fileName: string, data: string[][]): void {
    this.fileData[fileName] = data;
  }

  getFileData(): { [fileName: string]: string[][] } {
    return this.fileData;
  }

  clearFileData(): void {
    this.fileData = {};
  }

  // New methods for managing pathways
  setPathways(pathways: string[]): void {
    this.pathways = pathways;
  }

  getPathways(): string[] {
    return this.pathways;
  }

  clearPathways(): void {
    this.pathways = [];
  }

  // New methods for managing expressionData and countMatrixData
  setExpressionData(data: { [fileName: string]: string[][] }): void {
    this.expressionData = data;
  }

  getExpressionData(): { [fileName: string]: string[][] } {
    return this.expressionData;
  }

  clearExpressionData(): void {
    this.expressionData = {};
  }

  setCountMatrixData(data: { [fileName: string]: string[][] }): void {
    this.countMatrixData = data;
  }

  getCountMatrixData(): { [fileName: string]: string[][] } {
    return this.countMatrixData;
  }

  clearCountMatrixData(): void {
    this.countMatrixData = {};
  }
}