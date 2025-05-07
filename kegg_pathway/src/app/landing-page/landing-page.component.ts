import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { slideUpAnimation } from '../helper/route-animations';
import { FileDataService } from '../services/file-data.service';
import { ProjectLoaderService } from '../services/project-loader.service';
import JSZip from 'jszip';
@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
  animations: [slideUpAnimation],
  standalone: true
})
// LandingPageComponent is responsible for the landing page of the application
// It provides functionality to navigate to different pages - Display Page and Upload Page and Guide Page;
// Handles opening a saved project
// Moves to Upload Page when user click Get Started Button
// Moves to Guide Page when user click Guide Button
export class LandingPageComponent {
  
  constructor(private router: Router, private fileDataService: FileDataService, private projectLoaderService: ProjectLoaderService,) {}
  
  isGuideClicked: boolean = false;
  // Navigate to Upload Page if Get Started button is clicked
  getStarted() {
    this.router.navigate(['/upload']);
  }
  // Navigate to Guide Page if Guide button is clicked
  openGuide() {
    console.log('Navigating to guide page...');
    this.isGuideClicked = true;
    this.router.navigate(['/guide-page']);
  }
  // Open Project functionality if Open Project button is clicked
  openProject(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.zip';

    fileInput.onchange = async (event: Event) => {
      const input = event.target as HTMLInputElement;
      // Check if files are selected
      if (!input.files || input.files.length === 0) return;

      const zipFile = input.files[0];
      
      try {
        // Load the zip file using JSZip
        const zip = await JSZip.loadAsync(zipFile);
        
        // Extract file contents from the zip
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