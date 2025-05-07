import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';  
import { KeggDataService } from '../services/kegg_organisms-data.service';
import { KeggPathwaysService } from '../services/kegg_pathways.service';
import { Router } from '@angular/router';
import { FileDataService } from '../services/file-data.service';
import { ProjectLoaderService } from '../services/project-loader.service';
import JSZip from 'jszip';

// import { getUniquePathways } from '../helper/getGenePathways';
interface UploadedFile {
  name: string;
  file: File;
}

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
  imports: [CommonModule], 
})

export class UploadComponent {
  uploadedFiles: UploadedFile[] = []; // To store the uploaded files
  annotationFiles: any[] = []; // To store the annotation files
  expressionFiles: any[] = []; // To store the expression files
  showFileList = false;  // To toggle the file list display
  unsupportedFileTypeMessage: string = ''; // Unsupported file type message - only txt and csv files are supported
  validationMessage: string = ''; // Validation message - to select all dropdown options
  warningMessage: string = ''; // Warning message - incompatible file format (wrong separator)

  // Dropdown options
  uniqueKingdoms: string[] = []; 
  uniqueSubgroups: string[] = []; 
  uniqueClasses: string[] = []; 
  uniqueOrganisms: string[] = []; 

  // To keep tract of the selected dropdown options
  selectedKingdom: string | null = null;
  selectedSubgroup: string | null = null;
  selectedClass: string | null = null;
  selectedOrganism: string | null = null;

  // Hardcoded file path for KEGG IDs
  private hardcodedFilePath: string = '../helperData/KEGG_IDs.csv';
  
  // Constructor with injected services
  constructor(private keggService: KeggDataService, private router: Router, private fileDataService: FileDataService, private keggPathwaysService: KeggPathwaysService, private projectLoaderService: ProjectLoaderService ) {} // services

  // Once Upload button is clicked, create a file input element and trigger the click event
  onUploadClick(): void {

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true; // Allow multiple file selection
    
    // Trigger the click event
    fileInput.onchange = (event: any) => {
      const files: FileList = event.target.files; // Get the selected files
      
      // if files are selected, handle them and fetch the kingdoms
      if (files && files.length > 0) {
        this.handleFiles(files);
        this.fetchAndPopulateKingdoms();
      }
    };

    fileInput.click();
  }

