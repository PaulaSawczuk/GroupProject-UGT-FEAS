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
  
  // Process the uploaded files
  processFiles(): void {
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

      this.router.navigate(['/display']);
    // })
    // .catch(() => {
      // console.warn('Some files were not processed due to incompatible formats.');
    // });
  }

  parseFileContent(
    content: string,
    fileName: string,
    fileExtension: string
  ): string[][] | null {
    const data: string[][] = [];
    const lines = content.split('\n');
    const separator = fileExtension === 'csv' ? ',' : '\t'; // Determine separator

    for (const line of lines) {
        const values = line.split(separator);
        if (values.length <= 1) return null; // Ensure delimiter is operating properly
        data.push(values);
    }

    console.log(`Parsed data from ${fileName}: `, data);
    return data;
  }

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
}
