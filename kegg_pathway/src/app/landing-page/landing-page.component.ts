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
export class LandingPageComponent {
  
  constructor(private router: Router, private fileDataService: FileDataService, private projectLoaderService: ProjectLoaderService,) {}
  
  isGuideClicked: boolean = false;

  getStarted() {
    this.router.navigate(['/upload']);
  }

  openGuide() {
    console.log('Navigating to guide page...');
    this.isGuideClicked = true;
    this.router.navigate(['/guide-page']);
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