  // Handle the selected files
  private handleFiles(files: FileList): void {
    const validExtensions = ['txt', 'csv']; // Supported file types
    
    // Reset the warning messages each time files are uploaded
    this.unsupportedFileTypeMessage = '';  
    this.validationMessage = ''; 
    this.warningMessage = '';
    
    // Loop through the selected files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split('.').pop()?.toLowerCase(); // Get the file extension
      // Check if the file extension is valid
      if (fileExtension && validExtensions.includes(fileExtension)) {
        this.uploadedFiles.push({ name: file.name, file: file }); // Add the file to the uploaded files list
      } else {
        this.unsupportedFileTypeMessage = `File ${file.name} is not supported. Supported formats: .txt, .csv`; // Display unsupported file type message
      }
    }
    this.showFileList = this.uploadedFiles.length > 0; // Show the file list if files are uploaded
    this.preIdentifyUploadedFiles();
    
  }

  // Fetch and populate the kingdoms dropdown
  private fetchAndPopulateKingdoms(): void {
    if (this.keggService.getUniqueKingdoms().length > 0) {
      // If organisms are already available, use them immediately
      this.uniqueKingdoms = this.keggService.getUniqueKingdoms();
    } else {
      // Otherwise, fetch data from KEGG API
      this.keggService.fetchKEGGData().subscribe(() => {
        this.uniqueKingdoms = this.keggService.getUniqueKingdoms();
      });
    }
  }
  
  // Handle the selected kingdom
  onKingdomSelected(event: Event): void {
    // Get the selected kingdom
    const selectedKingdom = (event.target as HTMLSelectElement).value; 
    this.selectedKingdom = selectedKingdom;
    // Reset the selected subgroup, class, and organism if the Kingdom is changed
    this.selectedSubgroup = null;
    this.selectedClass = null;
    // Fetch the subgroups for the selected kingdom
    this.uniqueSubgroups = this.keggService.getSubgroups(selectedKingdom);
    this.uniqueClasses = [];
    this.uniqueOrganisms = [];
    this.onDropdownChange();
  }

  // Handle the selected subgroup
  onSubgroupSelected(event: Event): void {
    // Get the selected subgroup
    const selectedSubgroup = (event.target as HTMLSelectElement).value;
    this.selectedSubgroup = selectedSubgroup;
    // Reset the selected class and organism if the Subgroup is changed
    this.selectedClass = null;
    if (this.selectedKingdom) {
      // Fetch the classes for the selected subgroup
      this.uniqueClasses = this.keggService.getOrganismClass(this.selectedKingdom, selectedSubgroup);
      this.uniqueOrganisms = [];
    }
    this.onDropdownChange();
  }

  // Handle the selected class
  onClassSelected(event: Event): void {
    // Get the selected class
    const selectedClass = (event.target as HTMLSelectElement).value;
    this.selectedClass = selectedClass;
    if (this.selectedKingdom && this.selectedSubgroup) {
      // Fetch the organisms for the selected class
      this.uniqueOrganisms = this.keggService.getOrganismName(this.selectedKingdom, this.selectedSubgroup, selectedClass);
    }
    this.onDropdownChange();
  }

  // Handle the selected organism
  onOrganismSelected(event: any): void {
    // Get the selected organism
    const selectedOrganism = (event.target as HTMLSelectElement).value;
    this.selectedOrganism = selectedOrganism;
    this.onDropdownChange();
  }

  // Remove the expression and annotation files from the list
  removeFileByName(fileName: string): void {
    // Remove from expression and annotation file arrays
    this.annotationFiles = this.annotationFiles.filter(file => file.name !== fileName);
    this.expressionFiles = this.expressionFiles.filter(file => file.name !== fileName);
  
    // Recalculate uploaded statuses
    this.expressionUploaded = this.expressionFiles.length > 0;
    this.annotationUploaded = this.annotationFiles.length > 0;
  
    // Also remove from uploadedFiles if needed (optional)
    this.uploadedFiles = this.uploadedFiles.filter(file => file.name !== fileName);
  
    // Hide the file list if all files are removed
    if (this.uploadedFiles.length === 0) {
      this.showFileList = false;
      this.resetDropdowns();
    }
  
    // Reset the warning messages
    this.unsupportedFileTypeMessage = '';
    this.validationMessage = '';
    this.warningMessage = '';
  
    console.log("File removed:", fileName);
    console.log("Remaining files:", this.uploadedFiles);
    console.log("Expression files:", this.expressionFiles);
    console.log("Annotation files:", this.annotationFiles);
  }
  
  // Reset the dropdowns
  private resetDropdowns(): void {
    this.selectedKingdom = null;
    this.selectedSubgroup = null;
    this.selectedClass = null;
    this.uniqueSubgroups = [];
    this.uniqueClasses = [];
    this.uniqueOrganisms = [];
  }

  // Reset the validation message on dropdown change
  public onDropdownChange(): void {
    this.resetValidationMessage();  // Clear validation messages once a dropdown option is selected
  }

  // Reset the validation message
  private resetValidationMessage(): void {
    this.validationMessage = '';
  }

  expressionUploaded: boolean = false;
  annotationUploaded: boolean = false;

  // Pre-identify uploaded files
  // This method checks the file types and categorises them into expression and annotation files
  preIdentifyUploadedFiles(): void {
    const validExtensions = ['txt', 'csv'];

    // Reset before re-processing
    this.annotationFiles = [];  
    this.expressionFiles = [];  

    const dataLoadPromises = this.uploadedFiles.map(fileObj =>
      new Promise<void>((resolve, reject) => {
        const fileExtension = fileObj.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !validExtensions.includes(fileExtension)) {
          return reject();
        }
        
        const fileReader = new FileReader();
        // Read the file content
        fileReader.onload = (event: any) => {
          const content = event.target.result;
          const parsedData = this.parseFileContent(content, fileObj.name, fileExtension);

          if (!parsedData || parsedData.length === 0) {
            return reject();
          }

          const fileType = this.identifyFileType(parsedData, fileObj.name);
          
          // Get the type of the file
          switch (fileType) {
            case 'expression':
              this.expressionUploaded = true;
              this.expressionFiles.push(fileObj);
              break;
            case 'annotation':
              this.annotationUploaded = true;
              this.annotationFiles.push(fileObj);
              break;
          }
          resolve();
        };

        fileReader.onerror = () => {
          reject();
        };

        fileReader.readAsText(fileObj.file);
      })
    );

    Promise.allSettled(dataLoadPromises)
      .then(() => {
        console.log('Pre-identification complete.');
      })
      .catch((err) => {
        console.warn("Pre-identification error:", err);
      });
  }

  // Process the uploaded files
  processFiles(): void {
    this.uploadedFiles = [...this.annotationFiles, ...this.expressionFiles];
    const validExtensions = ['txt', 'csv'];
    const expressionData: { [filename: string]: string[][] } = {};
    const dataLoadPromises = this.uploadedFiles.map(fileObj =>
      
      // Check the file type
      new Promise<void>((resolve, reject) => {
        const fileExtension = fileObj.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !validExtensions.includes(fileExtension)) {
          this.unsupportedFileTypeMessage = `File ${fileObj.name} is not supported.`;
          return reject();
        }

        const fileReader = new FileReader();
        // Read the file content
        fileReader.onload = (event: any) => {
          const content = event.target.result;
          const parsedData = this.parseFileContent(content, fileObj.name, fileExtension);

          // Check if the parsed data is valid
          if (!parsedData || parsedData.length === 0) {
            this.warningMessage = `File ${fileObj.name} is empty or invalid.`;
            return reject();
          }

          console.log(`Parsed data from ${fileObj.name}:`, parsedData);

          // Identify the file type
          const fileType = this.identifyFileType(parsedData, fileObj.name);
          const shortName = (fileObj.name || '').replace(/\.[^/.]+$/, '');

          switch (fileType) {
            case 'expression':
              expressionData[shortName] = parsedData;
              break;
            case 'annotation':
              this.fileDataService.setAnnotationData(shortName, parsedData);
              break;
            default:
              this.warningMessage = `File ${fileObj.name} could not be identified as a valid input.`;
              return reject();
          }

          resolve();
        };

        fileReader.onerror = () => {
          this.warningMessage = `Error reading file ${fileObj.name}.`;
          reject();
        };

        fileReader.readAsText(fileObj.file);
        
      })
    );

    Promise.all(dataLoadPromises)
      .then(() => {
        // Set the expression data in the service
        this.fileDataService.setExpressionData(expressionData);
        // Get the annotation data from the service
        const annotationData = this.fileDataService.getAnnotationData();

        console.log("Expression data files:", expressionData);
        console.log("Annotation data files:", annotationData);

        // Check if expressionData and annotationData are empty
        if (Object.keys(expressionData).length === 0 || Object.keys(annotationData).length === 0) {
          this.warningMessage = "Missing expression or annotation data. Please ensure both are provided.";
          return;
        }

        const combinedArrayList: any[][] = [];
        console.log("start on iterating through expression files");
        // Iterate through each expression file
        for (const [exprFilename, exprData] of Object.entries(expressionData)) {
          const headerExpr = exprData[0].map(h => h.toLowerCase());
          console.log("header expressio: ", headerExpr);
          const geneIndexExpr = headerExpr.findIndex(col => col === 'gene');
          console.log("index expressio: ", geneIndexExpr);

          if (geneIndexExpr === -1) continue;

          const mergedGenes: any[] = [];

          // Iterate through each row in the expression data
          for (let i = 1; i < exprData.length; i++) {
            const row = exprData[i];
            const gene = row[geneIndexExpr];
            const geneData: any = { gene };

            // Copy all expression fields
            for (let j = 0; j < row.length; j++) {
              if (j !== geneIndexExpr && headerExpr[j]) {
                geneData[`${exprFilename}_${headerExpr[j]}`] = row[j];
              }
            }

            // Try to merge with annotation data
            console.log("start on iterating through annotation files");
            for (const [annFile, annData] of Object.entries(annotationData)) {
              console.log("Annotation file:", annFile);
              const headerAnn = annData[0].map(h => h.toLowerCase());
              console.log("header annot: ", headerExpr);

              const geneIndexAnn = headerAnn.findIndex(col => col === 'sequence.name' || col.includes('gene') || col === 'id');
              console.log("header annot: ", headerExpr);

              if (geneIndexAnn === -1) continue;
              // Find the row for this gene in the annotation data
              const annRow = annData.find(row => row[geneIndexAnn] === gene);
              if (annRow) {
                for (let k = 0; k < annRow.length; k++) {
                  if (k !== geneIndexAnn && headerAnn[k]) {
                    geneData[`${annFile}_${headerAnn[k]}`] = annRow[k];
                  }
                }
              }
            }
            console.log("Merged gene data:", geneData);
            mergedGenes.push(geneData);
          }

          console.log(`Merged dataset for ${exprFilename}:`, mergedGenes);
          combinedArrayList.push(mergedGenes);
        }

        const allCombined = combinedArrayList.flat();

        console.log("All combined data (flattened):", allCombined);
        console.log("Combined arrays stored separately:", combinedArrayList);

        if (allCombined.length === 0) {
          this.warningMessage = "No combined data available from any expression file.";
          return;
        }
        // Set the combined data in the service
        this.fileDataService.setCombinedData(allCombined);
        // Set the multiple combined arrays in the service
        this.fileDataService.setMultipleCombinedArrays(combinedArrayList);
        console.log(expressionData)

        // Set the uploaded expression and annotation files in the service
        this.fileDataService.setUploadedExpressionFiles(this.expressionFiles);
        this.fileDataService.setUploadedAnnoationFiles(this.annotationFiles);
        console.log("Moving to display page:");
        // Navigate to the display page
        this.router.navigate(['/display']);
      })
      .catch((err) => {
        console.warn("File processing failed:", err);
      });
  }

  // Contains methods to check file types
  identifyFileType(data: string[][], filename: string): string {
    if (data.length === 0 || data[0].length === 0) return 'unknown';

    const header = data[0].map(col => col.toLowerCase());

    // Check if it's an expression file (gene and log2FoldChange)
    if (header.includes('gene') && header.includes('log2foldchange')) {
      return 'expression';
    }

    // Check if it's an annotation file (look for specific annotation columns)
    if (header.includes('sequence.name') ||
      header.includes('annotation.go.id') ||
      header.includes('enzyme.code') ||
      header.includes('enzyme')) {
      return 'annotation';
    }

    // If first column has gene IDs and subsequent columns are numeric, it's likely a count matrix
    if (data.length > 1 && data[1].length > 1) {
      // Check if second column onwards appears to be numeric data
      let hasNumericData = false;
      for (let i = 1; i < Math.min(5, data.length); i++) {
        for (let j = 1; j < data[i].length; j++) {
          // Check if this looks like a number
          if (!isNaN(parseFloat(data[i][j])) && data[i][j].trim() !== '') {
            hasNumericData = true;
            break;
          }
        }
        if (hasNumericData) break;
      }

      if (hasNumericData) {
        return 'countMatrix';
      }
    }

    return 'unknown';
  }

  // Parse the file content based on its type
  parseFileContent(content: string, fileName: string, fileExtension: string): string[][] | null {
    const data: string[][] = [];
    
    // Check if content is empty
    if (!content || content.trim() === '') {
      console.warn(`File ${fileName} is empty`);
      return null;
    }
    
    const lines = content.split(/\r?\n/); // Handle different line endings
    
    // Try to detect the delimiter
    let separator = fileExtension === 'csv' ? ',' : '\t';
    
    // Additional check to better detect the delimiter
    if (lines.length > 0) {
      const firstLine = lines[0];
      const commaCount = (firstLine.match(/,/g) || []).length;
      const tabCount = (firstLine.match(/\t/g) || []).length;
      const semicolonCount = (firstLine.match(/;/g) || []).length;
      
      // Choose the most frequent delimiter
      if (semicolonCount > commaCount && semicolonCount > tabCount) {
        separator = ';';
      } else if (tabCount > commaCount) {
        separator = '\t';
      } else {
        separator = ',';
      }
      
      console.log(`Detected separator for ${fileName}: "${separator}"`);
    }
  
    for (const line of lines) {
      if (line.trim() === '') continue; // Skip empty lines
      const values = line.split(separator);
      
      // If we only got 1 value and the separator is likely wrong, try alternatives
      if (values.length <= 1 && line.length > 0) {
        // Try alternative separators
        const alternatives = [',', '\t', ';'].filter(s => s !== separator);
        
        for (const altSep of alternatives) {
          const altValues = line.split(altSep);
          if (altValues.length > 1) {
            // We found a better separator - use it for the whole file
            separator = altSep;
            console.log(`Switching to better separator for ${fileName}: "${separator}"`);
            
            // Start over with the new separator
            return this.parseFileContent(content, fileName, fileExtension);
          }
        }
        
        // If we get here, we couldn't find a good separator
        console.warn(`Couldn't find a suitable delimiter for ${fileName}`);
      }
      
      data.push(values);
    }
  
    if (data.length === 0) {
      console.warn(`No data was parsed from ${fileName}`);
      return null;
    }
  
    console.log(`Parsed ${data.length} rows from ${fileName}`);
    return data;
  }

  // Check if the data contains both gene and log2FoldChange columns
  containsGeneAndLog2FoldChange(data: string[][]): boolean {
    if (data.length > 0) {
        const header = data[0];
        return header.includes('gene') && header.includes('log2FoldChange');
    }
    return false;
  }

  // Load KEGG IDs
  async loadKeggIdsFromFile(filePath: string): Promise<string[]> {
    // Check if the file path is valid
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
      }
      const text = await response.text();
      const lines = text.split('\n');
      // Extract the first column (KEGG IDs) and trim whitespace
      return lines.map(line => line.split(',')[0].trim()).filter(id => id);
    } catch (error) {
      console.error('Error loading KEGG IDs:', error);
      return [];
    }
  }

  hideDropdowns: boolean = true;
  // Toggle the dropdowns
  toggleDropdowns(): void {
    this.hideDropdowns = !this.hideDropdowns;
    if (!this.hideDropdowns) {
      this.resetDropdowns();
    }
  }

  // ---------------- CHECKBOX TO CHECK IF TIME SERIES DATA ----------------
  
  noTimeSeriesChecked: boolean = false;
  
  onTimeSeriesCheckboxChange() {
    this.noTimeSeriesChecked = !this.noTimeSeriesChecked;
    console.log('Time Series?', this.noTimeSeriesChecked);
  }

  // ---------------- INPUT NUMBER OF PATHWAYS ----------------

  pathwayCount: number = 10;

  onPathwayInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    if (!isNaN(value) && value > 0) {
      this.pathwayCount = value;
      console.log('Pathway count:', this.pathwayCount);
      console.log('Sending pathway Count to File Service')
      this.fileDataService.setPathwayCount(value);
    }else{
      this.fileDataService.setPathwayCount(this.pathwayCount);

    }
}

