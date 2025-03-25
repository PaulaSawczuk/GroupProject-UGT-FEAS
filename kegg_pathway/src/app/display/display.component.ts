import { Component } from '@angular/core';
import { FileDataService } from '../services/file-data.service';

@Component({
  selector: 'app-display',
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.css'],
})
export class DisplayComponent {
  pathways: string[] = [];

  constructor(private fileDataService: FileDataService) {
    this.loadPathways();
  }

  private loadPathways(): void {
    this.pathways = this.fileDataService.getPathways();
  }
}