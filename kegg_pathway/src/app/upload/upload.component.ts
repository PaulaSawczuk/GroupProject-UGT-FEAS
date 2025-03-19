import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule

interface UploadedFile {
  name: string;
  file: File;
}

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
  imports: [CommonModule], // Add CommonModule to imports
})

export class UploadComponent {
  uploadedFiles: UploadedFile[] = [];
  showFileList = false;

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

  processFiles(): void {
    // TODO: Implement the logic to process the uploaded files
    console.log('Processing files:', this.uploadedFiles);
  }
}