// ------------------ GO BACK TO LANDING PAGE -----------------
goBackToLanding(): void {
  this.router.navigate(['/']);
}

// ------------------ INFORMATION ------------------

showInformationPopOut = false;

showInformation() {
  this.showInformationPopOut = true;
}

hideInformation() {
  this.showInformationPopOut = false;
}

// ------------------ DRAG EXPRESSION LIST ------------------

draggedIndex: number | null = null;
hoveredIndex: number | null = null; 

onDragStart(event: DragEvent, index: number): void {
  this.draggedIndex = index;
}

onDragOver(event: DragEvent, index: number): void {
  event.preventDefault();
  this.hoveredIndex = index; 
}

onDrop(event: DragEvent, dropIndex: number): void {
  event.preventDefault();
  if (this.draggedIndex === null || this.draggedIndex === dropIndex) return;

  const movedItem = this.expressionFiles[this.draggedIndex];

  // Remove from old position
  this.expressionFiles.splice(this.draggedIndex, 1);

  // Insert into new position
  this.expressionFiles.splice(dropIndex, 0, movedItem);

  // Reset states
  this.draggedIndex = null;
  this.hoveredIndex = null;
  console.log('Moved item:', movedItem);
  console.log('New expression files order:', this.expressionFiles);
}

onDragEnd(): void {
  this.hoveredIndex = null; // Clear hover if drag canceled
}

openProject(): void {
const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.zip';
  
    fileInput.onchange = async (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (!input.files || input.files.length === 0) return;
  
      const zipFile = input.files[0];
  
      try {
        const zip = await JSZip.loadAsync(zipFile);
  
        const fileContents: { name: string, content: string }[] = [];
  
        await Promise.all(
          Object.keys(zip.files).map(async (filename) => {
            const file = zip.files[filename];
            if (!file.dir) {
              const content = await file.async('string');
              fileContents.push({ name: filename, content });
            }
          })
        );
  
        // Save the fileContents temporarily in the service
        this.fileDataService.setTempProjectData(fileContents);
  
        // Navigate to display component
        this.router.navigate(['/display'], {
          state: { fromLanding: true }
        });
      } catch (err) {
        console.error('Failed to open project:', err);
        alert('Failed to open project file');
      }
    };
  
    fileInput.click();
  }
}
