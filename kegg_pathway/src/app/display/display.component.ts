import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { enzymeApiServicePost } from '../services/kegg_enzymepathwaysPost.serice';


@Component({
  selector: 'app-display',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.css']
})

export class DisplayComponent {



  enzymesList = [
    'ec:1.1.1.360',
    'ec:1.1.1.359',
    'ec:4.3.1.29',
    'ec:5.3.1.27',
    'ec:5.3.1.29',
    'ec:2.7.1.212',
    'ec:1.2.1.90'];

  // Array for the Fetch Data - contains Pathway Objects - Name and Pathway (ec No.)
  pathwayData: any[] = [];
  // Array of only names in the same order as pathwayData but for display purposes
  pathways: any[] = [];

  mapData: any[] = [];
  nodeData: any[] = [];
  linkData: any[] = [];
  constructor(private enzymeApiServicePost: enzymeApiServicePost) {};


  // Function for loading Names of each pathway that is fetched from the backend
  loadNames(): void {
    this.pathways = this.pathwayData.map(pathway => pathway.name);
  }

  loadNodes(): void {
    console.log('Getting Nodes');
    const entries: [string, string][] = Object.entries(this.mapData);
    //this.nodeData = this.mapData.
    const firstEntry: [string, string] = entries[0]; 
    //console.log(firstEntry);
    const nodes = firstEntry[1];
    //console.log(nodes);
    //console.log(nodes[0]);
    for (let i=0; i<nodes.length;i++){
      //console.log(nodes[i]);
      this.nodeData.push(nodes[i])
    }
    //this.nodeData = nodes;
    //console.log(this.nodeData);

  }
  loadLinks(): void {
    console.log('Getting Links');
    const entries: [string, string][] = Object.entries(this.mapData);
    const secondEntry: [string, string] = entries[1]; 
    //console.log(secondEntry);
    const links = secondEntry[1];
    //console.log(links);
    //this.linkData = JSON.links;
    for (let i=0; i<links.length;i++){
      //console.log(links[i]);
      this.linkData.push(links[i])
    }
    //console.log(this.linkData);
    //console.log(this.linkData[0]);

  }

  ngOnInit(): void {
    this.enzymeApiServicePost.postEnzymeData(this.enzymesList).subscribe(
      (response) => {
        // Handle the successful response
        this.pathwayData = response;
        this.loadNames();
        console.log('Received from backend:', response);
      },
      (error) => {
        // Handle errors
        console.error('Error:', error);
        //this.responseMessage = 'Error sending data';
      }
    );
  };

  getMapData(data: string): void {
    this.enzymeApiServicePost.postMapData(data).subscribe(
      (response) => {

        this.mapData = response;

        console.log('Loading data');
        this.loadNodes();
        this.loadLinks();
        console.log('Received from backend:', response);
        console.log(this.linkData);
        console.log(this.nodeData);
        console.log(this.nodeData[0]);
      },
      (error) => {
        console.error('Error:', error);
      }
    );
  };



  isMenuOpen = true;
  pathwaysOpen = false;
  exportOpen = false;
  targetAnalysisOpen = false;

  //pathways = ['ec00020', 'ec00030', 'ec00040'];
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
    const nameSelected = pathway;
    const path = this.pathwayData.find(path => path.name === nameSelected);
    console.log('Corresponding Code: '+path.pathway)
    this.selectedPathway = path.pathway;
    const code = path.pathway
    this.selectedTimeIndex = 0;
    this.getMapData(code);
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


