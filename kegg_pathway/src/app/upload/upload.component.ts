import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { KeggDataService } from  '../services/kegg_organisms-data.service';
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

  uniqueKingdoms: string[] = [];
  uniqueSubgroups: string[] = [];
  uniqueClasses: string[] = [];
  uniqueOrganisms: string[] = [];

  selectedKingdom: string | null = null;
  selectedSubgroup: string | null = null;
  selectedClass: string | null = null;
  
  constructor(private keggService: KeggDataService) {} // Inject service

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
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.uploadedFiles.push({ name: file.name, file: file });
    }
    this.showFileList = true; // Show the file list after upload
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
  }

  onSubgroupSelected(event: Event): void {
    const selectedSubgroup = (event.target as HTMLSelectElement).value;
    this.selectedSubgroup = selectedSubgroup;
    this.selectedClass = null;
    if (this.selectedKingdom) {
      this.uniqueClasses = this.keggService.getOrganismClass(this.selectedKingdom, selectedSubgroup);
      this.uniqueOrganisms = [];
    }
  }

  onClassSelected(event: Event): void {
    const selectedClass = (event.target as HTMLSelectElement).value;
    this.selectedClass = selectedClass;
    if (this.selectedKingdom && this.selectedSubgroup) {
      this.uniqueOrganisms = this.keggService.getOrganismName(this.selectedKingdom, this.selectedSubgroup, selectedClass);
    }
  }

  // onKingdomSelected(event: Event): void {
  //   const selectedKingdom = (event.target as HTMLSelectElement).value;
  //   this.selectedKingdom = selectedKingdom;
  //   this.uniqueSubgroups = this.keggService.getSubgroups(selectedKingdom);
  // }


  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
    if (this.uploadedFiles.length === 0) {
      this.showFileList = false;
      this.resetDropdowns(); // Reset dropdowns when all files are removed
    }
  }
  private resetDropdowns(): void {
    this.selectedKingdom = null;
    this.selectedSubgroup = null;
    this.selectedClass = null;
    this.uniqueSubgroups = [];
    this.uniqueClasses = [];
    this.uniqueOrganisms = [];
  }

  
  processFiles(): void {
    // TODO: Implement the logic to process the uploaded files
    console.log('Processing files:', this.uploadedFiles);
  }

}