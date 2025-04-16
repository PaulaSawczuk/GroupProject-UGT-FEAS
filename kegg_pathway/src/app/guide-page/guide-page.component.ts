import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { slideUpAnimation } from '../helper/route-animations';

interface GuideSection {
  title: string;
  preview: string;
  fullContent: string;
}

@Component({
  selector: 'app-guide-page',
  standalone: true, 
  imports: [CommonModule], 
  animations: [slideUpAnimation],
  templateUrl: './guide-page.component.html',
  styleUrls: ['./guide-page.component.css']
})
export class GuidePageComponent {
  constructor(private router: Router) { console.log('GuidePageComponent loaded');}
  
  guideSections: GuideSection[] = [
    {
      title: 'File Upload',
      preview: 'To upload a file, click the Upload button and select your file...',
      fullContent:`To upload a file, click the Upload button and select your file.
- Supported formats include .csv and .txt.
- Make sure your file is formatted correctly - tab separated.
- Uploaded files should at least include one expression and one annotation file.
- Pick the number of the top expressed pathways you want to be displayed.
- Pick if you want to specify and organism and if you have a time series data.

(You will be able to add more files later on.)
Once all the steps are completed, click the Process button to move to get visualisation of the KEGG pathways.`,
    },
    {
      title: 'Interactivity',
      preview: 'The pathway display offers various interactivity for the user...',
      fullContent: `The pathway display offers various interactivity for the user:\n` +
                   `- Click on nodes to see detailed information.\n` +
                   `- Use the zoom feature to navigate through the pathways.\n` +
                   `- Use the search feature to find specific enzimes, compounds or pathways.\n` +
                   `- Customise the colours of the gene expression levels.\n` +
                   `- The download feature allows you to save the current view as an image.\n` +
                   `- If you have a time series data, you can see the changes in the expression levels over time.`,
    },
    {
      title: 'Files',
      preview: 'At the top of the page in the File section, you will be able to...',
      fullContent:
        'At the top of the page in the File section, you will be able to:\n' +
        '- Uplaod more files.\n' +
        '- Export the current view as an image in svg or png formats.',
    },
    {
      title: 'View',
      preview: 'At the top of the page in the View section, you will be able to...',
      fullContent:
        'At the top of the page in the View section, you will be able to:\n' +
        '- In Search: Find specific enzimes, compounds or pathways by picking it from a drop down list.\n' +
        '- In Customise: Change the colour of expression of the genes by picking them from a colour pickers.',
    },
    {
      title: 'Time Series',
      preview: '...',
      fullContent:
        '',
    },
    {
      title: '',
      preview: '...',
      fullContent:
        '',
    },
  ];

  getStarted(): void {
    this.router.navigate(['/upload']);
  }

  selectedSection: GuideSection | null = null;

  openModal(section: GuideSection): void {
    this.selectedSection = section;
  }

  closeModal(): void {
    this.selectedSection = null;
  }

  goBackToLanding(): void {
    this.router.navigate(['/']);
  }
  
}
