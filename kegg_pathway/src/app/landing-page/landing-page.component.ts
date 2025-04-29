import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { slideUpAnimation } from '../helper/route-animations';
import JSZip from 'jszip';
@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
  animations: [slideUpAnimation],
  standalone: true
})
export class LandingPageComponent {
  
  constructor(private router: Router) {}
  
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
  
        // Read each file in the zip
        await Promise.all(
          Object.keys(zip.files).map(async (filename) => {
            const file = zip.files[filename];
            if (!file.dir) {
              const content = await file.async('string');
              fileContents.push({ name: filename, content });
            }
          })
        );
  
        console.log('Loaded files:', fileContents);
  
        // TODO: HERE MOVE THE FILES TO DISPLAY TO BE LOADED
        alert('Project loaded successfully');
  
      } catch (err) {
        console.error('Failed to open project:', err);
        alert('Failed to open project file');
      }
    };
  
    fileInput.click(); // Open file chooser
  }
}