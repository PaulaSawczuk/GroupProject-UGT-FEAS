import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { KeggDataService } from  '../services/kegg_organisms-data.service';
import { Router } from '@angular/router';
import { FileDataService } from '../services/file-data.service';
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
  uploadedFiles: UploadedFile[] = [];
  showFileList = false;
  unsupportedFileTypeMessage: string = '';
  validationMessage: string = '';
  warningMessage: string = '';

  uniqueKingdoms: string[] = [];
  uniqueSubgroups: string[] = [];
  uniqueClasses: string[] = [];
  uniqueOrganisms: string[] = [];

  selectedKingdom: string | null = null;
  selectedSubgroup: string | null = null;
  selectedClass: string | null = null;
  selectedOrganism: string | null = null;
  
  constructor(private keggService: KeggDataService, private router: Router, private fileDataService: FileDataService) {} // Inject service

  onUploadClick(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    
    fileInput.onchange = (event: any) => {
      const files: FileList = event.target.files;
      if (files && files.length > 0) {
        this.handleFiles(files);
        this.fetchAndPopulateKingdoms();
      }
    };

    fileInput.click();
  }

  private handleFiles(files: FileList): void {
    const validExtensions = ['txt', 'csv'];
    this.unsupportedFileTypeMessage = '';  // Reset the message each time files are uploaded
    this.validationMessage = '';
    this.warningMessage = '';
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension && validExtensions.includes(fileExtension)) {
        this.uploadedFiles.push({ name: file.name, file: file });
      } else {
        this.unsupportedFileTypeMessage = `File ${file.name} is not supported. Supported formats: .txt, .csv`;
      }
    }
    this.showFileList = this.uploadedFiles.length > 0;
  }

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
  
  onKingdomSelected(event: Event): void {
    const selectedKingdom = (event.target as HTMLSelectElement).value;
    this.selectedKingdom = selectedKingdom;
    this.selectedSubgroup = null;
    this.selectedClass = null;
    this.uniqueSubgroups = this.keggService.getSubgroups(selectedKingdom);
    this.uniqueClasses = [];
    this.uniqueOrganisms = [];
    this.onDropdownChange();
  }

  onSubgroupSelected(event: Event): void {
    const selectedSubgroup = (event.target as HTMLSelectElement).value;
    this.selectedSubgroup = selectedSubgroup;
    this.selectedClass = null;
    if (this.selectedKingdom) {
      this.uniqueClasses = this.keggService.getOrganismClass(this.selectedKingdom, selectedSubgroup);
      this.uniqueOrganisms = [];
    }
    this.onDropdownChange();
  }

  onClassSelected(event: Event): void {
    const selectedClass = (event.target as HTMLSelectElement).value;
    this.selectedClass = selectedClass;
    if (this.selectedKingdom && this.selectedSubgroup) {
      this.uniqueOrganisms = this.keggService.getOrganismName(this.selectedKingdom, this.selectedSubgroup, selectedClass);
    }
    this.onDropdownChange();
  }

  onOrganismSelected(event: any): void {
    const selectedOrganism = (event.target as HTMLSelectElement).value;
    this.selectedOrganism = selectedOrganism;
    this.onDropdownChange();
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
    if (this.uploadedFiles.length === 0) {
      this.showFileList = false;
      this.resetDropdowns(); // Reset dropdowns when all files are removed
    }
    this.unsupportedFileTypeMessage = '';
    this.validationMessage = '';
    this.warningMessage = '';
  }
  private resetDropdowns(): void {
    this.selectedKingdom = null;
    this.selectedSubgroup = null;
    this.selectedClass = null;
    this.uniqueSubgroups = [];
    this.uniqueClasses = [];
    this.uniqueOrganisms = [];
  }

  onDropdownChange(): void {
    this.resetValidationMessage();  // Clear validation messages once a dropdown option is selected
  }

  private resetValidationMessage(): void {
    this.validationMessage = '';
  }

  // processFiles(): void {
  //   if (!this.selectedKingdom || !this.selectedSubgroup || !this.selectedClass || !this.selectedOrganism) {
  //     this.validationMessage = 'Please select all required options: Kingdom, Subgroup, Class, and Organism.';
  //     return;  
  //   }
  
  //   const validExtensions = ['txt', 'csv'];

  //   const dataLoadPromises = this.uploadedFiles.map(fileObj => {
  //     const fileExtension = fileObj.name.split('.').pop()?.toLowerCase();

  //     if (!fileExtension || !validExtensions.includes(fileExtension)) {
  //       this.unsupportedFileTypeMessage = `File ${fileObj.name} is not supported. Supported formats: .txt, .csv`;
  //       return Promise.resolve();
  //     }
      
  //     return new Promise<void>((resolve, reject) => {
  //       const fileReader = new FileReader();
  //       fileReader.onload = (event: any) => {
  //         const content = event.target.result;
  //         const parsedData = this.parseFileContent(content, fileObj.name);
  //         if (parsedData) {
  //           this.fileDataService.setFileData(fileObj.name, parsedData);
  //           resolve();
  //         } else {
  //           this.warningMessage = `File ${fileObj.name} is not compatible. Files must be tab-separated.`;
  //           reject();
  //         }
  //       };
  //       fileReader.readAsText(fileObj.file);
  //     });
  //   });

  //   Promise.all(dataLoadPromises).then(() => {
  //     if (!this.warningMessage) {
  //       this.router.navigate(['/display']);
  //     }
  //   }).catch(() => {
  //     console.warn('Some files were not processed due to incompatible formats.');
  //   });
  // }

  processFiles(): void {
    if (!this.selectedKingdom || !this.selectedSubgroup || !this.selectedClass || !this.selectedOrganism) {
      this.validationMessage = 'Please select all required options: Kingdom, Subgroup, Class, and Organism.';
      return;
    }
  
    const validExtensions = ['txt', 'csv'];
  
    const dataLoadPromises = this.uploadedFiles.map(fileObj => new Promise<void>((resolve, reject) => {
      const fileExtension = fileObj.name.split('.').pop()?.toLowerCase();
  
      if (!fileExtension || !validExtensions.includes(fileExtension)) {
        this.unsupportedFileTypeMessage = `File ${fileObj.name} is not supported. Supported formats: .txt, .csv`;
        return reject(); // Ensure to reject here; not resolving on error
      }
  
      const fileReader = new FileReader();
      fileReader.onload = (event: any) => {
        const content = event.target.result;
        const parsedData = this.parseFileContent(content, fileObj.name);
        if (parsedData) {
          this.fileDataService.setFileData(fileObj.name, parsedData);
          resolve();
        } else {
          this.warningMessage = `File ${fileObj.name} is not compatible. Files must be tab-separated.`;
          reject(); // Properly reject if parsing fails
        }
      };
      fileReader.readAsText(fileObj.file);
    }));
  
    Promise.all(dataLoadPromises)
      .then(() => {
        // If all promises resolved successfully
        this.router.navigate(['/display']);
      })
      .catch(() => {
        // Handle rejection
        console.warn('Some files were not processed due to incompatible formats.');
        // Optionally display a global error if needed
      });
  }

  parseFileContent(content: string, fileName: string): string[][] | null {
    const data: string[][] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const values = line.split('\t');  // Assume tab as separator
      if (values.length <= 1) return null;  // Ensure delimiter is operating properly
      data.push(values);
    }

    console.log(`Parsed data from ${fileName}: `, data);
    return data;
  }

}
