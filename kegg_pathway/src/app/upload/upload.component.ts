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
  searchResults: any[] = [];

  constructor(private keggService: KeggDataService) {} // Inject service

  onUploadClick(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    
    fileInput.onchange = (event: any) => {
      const files: FileList = event.target.files;
      if (files && files.length > 0) {
        this.handleFiles(files);
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

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
    if (this.uploadedFiles.length === 0) {
      this.showFileList = false; // Hide the list if there are no files
    }
  }
  searchKEGG(query: string): void {
    this.searchResults = this.keggService.searchOrganisms(query);
    console.log('Search results:', this.searchResults);
  }
  processFiles(): void {
    // TODO: Implement the logic to process the uploaded files
    console.log('Processing files:', this.uploadedFiles);
  }

}