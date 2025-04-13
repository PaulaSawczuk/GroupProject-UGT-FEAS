import { Injectable } from '@angular/core';
@Injectable({
providedIn: 'root',
})
export class FileDataService {
private fileData: { [fileName: string]: string[][] } = {};
private pathways: string[] = []; // Add pathways property
private expressionData: { [fileName: string]: string[][] } = {};
//private countMatrixData: { [fileName: string]: string[][] } = {};
private combinedData: any[] = []; // Added for combined data
private annotationData: { [filename: string]: string[][] } = {}; // Added for annotation data
private multipleCombinedArrays: any[][] = [];
private pathwayCount: number = 10; // Default to 10 pathways 


setPathwayCount(numberEntered: number): void{
  console.log('Setting PathwayCount');
  this.pathwayCount = numberEntered;
}

getPathwayCount(): number{
  console.log('Pathway Count:')
  console.log(this.pathwayCount);
  return this.pathwayCount;
}


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
// setCountMatrixData(data: { [fileName: string]: string[][] }): void {
// this.countMatrixData = data;
//  }
// getCountMatrixData(): { [fileName: string]: string[][] } {
// return this.countMatrixData;
//  }
// clearCountMatrixData(): void {
// this.countMatrixData = {};
//  }

// New methods for combined data and annotation data
setCombinedData(data: any[]): void {
  this.combinedData = data;
}

getCombinedData(): any[] {
  return this.combinedData;
}

setMultipleCombinedArrays(data: any[][]): void {
  this.multipleCombinedArrays = data;
}

getMultipleCombinedArrays(): any[][] {
  return this.multipleCombinedArrays;
}

clearMultipleCombinedArrays(): void {
  this.multipleCombinedArrays = [];
}


clearCombinedData(): void {
  this.combinedData = [];
}

setAnnotationData(filename: string, data: string[][]): void {
  this.annotationData[filename] = data;
}

getAnnotationData(): { [filename: string]: string[][] } {
  return this.annotationData;
}

clearAnnotationData(): void {
  this.annotationData = {};
}




getAnnotationForGene(geneName: string): any {
  // Find annotation information for a specific gene
  const result: any = {};
  
  for (const [filename, data] of Object.entries(this.annotationData)) {
    if (data.length < 2) continue;
    
    const headerRow = data[0].map(h => h.toLowerCase());
    
    // Find the gene column index (sequence.name or similar)
    const geneColumnIndex = headerRow.findIndex(col => 
      col === 'sequence.name' || col.includes('gene') || col === 'id'
    );
    
    if (geneColumnIndex === -1) continue;
    
    // Find the row for this gene
    const geneRow = data.find(row => 
      row.length > geneColumnIndex && 
      row[geneColumnIndex].trim() === geneName
    );
    
    if (geneRow) {
      const fileKey = filename.replace(/\.[^/.]+$/, ""); // Remove file extension
      
      // Add all columns from this annotation file
      for (let i = 0; i < headerRow.length; i++) {
        if (i !== geneColumnIndex && geneRow.length > i) {
          result[`${fileKey}_${headerRow[i]}`] = geneRow[i];
        }
      }
      
      // Specifically look for EC number
      const enzymeCodeIndex = headerRow.findIndex(col => 
        col.includes('enzyme.code') || col === 'ec'
      );
      
      if (enzymeCodeIndex !== -1 && geneRow.length > enzymeCodeIndex) {
        result['ec_number'] = geneRow[enzymeCodeIndex];
      }
    }
  }
  
  return result;
}



// Get all genes that have EC numbers
getGenesWithECNumbers(): string[] {
  const genesWithEC: Set<string> = new Set();
  
  for (const [filename, data] of Object.entries(this.annotationData)) {
    if (data.length < 2) continue;
    
    const headerRow = data[0].map(h => h.toLowerCase());
    
    // Find the gene column index
    const geneColumnIndex = headerRow.findIndex(col => 
      col === 'sequence.name' || col.includes('gene') || col === 'id'
    );
    
    if (geneColumnIndex === -1) continue;
    
    // Find the EC column index
    const ecColumnIndex = headerRow.findIndex(col => 
      col.includes('enzyme.code') || col === 'ec'
    );
    
    if (ecColumnIndex === -1) continue;
    
    // Collect all genes that have an EC number
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.length > ecColumnIndex && 
          row.length > geneColumnIndex && 
          row[geneColumnIndex] && 
          row[ecColumnIndex] && 
          row[ecColumnIndex].trim() !== 'NA' && 
          row[ecColumnIndex].trim() !== '') {
        genesWithEC.add(row[geneColumnIndex].trim());
      }
    }
  }
  
  return Array.from(genesWithEC);
}
}