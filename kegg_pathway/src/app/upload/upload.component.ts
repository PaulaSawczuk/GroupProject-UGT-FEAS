import { Component } from '@angular/core';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {

  onUploadClick(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true; // Allow multiple file selection

    fileInput.onchange = (event: any) => {
      const files: FileList = event.target.files;
      if (files && files.length > 0) {
        this.handleFiles(files);
      }
    };

    fileInput.click(); // Trigger the file dialog
  }

  private handleFiles(files: FileList): void {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // TO DO: Here implement the logic to upload the file   
      console.log('Selected file:', file.name);
      
    }
  }
}