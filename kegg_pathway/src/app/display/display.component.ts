import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.css']
})
export class DisplayComponent {
  isMenuOpen = true;
  pathwaysOpen = false;
  exportOpen = false;
  targetAnalysisOpen = false;

  pathways = ['Pathway 1', 'Pathway 2', 'Pathway 3'];
  exportOptions = ['PDF', 'CSV', 'JSON'];
  targets = ['Target 1', 'Target 2', 'Target 3'];
  timepoints = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  selectedPathway: string = this.pathways[0];
  selectedTimeIndex: number = 0;

  sliderLine: ElementRef | undefined;

  @ViewChild('sliderLine') set sliderLineRef(sliderLineRef: ElementRef | undefined) {
    if (sliderLineRef) {
      this.sliderLine = sliderLineRef;
      this.initSliderLineListener();
    }
  }

  get selectedTimepoint() {
    return this.timepoints[this.selectedTimeIndex];
  }

  initSliderLineListener() {
    if (this.sliderLine) {
      this.sliderLine.nativeElement.addEventListener('click', (event: MouseEvent) => {
        this.updateTimeFromClick(event);
      });
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (!this.isMenuOpen) {
      this.closeAllDropdowns();
    }
  }

  closeAllDropdowns() {
    this.pathwaysOpen = false;
    this.exportOpen = false;
    this.targetAnalysisOpen = false;
  }

  selectPathway(event: Event, pathway: string) {
    event.stopPropagation();
    console.log('Selected:', pathway);
    this.selectedPathway = pathway;
    this.selectedTimeIndex = 0;
  }

  selectTarget(event: Event, target: string) {
    event.stopPropagation();
    console.log('Selected:', target);
  }

  updateTimeFromClick(event: MouseEvent) {
    if (this.sliderLine) {
      const rect = this.sliderLine.nativeElement.getBoundingClientRect();
      const clickPosition = event.clientX - rect.left;
      const sliderWidth = rect.width;
      const timeIndex = Math.round((clickPosition / sliderWidth) * (this.timepoints.length - 1));

      if (timeIndex >= 0 && timeIndex < this.timepoints.length) {
        this.selectedTimeIndex = timeIndex;
      }
    }
  }
}