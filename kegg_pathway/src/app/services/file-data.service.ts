import { Injectable } from '@angular/core';

interface UploadedFile {
  name: string;
  file: File;
}
@Injectable({
providedIn: 'root',
})

/**
 * This service is responsible for managing and storing differnet types of data
 * related to the project. It acts as a centralised data store for the application,
 * providing methods to set, get, and clear data for different file types and
 * project-related information.
 *
 * ### Key Responsibilities:
 * - **File Data Management**: Stores and retrieves data from uploaded files.
 * - **Pathway Data Management**: Handles pathway-related data, including counts and lists.
 * - **Expression Data Management**: Manages expression data for different files.
 * - **Annotation Data Management**: Stores and retrieves annotation data, including gene-specific information.
 * - **Combined Data Management**: Handles combined data and multiple combined arrays.
 * - **Temporary Project Data**: Stores temporary project data for intermediate processing.
 * - **Gene and Enzyme Information**: Provides methods to retrieve gene-specific annotations and genes with EC numbers.
 */
export class FileDataService {
private fileData: { [fileName: string]: string[][] } = {};
private pathways: string[] = []; // Add pathways property
private expressionData: { [fileName: string]: string[][] } = {};
private combinedData: any[] = []; // Added for combined data
private annotationData: { [filename: string]: string[][] } = {}; // Added for annotation data
private multipleCombinedArrays: any[][] = [];
private pathwayCount: number = 10; // Default to 10 pathways 
private uploadedExpressionFiles: UploadedFile[] = []; // Array to store uploaded expression files
private uploadedAnnoationFiles: UploadedFile[] = []; // Array to store uploaded annotation files
private tempProjectData: { name: string; content: string }[] = []; // Array to store temporary project data

// Set Temporary project data
setTempProjectData(data: { name: string; content: string }[]) {
  this.tempProjectData = data;
}

// Get Temporary project data
getTempProjectData() {
  return this.tempProjectData;
}

// set Uploaded expression files
setUploadedExpressionFiles(files: UploadedFile[]): void {
  this.uploadedExpressionFiles = files;
  console.log('Uploaded Expression files set:', this.uploadedExpressionFiles);
}

// get Uploaded expression files
getUploadedExpressionFiles(): UploadedFile[] {
  console.log('Getting Uploaded Expression files:', this.uploadedExpressionFiles);
  return this.uploadedExpressionFiles;
}

// clear Uploaded expression files
clearUploadedExpressionFiles(): void {
  this.uploadedExpressionFiles = [];
}

// set Uploaded annotation files
setUploadedAnnoationFiles(files: UploadedFile[]): void {
  this.uploadedAnnoationFiles = files;
  console.log('Uploaded Annotation files set:', this.uploadedAnnoationFiles);
}

// get Uploaded annotation files
getUploadedAnnoationFiles(): UploadedFile[] {
  return this.uploadedAnnoationFiles;
}

// clear Uploaded annotation files
clearUploadedAnnotationFiles(): void {
  this.uploadedAnnoationFiles = [];
}

// Set the count of pathways
setPathwayCount(numberEntered: number): void{
  console.log('Setting PathwayCount');
  this.pathwayCount = numberEntered;
}

// Get the count of pathways
getPathwayCount(): number{
  console.log('Pathway Count:')
  console.log(this.pathwayCount);
  return this.pathwayCount;
}

// Clear the pathway count
clearPathwayCount(): void {
  console.log('Clearing pathway count');
  this.pathwayCount = 10; 
}

// Set File Data
setFileData(fileName: string, data: string[][]): void {
this.fileData[fileName] = data;
 }

// Get File Data
getFileData(): { [fileName: string]: string[][] } {
return this.fileData;
 }

// Get File Data
clearFileData(): void {
this.fileData = {};
 }

// Set Pathways
setPathways(pathways: string[]): void {
this.pathways = pathways;
 }

// Get Pathways
getPathways(): string[] {
return this.pathways;
 }

// Clear Pathways
clearPathways(): void {
this.pathways = [];
 }

// Set Expression Data
setExpressionData(data: { [fileName: string]: string[][] }): void {
this.expressionData = data;
 }

// Get Expression Data
getExpressionData(): { [fileName: string]: string[][] } {
return this.expressionData;
 }

// Clear Expression Data
clearExpressionData(): void {
this.expressionData = {};
 }

// Set Combined Data
setCombinedData(data: any[]): void {
  this.combinedData = data;
}

// Get Combined Data
getCombinedData(): any[] {
  return this.combinedData;
}

// Set Multiple Combined Arrays
setMultipleCombinedArrays(data: any[][]): void {
  this.multipleCombinedArrays = data;
}

// Get Multiple Combined Arrays
getMultipleCombinedArrays(): any[][] {
  return this.multipleCombinedArrays;
}

// Clear Multiple Combined Arrays
clearMultipleCombinedArrays(): void {
  this.multipleCombinedArrays = [];
}
// Clear Combined Data
clearCombinedData(): void {
  this.combinedData = [];
}
// Set Annotation Data
setAnnotationData(filename: string, data: string[][]): void {
  this.annotationData[filename] = data;
}
// Get Annotation Data
getAnnotationData(): { [filename: string]: string[][] } {
  return this.annotationData;
}
// Clear Annotation Data
clearAnnotationData(): void {
  this.annotationData = {};
}
// Find annotation information for a specific gene
getAnnotationForGene(geneName: string): any {
  
  const result: any = {};
  // Iterate through each annotation file
  for (const [filename, data] of Object.entries(this.annotationData)) {
    if (data.length < 2) continue;
    // Get the header row and convert to lowercase
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