// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FileDataService } from '../services/file-data.service';

// @Component({
//   selector: 'app-display',
//   standalone: true,
//   imports: [CommonModule],  // Import CommonModule for NgFor and NgIf
//   templateUrl: './display.component.html',
//   styleUrls: ['./display.component.css'],
// })
// export class DisplayComponent {
//   fileData: { [fileName: string]: string[][] } = {};
//   fileDataKeys: string[] = [];

//   constructor(private fileDataService: FileDataService) {
//     this.fileData = this.fileDataService.getFileData();
//     this.fileDataKeys = Object.keys(this.fileData);
//     console.log('File Data:', this.fileData);
//     console.log('File Names:', this.fileDataKeys); 
//   }
// }

// display.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import for directives like *ngFor
import { FileDataService } from '../services/file-data.service';
import { Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-display',
  standalone: true,  // Mark as standalone
  imports: [CommonModule],  // Import necessary Angular modules
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.css'],
})
export class DisplayComponent {
  private routerSub: Subscription;
  fileData: { [fileName: string]: string[][] } = {};
  fileDataKeys: string[] = [];

  constructor(private fileDataService: FileDataService, private router: Router) {
    // Initialize component state directly in the constructor
    this.fileData = this.fileDataService.getFileData();
    this.fileDataKeys = Object.keys(this.fileData);  // Prepare keys for template iteration

    // Subscribe to router events
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        // Clear file data only when navigating away
        this.fileDataService.clearFileData();
      }
    });
  }

  // Optional cleanup, if you prefer this within constructor-based models
  finalize() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();  // Clean up subscription
    }
  }
}