import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';  
import { KeggDataService } from '../services/kegg_organisms-data.service';
import { KeggPathwaysService } from '../services/kegg_pathways.service';
import { Router } from '@angular/router';
import { FileDataService } from '../services/file-data.service';
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
  constructor(private keggService: KeggDataService, private router: Router, private fileDataService: FileDataService, private keggPathwaysService: KeggPathwaysService) {} // Inject service

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

  // Remove a file from the uploaded files list
  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1); // Remove the file from the list
    
    // Hide the file list if all files are removed
    if (this.uploadedFiles.length === 0) {
      this.showFileList = false;
      this.resetDropdowns(); // Reset dropdowns when all files are removed
    }
    // Reset the warning messages each time a file is removed
    this.unsupportedFileTypeMessage = '';
    this.validationMessage = '';
    this.warningMessage = '';
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


  

//=====MABLES=====
  // Process the uploaded files
  processFiles(): void {
    const validExtensions = ['txt', 'csv'];
    const expressionData: { [filename: string]: string[][] } = {};
    const dataLoadPromises = this.uploadedFiles.map(fileObj =>
      new Promise<void>((resolve, reject) => {
        const fileExtension = fileObj.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !validExtensions.includes(fileExtension)) {
          this.unsupportedFileTypeMessage = `File ${fileObj.name} is not supported.`;
          return reject();
        }

        const fileReader = new FileReader();
        fileReader.onload = (event: any) => {
          const content = event.target.result;
          const parsedData = this.parseFileContent(content, fileObj.name, fileExtension);

          if (!parsedData || parsedData.length === 0) {
            this.warningMessage = `File ${fileObj.name} is empty or invalid.`;
            return reject();
          }

          console.log(`Parsed data from ${fileObj.name}:`, parsedData);

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
        this.fileDataService.setExpressionData(expressionData);
        const annotationData = this.fileDataService.getAnnotationData();

        console.log("Expression data files:", expressionData);
        console.log("Annotation data files:", annotationData);

        const combinedArrayList: any[][] = [];

        for (const [exprFilename, exprData] of Object.entries(expressionData)) {
          const headerExpr = exprData[0].map(h => h.toLowerCase());
          const geneIndexExpr = headerExpr.findIndex(col => col === 'gene');
          if (geneIndexExpr === -1) continue;

          const mergedGenes: any[] = [];

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
            for (const [annFile, annData] of Object.entries(annotationData)) {
              const headerAnn = annData[0].map(h => h.toLowerCase());
              const geneIndexAnn = headerAnn.findIndex(col => col === 'sequence.name' || col.includes('gene') || col === 'id');
              if (geneIndexAnn === -1) continue;

              const annRow = annData.find(row => row[geneIndexAnn] === gene);
              if (annRow) {
                for (let k = 0; k < annRow.length; k++) {
                  if (k !== geneIndexAnn && headerAnn[k]) {
                    geneData[`${annFile}_${headerAnn[k]}`] = annRow[k];
                  }
                }
              }
            }

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

        this.fileDataService.setCombinedData(allCombined);
        this.fileDataService.setMultipleCombinedArrays(combinedArrayList);

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
      (header.includes('go') && header.includes('enzyme'))) {
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

  // // Find common genes across all files
  // private findCommonGenes(expressionData: { [filename: string]: string[][] }, countMatrixData: { [filename: string]: string[][] }): string[] {
  //   const genesByFile: { [filename: string]: Set<string> } = {};

  //   // Extract genes from expression data files
  //   for (const [filename, data] of Object.entries(expressionData)) {
  //     if (data.length < 2) continue; // Skip if no data rows

  //     const headerRow = data[0].map(h => h.toLowerCase());
  //     const geneColumnIndex = headerRow.findIndex(col => col === 'gene');

  //     if (geneColumnIndex === -1) continue;

  //     const geneSet = new Set<string>();
  //     for (let i = 1; i < data.length; i++) {
  //       const row = data[i];
  //       if (row.length > geneColumnIndex && row[geneColumnIndex]) {
  //         geneSet.add(row[geneColumnIndex].trim());
  //       }
  //     }

  //     genesByFile[filename] = geneSet;
  //   }

  //   // Extract genes from count matrix data files
  //   for (const [filename, data] of Object.entries(countMatrixData)) {
  //     if (data.length < 2) continue; // Skip if no data rows

  //     const headerRow = data[0].map(h => h.toLowerCase());

  //     // Check if this is an annotation file
  //     const isAnnotation = headerRow.some(col =>
  //       col.includes('go.id') ||
  //       col.includes('enzyme.code') ||
  //       col.includes('sequence.description')
  //     );

  //     // Determine the gene column name/index
  //     let geneColumnIndex = -1;

  //     if (isAnnotation) {
  //       // For annotation files, look for sequence.name or similar
  //       geneColumnIndex = headerRow.findIndex(col =>
  //         col === 'sequence.name' || col.includes('gene') || col === 'id'
  //       );
  //     } else {
  //       // For count matrix, assume first column is gene identifier
  //       geneColumnIndex = 0;
  //     }

  //     if (geneColumnIndex === -1) continue;

  //     const geneSet = new Set<string>();
  //     for (let i = 1; i < data.length; i++) {
  //       const row = data[i];
  //       if (row.length > geneColumnIndex && row[geneColumnIndex]) {
  //         geneSet.add(row[geneColumnIndex].trim());
  //       }
  //     }

  //     genesByFile[filename] = geneSet;
  //   }

  //   // Find intersection of gene sets
  //   const fileNames = Object.keys(genesByFile);
  //   if (fileNames.length === 0) return [];

  //   let commonGenes = [...genesByFile[fileNames[0]] || []];

  //   for (let i = 1; i < fileNames.length; i++) {
  //     const fileGenes = genesByFile[fileNames[i]];
  //     commonGenes = commonGenes.filter(gene => fileGenes.has(gene));
  //   }

  //   return commonGenes;
  // }

  // // Create a combined dataset with all relevant data for common genes
  // private createCombinedDataset(
  //   commonGenes: string[],
  //   expressionData: { [filename: string]: string[][] },
  //   countMatrixData: { [filename: string]: string[][] }
  // ): any[] {
  //   const result: any[] = [];

  //   // Process each common gene
  //   for (const gene of commonGenes) {
  //     const geneData: any = { gene };

  //     // Extract data from expression files
  //     for (const [filename, data] of Object.entries(expressionData)) {
  //       const headerRow = data[0].map(h => h.toLowerCase());
  //       const geneColumnIndex = headerRow.findIndex(col => col === 'gene');
  //       const log2FoldChangeColumnIndex = headerRow.findIndex(col => col === 'log2foldchange');

  //       if (geneColumnIndex === -1 || log2FoldChangeColumnIndex === -1) continue;

  //       // Find the row for this gene
  //       const geneRow = data.find(row =>
  //         row.length > geneColumnIndex &&
  //         row[geneColumnIndex].trim() === gene
  //       );

  //       if (geneRow && geneRow.length > log2FoldChangeColumnIndex) {
  //         const fileKey = filename.replace(/\.[^/.]+$/, ""); // Remove file extension
  //         geneData[`${fileKey}_log2FoldChange`] = geneRow[log2FoldChangeColumnIndex];

  //         // Also add any other important columns
  //         for (let i = 0; i < headerRow.length; i++) {
  //           if (i !== geneColumnIndex && i !== log2FoldChangeColumnIndex && geneRow.length > i) {
  //             const colName = headerRow[i];
  //             if (colName && colName !== 'log2foldchange' && colName !== 'gene') {
  //               geneData[`${fileKey}_${colName}`] = geneRow[i];
  //             }
  //           }
  //         }
  //       }
  //     }

  //     // Extract data from count matrix files
  //     for (const [filename, data] of Object.entries(countMatrixData)) {
  //       const headerRow = data[0].map(h => h.toLowerCase());

  //       // Check if this is an annotation file by looking for annotation-specific columns
  //       const isAnnotation = headerRow.some(col =>
  //         col.includes('go.id') ||
  //         col.includes('enzyme.code') ||
  //         col.includes('sequence.description')
  //       );

  //       // Determine the gene column name/index
  //       let geneColumnIndex = -1;

  //       if (isAnnotation) {
  //         // For annotation files, look for sequence.name or similar
  //         geneColumnIndex = headerRow.findIndex(col =>
  //           col === 'sequence.name' || col.includes('gene') || col === 'id'
  //         );
  //       } else {
  //         // For count matrix, assume first column is gene identifier
  //         geneColumnIndex = 0;
  //       }

  //       if (geneColumnIndex === -1) continue;

  //       // Find the row for this gene
  //       let geneRow = data.find(row =>
  //         row.length > geneColumnIndex &&
  //         row[geneColumnIndex].trim() === gene
  //       );

  //       if (geneRow) {
  //         const fileKey = filename.replace(/\.[^/.]+$/, ""); // Remove file extension

  //         if (isAnnotation) {
  //           // Handle specific annotation columns

  //           // Look for EC number
  //           const enzymeCodeIndex = headerRow.findIndex(col =>
  //             col.includes('enzyme.code') || col.includes('ec')
  //           );

  //           if (enzymeCodeIndex !== -1 && geneRow.length > enzymeCodeIndex) {
  //             geneData[`${fileKey}_EC`] = geneRow[enzymeCodeIndex];
  //           }

  //           // Look for GO ID
  //           const goIdIndex = headerRow.findIndex(col =>
  //             col.includes('go.id') || col === 'go'
  //           );

  //           if (goIdIndex !== -1 && geneRow.length > goIdIndex) {
  //             geneData[`${fileKey}_GO`] = geneRow[goIdIndex];
  //           }

  //           // Look for description
  //           const descIndex = headerRow.findIndex(col =>
  //             col.includes('description') || col.includes('desc')
  //           );

  //           if (descIndex !== -1 && geneRow.length > descIndex) {
  //             geneData[`${fileKey}_description`] = geneRow[descIndex];
  //           }

  //           // Also add enzyme name if available
  //           const enzymeNameIndex = headerRow.findIndex(col =>
  //             col.includes('enzyme.name')
  //           );

  //           if (enzymeNameIndex !== -1 && geneRow.length > enzymeNameIndex) {
  //             geneData[`${fileKey}_enzyme_name`] = geneRow[enzymeNameIndex];
  //           }

  //         } else {
  //           // Handle count matrix columns
  //           // Add sample values for all samples in this file
  //           for (let i = 1; i < headerRow.length; i++) {
  //             const sampleName = data[0][i]?.trim();
  //             if (sampleName && geneRow.length > i) {
  //               geneData[`${fileKey}_${sampleName}`] = geneRow[i];
  //             }
  //           }
  //         }
  //       }
  //     }

  //     result.push(geneData);
  //   }

  //   return result;
  // }




//======================================================================
//====WITHOUT COUNT MATRIX FILE=====
// Process the uploaded files
// processFiles(): void {
//   const validExtensions = ['txt', 'csv'];
//   const expressionData: { [filename: string]: string[][] } = {};
//   // Removed countMatrixData definition

//   const dataLoadPromises = this.uploadedFiles.map(fileObj =>
//     new Promise<void>((resolve, reject) => {
//       const fileExtension = fileObj.name.split('.').pop()?.toLowerCase();
//       if (!fileExtension || !validExtensions.includes(fileExtension)) {
//         this.unsupportedFileTypeMessage = `File ${fileObj.name} is not supported.`;
//         return reject();
//       }

//       const fileReader = new FileReader();
//       fileReader.onload = (event: any) => {
//         const content = event.target.result;
//         const parsedData = this.parseFileContent(content, fileObj.name, fileExtension);

//         if (!parsedData || parsedData.length === 0) {
//           this.warningMessage = `File ${fileObj.name} is empty or invalid.`;
//           return reject();
//         }

//         const fileType = this.identifyFileType(parsedData, fileObj.name);
//         const shortName = fileObj.name.replace(/\.[^/.]+$/, "");

//         switch (fileType) {
//           case 'expression':
//             expressionData[shortName] = parsedData;
//             break;
//           case 'annotation':
//             this.fileDataService.setAnnotationData(shortName, parsedData);
//             break;
//           // Removed 'countMatrix' case
//           default:
//             this.warningMessage = `File ${fileObj.name} could not be identified as a valid input.`;
//             return reject();
//         }

//         resolve();
//       };

//       fileReader.onerror = () => {
//         this.warningMessage = `Error reading file ${fileObj.name}.`;
//         reject();
//       };

//       fileReader.readAsText(fileObj.file);
//     })
//   );

//   Promise.all(dataLoadPromises)
//     .then(() => {
//       this.fileDataService.setExpressionData(expressionData);
//       // Removed setting countMatrixData

//       // Modified to only consider expressionData for common genes
//       const annotationData = this.fileDataService.getAnnotationData();
//       const commonGenes = this.findCommonGenes(expressionData, annotationData);
//       const combinedData = this.createCombinedDataset(commonGenes, expressionData, annotationData);

//       if (!combinedData || combinedData.length === 0) {
//         this.warningMessage = "No combined data available to extract EC numbers from.";
//         return;
//       }

//       this.fileDataService.setCombinedData(combinedData);
//       this.router.navigate(['/display']);
//     })
//     .catch((err) => {
//       console.warn("File processing failed:", err);
//     });
// }


// // Find common genes across all files
// private findCommonGenes(expressionData: { [filename: string]: string[][] }, annotationData: { [filename: string]: string[][] }): string[] {
//   const genesByFile: { [filename: string]: Set<string> } = {};

//   // Extract genes from expression data files
//   for (const [filename, data] of Object.entries(expressionData)) {
//     if (data.length < 2) continue; // Skip if no data rows

//     const headerRow = data[0].map(h => h.toLowerCase());
//     const geneColumnIndex = headerRow.findIndex(col => col === 'gene');

//     if (geneColumnIndex === -1) continue;

//     const geneSet = new Set<string>();
//     for (let i = 1; i < data.length; i++) {
//       const row = data[i];
//       if (row.length > geneColumnIndex && row[geneColumnIndex]) {
//         geneSet.add(row[geneColumnIndex].trim());
//       }
//     }

//     genesByFile[filename] = geneSet;
//   }

//   // Extract genes from annotation data files
//   for (const [filename, data] of Object.entries(annotationData)) {
//     if (data.length < 2) continue; // Skip if no data rows

//     const headerRow = data[0].map(h => h.toLowerCase());

//     // Determine the gene column name/index
//     const geneColumnIndex = headerRow.findIndex(col =>
//       col === 'sequence.name' || col.includes('gene') || col === 'id'
//     );

//     if (geneColumnIndex === -1) continue;

//     const geneSet = new Set<string>();
//     for (let i = 1; i < data.length; i++) {
//       const row = data[i];
//       if (row.length > geneColumnIndex && row[geneColumnIndex]) {
//         geneSet.add(row[geneColumnIndex].trim());
//       }
//     }

//     genesByFile[filename] = geneSet;
//   }

//   // Find intersection of gene sets
//   const fileNames = Object.keys(genesByFile);
//   if (fileNames.length === 0) return [];

//   let commonGenes = [...genesByFile[fileNames[0]] || []];

//   for (let i = 1; i < fileNames.length; i++) {
//     const fileGenes = genesByFile[fileNames[i]];
//     commonGenes = commonGenes.filter(gene => fileGenes.has(gene));
//   }

//   return commonGenes;
// }

// // Create a combined dataset with all relevant data for common genes
// private createCombinedDataset(
//   commonGenes: string[],
//   expressionData: { [filename: string]: string[][] },
//   annotationData: { [filename: string]: string[][] }
// ): any[] {
//   const result: any[] = [];

//   // Process each common gene
//   for (const gene of commonGenes) {
//     const geneData: any = { gene };

//     // Extract data from expression files
//     for (const [filename, data] of Object.entries(expressionData)) {
//       const headerRow = data[0].map(h => h.toLowerCase());
//       const geneColumnIndex = headerRow.findIndex(col => col === 'gene');
//       const log2FoldChangeColumnIndex = headerRow.findIndex(col => col === 'log2foldchange');

//       if (geneColumnIndex === -1 || log2FoldChangeColumnIndex === -1) continue;

//       // Find the row for this gene
//       const geneRow = data.find(row =>
//         row.length > geneColumnIndex &&
//         row[geneColumnIndex].trim() === gene
//       );

//       if (geneRow && geneRow.length > log2FoldChangeColumnIndex) {
//         const fileKey = filename.replace(/\.[^/.]+$/, ""); // Remove file extension
//         geneData[`${fileKey}_log2FoldChange`] = geneRow[log2FoldChangeColumnIndex];

//         // Also add any other important columns
//         for (let i = 0; i < headerRow.length; i++) {
//           if (i !== geneColumnIndex && i !== log2FoldChangeColumnIndex && geneRow.length > i) {
//             const colName = headerRow[i];
//             if (colName && colName !== 'log2foldchange' && colName !== 'gene') {
//               geneData[`${fileKey}_${colName}`] = geneRow[i];
//             }
//           }
//         }
//       }
//     }

//     // Extract data from annotation files
//     for (const [filename, data] of Object.entries(annotationData)) {
//       const headerRow = data[0].map(h => h.toLowerCase());

//       // Determine the gene column name/index
//       const geneColumnIndex = headerRow.findIndex(col =>
//         col === 'sequence.name' || col.includes('gene') || col === 'id'
//       );

//       if (geneColumnIndex === -1) continue;

//       // Find the row for this gene
//       let geneRow = data.find(row =>
//         row.length > geneColumnIndex &&
//         row[geneColumnIndex].trim() === gene
//       );

//       if (geneRow) {
//         const fileKey = filename.replace(/\.[^/.]+$/, ""); // Remove file extension

//         // Handle specific annotation columns
//         // Look for EC number
//         const enzymeCodeIndex = headerRow.findIndex(col =>
//           col.includes('enzyme.code') || col.includes('ec')
//         );

//         if (enzymeCodeIndex !== -1 && geneRow.length > enzymeCodeIndex) {
//           geneData[`${fileKey}_EC`] = geneRow[enzymeCodeIndex];
//         }

//         // Look for GO ID
//         const goIdIndex = headerRow.findIndex(col =>
//           col.includes('go.id') || col === 'go'
//         );

//         if (goIdIndex !== -1 && geneRow.length > goIdIndex) {
//           geneData[`${fileKey}_GO`] = geneRow[goIdIndex];
//         }

//         // Look for description
//         const descIndex = headerRow.findIndex(col =>
//           col.includes('description') || col.includes('desc')
//         );

//         if (descIndex !== -1 && geneRow.length > descIndex) {
//           geneData[`${fileKey}_description`] = geneRow[descIndex];
//         }

//         // Also add enzyme name if available
//         const enzymeNameIndex = headerRow.findIndex(col =>
//           col.includes('enzyme.name')
//         );

//         if (enzymeNameIndex !== -1 && geneRow.length > enzymeNameIndex) {
//           geneData[`${fileKey}_enzyme_name`] = geneRow[enzymeNameIndex];
//         }
//       }
//     }

//     result.push(geneData);
//   }

//   return result;
// }

// // Contains methods to check file types
// identifyFileType(data: string[][], filename: string): string {
//   if (data.length === 0 || data[0].length === 0) return 'unknown';

//   const header = data[0].map(col => col.toLowerCase());

//   // Check if it's an expression file (gene and log2FoldChange)
//   if (header.includes('gene') && header.includes('log2foldchange')) {
//     return 'expression';
//   }

//   // Check if it's an annotation file (look for specific annotation columns)
//   if (header.includes('sequence.name') ||
//     header.includes('annotation.go.id') ||
//     header.includes('enzyme.code') ||
//     (header.includes('go') && header.includes('enzyme'))) {
//     return 'annotation';
//   }

//   // Removed countMatrix detection logic

//   return 'unknown';
// }
//======================================================================



//====PAULAS=====
  //processFiles(): void {
    // Validate the selected dropdown options
  //   if (!this.selectedKingdom || !this.selectedSubgroup || !this.selectedClass || !this.selectedOrganism) {
      
  //     this.validationMessage =
  //       'Please select all required options: Kingdom, Subgroup, Class, and Organism.';
  //     return;
  //   }
    
  //   const validExtensions = ['txt', 'csv']; // Supported file types
  //   const expressionData: { [filename: string]: string[][] } = {}; // To store the expression data
  //   const countMatrixData: { [filename: string]: string[][] } = {}; // To store the count matrix data

  //   // Load the data from the uploaded files
  //   const dataLoadPromises = this.uploadedFiles.map(
  //     (fileObj) =>
  //         new Promise<void>((resolve, reject) => {
  //             // Get the file extension from the file name
  //             const fileExtension = fileObj.name.split('.').pop()?.toLowerCase();

  //             // Check if the file extension is valid
  //             if (!fileExtension || !validExtensions.includes(fileExtension)) {
  //                 this.unsupportedFileTypeMessage = `File ${fileObj.name} is not supported. Supported formats: .txt, .csv`;
  //                 return reject();
  //             }
  //             // Read the file content
  //             const fileReader = new FileReader();
              
  //             fileReader.onload = (event: any) => {
  //                 const content = event.target.result; // Get the file content
  //                 const parsedData = this.parseFileContent(content, fileObj.name, fileExtension); // Parse the file content
                  
  //                 // Check if the file contains gene and log2FoldChange columns
  //                 if (parsedData) {
  //                     if (this.containsGeneAndLog2FoldChange(parsedData)) {
  //                         expressionData[fileObj.name] = parsedData;
  //                     } else {
  //                         countMatrixData[fileObj.name] = parsedData;
  //                     }
  //                     resolve();
  //                 } else {
  //                     this.warningMessage = `File ${fileObj.name} is not compatible. Expression data does not contain gene and log2FoldChange columns.`;
  //                     reject();
  //                 }
  //             };
  //             fileReader.readAsText(fileObj.file);
  //         })
  // );
  // // Process the uploaded files
  // Promise.all(dataLoadPromises)
  //     .then(async () => {
  //       // Set the expression data and count matrix data in the file data service
  //       this.fileDataService.setExpressionData(expressionData);
  //       this.fileDataService.setCountMatrixData(countMatrixData);
  //       // Get the organism code
  //       const organismCode = this.keggService.getOrganismCode(
  //         this.selectedKingdom!,
  //         this.selectedSubgroup!,
  //         this.selectedClass!,
  //         this.selectedOrganism!
  //       );
  //       //
  //     //   console.log('Organism code:', organismCode);
  //     //   if (organismCode) {
  //     //     const keggIds = await this.loadKeggIdsFromFile(this.hardcodedFilePath);
  //     //     console.log('KEGG IDs:', keggIds);
  //     //     if (keggIds && keggIds.length > 0) {
  //     //       const pathways = await getUniquePathways(keggIds, organismCode);
  //     //       this.fileDataService.setPathways(pathways);
  //     //     } else {
  //     //       console.log('KEGG IDs:', keggIds);
  //     //       console.warn('No KEGG IDs found in the file.');
  //     //     }
  //     //   } else {
  //     //     console.error('Organism code not found.');
  //     //   }

  //     //   this.router.navigate(['/display']);
  //     // })
  //     // .catch(() => {
  //     //   console.warn('Some files were not processed due to incompatible formats.');
  //     // });
  //     console.log('Organism code:', organismCode);
  //     if (organismCode) {
  //       this.keggPathwaysService.fetchKEGGPathways(organismCode).subscribe(pathways => {
  //         if (pathways && pathways.length > 0) {
  //           this.fileDataService.setPathways(pathways.map(p => p.path));
  //         } else {
  //           console.warn('No pathways found for organism code:', organismCode);
  //         }
  //         this.router.navigate(['/display']);
  //       });
  //     } else {
  //       console.error('Organism code not found.');
  //     }

      //this.router.navigate(['/display']);
    // })
    // .catch(() => {
      // console.warn('Some files were not processed due to incompatible formats.');
    // });
  //}
  //==========================================================================


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



  // parseFileContent(
  //   content: string,
  //   fileName: string,
  //   fileExtension: string
  // ): string[][] | null {
  //   const data: string[][] = [];
  //   const lines = content.split('\n');
  //   const separator = fileExtension === 'csv' ? ',' : '\t'; // Determine separator

  //   for (const line of lines) {
  //       const values = line.split(separator);
  //       if (values.length <= 1) return null; // Ensure delimiter is operating properly
  //       data.push(values);
  //   }

  //   console.log(`Parsed data from ${fileName}: `, data);
  //   return data;
  // }

  containsGeneAndLog2FoldChange(data: string[][]): boolean {
    if (data.length > 0) {
        const header = data[0];
        return header.includes('gene') && header.includes('log2FoldChange');
    }
    return false;
  }

  async loadKeggIdsFromFile(filePath: string): Promise<string[]> {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
      }
      const text = await response.text();
      const lines = text.split('\n');
      return lines.map(line => line.split(',')[0].trim()).filter(id => id);
    } catch (error) {
      console.error('Error loading KEGG IDs:', error);
      return [];
    }
  }
  hideDropdowns: boolean = true;
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
      this.fileDataService.setPathwayCount(this.pathwayCount);
    }
  }
}
