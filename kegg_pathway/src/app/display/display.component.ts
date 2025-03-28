import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AfterViewInit } from '@angular/core';
import * as go from 'gojs';  // Import GoJS library

@Component({
  selector: 'app-gojs-diagram',
  template: `<div #diagramDiv style="width: 100%; height: 500px;"></div>`, // Container for the diagram
})
export class GojsDiagramComponent implements AfterViewInit {
  private diagram: go.Diagram | null = null;

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.createDiagram();
  }

  createDiagram(): void {
    const $ = go.GraphObject.make;
    
    // Create the GoJS Diagram
    this.diagram = $(go.Diagram, this.el.nativeElement.querySelector('#diagramDiv'), {
      initialContentAlignment: go.Spot.Center, // Align content
      "undoManager.isEnabled": true,  // Enable undo/redo
    });

    // Define the diagram's node template
    this.diagram.nodeTemplate = $(
      go.Node,
      "Auto",
      $(
        go.Shape,
        "RoundedRectangle",
        { strokeWidth: 0, fill: "lightblue" },
        new go.Binding("fill", "color")
      ),
      $(
        go.TextBlock,
        { margin: 8 },
        new go.Binding("text", "key")
      )
    );

    // Define the diagram's link template
    this.diagram.linkTemplate = $(
      go.Link,
      { routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver },
      $(
        go.Shape,
        { strokeWidth: 2, stroke: "gray" }
      )
    );

    // Create the model data (nodes and links)
    const model = new go.GraphLinksModel(
      [
        { key: "Alpha", color: "lightblue" },
        { key: "Beta", color: "lightgreen" }
      ],
      [
        { from: "Alpha", to: "Beta" }
      ]
    );

    // Set the model to the diagram
    if (this.diagram) {
      this.diagram.model = model;
    }
  }
}


@Component({
  selector: 'app-display',
  standalone: true,
  imports: [CommonModule, FormsModule,GojsDiagramComponent],
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.css']
})

export class DisplayComponent {
  isMenuOpen = true;
  pathwaysOpen = false;
  exportOpen = false;
  targetAnalysisOpen = false;

  pathways = ['ec00020', 'ec00030', 'ec00040'];
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


