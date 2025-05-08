import { Component, ViewChild, ElementRef , HostListener, ChangeDetectorRef, OnInit, AfterViewInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { enzymeApiServicePost } from '../services/kegg_enzymepathwaysPost.serice';
import * as go from 'gojs';
import { FileDataService } from '../services/file-data.service';
import { filter, first } from 'rxjs';
import { parseFileContent, identifyFileType } from '../helper/file-utils';
import {MatSliderModule} from '@angular/material/slider';
import { match } from 'assert';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ProjectLoaderService } from '../services/project-loader.service';
import JSZip, { file } from 'jszip';
import { saveAs } from 'file-saver';
import { ProjectNameModalComponent } from '../project-name-modal/project-name-modal.component';
import { firstValueFrom } from 'rxjs';

interface GuideElement {
  title: string;
  preview: string;
  fullContent: string;
  imagePaths?: string[];
}

interface UploadedExpressionFile {
  name: string;
  file: File;
}

interface UploadedAnnoationFile {
  name: string;
  file: File;
}

export interface StatsArrayType {
  totalGenes: number;
  uniqueGenes: number;
  enzymesEffected: number;
}

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSliderModule, ProjectNameModalComponent],
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.css']
})

export class DisplayComponent implements OnInit, AfterViewInit {
  LoadingMessage: string = '';


  /** --------  INITIALISING GLOBAL ATTRIBUTES -------- **/

  pathwayData: any[] = []; // Array for the Fetch Data - contains Pathway Objects - Name and Pathway (ec No.)

  pathways: any[] = []; // Array of only names in the same order as pathwayData but for display purposes

  mapData: any[] = []; // Array for storing response of getMapData

  ALLpathwayData: any[] = []; // Array for storing all Pathway Data - Name, code, Edges, Nodes and EnzymeList
                                              // This is recieved from the back-end

  AllKeggPathways: any[] = []; // Array for storing list of all Kegg Enzyme Pathways
  
  pathwayResponse: any[]=[]; // Array for temporarily storing response when newly updated pathway list 
                                        // Allows for comparison of pathway list before overwriting 

  filteredGenes: any[] = []; // Array of Genes, Logfc and EC number of combined Data 

  pathwayNumber: number = 10; // Hard Coded - but can add functionality for user to change this

  fileNames: any[] = [];


  loadedPathwayData: any[] = []; // Array for Storing Loaded Pathways (name, nodes (parallel to filtered Genes))

  colourArray: any[] = []; // Array for storing only the colours of nodes and corresponding key

  enzymeList: any[] = []; // Array for storing list of Enzymes filtered from input expression files

  pathwayTally: any[] = []; // Array recieved from back-end with all pathways regulated by the Enzymes Extracted
                                          // From users data

  highlightedPathways: any[] = []; // Loaded Pathway Tally mapped to Pathway Name 
                                                      // contains code, pathway, number of enzymes


  // ------  Metabolic Flux Animation Attributes ---------
  regulatedLinks: any[] = []; // Storing current regulated links for animating 

  animatedParts: go.Part[] = []; // Store animated parts (dots)
  
  animatedIntervals: number[] = [];



  StatsArray: any[] = [];

  currentLogFc: any[] = [];

  UploadedExpressionFiles: UploadedExpressionFile[] = [];
  UploadedAnnoationFiles: UploadedAnnoationFile[] = [];
  ExpressionFileNames: string[] = [];


  //-------- Visualisation Attributes --------

  // Creating a GoJS Diagram 
  private myDiagram: go.Diagram | null = null;

  // to track the number of popups
  //private activePopups: { nodeKey: any }[] = [];
  
  // a variable to send the data from a node click to Angular to be used in html 
  popupNodeData: any = null;

  // a variable to track the popup's position 
  popupPosition: { top: number, left: number } = { top: 0, left: 0 };

  // a variable to remember which node was clicked (for popups to be placed next to the cliked nodes)
  popupNodeKey: string | null = null; // ### TBR
  //////////////////////////////////#############

  @ViewChild('goHtmlPopup', { static: true }) htmlPopupRef!: ElementRef;

  // 
  isPopupVisible = false;

  // Toggle for nodes dropdown visibility
  nodesOpen: boolean = false;

  // List of enzyme categories: e.g., ['Oxidoreductase', 'Transferase']
  enzymeCategories: string[] = [];

  // Map of category → list of enzymes in the displayed pathway
  enzymeCategoryMap: { 
    [category: string]: { ec: string, name: string, colour?: string, logfc?: number }[] 
  } = {};  

  // List of compounds in the displayed pathway
  compoundList: string[] = [];

  // List of pathways in the displayed pathway
  pathwayList: string[] = [];

  // Floating mini map's overview variable
  myOverview: go.Overview | null = null;

  // Creating the Back-end API Service 
  constructor(
    private enzymeApiServicePost: enzymeApiServicePost,
    private fileDataService: FileDataService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private projectLoaderService: ProjectLoaderService,
  ) {
    document.addEventListener('click', this.handleClickOutside.bind(this));
    document.addEventListener('click', this.onOutsideClick.bind(this));
    this.UploadedExpressionFiles = this.fileDataService.getUploadedExpressionFiles();
    this.UploadedAnnoationFiles = this.fileDataService.getUploadedAnnoationFiles();
  }

  // it stops the scroll event signals that happen inside the popups,
  // therefore prevents the page from responding to these signals and 
  // sends tese signals to GoJS canvas to keep in sync with diagram's panning events
  ngAfterViewInit(): void {
  
    const popup = this.htmlPopupRef.nativeElement;
  
    popup.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault(); // block page scroll
  
      const diagramDiv = document.getElementById('myDiagramDiv');
      if (!diagramDiv) return;
  
      const canvas = diagramDiv.querySelector('canvas');
      if (!canvas) return;
  
      const newEvent = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        clientX: event.clientX,
        clientY: event.clientY,
        ctrlKey: event.ctrlKey,
      });
  
      requestAnimationFrame(() => {
        canvas.dispatchEvent(newEvent);
      });
      
    }, { passive: false });
  }


  // ------------- SETTING UP PROCESSING FUNCTIONS -------------------------

  /** --------  INPUT Data Processing Functions -------- **/

// Filtering function that only selects enzyme codes that are in the correct
// full format ec:_._._._
private filterString(input: string): boolean {
    // Define the regular expression
    const pattern = /^ec:(\d+\.\d+\.\d+\.\d+)$/;
  
    // Return the string if it matches the pattern, otherwise return null
    return pattern.test(input);
  }

// --------------- Filtering Required Information from Expression/Contrast Data -----------
// Takes Annotation Files and selects Genes, Logfc and EC columns for each 
// Filters to only get Genes that have corresponding full EC codes (filterEnzymeGenes)

private getEnzymeGenes(): void{
  this.isLoading = true;
  const combinedData = this.fileDataService.getMultipleCombinedArrays();
  //console.log('MultiCombined: '+combinedData);
  console.log('Number of Files: '+combinedData.length);
  var filteredFiles = [];
  //console.log('First File: '+firstFile);
  for (let i=0; i<combinedData.length; i++){
    const file = combinedData[i];

    var geneEnzymes: any[] = []; // Use Set to avoid duplicates
    
    if (file && file.length > 0) {
      for (const item of file) {
        for (const key in item) {
          //console.log(key);
          var logfc;
          var gene;
          var ec;
          if (key.includes('_log2foldchange')&& item[key]){
            logfc = item[key];
          }

          if (key.includes("_enzyme.code") && item[key]) {
            ec = item[key];
            if (ec.startsWith("EC")){
                //ec = item[key];
                gene = item.gene
                //console.log(ec);
                //console.log(gene);
                //console.log(logfc);
                geneEnzymes.push({
                  gene: gene,
                  logfc: logfc,
                  enzyme: ec
                })
            };
          }
        }
        
      }
      //console.log(geneEnzymes);
      filteredFiles.push(geneEnzymes);
    }
  }

  //console.log(geneEnzymes); //Array of Genes with EC matched 
  this.filterEnzymeGenes(filteredFiles); // pass to 
}

// Called from getEnzymeGenes()
// Filters genes to those only with corresponding ec codes and reformats them in the correct order
private filterEnzymeGenes(filteredFiles:any[]):void{

  this.isLoading = true;
  console.log("------------------");
  console.log("Filtering Genes from Files...");
  console.log("------------------");
  var filteredFiles_enzymes = [];
  for (let j=0; j<filteredFiles.length; j++){
    //console.log(this.fileNames[j]);
    let geneEnzymes = filteredFiles[j];
    //console.log(geneEnzymes);
    for (let i=0; i<geneEnzymes.length; i++){
      //console.log(geneEnzymes[i].enzyme);
      let ecNumber = geneEnzymes[i].enzyme;
      if (ecNumber.toUpperCase().startsWith('EC:')) {
        // Convert to lowercase and remove spaces
        ecNumber = ecNumber.replace(/\s+/g, '').toLowerCase();
        ecNumber = ecNumber.split("|");

      } else {
        // Add lowercase ec: prefix
        ecNumber = "ec:" + ecNumber;
      }

      for (let j=0; j<ecNumber.length; j++){
        var filteredEnzymes = [];
        if (this.filterString(ecNumber[j]) == true)
          filteredEnzymes.push(ecNumber[j]);
          ecNumber = filteredEnzymes;

        }
        //console.log(ecNumber);
        geneEnzymes[i].enzyme = ecNumber;
    }
    //console.log(geneEnzymes);
    const filteredArray = geneEnzymes.filter((item: { enzyme: string | any[]; }) => {
      return item.enzyme && (!Array.isArray(item.enzyme) || item.enzyme.length > 0);
    });
    //console.log(filteredArray);
    filteredFiles_enzymes.push(filteredArray);
  }
  //console.log("Filteref out enzymes: "+ filteredFiles_enzymes[0]);
  this.filteredGenes = filteredFiles_enzymes;
}


// ---------------- Extraction of enzymes in filtered Constrast Datasets ---------------------
// This Gets a processed list of all the enzymes present in the input files that have corresponding DEGs
// Returns the top 1000 (or otherwise specified) list of enzymes to be queried to KEGG to get paths

private extractECNumbers(): void {
  this.isLoading = true;
  // Set this up to loop through all files -- total enzymes 
  console.log('Extracting Enzymes to Search');
  //console.log(this.filteredGenes);
  //var enzymeList: Set<any> = new Set()
  var enzymeList: any[]=[];
  //const file_number=0; // default to first file

  console.log('Number of files to filter:')
  console.log(this.filteredGenes.length);
  //console.log(this.filteredGenes);
  for (let i=0; i<this.filteredGenes.length;i++){
    const genes = this.filteredGenes[i];
    console.log(genes);
    for (let i=0; i<genes.length; i++){
      let enzyme = genes[i].enzyme[0];
      //console.log(enzyme);
      enzymeList.push(enzyme);
    }
  }
  console.log('Enzymes List:')
  console.log(enzymeList);
  const topEnzymes = this.getTopEnzymes(enzymeList);
  this.enzymeList = Array.from(topEnzymes);
}

/** --------  ENZYME PROCESSING  -------- **/

// --------- Enzyme Tally and Processing Functions --------
// Called from extractECNumbers()
// Getting a list of all enzymes present in files
// Mulitple Genes to one enzyme are represented by enzyme duplicated in list 

// Fully Enzyme List is too large query KEGG rest API in succession 
// Enzymes are tallied and sorted in descending order 
// Top 1000 (or can be changed) are selected and submitted to backend to query KEGG
private tallyStrings(items: string[]): Record<string, number> {
  console.log("--------------------")
  console.log('Tallying Enzymes');
  
  const tally: Record<string, number> = {};

  items.forEach(item => {
    tally[item] = (tally[item] || 0) + 1;
  });

  return tally;
}

// Sorting Enzyme Tally 
private sortTally(tally: Record<string, number>): [string, number][] {
  console.log("--------------------")
  this.LoadingMessage = 'Processing Enzyme List...';
  // Convert the tally object into an array of key-value pairs
  const entries = Object.entries(tally);
  // Sort by the count in descending order
  entries.sort((a, b) => b[1] - a[1]);
  return entries;
}

// Extracting Top enzymes from Tally
private getTopEnzymes(items: string[]): string[] {
  console.log("--------------------")
  console.log('Getting Top Enzymes');
  const tally = this.tallyStrings(items);    
  const sortedTally = this.sortTally(tally);  

  // Step 3: Select the top items and extract only the names
  const top100Names = sortedTally.slice(0, 1000).map(entry => entry[0]);
  return top100Names;
}


/** --------  DGE PROCESSING  -------- **/

// ----------- Differential Gene Expression Data Functions ----------------
// Called when changing Node information when map is selected/ timepoint changes 

// LogFC to RGB conversion function 
// Takes Logfc value -- returns rgb value to change enzyme node colour

private newlogfcToRGB(
  logFoldChange: number,
  lowColor: string,
  highColor: string,
  maxFC: number = 5 // Max absolute logFC expected
): string {
  // Clamp logFC between -maxFC and +maxFC
  const clamped = Math.max(-maxFC, Math.min(maxFC, logFoldChange));

  // Normalize: -maxFC → 0, 0 → 0.5, +maxFC → 1
  const t = (clamped + maxFC) / (2 * maxFC);

  // Convert hex to RGB
  const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b };
  };

  const interpolate = (
    color1: { r: number, g: number, b: number },
    color2: { r: number, g: number, b: number },
    factor: number
  ) => ({
    r: Math.round(color1.r + (color2.r - color1.r) * factor),
    g: Math.round(color1.g + (color2.g - color1.g) * factor),
    b: Math.round(color1.b + (color2.b - color1.b) * factor),
  });

  const low = hexToRgb(lowColor);
  const mid = hexToRgb('#D3D3D3');
  const high = hexToRgb(highColor);

  let color;
  if (t < 0.5) {
    // Interpolate between low and mid
    color = interpolate(low, mid, t * 2); // t * 2 maps [0, 0.5] → [0, 1]
  } else {
    // Interpolate between mid and high
    color = interpolate(mid, high, (t - 0.5) * 2); // (t - 0.5) * 2 maps [0.5, 1] → [0, 1]
  }

  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}
// Takes array of logfc and find average value 
// used when there are multiple genes acting on an enzyme 
private findMean(arr: any[]): number {
  // Ensure the array is not empty
  if (arr.length === 0) return 0;

  // Convert string numbers to actual numbers and sum them
  const sum = arr
    .map(Number) // Convert each string to a number
    .reduce((acc, current) => acc + current, 0);

  // Calculate the mean by dividing the sum by the length of the array
  return sum / arr.length;
}

// Resizing nodes relative to LogFc size
// Makes nodes more visible to user 
private resizeNodeByLogFC(logfc: number) {

  const baseWidth = 50;
  const baseHeight = 30;

  // Increase size proportionally with the *magnitude* of logfc
  const scale = Math.pow(2, Math.abs(logfc));

  // Optional clamping to avoid extreme sizes
  const minScale = 1;     // at logfc = 0 → base size
  const maxScale = 3;     // optional upper bound
  const Scale = Math.max(minScale, Math.min(scale, maxScale));

  const newWidth = baseWidth * Scale;
  const newHeight = baseHeight * Scale;

  return [newHeight,newWidth];
}


// ----------- Matching Genes to Enzyme Ndoes ----------------
// Called when changing Node information when map is selected/ timepoint changes 

// Mathing Enzyme Nodes to Enzymes present in Expression file selected 
// Changing Enzyme node colour based on LogFC if match is found
// Adding Genes to Enzyme node 

// TWO BRACNHES
// - 'No Size' - This does not changes node size -- required for Animation functionality (links dont move)
// - 'On demand" - Other branch includes size change - this is called on demand when the user selects individual timepoints/ maps
//        Enhances node size for easier viewing -- Map link move in response 


// ----- Animation Branch Function ------
// No Size Change
private matchGenesNoSize(genes: any[], nodes: any[]): any[] {
  // Matching Genes to Enzymes in Selected Map Data 

  var enzymeSet = new Set();
  var GeneSet = new Set();
  var allGenes = [];
  var colourArray = [];
  var stats = [];
  var currentLogFc = [];


  // Create a deep copy of nodes to prevent mutation of the original array
  var newNodes = nodes.map(node => ({ ...node }));

  // cycle through nodes
  for (let i = 0; i < newNodes.length; i++) {
    if (newNodes[i].type === 'enzyme') {
      var geneList = [];
      var logfcList = [];
      let nodetext = newNodes[i].text;

      // cycle through genes 
      for (let j = 0; j < genes.length; j++) {
        let enzyme = genes[j].enzyme[0]; // Enzyme Name 
        let gene = genes[j].gene; // Gene Name 
        let logfc1 = genes[j].logfc; // Logfc Value
        const parsedNum = parseFloat(logfc1);
        let logfc = parseFloat(parsedNum.toFixed(4));

        if (enzyme === nodetext) { // If they match
          enzymeSet.add(enzyme); // Add to unique list of enzymes 
          geneList.push(gene); // Add to list of Genes 
          GeneSet.add(gene); // Add to unique list of genes 
          allGenes.push(gene); // Add to list of all genes
          logfcList.push(logfc); // Add to list of logfc 
        }
      }

      if (geneList[0]) { // If there were genes that matched 
        newNodes[i].gene = geneList; // Add gene attribute to node
      }

      if (logfcList[0]) {
        let mean = parseFloat((this.findMean(logfcList).toFixed(4))); // Calculating mean of Genes logfc
        let rgb = this.newlogfcToRGB(mean, this.selectedColorLow,this.selectedColorHigh); // Getting colout relative to logfc

        newNodes[i].logfc = mean;
        newNodes[i].colour = rgb;
        newNodes[i].logfcList = logfcList;
        currentLogFc.push(logfcList);
      }
      //console.log('adding colour');
      colourArray.push({
        node: newNodes[i].key,
        colour: newNodes[i].colour
    });
    }
  }
  stats.push({
    totalGenes: allGenes.length,
    uniqueGenes: GeneSet.size,
    enzymesEffected: enzymeSet.size
  })

  //this.currentLogFc = currentLogFc;
  return [newNodes,colourArray, stats];
}

// ----- "On Demand" Branch Function ------
// With Size Change 
private matchGenes(genes: any[], nodes: any[]): any[] {
  // Matching Genes to Enzymes in Selected Map Data 
  console.log("--------------------");
  console.log('Matching Genes...');
  var enzymeSet = new Set();
  var GeneSet = new Set();
  var allGenes = [];
  var colourArray = [];
  var stats = [];
  var currentLogFc = [];

  // Create a deep copy of nodes to prevent mutation of the original array
  var newNodes = nodes.map(node => ({ ...node }));

  // cycle through nodes
  for (let i = 0; i < newNodes.length; i++) {
    if (newNodes[i].type === 'enzyme') {
      var geneList = [];
      var logfcList = [];
      let nodetext = newNodes[i].text;
      var logfcGene = [];

      // cycle through genes 
      for (let j = 0; j < genes.length; j++) {
        let enzyme = genes[j].enzyme[0]; // Enzyme Name 
        let gene = genes[j].gene; // Gene Name 
        let logfc1 = genes[j].logfc; // Logfc Value
        const parsedNum = parseFloat(logfc1) 
        let logfc = parseFloat(parsedNum.toFixed(4))

        if (enzyme === nodetext) { // If they match
          enzymeSet.add(enzyme); // Add to unique list of enzymes 
          geneList.push(gene); // Add to list of Genes 
          GeneSet.add(gene); // Add to unique list of genes 
          allGenes.push(gene); // Add to list of all genes
          logfcList.push(logfc); // Add to list of logfc 
          logfcGene.push ({gene: gene, logfc: logfc})
        }
      }
      //console.log(logfcGene);

      if (geneList[0]) { // If there were genes that matched 
        newNodes[i].gene = geneList; // Add gene attribute to node
      }

      if (logfcList[0]) {

        let mean =parseFloat((this.findMean(logfcList).toFixed(4))); // Calculating mean of Genes logfc
        let rgb = this.newlogfcToRGB(mean, this.selectedColorLow,this.selectedColorHigh); // Getting colout relative to logfc
        let result = this.resizeNodeByLogFC(mean); // resizing node
        let height = result[0];
        let width = result[1];
        newNodes[i].width = width; // Assign node attributes 
        newNodes[i].height = height;
        newNodes[i].logfc = mean;
        newNodes[i].colour = rgb;
        newNodes[i].logfcList = logfcList;
        currentLogFc.push(logfcList);
        newNodes[i].geneList = logfcGene;
      }
      //console.log(newNodes[i]);
      //console.log('adding colour');
      colourArray.push({
        node: newNodes[i].key,
        colour: newNodes[i].colour
    });
    }
  }
  //console.log('Number of Unique Genes: ' + GeneSet.size);
  //console.log('Total Number of instances of Genes: ' + allGenes.length);
  //console.log('Enzymes Effected: ' + enzymeSet.size);
  stats.push({
    totalGenes: allGenes.length,
    uniqueGenes: GeneSet.size,
    enzymesEffected: enzymeSet.size
  })
 
  //console.log(newNodes);

  return [newNodes,colourArray, stats];
}


// ----------- Processing Function Before Matching Nodes ----------------
// Takes nodes of selected Map 
// Gets relevant timepoint, retrieves annotated genes
// Both function indentical but call variations in matchGenes(NoSize) 
// Dependent on User interaction

// With Size Change - called when user selects individual pathways/timepoints
private compareEnzymes(nodes: any[],timepoint: number): any[]{
  //console.log('Extracting Logfc Data - Comparing to Enzymes');
  // Get Genes with logfc for the timepoint  (index this in future)
  const localNodes = nodes;
  //console.log("--------------------")
  //console.log('Selected Timepoint: '+timepoint);
  const genes = this.filteredGenes[timepoint];
  // Taking Genes from file and matching them to enzyme nodes 
  // Change enzyme node attributes accordingly 

  const elements = this.matchGenes(genes, localNodes)
  const updatedNodes = elements[0];
  const colourArray = elements[1];
  const stats = elements[2];
  this.StatsArray = elements[2];
  const finalNodes = this.getMultipleGenes(updatedNodes);
  console.log(finalNodes);
  return [finalNodes, colourArray, stats];
}
// No size change - called from getLoadedPathways
private compareEnzymesNoSize(nodes: any[],timepoint: number): any[]{
  console.log("--------------------")
  console.log('Extracting Logfc Data - Comparing to Enzymes');
  // Get Genes with logfc for the timepoint  (index this in future)
  const localNodes = nodes;
  console.log("--------------------")
  const genes = this.filteredGenes[timepoint];
  
  // Taking Genes from file and matching them to enzyme nodes 
  // Change enzyme node attributes accordingly 
  const elements = this.matchGenesNoSize(genes, localNodes)
  const updatedNodes = elements[0];
  const colourArray = elements[1];
  const stats = elements[2];
  const finalNodes = this.getMultipleGenes(updatedNodes);
  return [finalNodes, colourArray, stats];
}


// ------------ PARALOG IDENTIFCATION ---------------------

// Identification of enzyme Nodes that have multiple differentially regualted genes 
// Colour the FULL NODE with selected colour 

// Function for assessing and flagging differential direction regulation in LogFc values
// for an enzyme node --  paralog highlighting
private hasMixedSigns(numbers: number[]): boolean {
  const allPositive = numbers.every(n => n > 0);
  const allNegative = numbers.every(n => n < 0);
  return !(allPositive || allNegative);
}


private getMultipleGenes(nodes: any[]): any[]{

  var newNodes = nodes.map(node => ({ ...node }));
  //console.log(newNodes);
  // Looping through all the nodes
  for (let i = 0; i < newNodes.length; i++) {
    if (newNodes[i].type === 'enzyme' && (newNodes[i].gene)){
      const firstGenes = newNodes[i].gene;

      // If the list of Genes is greater than 1 and there is differential regulation direactionality
      if (firstGenes.length>1 && this.hasMixedSigns(newNodes[i].logfcList)==true){
        //console.log(newNodes[i].logfcList);
        const key1 = newNodes[i].key;
        console.log('Changing Colour - Paralog with differential regulation directionality');
        newNodes[i].colour = this.selectedColorIsoform;

      }
    }
  }    
  return newNodes;

}


// ------------- METABOLIC FLUX - LOGFC -----------------
// Gets enzyme nodes that are impacted by genes and are not due to isoforms (by colour)
// Gets the node group key and finds 'from' links by match the key to the link key (e.g. Group: 76, Link 37R76)
// Ensures that 
// Extracts the logfc for that 

private getMetabolicFlux(nodes: any[], links: any[]){


  var newNodes = nodes.map(node => ({ ...node }));// Deep cloning Nodes and Links 
  var newLinks = links.map(link => ({ ...link}));
  var regulatedLink = [];
  var currentLogFc = [];
  for (let i = 0; i < newNodes.length; i++) {

    // Get all enzyme nodes that have been effected but not by isoforms (coloured yellow)
    if (newNodes[i].type === 'enzyme' && (newNodes[i].gene) && newNodes[i].colour != this.selectedColorIsoform){

      const group = newNodes[i].group;
      //console.log(group);
      const key = newNodes[i].key;
      const colour = newNodes[i].colour;
      const logfc = newNodes[i].logfc;
      currentLogFc.push(logfc);
      const rIndex = key.indexOf("R"); // Finding 'R' character in link key 
      if (rIndex !== -1) {
        const reactKey = key.substring(rIndex);


        // Loop through links to get any that match with that reaction key
      for (let j = 0; j < newLinks.length; j++) { // Matching 'to' links
        if (newLinks[j].to == group){
          //console.log('Match Found: (Link to) ');
          let category = newLinks[j].category;
          newLinks[j].colour = colour; 
          newLinks[j].logfc = logfc;
          regulatedLink.push(group);
          //console.log(category);


        }
        if (newLinks[j].from == group){ // Matching 'from' links
          let category = newLinks[j].category;
          newLinks[j].colour = colour; // Adding new colour attribute to link 
          newLinks[j].logfc = logfc;

          regulatedLink.push(group);
        }else{
          continue;
        }
      }

      } else {
        console.log("No 'R' found in the string");
        continue;
      }
    }
  }
  this.currentLogFc = currentLogFc;
  this.regulatedLinks = regulatedLink;

  // Returns new links to 
  return newLinks;
}

// ----------- Loading Pathway Function ----------------
// Function to load all the pathways into a Stored Array for Accessing on demand
// Called when inital Map data is recieved + when colour are updated
// This loads the Nodes WITHOUT size changes --> accessed for animation

private getLoadedPathways(): void{
  console.log("--------------------")

  const timepointData = this.filteredGenes.map(item => ({ ...item }));  // Deep copy of timepointData
  var loadedPathwayData = [];
  var ALLcolourArray = [];
  // Cycling through filtered genes 

  const pathwayData = this.ALLpathwayData.map(item => ({
    ...item,  // Shallow copy of the top level properties
    nodes: item.nodes.map((node: any[]) => ({ ...node })), // Deep copy of nodes to avoid mutation
    edges: item.edges.map((edge: any[]) => ({ ...edge })) // Deep copy of edges if necessary
  }));
  console.log('Pathway Data to load:')
  
  for (let i = 0; i < pathwayData.length; i++) {
    const nodes = pathwayData[i].nodes; // Already a deep copy
    var edges = pathwayData[i].edges;
    //console.log(nodes);

    var nodesArray = [];
    var edgesArray = [];
    var colourArray = [];
    var statsArray = [];

    // Cycle through timepoints
    for (let j = 0; j < timepointData.length; j++) {

      var elements = this.compareEnzymesNoSize(nodes,j);
      // Extract Colour and Nodes

      // Highlighting regulated links - metabolic flux 
      var updatedNodes = elements[0];
      var updatedEdges = this.getMetabolicFlux(updatedNodes,edges);

      // Extracting colour array
      var colours = elements[1];

      // Extracting Stats Array
      var stats = elements[2];

      // Add updated nodes and colours to respective arrays
      edgesArray.push(updatedEdges);
      nodesArray.push(updatedNodes);
      colourArray.push(colours);
      statsArray.push(stats);
    }
     // Push the processed pathway data into the loadedPathwayData array
     loadedPathwayData.push({
      pathway: pathwayData[i].name,
      nodes: nodesArray,
      edges: edgesArray,
      stats: statsArray
    });

    // Push the colour data into the ALLcolourArray
    ALLcolourArray.push({
      pathway: pathwayData[i].name,
      colours: colourArray,
    });
  }

  // Log the result
  console.log("--------------------")
  console.log(ALLcolourArray);
  console.log(loadedPathwayData);
  console.log("--------------------")

  // Assign the processed data to component properties
  this.colourArray = ALLcolourArray;
  this.loadedPathwayData = loadedPathwayData;


  console.log('--------- LoadMapData Finished -------');
}



  /** -------- Data Processing Functions -------- **/

  // ------ Loding Pathway Names from back-end --------
  // Function for loading Names of each pathway that is fetched from the backend
  // Produces a list of pathway names to display in the menu
  loadNames(): void {
    console.log("--------------------")
    console.log('Processing Pathway Names');
    this.LoadingMessage = 'Processing Pathway Names...';
    this.pathways = this.pathwayData.map(pathway => pathway.name);
  }

  // ------ Loding Enzyme List from back-end --------
  loadEnzymes(): any[] {
    var enzymeData=[];
    console.log("--------------------")
    console.log('Getting Enzymes');
    const entries: [string, string,][] = Object.entries(this.mapData);
    //console.log(entries);
    const thirdEntry: [string, string] = entries[2]; 
    //console.log(thirdEntry);
    const enzymes = thirdEntry[1];
    for (let i=0; i<enzymes.length;i++){
      //console.log(links[i]);
      enzymeData.push(enzymes[i])
    }
    return enzymeData;
  }

  // ------ Loading Pathway Tally from back-end --------
  loadTally(): void {
    console.log("--------------------")
    console.log('Processing Pathway Tally');
    var highlightedPathways = [];
    // extract each pathway 
    // match code to allKEGGPathways -- get name 
    // store in new object array - Name, pathway (code), number of enzymes in tally 
    console.log(this.pathwayTally);
    for (let i=0; i<this.pathwayTally.length;i++){
      const entry = this.pathwayTally[i];
      //console.log(entry);
      let code = entry[0];
      let number = entry[1];
      const result = this.AllKeggPathways.find(item => item.pathway === code);
      const name = result ? result.name : null;
      highlightedPathways.push({
        name: name,
        pathway: code,
        Enzymes: number
      });
    }
    console.log(highlightedPathways);
    this.highlightedPathways = highlightedPathways;
  }

  isLoading: boolean = false;

  // Function for getting a range of number for 1 with the same length of a selected Array
  // Used to get timepoints the same length as file storage array
  rangeFromOne(arr: any[]): number[] {
    return Array.from({ length: arr.length }, (_, i) => i + 1);
  }


  /** --------  POST REQUEST Functions -------- **/

  // -------------- Sending Pathway Requests to Back-end ---------------------
  // Fetches relevant pathways when the Display component is initialised



// --------------- INITIAL FUNCTION - PROCESSING + POSTING -------------------
  // Display Initalisation Function - First Function called when Display.component is opened
  async ngOnInit(): Promise<void> {
    const params = await firstValueFrom(this.route.queryParams);
    this.skipInitProcessing = params['skipInitProcessing'] === 'true' || history.state?.fromLanding;

    console.log("--------------------");
    console.log("skip ngOnInit? " + this.skipInitProcessing);
    console.log("--------------------");
  
    console.log("--------------------")
    console.log("skip ngOnInit? " + this.skipInitProcessing);
    console.log("--------------------")
    // If user is not opening the saved project
    if (!this.skipInitProcessing) {
      // Updating TimeSlider for the length of the expression files 
      const allData = this.fileDataService.getMultipleCombinedArrays();
      const timepoints = this.rangeFromOne(allData);
      console.log("--------------------")
      console.log('Timepoints: '+timepoints);
      this.timepoints = timepoints;

      // Loading Screen
      this.isLoading = true;

      // Fetching a list of the enzyme pathways from KEGG
      await this.getAllPathwayNames();

      // Processing Input Data - Match Genes and Extracting LogFc + EC numbers
      this.getEnzymeGenes();
      // Getting List of Enzymes from Input Data
      this.extractECNumbers();

      // Retrieving the Pathway number from the User
      this.pathwayNumber = this.fileDataService.getPathwayCount();
      console.log("--------------------")

      // Setting up Data Array to send to back-end API
      // Sending list of enzymes (from ExtractECNUmber()) and Number of top pathways to get (e.g. 10))
      const data = [this.enzymeList, this.pathwayNumber];
      this.enzymeApiServicePost.postEnzymeData(data).subscribe(
        (response) => {
          console.log('Response from Backend:')
          console.log(response);

          this.pathwayTally = response[1];
          console.log('Pathway Tally');
          console.log(this.pathwayTally);
          // Handle the successful response
          this.pathwayData = response[0].paths;

          this.loadNames();// Loading Pathway names -- for displaying to user
          this.loadTally();// Loading Tally of all pathways 
          console.log("--------------------")
          console.log('Received from backend:', response);
          console.log("--------------------")
          console.log('Getting Mapping Data');
          this.getMapData(this.pathwayData);
          
        },
        (error) => {
          // Handle errorsF
          console.error('Error:', error);
          this.isLoading = false; 

        }
        
      );

      this.filteredPathways = [...this.pathways];
      
      this.ExpressionFileNames = this.UploadedExpressionFiles.map(file => file.name);
    // If user is opening a saved project
    }else{
      if (history.state?.fromLanding) {
        const fileContents = this.fileDataService.getTempProjectData();
        if (fileContents?.length) {
          this.skipInitProcessing = true;
          this.isLoading = true;
          this.LoadingMessage = 'Loading Project...';
          this.projectLoaderService.loadProjectFiles(fileContents, this).then(() => {
            this.isLoading = false;
            this.skipInitProcessing = false;

          });
        }
      }
    }
  };


// --------------- Retrieving Mapping Data -------------------
// Sends Map code (Post Request)(e.g. ec:00030)
// Returns Mapping Data for relevant pathways (Nodes and Links)
// Calls Data Processing functions (loadNodes, loadLinks)
  getMapData(pathwayData: any[]): void {

  // Sending top 10 Pathways to back-end to retrieve Mapping Data 
  const data = [pathwayData];
  this.isLoading = true;
  console.log("--------------------")
  console.log('Sending Request for Pathway Mapping Data');
  this.LoadingMessage = 'Loading Pathway Mapping Data...';
  this.enzymeApiServicePost.postALLMapData(data).subscribe(
    (response) =>{
    //console.log(response);
    
    // Assigning Global & Local attributes
    const ALLpathwayData = response;
    this.pathwayResponse = response;
    this.ALLpathwayData = ALLpathwayData;

    // Loading Pathway Data to Loaded Pathway Array
    // Loads edited Nodes (logfc, genes, colour)
    this.getLoadedPathways();

    console.log("--------------------")
    console.log('Pathway Data Loaded Successfully');
    this.isLoading = false;
    },
    (error) => {
      console.error('Error:', error);
      this.isLoading = false;
    });
  };

  newlyAddedPathways: string[] = [];
  
  getMoreMapData(pathwayData: any[]): void {

    // Sending top 10 Pathways to back-end to retrieve Mapping Data 
    const data = [pathwayData];
    this.isLoading = true;
    console.log("--------------------")
    console.log('Sending Request for Pathway Mapping Data');
    this.LoadingMessage = 'Loading Pathway Mapping Data...';
    this.enzymeApiServicePost.postALLMapData(data).subscribe(
      (response) =>{
      console.log(response);
      
      const pathwayResponse = response;

      // Adding New Pathways to already loaded pathways 
      console.log(this.ALLpathwayData);
      pathwayResponse.forEach(item => {
        this.ALLpathwayData.push(item);
      });

      console.log(this.ALLpathwayData);

      // Adding to list of names to display 
      console.log("pathways before adding", this.pathways);
      this.newlyAddedPathways=[];
      pathwayResponse.forEach(item => {
        this.pathways.push(item.name);
        this.newlyAddedPathways.push(item.name);
      });
      console.log("pathways after adding", this.pathways);

      // Adding to list of names to display 
      console.log(this.pathwayData);
      pathwayResponse.forEach(item => {
        this.pathwayData.push({name:item.name, pathway: item.pathway});
      });
      console.log(this.pathwayData);

      // Loading Pathway Data to Loaded Pathway Array
      // Loads edited Nodes (logfc, genes, colour)

      this.getLoadedPathways();

      const loadedData = this.loadedPathwayData;
      console.log(loadedData);
      console.log("--------------------")
      console.log('Pathway Data Loaded Successfully');
      console.log("--------------------")
      this.isLoading = false;
      },
      (error) => {
        console.error('Error:', error);
        this.isLoading = false;
      });
  };
  
  

  /** --------  GET REQUEST Functions -------- **/


// -------------- Get REQUEST for all Pathway Names + Code --------------
// GET request for Pathway Names and asscoiated EC pathway codes
// Returns list after filtering against blacklist 
// Occurs regardless of loading stage

async getAllPathwayNames(): Promise<void>{
    console.log("--------------------")
    console.log('Getting All Pathway Names')
    console.log("--------------------")
    this.isLoading = true;
    this.LoadingMessage = 'Loading All KEGG Pathway Names and Codes...';
    this.enzymeApiServicePost.getPathwayNames().subscribe(response => {
        // Handle the successful response
        
        console.log('Response from backend:')
        console.log(response);
        this.AllKeggPathways = response;

      },
      (error) => {
        // Handle errors
        console.error('Error:', error);
        this.isLoading = false; 

        //this.responseMessage = 'Error sending data';
      }
    );
  }

// -------------- Get REQUEST for Specific Pahtway Data--------------
// Called when users want to get information for a specific pathway not in the pathway list 
 getSpecificPathway(pathwayData: { name: string; pathway: string }): void{
  // Function to get specific pathway based on EC Code/name
  // Will make new post request to fetch KGML and data for that pathway

  // Pathway code 
    console.log('Getting Specific Pathway Request');
    //console.log(pathwayData.pathway);
    const code = pathwayData.pathway;
    const pathwayName = pathwayData.name;
    //console.log(data);
    this.isLoading = true;
    console.log("--------------------")
    console.log('Sending Request for Specific Pathway Data');
    console.log("--------------------")

    this.LoadingMessage = 'Loading Pathway Mapping Data...';

    this.enzymeApiServicePost.postMapData(code).subscribe(
      (response) =>{
      console.log(response);

      const pathwayData = response;
      //console.log(pathwayData);
      pathwayData[0].name= pathwayName;
      //console.log(pathwayData);
      this.ALLpathwayData.push(pathwayData[0]);
      //console.log(this.ALLpathwayData);
      console.log("--------------------")
      console.log('Pathway Data Loaded Successfully');
      console.log("--------------------")

      this.pathways.push(pathwayName);
      this.pathwayData.push(pathwayData[0]);

      this.getLoadedPathways();
      
      const data = this.ALLpathwayData.find((obj => obj.pathway === code));
      this.selectedPathway = code;
      this.setMap(code,this.selectedTimeIndex, data);

      this.isLoading = false;
      },
      (error) => {
        console.error('Error:', error);
        this.isLoading = false;
      });

 }

    /** --------  Mapping Functions -------- **/
    stats = {
      totalGenes: 0,
      uniqueGenes: 0,
      enzymesEffected: 0,
    };
  // --------------- Retrieving Data and Calling Mapping Functions-------------------
  // Gets correct Mapping Data before calling the Diagram Updating Functions
  setMap(code: string, timepoint: number, pathwayData: {name: string, pathway: string,
               nodes: any[], edges: any[], enzymes: []}): void {
    console.log("--------------------");
    console.log("Getting Map Data: "+code);
    //console.log(pathwayData);
    const pathwayResponse = this.pathwayResponse;
    console.log("--------------------");
    console.log('Original Response: '+pathwayResponse);

    // Extracting nodes and edges 
    const nodes = pathwayData.nodes;
    const links = pathwayData.edges;
    console.log("--------------------");
    console.log('Nodes + Edges Retrieved');
    //console.log(nodes);
    //console.log(links);
    console.log("--------------------");
    console.log('Loading Differential Expression Data')
    const elements = this.compareEnzymes(nodes,timepoint);
    
    const updatedNodes = elements[0];
    const updatedEdges = this.getMetabolicFlux(updatedNodes,links)
    console.log("--------------------");
    console.log('Stats Recieved');
    const stats = elements[2][0];
    console.log(stats);
    console.log('Is array?', Array.isArray(stats));

    // TO DO:  ADD STATS TO DISPLAY COMPONENT 
    this.stats = {...stats};
    console.log(this.stats);
    console.log(this.stats.enzymesEffected);

    this.changeDiagram(updatedNodes, updatedEdges);
    this.isLoading = false;

    // calls this method when user selects another pathway, updates the dropdown node values
    this.populateNodeCategories();
    if (this.myDiagram){
    this.setLegend(this.myDiagram);
    }

    this.isLoading = false;
  }


  // --------------- Creating GO.js Model -------------------
  // Creating the First GoJS MAP
  // Creates the Diagram Template and initialises 
  createGoJSMap(nodes: any[], links: any[] ): void {

    console.log("--------------------");
    console.log('Initialising Map');

    var $ = go.GraphObject.make;
    
  // Create the GoJS Diagram
    this.myDiagram = $(go.Diagram, "myDiagramDiv", {
    initialContentAlignment: go.Spot.Center,
    "undoManager.isEnabled": true,
    initialAutoScale: go.AutoScale.Uniform
  });
  
  // Attach the overview panel (floating mini-map)
  this.myOverview = $(go.Overview, "overviewDiv", {
    observed: this.myDiagram,
    contentAlignment: go.Spot.Center,
    drawsGrid: false,
    scale: 1.5 // to improve the clarity of the diagram inside the minimap
  });

  // TEMPLATE FOR LAYOUT

  this.myDiagram.layout = new go.LayeredDigraphLayout({
    // Set optional parameters for the layout
    direction: 90,
    layerSpacing: 70,  // Space between layers (nodes grouped in layers)
    columnSpacing: 50,  // Space between columns (nodes within the same layer)
    setsPortSpots: true,  // Don't automatically adjust port spots (ports can be manually set)
    packOption: go.LayeredDigraphLayout.PackMedian, // Helps with tight packing
    aggressiveOption: go.LayeredDigraphLayout.AggressiveMore,
  });

  // TEMPLATE FOR COMPOUNDS 
    this.myDiagram.nodeTemplateMap.add("compound",  // Custom category for compound nodes
      new go.Node("Vertical")  // Use Vertical Panel to place the label above the shape
        .add(
          new go.Shape("Circle", {
            width: 40,
            height: 40,
            fill: "lightgrey",
          })
        ).add(new go.TextBlock(
          { name: "TEXT", 
            margin: 5,
            font: "15px sans-serif",
            maxSize: new go.Size(100, 20),
            overflow: go.TextBlock.OverflowEllipsis,
            //wrap: go.TextBlock.WrapFit,
            })
          .bind("text","text")         
        )
    );

  // TEMPLATE FOR LINKS
    this.myDiagram.linkTemplate =
    new go.Link({
        routing: go.Routing.AvoidsNodes,
        //routing: go.Link.Bezier,
      })
      .add(
        new go.Shape(),
        new go.Shape( { toArrow: "Standard" })
      );

  // TEMPLATE FOR LINKS for MAPLINKS
  this.myDiagram.linkTemplateMap.add("maplink",  // Link type category
    $(go.Link,
      {
        relinkableFrom: true,
        relinkableTo: true,
        routing: go.Link.AvoidsNodes,  // Route around nodes
        corner: 5,  // Optional: corner rounding
        reshapable: true,  // Allow reshaping the link
        selectable: true,  // Make link selectable
        layerName: "Foreground",  // Draw link on the foreground layer
      },
      new go.Binding("points").makeTwoWay(),
      
      // Shape of the link (the line itself)
      $(go.Shape, 
        {
          stroke: "darkgrey",  // Set the color of the link (line) to black
          strokeWidth: 3,
          strokeDashArray: [10, 5]  // Set the line to be dashed (10px dashes, 5px gaps)
        }),
  
      // Arrowhead at the "to" end of the link (one-way arrow)
      $(go.Shape, 
        {
          toArrow: "Standard",  // Standard arrowhead at the end of the link
          fill: "black",  // Set the color of the arrow to black
          stroke: null  // No border around the arrow
        })
    )
  );

  this.myDiagram.linkTemplateMap.add("reversible",  // Link type category
    $(go.Link,
      {
        relinkableFrom: true,
        relinkableTo: true,
        routing: go.Link.AvoidsNodes,  // Route around nodes
        corner: 5,  // Optional: corner rounding
        reshapable: true,  // Allow reshaping the link
        selectable: true,  // Make link selectable
        layerName: "Foreground",  // Draw link on the foreground layer
      },
      new go.Binding("points").makeTwoWay(),
      
      // Shape of the link (the line itself)
      $(go.Shape, 
        {
          //stroke: "black",  // Set the color of the link (line) to black
          strokeWidth: 3,
          strokeDashArray: [10, 5]  // Set the line to be dashed (10px dashes, 5px gaps)
        }).bind('stroke','colour').bind('strokeWidth','size'),
        /*
      // Arrowhead at the "to" end of the link (one-way arrow)
      $(go.Shape, 
        {
          toArrow: "Standard",  // Standard arrowhead at the end of the link
          stroke: null  // No border around the arrow
        }).bind('fill','colour'),
    ),*/
    $(go.Shape,
      {
        toArrow: 'OpenTriangle',
        name: "MiddleArrow",
        segmentIndex: Infinity,  // position the arrow
        segmentFraction: 0.5,    // middle of the link
        stroke: 'black',
        fill: 'black',
        scale: 1.7
      }
    ))
);

  this.myDiagram.linkTemplateMap.add("irreversible",  // Link type category
    $(go.Link,
      {
        relinkableFrom: true,
        relinkableTo: true,
        routing: go.Link.AvoidsNodes,  // Route around nodes
        corner: 5,  // Optional: corner rounding
        reshapable: true,  // Allow reshaping the link
        selectable: true,  // Make link selectable
        layerName: "Foreground",  // Draw link on the foreground layer
      },
      new go.Binding("points").makeTwoWay(),
      
      // Shape of the link (the line itself)
      $(go.Shape, 
        {
          stroke: "black",  // Set the color of the link (line) to black
          strokeWidth: 3,
        }).bind('stroke','colour').bind('strokeWidth','size'),
  
      // Arrowhead at the "to" end of the link (one-way arrow)
      /*
      $(go.Shape, 
        {
          toArrow: "Standard",  // Standard arrowhead at the end of the link
          fill: "black",  // Set the color of the arrow to black
          stroke: null  // No border around the arrow
        }).bind('fill','colour'),
    )*/
        $(go.Shape,
          {
            toArrow: 'OpenTriangle',
            name: "MiddleArrow",
            segmentIndex: Infinity,  // position the arrow
            segmentFraction: 0.5,    // middle of the link
            stroke: 'black',
            fill: 'black',
            scale: 1.7
          }
        ))
      );
        
  
  // TEMPLATE FOR ENZYME NODES
    this.myDiagram.nodeTemplateMap.add("enzyme",
      new go.Node("Auto") 
        .add(
          new go.Shape("Rectangle").bind("fill","colour").bind("width").bind("height").bind('stroke').bind('strokeWidth','border')
        ).add(new go.TextBlock(
          { margin: 2,
            //font: "10px sans-serif",
            wrap: go.TextBlock.WrapFit,
          width: 80 })
          .bind("text")
          .bind("font", "", (node) => {
            const size = node.width; 
            const result = Math.max(10, size * 0.1);
            const output = `${result}px sans-serif`;
            return output;
        })
        )
    );

    // TEMPLATE FOR MAP NODES
    this.myDiagram.nodeTemplateMap.add("map",
      new go.Node("Auto",
        {
          /*click: (e: go.InputEvent, obj: go.GraphObject) => {
            const node = obj.part as go.Node;
            const data = node.data;
            this.handleMapNodeClick(data);
        }*/
      }
      ) 
        .add(
          new go.Shape("RoundedRectangle", {
            fill: "lightblue",
            width: 100,
            height: 60
          })
        ).add(new go.TextBlock(
          { name: "TEXT", 
            margin: 2,
            font: "10px sans-serif",
            wrap: go.TextBlock.WrapFit,
          width: 80 })
          .bind("text", "name")
        )  
    );

  // TEMPLATE FOR REACTION GROUPS
    this.myDiagram.groupTemplate =
    new go.Group("Horizontal")
      .add(
        new go.Panel("Auto")
          .add(
            new go.Shape("Rectangle", {
                parameter1: 0,
                fill: "#F2F2F2",
                stroke:"#F2F2F2"
              }),
            new go.Placeholder(
                { padding: 10})  
          ),
        new go.TextBlock({
            visible: false
          })
          .bind("text")
      );


    // Shows popup on click for all node types
    this.myDiagram.addDiagramListener("ObjectSingleClicked", (e) => {
      console.log("Diagram click detected");
      // Extracting data from the node and populates the variables with the data
      const part = e.subject.part;
      if (!(part instanceof go.Node)) return;
    
      const node = part;
      const data = node.data || {};
    
      this.popupNodeData = data;
      this.popupNodeKey = data.key;
    
      // To fix the position of the pop-up below the node 
      const pos = this.myDiagram!.transformDocToView(
        node.getDocumentPoint(go.Spot.BottomCenter)
      );
    
      // Sets temporary top position, delay horizontal calculation
      this.popupPosition = {
        top: pos.y + 10,
        left: 0  // temporary value until we get correct width
      };
      this.isPopupVisible = true;
      this.cdr.detectChanges();
    
      // Delay centering until Angular has rendered the popup
      setTimeout(() => {
        const popup = this.htmlPopupRef.nativeElement;
        const width = popup.offsetWidth;
    
        this.popupPosition = {
          top: pos.y + 10,
          left: pos.x - width / 2
        };
    
        this.cdr.detectChanges();
      }, 0);
    });
    
    // Triggered when the user pans or zooms the diagram. 
    // Recalculates the popup's position to stay aligned with its associated node.
    this.myDiagram?.addDiagramListener("ViewportBoundsChanged", () => {
      if (this.popupNodeData && this.popupNodeKey) {
        const node = this.myDiagram?.findNodeForKey(this.popupNodeKey);
        if (!node) {
          console.log("⚠️ Node not found for popupKey:", this.popupNodeKey);
        }
        if (node) { // to maintain position of the popup at the bottom centre of the clicked node
          const pos = this.myDiagram?.transformDocToView(node.getDocumentPoint(go.Spot.BottomCenter));
          if (pos) {

            const popup = this.htmlPopupRef.nativeElement;
            const width = popup.offsetWidth;  

            this.popupPosition = {
              top: pos.y + 10,        // match your original vertical offset
              left: pos.x - width / 2 // horizontal centering
            };
          }
        }
      }
    });    
          
    // For clearing the pop-up when the background (or the canvas) is clicked.
    this.myDiagram!.addDiagramListener("BackgroundSingleClicked", () => {
      this.myDiagram!.clearSelection();
      // Resetting pop-up related variables, cleared of any reference to the previously selected node.
      this.isPopupVisible = false;
      this.popupNodeKey = null;
      this.popupNodeData = null;
    }); 

    var model = $(go.GraphLinksModel);
    model.nodeDataArray = nodes; 
    model.linkDataArray = links;
    // Assigning the model to the diagram for visualisation
    //this.clearAnimations(this.myDiagram);
    this.myDiagram.model = model;

    // for populating the node categories 
    this.populateNodeCategories();   
    
    // runs once the initial layout of the diagram is complete
    this.myDiagram.addDiagramListener("InitialLayoutCompleted", () => {
      if (this.myDiagram) {
        //this.clearAnimations(this.myDiagram);
        this.setLegend(this.myDiagram);
        this.animateLinksFromNodeKeys(this.myDiagram, this.regulatedLinks);
      }
    });
  }


 // method for populating the node categories
  populateNodeCategories(): void {
    if (!this.myDiagram) return;
    // extracting node data from the diagram model
    const nodeDataArray = this.myDiagram.model.nodeDataArray;
    
    // initialising variables
    this.enzymeCategories = [];
    this.enzymeCategoryMap = {};
    this.compoundList = [];
    this.pathwayList = [];
  
  
    for (const node of nodeDataArray) {
      //console.log("🔍 Node:", node);
      const type = node['type'];
      const ec = node['text'];

      const name = node['name'] || ec;
  
      if (type === 'enzyme') {
        const category = node['enzymeType'] || 'Uncategorized';
  
        if (!this.enzymeCategoryMap[category]) {
          this.enzymeCategoryMap[category] = [];
          this.enzymeCategories.push(category);
        }
  
        // Avoid duplicate entries
        const alreadyExists = this.enzymeCategoryMap[category].some(e => e.ec === ec);
        if (!alreadyExists) {
          this.enzymeCategoryMap[category].push({
            ec,
            name,
            logfc: node?.['logfc'] ?? null,
            colour: node?.['colour'] ?? null,
          });
          
        }
      }
  
      if (type === 'compound' && !this.compoundList.includes(name)) {
        this.compoundList.push(name);
      }
  
      if (type === 'map' && !this.pathwayList.includes(name)) {
        this.pathwayList.push(name);
      }
    }
  
    this.enzymeCategories.sort();
    for (const category of this.enzymeCategories) {
      this.enzymeCategoryMap[category].sort((a, b) => a.name.localeCompare(b.name));
    }
    this.compoundList.sort();
    this.pathwayList.sort();
    
    // to populate the drop downs
    for (const category of this.enzymeCategories) {
      for (const enzyme of this.enzymeCategoryMap[category]) {
        // Find matching node in nodeDataArray
        const node = nodeDataArray.find(n => n['text'] === enzyme.ec && n['type'] === 'enzyme');
    
        this.enzymeOptions.push({
          ec: enzyme.ec,
          name: enzyme.name,
          logfc: node?.['logfc'] ?? null,
          colour: node?.['colour'] ?? null
        });
      }
    }

    console.log('enzymeCategoryMap w/ colours:', this.enzymeCategoryMap);

    console.log('enzymeOptions:', this.enzymeOptions);

  this.CompoundOptions = [...this.compoundList];
  this.PathwayOptions = [...this.pathwayList];
  }
  
  // method for highlighting the node when an item in the dropdown is clicked
  selectNodeFromDropdown(nodeKeyOrName: string, nodeType: string): void {
    if (!this.myDiagram) return;
  
    const nodeDataArray = this.myDiagram.model.nodeDataArray;
  
    let match: any;

    // Based on the selected type (enzyme, compound, or map), 
    // the method searches the diagram's nodeDataArray for a matching node.
    // The match is determined using either the text field (for enzymes and compounds) or the name field (for map nodes).
    if (nodeType === 'enzyme') {
      match = nodeDataArray.find(n => n['type'] === 'enzyme' && n['text'] === nodeKeyOrName);
    } else if (nodeType === 'compound') {
      match = nodeDataArray.find(n => n['type'] === 'compound' && n['text'] === nodeKeyOrName);
    } else if (nodeType === 'map') {
      match = nodeDataArray.find(n => n['type'] === 'map' && n['name'] === nodeKeyOrName);
    }
  
    if (!match) {
      console.warn(`${nodeType === 'map' ? 'Map name' : 'Node'} not found: ${nodeType} →`, nodeKeyOrName);
      return;
    }
    // If a match is found, it retrieves the actual GoJS Node object using findNodeForData().
    const node = this.myDiagram.findNodeForData(match);
    if (!node) {
      console.warn(`Node instance not found for:`, match);
      return;
    }

    // Highlight node
    this.myDiagram.select(node); // to highlight the node
    this.myDiagram.centerRect(node.actualBounds);

    // Zoom and center
    this.myDiagram.commandHandler.scrollToPart(node);
    this.myDiagram.scale = 1.1;
    this.myDiagram.centerRect(node.actualBounds);
    this.setLegend(this.myDiagram);
  }
  
  // for the popup
  isArray(value: any): boolean {
    return Array.isArray(value);
  }
  

  // --------------- Updating GO.js Model -------------------
  // Updates the pre-existing Diagram Model
  updateDiagram(nodes: any[], links: any[]): void{
    if (this.myDiagram){
    console.log('Updating Diagram'); 
    this.clearAnimations(this.myDiagram); 
    this.myDiagram.model = new go.GraphLinksModel(nodes, links);
    }
  }


  // ----------- Changing Diagram Upon Selection -------------------
  // Checks for an existing Diagram 
  // If exists - Updates the Model with new nodes + links (updateDiagram()))
  // If doesnt exist - Creates first Diagram Model (createGOJSMap())
  changeDiagram(nodes: any[], links: any[]): void {

    // Reset popup when diagram changes
    this.popupNodeData = null;
    this.popupNodeKey = null;
    this.isPopupVisible = false;
    this.cdr.detectChanges();

    // If diagram exists, clear it first
    console.log("--------------------");
    console.log('Changing Diagram');
    if (this.myDiagram) {
      // Diagram Exists - update the current one 
      console.log("--------------------");
      console.log('Diagram Exists')
      this.clearAnimations(this.myDiagram);
      this.myDiagram.model = new go.GraphLinksModel([], []); // Clearing Nodes & Links
      console.log('Diagram Data Cleared')
      this.updateDiagram(nodes,links); // Assigning new Nodes & Links
      this.setLegend(this.myDiagram); // Setting Updated Legend
      // Lisenting for layout completion --> staring Metabolic Arrow Animation
      this.myDiagram.addDiagramListener("InitialLayoutCompleted", () => {
        if (this.myDiagram) {
          this.clearAnimations(this.myDiagram); // Clearing previous Animations
          // Starting new animations with highlighted links
          this.animateLinksFromNodeKeys(this.myDiagram, this.regulatedLinks);
        }
      });

    }else{
    //  Initialisaing first diagram with template
      this.createGoJSMap(nodes, links);
    if (this.myDiagram) { // Animating Metabolic Flux 
          this.clearAnimations(this.myDiagram);
          this.animateLinksFromNodeKeys(this.myDiagram, this.regulatedLinks);
        }}
      
  }



// ------------- Linked Map retrieval Function ----------------
// Handles clicking of map node of pathway data that is not already generated
// Makes new post request to backend with selected pathway code 
// Appends new pathway data to pathway list and data arrays 
// Pathway is added to end of list displayed to user and rendered on the screen

  private handleMapNodeClick(data: any): void {
    console.log("Clicked map node:", data);
    const pathCode = data.text;
    const pathName = data.name;
    const code = pathCode.replace("path:", "");
    //console.log(code);

    const matchingItems = this.ALLpathwayData.find((obj => obj.pathway === code));
    //console.log(matchingItems);
    if (matchingItems){
      // If the pathway is already loaded --> visualise map for this pathway
      this.setMap(code, this.selectedTimeIndex,matchingItems)
    }else{
      // Looking through all Kegg Pathways
      console.log('Searching all Kegg Pathways');
      // Retrieving Code for pathway if present
      const allMatch = this.AllKeggPathways.find((obj => obj.pathway === code));
      if (allMatch){
        // Setting request for specific pathway map data 
        // Uses getMap endpoint of back-end
        this.getSpecificPathway(allMatch);

      }else{
        
    }}
    this.SelectedPathwayName = pathName;
  }


// ----------- CREATING LEGEND for each map retrieval -------------
// Called each time a map is intialised / changed 
// Legend is updated with user-selected colours 
// Rendered in bottom right-hand corner of the Display Div as GoJS element

  private setLegend(myDiagram: go.Diagram): void{
    const $ = go.GraphObject.make;

    const legend = $(
      go.Part, "Table",
      {
        name: "Legend",
        layerName: "ViewportForeground",  // Ensures it's in the foreground and fixed in the viewport
        isLayoutPositioned: false,        // Prevents layout from affecting its position
        selectable: false,
        alignment: go.Spot.BottomRight,    // Aligns to the bottom-left of the viewport
        alignmentFocus: go.Spot.BottomRight,
        margin: new go.Margin(10, 10, 10, 10) // Adds padding from the viewport edges
      },
    
      // Title
      $(go.TextBlock, "Legend",
        {
          row: 0,
          font: "bold 10pt sans-serif",
          stroke: "#333",
          margin: new go.Margin(0, 0, 6, 0),
          columnSpan: 2
        }
      ),
    
      // Node Type: Compound
      $(go.Panel, "Horizontal", { row: 1 },
        $(go.Shape, "Circle", { width: 15, height: 15, fill: "#ccc", margin: 2 }),
        $(go.TextBlock, "Compound", { margin: 2,font: "8pt sans-serif" })
      ),
    
      // Node Type: Linked Pathway
      $(go.Panel, "Horizontal", { row: 2 },
        $(go.Shape, "RoundedRectangle", { width: 15, height: 15, fill: "lightblue", margin: 2 }),
        $(go.TextBlock, "Linked Pathway", { margin: 2 ,font: "8pt sans-serif"})
      ),

      // Node Type: Enzyme - No change 
      $(go.Panel, "Horizontal", { row: 3 },
        $(go.Shape, "Rectangle", { width: 15, height: 15, fill: 'lightgrey', margin: 2 }),
        $(go.TextBlock, "Enzyme - No change", { margin: 2,font: "8pt sans-serif"})
      ),
 
      // Expression Gradient
      $(go.Panel, "Horizontal", { row: 4 },
        $(go.Shape, "Rectangle", {
          width: 100,
          height: 12,
          margin: 2,
          fill: $(go.Brush, "Linear", {
            start: go.Spot.Left,
            end: go.Spot.Right,
            0: this.selectedColorLow,        // Low expression
            0.5: "lightgrey",                // Neutral / No change
            1: this.selectedColorHigh        // High expression
          }),
          stroke: "black"
        })
      ),

      $(go.Panel, "Horizontal", { row: 5 },
        $(go.TextBlock, "Down-regulated", { font: "6pt sans-serif", margin: new go.Margin(0, 40, 0, 2) }),
        $(go.TextBlock, "Up-regulated", { font: "6pt sans-serif", margin: new go.Margin(0, 2, 0, 40) })
      ),

      // Node Type: Selected Isoform Colour
      $(go.Panel, "Horizontal", { row: 6 },
        $(go.Shape, "Rectangle", { width: 15, height: 15, fill: this.selectedColorIsoform, margin: 2 }),
        $(go.TextBlock, "Gene Paralogs", { margin: 2,font: "8pt sans-serif"})
      ),
    
      // Link: Reversible
      $(go.Panel, "Horizontal", { row: 7 },
        $(go.Shape, {
          geometryString: "M0 0 L30 0",
          stroke: "black",
          strokeWidth: 3,
          strokeDashArray: [10, 5] ,
          margin: 2
        }),
        $(go.TextBlock, "Reversible", { margin: 2,font: "8pt sans-serif"})
      ),
    
      // Link: Irreversible
      $(go.Panel, "Horizontal", { row: 8 },
        $(go.Shape, {
          geometryString: "M0 0 L30 0",
          stroke: "black",
          strokeWidth: 2,
          margin: 2
        }),
        $(go.TextBlock, "Irreversible", { margin: 2,font: "8pt sans-serif"})
      )
    );
    
    // Add the legend to the diagram
    myDiagram.add(legend);

  }




// ---------- METABOLIC FLUX ANIMATIONS ----------

  private animatedLinkIds: Set<string> = new Set();

  // Finds to and from links from list of Differentially regulated links
  // Extracts colours from the links to assigns as the arrow colour
  // calls animtaion function for each link (animateAlongLink) for dynamic animation along the selected links


  // Finds Minimum and Maximum of logfc list -- to get relative arrow size
 private getMinMax(values: number[]): { min: number; max: number } {
    if (!values.length) {
      throw new Error("Empty array passed to getMinMax");
    }
  
    let min = values[0];
    let max = values[0];
  
    for (const val of values) {
      if (val < min) min = val;
      if (val > max) max = val;
    }
  
    return { min, max };
  }

  // ---- LINK IDENTIFICATION AND PROCESSING -----
  // Find links associated to passed Node keys 
  // Stores the identified links in a set 
  // If the length of the link is >2 then calls animation function 
  // Removes default arrow of links that have animation 

  private animateLinksFromNodeKeys(diagram: go.Diagram, fromNodeKeys: string[]) {
    if (!diagram) return;
    
    // Ensuring that the diagram has no animations remaining 
    this.clearAnimations(diagram);
    diagram.startTransaction("animate links");
    const animatedLinkIds = new Set<string>();
    
    // Find node objects for each key passed.
    fromNodeKeys.forEach(fromKey => {
      const node = diagram.findNodeForKey(fromKey);
      if (!node) {
        console.warn(` Node not found for key: ${fromKey}`);
        return;
      }
  
      // Get BOTH incoming and outgoing links for the reaction node
      const linksOut = node.findLinksOutOf();
      const linksIn = node.findLinksInto();
      
  
      // Combine them
      const allLinks = new go.List<go.Link>().addAll(linksOut).addAll(linksIn);
  
      allLinks.each((link: go.Link) => {
        const pointsCount = link.pointsCount;
        const from = link.data?.from;
        const to = link.data?.to;

        // If node has to and from link add to set of links
        // Required to remove default arrow
        if (from && to) {
          const linkId = `${from}->${to}`;
          animatedLinkIds.add(linkId);
        }
        
        // Calculating Min and Max of Logfc for the current diagram
        // Use to get a realtive scale for determining arrow size 
        const result = this.getMinMax(this.currentLogFc);
        const min = result.min;
        const max = result.max;
  
        if (pointsCount < 2) { // Determines in Link is long enough for animation
          console.warn(`Link from ${from} to ${to} has insufficient points`);
        } else {
          // Calling animation function for highlighted link
          this.animateAlongLink(diagram, link, min,max);
        }
      });
    });
    // Removing default 'Middle Arrow" for links that now have animations
    // This Arrow is defined in the link template of createGOJSMap()
    this.updateArrowVisibilityForAnimations(animatedLinkIds);
    
    // Commiting Diagram Transaction - Transaction no longer active
    diagram.commitTransaction("animate links");

    // Updating list of animated links
    this.animatedLinkIds = animatedLinkIds;
  }

// ------- ANIMATION FUNCTION ---------
// Function that defines animation attributes
// Called for each highlighted link within the selected pathway map
  private animateAlongLink(diagram: go.Diagram, link: go.Link,minLogfc: number, maxLogfc: number) {
    if (!link || link.pointsCount < 2) {
      // Checking that the link it long enough to animate along
      return;
    }

    // Defining the node colour as the link colour with default as 'green'
    const rawLogfc = link.data?.logfc ?? 0;
    const logfc = typeof rawLogfc === "string" ? parseFloat(rawLogfc) : rawLogfc;
    const linkColour = link.data?.colour || "green";

    let normalized = 0;
    if (maxLogfc !== minLogfc) {
      normalized = (logfc - minLogfc) / (maxLogfc - minLogfc);
    }


    // Compute arrow scale based on absolute logfc
    // Setting clamps to prevent overly large or small scaling 
    const clamped = Math.max(0, Math.min(1, normalized));   
    const minScale = 1;
    const maxScale = 4;
    const arrowScale = minScale + clamped * (maxScale - minScale);

    // Arrow Shape Attributes 
    const shape = new go.Shape(); // Initalising a new shape 
    shape.geometryString = "F1 M0 0 L10 5 L0 10 Z"; // Arrow
    shape.fill = linkColour; // Same colours as link - relative to DGE
    shape.stroke = null;
    
    shape.scale = isFinite(arrowScale) && !isNaN(arrowScale) ? arrowScale : 1;
    shape.angle = 0; // default but updated dynamically
  
    const part = new go.Part();
    part.layerName = "Foreground";
    part.locationSpot = go.Spot.Center;
    part.category = "animation-dot"; // Assingin category for node removal later
    part.add(shape);// add arrow to part
    diagram.add(part);// add part to diagram
  
    // Animation config
    const pixelsPerSecond = 400;
    const fps = 60;
    const intervalTime = 1000 / fps;
    const pixelsPerFrame = (pixelsPerSecond / 1000) * intervalTime;
  
    let distance = 0;
  
    const interval = window.setInterval(() => {
      // Recalculate link path every frame
      const rawPoints: go.Point[] = [];
      link.points.each(pt => rawPoints.push(pt.copy()));
  
      const segments: { from: go.Point; to: go.Point; len: number }[] = [];
      let totalLength = 0;
  
      for (let i = 0; i < rawPoints.length - 1; i++) {
        const from = rawPoints[i];
        const to = rawPoints[i + 1];
        const len = Math.sqrt(from.distanceSquaredPoint(to));
        segments.push({ from, to, len });
        totalLength += len;
      }
  
      // Handle no valid segments
      if (segments.length === 0 || totalLength === 0) return;
  
      distance += pixelsPerFrame;
      if (distance > totalLength) distance = 0;
  
      let distLeft = distance;
      let pos: go.Point | null = null;
      let currentSegment: { from: go.Point; to: go.Point; len: number } | null = null;
  
      for (const seg of segments) {
        if (distLeft <= seg.len) {
          currentSegment = seg;
          const t = distLeft / seg.len;
          pos = new go.Point(
            seg.from.x + (seg.to.x - seg.from.x) * t,
            seg.from.y + (seg.to.y - seg.from.y) * t
          );
          break;
        } else {
          distLeft -= seg.len;
        }
      }
  
      if (pos && currentSegment) {
        const dx = currentSegment.to.x - currentSegment.from.x;
        const dy = currentSegment.to.y - currentSegment.from.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
        diagram.startTransaction("move shape");
        part.location = pos;
        shape.angle = angle;
        diagram.commitTransaction("move shape");
      }
    }, intervalTime);
  
    this.animatedParts.push(part);
    this.animatedIntervals.push(interval);
  }


  // ------ ANIMATION CLEARING FUNCTION -------
  // Function to clear existing animations
  // Prevents nodes from staying on the diagram when a different timepoint/pathway 
  // is selected 
  // Employs several different methods to ensure no previous animation remains 
  // Clear global attributes and GoJS diagram attributes
  private clearAnimations(diagram: go.Diagram) {

    // Clear all intervals (stop animations)
    this.animatedIntervals.forEach(id => clearInterval(id));
    this.animatedIntervals = [];

    // Manually removing
    // Remove all animation parts (dots) from the diagram
    this.animatedParts.forEach(part => {
      if (diagram.findPartForKey(part.key)) {
        diagram.remove(part);
      }
    });
    // Assinging empty array
    this.animatedParts = [];

    diagram.parts.each(part => {
      if (part.category === "animation-dot") {
        diagram.remove(part);
      }
    });

    // Clearing list of animated links
    this.animatedLinkIds?.clear?.();

    //console.log("All old animations cleared.");
  }

  // ---- REMOVING DEFAULT ARROW ----------
  // Takes all animated link 
  // Removed static default arrow assigned in GoJS diagram template
  // Sets invisible rather than removed to ensure it is not a permenant change
  private updateArrowVisibilityForAnimations(animatedLinkIds: Set<string>) {
    if (this.myDiagram){
    this.myDiagram.links.each(link => {
      const id = `${link.data.from}->${link.data.to}`;
      const arrow = link.findObject("MiddleArrow") as go.Shape;
      if (arrow) {
        // Making the default arrow invisible 
        arrow.visible = !animatedLinkIds.has(id);
      }
    });}
  }

  //------ MOCK DATA -----
  isMenuOpen = true;
  pathwaysOpen = true;
  targetAnalysisOpen = false;

  exportOptions = ['PDF', 'CSV', 'JSON'];
  targets = ['Target 1', 'Target 2', 'Target 3'];
  
  selectedPathway: string = this.pathways[0];
  SelectedPathwayName: string = '';

  // ------------------ PATHWAY SIDE BAR -------------------
  // Open/Close sidebar
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (!this.isMenuOpen) {
      this.closeAllDropdowns();
      this.sortDropdownOpen = false;
    }else {
      this.pathwaysOpen = true;
    }
  }
  // Close all dropdowns
  closeAllDropdowns() {
    this.pathwaysOpen = false;
  }
  // On select Pathway
  selectPathway(event: Event, pathway: string) {
    event.stopPropagation();
    this.SelectedPathwayName = pathway;
    console.log("--------------------");
    console.log(this.SelectedPathwayName);
    console.log('Selected:', pathway);
    const nameSelected = pathway;
    console.log('Pathway Selected: '+nameSelected);
    console.log(this.pathwayData)
    // Finding corresponding map code to pathway name
    const path = this.pathwayData.find(path => path.name === nameSelected);
    console.log('Corresponding Code: '+path.pathway)

    // Assinging code of pathway selected 
    this.selectedPathway = path.pathway;
    const code = path.pathway

    const pathwayData = this.ALLpathwayData.find((obj => obj.pathway === code));
    this.setMap(code, this.selectedTimeIndex, pathwayData);
    if(this.myDiagram){
    this.setLegend(this.myDiagram);

    }
  }

  // ------------------ SORT BY FUNCTIONALITY -------------------
  sortDropdownOpen = false;
  
  // Open/close sort dropdown
  toggleSortDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.sortDropdownOpen = !this.sortDropdownOpen;
  }
  // Mnage sorting
  onSortClick(sortType: string) {
    console.log('onSortClick called with:', sortType); 
    this.sortPathways(sortType);
    this.sortDropdownOpen = false;
  }
  // Close the sort by if clicked outside
  handleClickOutside = (event: Event) => {
    const target = event.target as HTMLElement;
    if (this.sortDropdownOpen && !target.closest('.sort-container')) {
      this.sortDropdownOpen = false;
    }
  
    // Close sort dropdown
    if (this.sortDropdownOpen && !target.closest('.sort-container')) {
      this.sortDropdownOpen = false;
    }
  
  }

  // -------  PATHWAY SORTING FUNCTIONS -----------

  // ------ SORTING PATHWAYS--------
  // Takes Criteria Selected from User (Drop Down Menu)
  sortPathways(criteria: string) {
    console.log(`Sorting by ${criteria}`);

    // ----  Sort A-Z
    if (criteria == 'name'){
      // sorting A-Z
      let list = this.pathways;
      list = list.sort();
      console.log(list);
      this.pathways = list;
    }
    // ----  Sort Z-A
    if (criteria == 'length'){
      let list = this.pathways;
      list = list.sort((a, b) => b.localeCompare(a));
      console.log(list);
      this.pathways = list;
    }

    // ---  Sorting High DE enzymes
    if (criteria == 'highDGE'){
      
      console.log('Sorting Pathways by No. of DE Enzymes - High to low');
      const pathwayTally = this.pathwayTally;
      let list = this.pathways; // Getting list of displayed pathways 

      // Comparing to All KEGG Pathways --> get name
      const result = this.AllKeggPathways.filter(item1 =>
        list.some(item2 => item2 === item1.name)
      );

      // Getting Tally result (number of enzymes)
      const tally = result.map(item => {
        const match = pathwayTally.find(([path]) => path === item.pathway);
        return match ? { name: item.name, number: match[1] } : null;
      }).filter(Boolean);
      // Sorting the resulting list by tally number
      const sortedTally = tally.sort((a, b) => {
        if (a === null && b === null) return 0;
        if (a === null) return 1;  // push nulls to the end
        if (b === null) return -1;
        return b.number - a.number;
      });
      // Sorting high to low (Descending)
      const sortedNames = sortedTally
          .filter(item => item !== null)
            .map(item => item.name);
      // Assinging the displayed list to the new tally sorted list
      this.pathways=sortedNames;

      };

    // ---  Sorting Low DE Enzymes
    if (criteria == 'lowDGE'){
      console.log('Sorting Pathways by No. of DE Enzymes - Low to High');
      const pathwayTally = this.pathwayTally;
      let list = this.pathways;
      //console.log(list);
      let data = this.ALLpathwayData;
      //console.log(data);

      const result = this.AllKeggPathways.filter(item1 =>
        list.some(item2 => item2 === item1.name)
      );
      console.log(result);

      const tally = result.map(item => {
        const match = pathwayTally.find(([path]) => path === item.pathway);
        return match ? { name: item.name, number: match[1] } : null;
      }).filter(Boolean);

      // Sorting Low to high (ascending)
      const sortedTally = tally.sort((a, b) => {
        if (a === null && b === null) return 0;
        if (a === null) return 1;  // push nulls to the end
        if (b === null) return -1;
        return a.number - b.number;
      });

      const sortedNames = sortedTally
          .filter(item => item !== null)
            .map(item => item.name);
      // Assinging the displayed list to the new tally sorted list
      this.pathways=sortedNames;
    }
    // Closing Modal 
    this.sortDropdownOpen = false;
  }

  //  ------------------ EXPORTING -------------------
  
  exportSubmenuOpen = false;

  toggleExportSubmenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation(); 
    this.exportSubmenuOpen = !this.exportSubmenuOpen;
  }
  // Handles clicks on the submenu
  onSubmenuClick(event: MouseEvent) {
    event.stopPropagation(); 
  }

  @HostListener('document:click', ['$event'])
  // Listens for clicks outside the component
  onDocumentClick(event: MouseEvent) {
    // Close submenu if clicked outside
    if (this.exportSubmenuOpen) {
      this.exportSubmenuOpen = false;
    }

    if (this.searchSubmenuOpen) {
      this.searchSubmenuOpen = false;
    }

  }

  // Exporting the diagram as an image
  exportImage(format: string) {
    if (!this.myDiagram) return;
    
    const diagramBounds = this.myDiagram.documentBounds;
    const diagramWidth = diagramBounds.width;
    const diagramHeight = diagramBounds.height;
    
    const maxWidth = 13500; 
    const maxHeight = 2200;
    
    const scaleX = maxWidth / diagramWidth;
    const scaleY = maxHeight / diagramHeight;
    const scale = Math.min(scaleX, scaleY);
  
    const pathwayName = this.SelectedPathwayName || 'pathway';
    const timePointName = this.UploadedExpressionFiles[this.selectedTimeIndex]?.name || 'timepoint';
    
    const safePathwayName = pathwayName.replace(/\s+/g, '_').replace(/[^\w\-]/g, '');
    const safeTimePointName = timePointName.replace(/\s+/g, '_').replace(/[^\w\-]/g, '').replace(/\.(csv|txt)$/i, '');
    
    const fileName = `${safePathwayName}_${safeTimePointName}`;
    // For png format set background to white, scale to fit within maxWidth and maxHeight
    if (format === 'png') {
      const pngData = this.myDiagram.makeImageData({
        background: "white",
        scale: scale,
        maxSize: new go.Size(maxWidth, maxHeight),
        type: "image/png"
      });
      // if pngData is generated successfully, create a link and trigger download
      if (pngData) {
        const link = document.createElement('a');
        if (typeof pngData === 'string') {
          link.href = pngData;
        } else {
          console.error('Failed to generate PNG image as a string.');
          return;
        }
        link.download = `${fileName}.png`; 
        link.click();
      } else {
        console.error('Failed to generate PNG image.');
      }
    // For svg format set background to white
    } else if (format === 'svg') {
      const svg = this.myDiagram.makeSvg({
        scale: scale,
        background: 'white'
      });
      // if svg is generated successfully, create a link and trigger download
      if (svg) {
        const serializer = new XMLSerializer();
        const svgData = serializer.serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
  
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.svg`;
        link.click();
  
        URL.revokeObjectURL(url);
      } else {
        console.error('Failed to generate SVG image.');
      }
  
    } else {
      console.error(`Unsupported format: ${format}`);
    }
  }
  
  //  ------------------ UPLOADING -------------------

  // Same function as above for Newly Uploaded Files
  private updateEnzymeGenes(file: any[]): any[]{

    var geneEnzymes: any[] = []; // Use Set to avoid duplicates
    //var filteredSet: Set<any> = new Set()
    
    if (file && file.length > 0) {
      // Loop through the combined data to find EC numbers
      for (const item of file) {
        for (const key in item) {
          //console.log(key);
          var logfc;
          var gene;
          var ec;
          if (key.includes('_log2foldchange')&& item[key]){
            logfc = item[key];
          }

          if (key.includes("_enzyme.code") && item[key]) {
            ec = item[key];
            if (ec.startsWith("EC")){
                //ec = item[key];
                gene = item.gene
                geneEnzymes.push({
                  gene: gene,
                  logfc: logfc,
                  enzyme: ec
                })
            };
          }
        }
        
    }
  }
  return geneEnzymes;
}

  private updateFilterEnzymeGenes(filteredFiles:any[]):any[]{
  var filteredFiles_enzymes = [];
  for (let j=0; j<filteredFiles.length; j++){
    console.log(this.fileNames[j]);
    let geneEnzymes = filteredFiles[j];
    console.log(geneEnzymes);
    for (let i=0; i<geneEnzymes.length; i++){
      //console.log(geneEnzymes[i].enzyme);
      let ecNumber = geneEnzymes[i].enzyme;
      if (ecNumber.toUpperCase().startsWith('EC:')) {
        // Convert to lowercase and remove spaces
        ecNumber = ecNumber.replace(/\s+/g, '').toLowerCase();
        ecNumber = ecNumber.split("|");

      } else {
        // Add lowercase ec: prefix
        ecNumber = "ec:" + ecNumber;
      }

      for (let j=0; j<ecNumber.length; j++){
        var filteredEnzymes = [];
        //console.log(enzymes[j])
        //console.log(this.filterString(enzymes[j]));
        if (this.filterString(ecNumber[j]) == true)
          filteredEnzymes.push(ecNumber[j]);
          ecNumber = filteredEnzymes;

        }
        //console.log(ecNumber);
        geneEnzymes[i].enzyme = ecNumber;
    }
    //console.log(geneEnzymes);
    const filteredArray = geneEnzymes.filter((item: { enzyme: string | any[]; }) => {
      return item.enzyme && (!Array.isArray(item.enzyme) || item.enzyme.length > 0);
    });
    //console.log(filteredArray);
    filteredFiles_enzymes.push(filteredArray);
  }
  //console.log("Filteref out enzymes: "+ filteredFiles_enzymes[0]);
  return filteredFiles_enzymes;
}
// Process New Files
processNewFiles(): void{
    this.isLoading = true;
    this.LoadingMessage = 'Processing New Files...'

    console.log('Processing New Files');
    const originalData = this.filteredGenes;
    console.log('Original filtered Genes:');
    console.log(originalData);
    console.log('Original Number of Expression Files: ' +originalData.length);
    const allData = this.fileDataService.getMultipleCombinedArrays();
    console.log('Current Number of Expression Files: ' +allData.length);

    const fileNumber = (allData.length-originalData.length);
    console.log('Number of New Files: ' +fileNumber);
    const previousLength = this.filteredGenes.length;

    var filteredFiles = [];
    for (let i = previousLength; i<allData.length;i++){
      console.log('Processing New Data');
      const file = allData[i];
      const geneEnzymes = this.updateEnzymeGenes(file);
      filteredFiles.push(geneEnzymes)
    }

    const newFilteredGenes = this.updateFilterEnzymeGenes(filteredFiles);
    // this.UploadedExpressionFiles =  [...this.UploadedExpressionFiles, ...newFiles];

    //var newArray = originalData.push(newFilteredGenes);
    console.log('Adding New Filtered Data to Array');
    newFilteredGenes.forEach(item =>{
      this.filteredGenes.push(item);
    })
    
  }

  isUploadModalOpen: boolean = false;
  uploadedFiles: { name: string; file: File }[] = [];
  unsupportedFileTypeMessage: string = '';
  validationMessage: string = '';
  warningMessage: string = '';
  WrongFileAddedMessage: string = '';
  showFileList: boolean = false;

  // Open the modal when the 'Import files' button is clicked
  openUploadModal() {
    this.isUploadModalOpen = true;
  }

  // Close the modal when the 'X' button is clicked
  closeUploadModal() {
    this.isUploadModalOpen = false;
    this.uploadedFiles = []; // Clear uploaded files on close
    this.unsupportedFileTypeMessage = '';
    this.validationMessage = '';
    this.warningMessage = '';
    this.WrongFileAddedMessage = '';
    this.showFileList = false;
  }


  // Function to compare new and old list of pathways on upload of new files
  // Returns Simiar pathways, Removed Pathways, and Added Pathways 
  // Used to inform user of changed 
  comparePathways(oldPathways: string[], newPathways: string[]) {
    const similarities = oldPathways.filter(item => newPathways.includes(item));
    const oldItems = oldPathways.filter(item => !newPathways.includes(item));
    const newItems = newPathways.filter(item => !oldPathways.includes(item));
  
    return {
      similarities,
      oldItems,
      newItems
    };
  }


  // Trigger file input click
  onUploadClick(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true; // Allow multiple file selection

    // Trigger the click event
    fileInput.onchange = (event: any) => {
      const files: FileList = event.target.files; // Get the selected files

      // if files are selected, handle them
      if (files && files.length > 0) {
        this.handleFiles(files);
      }
    };

    fileInput.click();
  }

  // Handle the selected files
  private handleFiles(files: FileList): void {
    const validExtensions = ['txt', 'csv']; // Supported file types

    // Reset the warning messages each time files are uploaded
    this.unsupportedFileTypeMessage = '';
    this.validationMessage = '';
    this.warningMessage = '';
    this.WrongFileAddedMessage = '';

    const newFiles: { name: string; file: File }[] = [];

    // Loop through the selected files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split('.').pop()?.toLowerCase(); // Get the file extension
      // Check if the file extension is valid
      if (fileExtension && validExtensions.includes(fileExtension)) {
        newFiles.push({ name: file.name, file: file }); // Add the file to the new files array
      } else {
        this.unsupportedFileTypeMessage += `File "${file.name}" is not supported. Supported formats: ${validExtensions.join(', ')}<br>`; // Display unsupported file type message
      }
    }

    // Update the uploadedFiles array with the newly selected valid files
    this.uploadedFiles = [...this.uploadedFiles, ...newFiles];
    this.showFileList = this.uploadedFiles.length > 0; // Show the file list if files are uploaded
    // this.UploadedExpressionFiles =  [...this.UploadedExpressionFiles, ...newFiles];
  }

  // Remove a specific file from the uploadedFiles list
  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
    this.showFileList = this.uploadedFiles.length > 0;
  }

  showSummaryBox = false;
  summaryData = {
    newItems: [] as string[],
    oldItems: [] as string[],
    similarities: [] as string[],
  };
  
  // Add files
  addFiles() {
      if (this.uploadedFiles.length > 0) {
        console.log('Files to be added:', this.uploadedFiles);
  
        const validExtensions = ['txt', 'csv'];
        const expressionData: { [filename: string]: string[][] } = {};
  
        const dataLoadPromises = this.uploadedFiles.map(fileObj =>
          new Promise<void>((resolve, reject) => {
            const fileExtension = fileObj.name.split('.').pop()?.toLowerCase();
            if (!fileExtension || !validExtensions.includes(fileExtension)) {
              this.unsupportedFileTypeMessage = `File ${fileObj.name} is not supported.`;
              return reject();
            }
  
            const reader = new FileReader();
            reader.onload = (event: any) => {
              const content = event.target.result;
              const parsedData = parseFileContent(content, fileObj.name, fileExtension);
  
              if (!parsedData || parsedData.length === 0) {
                this.warningMessage = `File ${fileObj.name} is empty or invalid.`;
                return reject();
              }
  
              const fileType = identifyFileType(parsedData, fileObj.name);
              const shortName = (fileObj.name || '').replace(/\.[^/.]+$/, '');
  
              if (fileType === 'expression') {
                expressionData[shortName] = parsedData;
              } else {
                this.warningMessage = `File ${fileObj.name} must be an expression file.`;
                return reject();
              }
  
              resolve();
            };
  
            reader.onerror = () => {
              this.warningMessage = `Error reading file ${fileObj.name}.`;
              reject();
            };
  
            reader.readAsText(fileObj.file);
          })
        );
  
        Promise.all(dataLoadPromises).then(() => {
          const annotationData = this.fileDataService.getAnnotationData();
          const existingCombined = this.fileDataService.getMultipleCombinedArrays() || [];
  
          for (const [exprFilename, exprData] of Object.entries(expressionData)) {
            const headerExpr = exprData[0].map(h => h.toLowerCase());
            const geneIndexExpr = headerExpr.findIndex(col => col === 'gene');
            if (geneIndexExpr === -1) continue;
  
            const mergedGenes: any[] = [];
  
            for (let i = 1; i < exprData.length; i++) {
              const row = exprData[i];
              const gene = row[geneIndexExpr];
              const geneData: any = { gene };
  
              for (let j = 0; j < row.length; j++) {
                if (j !== geneIndexExpr && headerExpr[j]) {
                  geneData[`${exprFilename}_${headerExpr[j]}`] = row[j];
                }
              }
  
              for (const [annFile, annData] of Object.entries(annotationData)) {
                const headerAnn = annData[0].map(h => h.toLowerCase());
                const geneIndexAnn = headerAnn.findIndex(col => col === 'sequence.name' || col.includes('gene') || col === 'id');
                if (geneIndexAnn === -1) continue;
  
                const annRow = annData.find(row => row[geneIndexAnn] === gene);
                if (annRow) {
                  for (let k = 0; k < annRow.length; k++) {
                    if (k !== geneIndexAnn && headerAnn[k]) {
                      geneData[`${annFile}_${headerAnn[k]}`] = annRow[k];
                    }
                  }
                }
              }
  
              mergedGenes.push(geneData);
            }
  
            console.log(`Appended dataset for ${exprFilename}:`, mergedGenes);
            existingCombined.push(mergedGenes);
          }

          this.isLoading = true;
          this.LoadingMessage = 'Loading New File Data...' // Updating the User 


          const allCombined = existingCombined.flat();
          this.fileDataService.setCombinedData(allCombined);
          this.fileDataService.setMultipleCombinedArrays(existingCombined);
          console.log('All-files');
          const data = this.fileDataService.getMultipleCombinedArrays();

          // Updating timeslider 
          const timepoints = this.rangeFromOne(data);
          console.log('Timepoints: '+timepoints);
          this.timepoints = timepoints;
          
          console.log(data);
          console.log("Already Loaded Files");
          console.log(this.filteredGenes);
          
          console.log("Loading New Files")
          
          // Process Files -- update filteres Genes Array
          this.processNewFiles(); // Filter and Extract Enzymes

          const currentPaths = this.pathways;
          //console.log('Current Pathways: '+currentPaths);

          // REPROCESSING FILES TO GET ENZYMESS + PATHWAYS 
          // Processing Input Data - Match Genes and Extracting LogFc + EC numbers
          // This overrides all the processing done initally to update the pathway list + enzyme list 
          this.getEnzymeGenes();
          // Getting List of Enzymes from Input Data
          this.extractECNumbers();

          // Processing all enzymes:
          const postData = [this.enzymeList, this.pathwayNumber];
          this.enzymeApiServicePost.postEnzymeData(postData).subscribe(
            (response) => {
              // Overriding / updating lit of pathways including newly uploaded pathways 

              // Current Pathways before processing new files 
              console.log('Current Pathways:');
              console.log(currentPaths)

              console.log('Response from Backend:')
              console.log(response);
              //console.log(response[0]);
              //console.log(response[1]);
              this.pathwayTally = response[1];
              console.log('Pathway Tally');
              console.log(this.pathwayTally);
              // Handle the successful response
              this.pathwayData = response[0].paths;

              // Loading Pathway names -- for displaying to user
              this.loadNames();
              this.loadTally();

              // Comparing pathways to inform the user 
              console.log('Updated Pathways:');
              console.log(this.pathways)

              // Comparing pathway arrays to get the different pathways 
              const result = this.comparePathways(currentPaths,this.pathways);
              const similar = result.similarities; // Similar pathways 
              const oldItems = result.oldItems; // Pathways that have been removed
              const newItems = result.newItems; // Pathways that have been added

              console.log('Similar Pathways: ');
              console.log(similar)

              console.log('Pathways Removed: ');
              console.log(oldItems);

              console.log('Pathways Added: ');
              console.log(newItems);

              this.summaryData = {
                newItems,
                oldItems,
                similarities: similar,
              };
              this.showSummaryBox = true;
              

              console.log('Received from backend:', response);
              console.log('-----------------------------');
              console.log('Getting Mapping Data');
              this.getMapData(this.pathwayData);

              //this.filteredPathways = [...this.pathways];
              //this.ExpressionFileNames = this.UploadedExpressionFiles.map(file => file.name);

            },
            (error) => {
              // Handle errors
              console.error('Error:', error);
              this.isLoading = false; 

              //this.responseMessage = 'Error sending data';
            }
          );
          this.closeUploadModal(); // Close modal after merge
          
        }).catch(err => {
          console.warn('Failed to process added files:', err);
          this.unsupportedFileTypeMessage = 'Failed to process added files, make sure you are only uploading Expression Data';
        });
      } else {
        console.error('No files selected!');
      }
    }
  
  //  ------------------ HELP - GUIDE -------------------
  isFilterPathwayModalOpen = false;
  selectedGuideElement: GuideElement | null = null;
  maxTitleHeight = 0;
  
  // Guide Context
  guideElements: GuideElement[] = [
    {
      title: 'File Upload',
      preview: 'To upload upload annotation and expression files...',
      fullContent: `[[IMAGE_1]]
      <strong>Step 1: Upload Your Files</strong><br>
      Click the “Upload” button <strong>(A)</strong> to select your files. You need at least one expression file and one annotation file to proceed.<br>
      <strong>Supported file formats:</strong> .csv and .txt.<br><br>

      <strong>Step 2: Access Information</strong><br>
      You will also be displayed with the check information if the required files were uploaded or not <strong>(C)</strong><br>
      But if you're still unsure about which files to upload, click the information button <strong>(D)</strong> at the top-right corner for guidance.<br><br>

      <strong>Open Project</strong><br>
      To open a project, click the “Open Project” button <strong>(B)</strong>.<br>
      <li>This will open a pop-up window where you can select the project file to upload.</li>
      <li>Once selected, the project file will be uploaded and you will be redirected to Display Page.</li>

      [[IMAGE_2]]
      <strong>Step 3: Manage Uploaded Files</strong><br>
      Upon uploading, you'll see a list of all selected files separated in two groups - Annotaion File List <strong>(E)</strong> and Expression File List <strong>(F)</strong> .<br>
      <li>To remove a file from the list, click the x button <strong>(G)</strong> next to the file.</li>
      <li>To change an order of your time points, drag the expression file to the designed location and drop it. You will be able to change the order of the files later on as well.</li>
      <li>To add additional files, click the “Upload” button again. You can upload more files at any time.</li><br>

      <strong>Step 4: Configure Settings</strong><br>
      You will see three settings options:<br><br>

      <strong>Number of Top-Expressed Pathways:</strong><br>
      <li>Enter the desired number or adjust it using the up or down arrows <strong>(I)</strong>.</li><br>

      <strong>Organism Specification:</strong><br>
      <li>Choose whether to specify an organism. <em>(Note: This feature is not yet implemented.)</em></li><br>

      <strong>Time Series Data:</strong><br>
      <li>Indicate if your data includes time series analysis <strong>(H)</strong>.</li><br>

      <strong>Final Step: Process and Visualise</strong><br>
      Once all settings are configured, click the “Process” button <strong>(J)</strong> to generate visualisations of the KEGG pathways.`,
      imagePaths: ['assets/newImg/Upload1.png', 'assets/newImg/Upload2.png'],
    },
    
    {
      title: 'Manage Files, Imports and Exports',
      preview: 'To upload extra files, open/save projects or export a mapping view...',
      fullContent: `[[IMAGE_1]]
                    <h3>File Management: Upload Extra Expression Files, Remove Files and Reorder Timepoints</h3>                 
                    <strong>Step 1: Open File Manager</strong><br>
                    At the top bar, click the <strong>File</strong> button <strong>(A)</strong>.<br>
                    And then click Manage Files <strong>(B)</strong> which will desplay a File Manager Modal <br><br>
                    [[IMAGE_2]]

                    <strong>Step 2: Manage Files</strong><br>
                    Manage Files modal contains two lists - Uploaded Annoatnion files <strong>(G)</strong> and Uploaded Expression Files <strong>(H)</strong> for which you can:<br>
                    
                    <h4>Upload Extra Expression Files</h4>
                    Click <strong>+ Add Expression Files</strong> button. A pop-up window will appear, allowing you to upload additional expression files if needed.<br>
                    <li>You can import multiple expression files</li>
                    <li>The new Expression files will be added to the list of Expression files and marked as green <strong>(I)</strong> </li><br>
                    
                    <h4>Remove Expression Files</h4>
                    To remove files from the Expression List click the x button next to the file from the list <strong>(J)</strong>.<br>

                    <h4>Reorder Expression Files</h4>
                    To reorder the expression files, drag the file to the desired position in the expression list and drop.<br>
                    
                    <strong>Step 3: Save the Changes</strong><br>
                    Once you are satisfied with the list of files, click the <strong>Apply Changes</strong> button <strong>(M)</strong>.<br>
                    <li>This will reprocess the mapping and display the previously chosen number of top pathways from all expression files.</li>
                    
                    <h3>Open, Save and Start a Project</h3> 
                    
                    <h4>Open Project</h4>
                    
                    <strong>Step 1: Open Project</strong><br>
                    Click the <strong>File</strong> button <strong>(A)</strong> at the top bar.<br>
                    Then click the <strong>Open Project</strong> button <strong>(D)</strong>.<br>
                    
                    <strong>Step 2: Select Project File</strong><br>
                    A pop-up window will appear, allowing you to select the project file to upload.<br>
                    Once selected, the project file will be uploaded and you will be redirected to Display Page.<br>
                    
                    <h4>Save Project</h4>

                    <strong>Step 1: Save Project</strong><br>
                    Click the <strong>File</strong> button <strong>(A)</strong> at the top bar.<br>
                    Then click the <strong>Save Project</strong> button <strong>(E)</strong>.<br>
                    
                    <strong>Step 2: Specify Project Name</strong><br>
                    A pop-up window will appear, allowing you to set a project name to save the project file as.<br>
                    Once selected, the project file will be saved under chosen name into your <strong>Downloads</strong> folder.</li><br>
                    
                    <h4>Start New Project</h4>
                    
                    <strong>Step 1: Start New Project</strong><br>
                    Click the <strong>File</strong> button <strong>(A)</strong> at the top bar.<br>
                    Then click the <strong>New Project</strong> button <strong>(C)</strong>.<br>
                    
                    <strong>Step 2: Confirm New Project</strong><br>
                    A pop-up window will appear, asking you to confirm if you want to start a new project.<br>
                    <li>This will remove all previously uploaded files and settings.</li>
                    <li>Click <strong>Yes</strong> to proceed.</li>
                    <Li>You will be redirected to the upload page from where you can start a new.</li><br>

                    <h3>Export Pathway Visualisation</h3>     
                    
                    <strong>Step 1: Access Export Options</strong><br>
                    Go to the <strong>File</strong> menu at the top bar <strong>(A)</strong>.<br><br>

                    <strong>Step 2: Initiate Export</strong><br>
                    Click the <strong>Export</strong> button in the dropdown <strong>(F)</strong>.<br><br>

                    <strong>Step 3: Choose Export Format</strong><br>
                    <li>You will have two options to export the image: <strong>PNG</strong> and <strong>SVG</strong>.</li>
                    <li>Click your desired format.</li><br>`,
                   imagePaths: ['assets/newImg/TopBar1.png','assets/newImg/FileManagement.png']
    },
    {
      title: 'Customise / Search',
      preview: 'To Customise visualiastion and Search for elements...',
      fullContent: `[[IMAGE_1]]
                    <h3>Customise the Colours of Certain Nodes on the Display</h3>
                    <strong>Step 1: Access the View Options</strong><br>
                    Go to the <strong>View</strong> menu <strong>(A)</strong> at the top bar.<br><br>

                    <strong>Step 2: Open Customisation</strong><br>
                    Click the <strong>Customise</strong> button <strong>(B)</strong>.<br>
                    <li>This will open a tab on the left side of the website with customisation options.</li><br>
                    [[IMAGE_2]]
                    <strong>Step 3: Change Colours</strong><br>
                    You can change the colours of up or down regulated genes and Paralogs:<br>
                    <li>Click the coloured box <strong>(F)</strong> to open a colour picker.</li>
                    <li>Pick a desired colour from the colour picker.</li><br>

                    <strong>Final Step: Close the Colour Picker</strong><br>
                    Once satisfied with the colour choice, click outside the colour picker to close it.<br><br>

                    <strong>To Close the Customisation Tab:</strong>
                    Click the <strong>x</strong> button in the top right corner of the tab <strong>(H)</strong>.
                    
                    <h3>Search for Certain Elements in the Display</h3>

                    <strong>Step 1: Access the View Options</strong><br>
                    Go to the <strong>View</strong> menu <strong>(A)</strong> at the top bar.<br><br>

                    <strong>Step 2: Open Search Options</strong><br>
                    Click <strong>Search</strong> <strong>(C)</strong> and then <strong>Pathway Elements</strong> <strong>(D)</strong>.<br>
                    <li>This will open a tab on the left side of the website with search options.</li><br>
                    [[IMAGE_3]]
                    <strong>Step 3: Choose an Element Category</strong><br>
                    You will see three options: <strong>Enzyme</strong>, <strong>Compound</strong>, and <strong>Pathway</strong>.<br>
                    <li>Choose the option corresponding to the element you want to find within the current display.</li>
                    <li>Tick the box next to the desired option <strong>(I)</strong>.</li><br>

                    <strong>Step 4: Search for the Element</strong><br>
                    A drop-down box <strong>(J)</strong> will appear with a list of elements in the current pathway belonging to the selected category.<br>
                    <li>Scroll through the list to find the element you are looking for.</li>
                    <li>Click on the element to zoom into it in the Visualisation Display.</li><br>

                    <h3>Search for Pathway</h3>

                    <strong>Step 1: Access the View Options</strong><br>
                    Go to the <strong>View</strong> menu <strong>(A)</strong> at the top bar.<br><br>

                    <strong>Step 2: Open Search for Pathway</strong><br>
                    Click the <strong>Search</strong> button <strong>(C)</strong>, then click <strong>Pathway</strong> <strong>(E)</strong>.<br>
                    <li>This will open a pop-out with two tabs for searching pathways.</li><br>
                    [[IMAGE_4]]
                    <strong>Highlight Tab <strong>(K):</strong></strong><br>
                    <li>Displays a table listing all the pathways where uploaded expression files found hits.</li>
                    <li>See information on the total number of pathways and how many you have selected above the table.</li>
                    <li>To select pathways, click the tick boxes in the <strong>Select</strong> column of the table <strong>(L)</strong>. You can select multiple pathways. The grayed out pathway indicate pathways that are already within your display.</li>
                    <li>To unselect a pathway, click the tick box again.</li>
                    <li>Use the <strong>Select All</strong> and <strong>Clear All</strong> buttons <strong>(M)</strong> to quickly select or clear selections.</li>
                    <li>Once satisfied with your selections, click <strong>Search</strong> <strong>(N)</strong> to add these pathways to the end of the pathway list in the Side Bar.</li><br>
                    [[IMAGE_5]]
                    <strong>All KEGG Tab <strong>(O):</strong></strong><br>
                    <li>Allows searching for a pathway avaiable in KEGG API by typing the pathway name in the <strong>Search Pathway Box</strong> <strong>(U)</strong>.</li>
                    <li>A list of matching pathways to the search term will appear below the search box.<br>
                    <li>To add a pathway, click its name; it will be added to a list below the search box <strong>(P)</strong>.</li>
                    <li>You can add multiple pathways. To remove a pathway, click the <strong>x</strong> next to its name.</li>
                    <li>Once happy with the selection, click <strong>Search</strong> to add the pathways to the end of the pathway list in the Side Bar.</li><br>

                    <strong>Note:</strong><br>
                    1. The pop-out can be resized by dragging the bottom right corner for a more comfortable view of the table.<br>
                    2. Only one tab can be used at a time. Switching tabs will reset the selections in the closed tab.<br>
                    `,
        imagePaths: ['assets/newImg/TopBar2.png', 'assets/newImg/Customise.png', 'assets/newImg/SearchForElements.png', 'assets/newImg/SearchPatwayHighlight.png', 'assets/View_SearchForPathway_AllKEGG.png' ]
    },
    {
      title: 'Time Series',
      preview: 'Working with Time Series Data...',
      fullContent:
        `<strong>Working with Time Series Data</strong><br><br>

        If you have time series data, you can access tools to operate it at the bottom of the page, below the display.<br><br>
        [[IMAGE_1]]

        [[IMAGE_2]]
        <strong>Viewing Different Time Points</strong><br>
        <li>Use the <strong>slider</strong> <strong>(A)</strong> to move through different time points and see the display for each.</li><br>

        <strong>Creating a Timelapse</strong><br>
        - Click the <strong>Animate</strong> button <strong>(B)</strong> to create a timelapse of all the time points for a pathway.<br>
        - This will animate the display, showing all time points sequentially.<br>`,
        imagePaths: ['assets/newImg/TimeSliderPage.png','assets/newImg/TimeSlider.png']
    },
    {
      title: 'Display Interaction',
      preview: 'Display Interaction and Functionality...',
      fullContent:
        `<h3>Display Elements</h3>
        [[IMAGE_1]]
        <li><strong>Linked Pathway:</strong> Represented by the light blue rectangular box labeled <strong>(A)</strong>, this element serves as a gateway to another pathway
        visualisation. Clicking on this interactive element opens up a popout with a button that allows to navigate to related metabolic pathways</li>

        <li><strong>Enzyme: </strong> Rectangular boxes such as the one labeled <strong>(I)</strong>, enzymes are color-coded to reflect differential gene expression levels. The color
        spectrum transitions from in this case blue <strong>(C)</strong> for downregulation to red <strong>(B)</strong> upregulation (however it can be changed see Customisation
        section of this guide), indicating varying degrees of expression. Gray enzymes <strong>(I)</strong> signify neutral expression levels, indicating no significant change in gene
        activity. The legend <strong>(J)</strong> in the bottom corner provides a complete reference for interpreting these color variations. </li>

        <li><strong>Paralogs: </strong> Another boxes that is colour separated from the others are Paralogs <strong>(D)</strong> here represented in yellow as default however it can
        be changed in the Customisation section in View. (See Customisation section of this guide)</li>
        
        <li><strong>Compound:</strong> Illustrated by gray circles <strong>(E)</strong>, these elements represent metabolites or chemical compounds that participate in the
        biochemical reactions within the pathway.</li>

        <li><strong>Directionality:</strong> The flow and reversibility of reactions are indicated by arrows <strong>(K)</strong> and <strong>(L)</strong> along with distinctive line
        styles. Reversible reactions are represented by segmented lines, while irreversible reactions are depicted with solid straight lines. These directional indicators convey crucial
        information through both their color and size. The color reflects the differential expression of the associated genes, while the arrow size corresponds to the relative log2fold
        change magnitude of that particular pathway segment. As evidenced by arrows <strong>(K)</strong> and <strong>(L)</strong>, both colour intensity and arrow dimensions vary to
        represent different expression levels and fold changes between conditions.</li>

        <li><strong>Pathway Magnifier:</strong> You can zoom in if they click on the + or out if they on the - sign <strong>(G)</strong>(It is also possible to zoom in and zoom out using
        computer mouse). The feature labeled <strong>(H)</strong> functions as a navigation mini map, allowing to view the specific regions of interest within the pathway visualisation.
        This feature enhances the examination of complex pathway sections by providing detailed views of selected areas.</li>​

        [[IMAGE_2]]
        <li><strong>Annoation Popout:</strong> After clicking on any kind of node you will be displayed with a pop-out window that contains annoation and possibility of viewing that
        element within Kegg <strong>(M)</strong>. In case of pathway nodes, in addition you get an option to navigate to this pathway within the app by clikcing <strong>Launch</strong>
        button <strong>(N)</strong></li>`,
        imagePaths: ['assets/newImg/Display.png', 'assets/newImg/popout.png']
    },
    {
      title: 'Side Bar / Pathway Information',
      preview: 'Side Bar Functionality and Pathway Information...',
      fullContent:
        `<h3>Side Bar Functionality</h3>

        [[IMAGE_1]]
        The Side Bar, located on the left side of the website, displays a list <strong>(A)</strong> of top-expressed pathways. The number of pathways displayed depends on the number previously selected by the user.<br><br>
        <li>Under the Pathway title side bar displays the total number of pathways that had hits within users data</li>
        <li>Also by clicking <strong>See All</strong> button <strong>(C)</strong> it will open the modal with all the pathways (see more in <strong>Customise / Search -> Search for Pathway -> Highlight</strong> section of this guide ) </li>
        [[IMAGE_2]]

        <strong>Sorting Pathways</strong><br>
        <li>Click the <strong>Sort</strong> button <strong>(B)</strong> to open a dropdown menu with sorting options for the list.</li><br>

        <strong>Expanding and Collapsing the Side Bar</strong><br>
        <li>To collapse the Side Bar and expand the Display View, click the arrows at the top right corner <strong>(C)</strong>.</li>
        <li>To reopen the Side Bar, click the same arrows on the closed bar <strong>(D)</strong>.</li><br>
        [[IMAGE_3]]
        <strong>Managing Tabs within the Side Bar</strong><br>
        If the <strong>Search</strong> or <strong>Customisation</strong> tabs are added to the Side Bar:<br>
        <li>Switch between options by clicking either the icon or the section name. The section icon will be highlighted <strong>(E)</strong> indicating the current section.</li>
        <li>To close the Search or Customisation sections, click the <strong>x</strong> button <strong>(F)</strong> at the top right of each section.</li>
        <li>Closing a section will automatically revert to the Pathway section, which is the default view.</li>
        <li>Note: The Pathway section cannot be closed as it is the default view of the Side Bar.</li><br>

        <h3>Information about the Pathway</h3>
        [[IMAGE_4]]
        Below the display, information about the pathway is shown, including:<br>
        <li><strong>Name</strong></li>
        <li><strong>Contrast/Time Point</strong></li>
        <li><strong>Total number of genes</strong></li>
        <li><strong>Number of unique genes</strong></li>
        <li><strong>Number of affected enzymes</strong></li>`,
        imagePaths: ['/assets/newImg/SideBarPage.png', '/assets/newImg/SideBar1.png', '/assets/newImg/SideBar2.png', '/assets/newImg/InformationPage.png']
    },
  ];
  // Format the Guide context to be displayed as images and text
  splitContent(fullContent: string, imagePaths: string[] = []): { type: 'text' | 'image'; content: string }[] {
    const parts: { type: 'text' | 'image'; content: string }[] = [];
    const textParts = fullContent.split(/\[\[IMAGE_\d+\]\]/);
  
    textParts.forEach((textPart, index) => {
      if (textPart.trim()) {
        parts.push({ type: 'text', content: textPart.trim() });
      }
      if (imagePaths[index]) {
        parts.push({ type: 'image', content: imagePaths[index] });
      }
    });
  
    return parts;
  }
  
  // Open Guide section
  openGuideDetail(element: GuideElement) {
    this.selectedGuideElement = element;
  }
  // Close Guide section
  closeGuideDetail() {
    this.selectedGuideElement = null;
  }

  openFilterPathwayModal() {
    this.isFilterPathwayModalOpen = true;
  }

  closeFilterPathwayModal() {
    this.isFilterPathwayModalOpen = false;
  }

  // ------------------ UPLOADED FILES MODAL -------------------

  isUploadedFileModalOpen = false;

  draggedIndex: number | null = null;
  hoveredIndex: number | null = null;
  initialExpressionFiles: any[] = []; // Save the initial state
  remainingExpressionFiles: any[] = []; // Working list (after removal, reordering)
  filesMarkedForRemoval: any[] = []; // Files to remove

  // When opening modal, prepare data
  openUploadedFilesModal() {
    this.isUploadedFileModalOpen = true;
    this.initialExpressionFiles = [...this.UploadedExpressionFiles]; // Save original
    this.remainingExpressionFiles = [...this.UploadedExpressionFiles];
    this.filesMarkedForRemoval = [];
  }

  // Start dragging
  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex = index;
  }

  // Drag over
  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    this.hoveredIndex = index;
  }

  // Drop
  onDrop(event: DragEvent, index: number) {
    event.preventDefault();
    if (this.draggedIndex === null) return;

    const file = this.remainingExpressionFiles[this.draggedIndex];
    this.remainingExpressionFiles.splice(this.draggedIndex, 1);
    this.remainingExpressionFiles.splice(index, 0, file);

    this.draggedIndex = null;
    this.hoveredIndex = null;
  }

  // End dragging
  onDragEnd() {
    this.draggedIndex = null;
    this.hoveredIndex = null;
  }

  // Move file to removal list
  moveToRemove(file: File): void {
    const isNewUpload = this.newlyUploadedFiles.includes(file);
    if (isNewUpload) {
      // Just remove it completely
      this.remainingExpressionFiles = this.remainingExpressionFiles.filter(f => f !== file);
      this.newlyUploadedFiles = this.newlyUploadedFiles.filter(f => f !== file);
    } else {
      this.remainingExpressionFiles = this.remainingExpressionFiles.filter(f => f !== file);
      this.filesMarkedForRemoval.push(file);
    }
  }

  // Restore file back
  restoreFile(file: File): void {
    // Prevent duplicate restoration
    const alreadyExists = this.remainingExpressionFiles.some(f => f.name === file.name);
    if (!alreadyExists) {
      this.remainingExpressionFiles.push(file);
    }
    this.filesMarkedForRemoval = this.filesMarkedForRemoval.filter(f => f !== file);
  }

  // Apply all changes
  applyChanges() {
    this.skipInitProcessing = false;
    console.log('Applying changes to uploaded files');
    
    // Removed files
    const removedFiles = this.filesMarkedForRemoval.map(f => f.name);
    console.log('Removed files list:', removedFiles);

    // File format parser
    const properlyFormattedFiles = this.remainingExpressionFiles.map(file => {
      if (file.name && file.file instanceof File) {
        return file;
      }
      return {
        name: file.name,
        file: file,
      };
    });

    // List of current files
    const currentFiles = [...properlyFormattedFiles];
    // Names of already processed files
    const alreadyProcessedNames = this.initialExpressionFiles.map(f => f.name);
    // Names of new files to process
    const newFilesToProcess = currentFiles.filter(f => !alreadyProcessedNames.includes(f.name));

    // Check if the order of files has changed
    const initialWithoutRemoved = this.initialExpressionFiles
      .filter(f => !this.filesMarkedForRemoval.some(r => r.name === f.name))
      .map(f => f.name);

    // Newly added files
    const addedFiles = newFilesToProcess.map(f => f.name);
    // list of current files
    const currentNames = currentFiles.map(f => f.name);
    // Order initially
    const expectedOrder = [...initialWithoutRemoved, ...addedFiles];
    // Boolean to check if the order has changed
    const reorderChanged = !this.isSameOrder(expectedOrder, currentNames);

    // Display message to user
    // Check if any files were removed
    // Check if any files were added
    // Check if the order of files has changed
    let message = '';
    if (removedFiles.length > 0) {
      message += `You are about to remove these files:\n- ${removedFiles.join('\n- ')}\n\n`;
    }
    if (addedFiles.length > 0 && !reorderChanged) {
      message += `You have added these new files:\n- ${addedFiles.join('\n- ')}\n\n`;
    }
    if (reorderChanged) {
      message += `You have reordered the files.\n\n`;
    }

    if (message === '') {
      alert('No changes to apply.');
      this.closeUploadedFilesModal();
      return;
    }
    // Check with the user if they want to apply the changes
    const confirmed = window.confirm(message + 'Are you sure you want to apply these changes?');
    if (!confirmed) return;

    // Assign the current files to the initial expression files
    this.UploadedExpressionFiles = currentFiles;
    this.ExpressionFileNames = this.UploadedExpressionFiles.map(file => file.name);

    // Assign the current files to the uploaded files
    this.uploadedFiles = currentFiles;

    const validExtensions = ['txt', 'csv'];
    const expressionData: { [filename: string]: string[][] } = {};

    // Process the new files
    const dataLoadPromises = newFilesToProcess.map(fileObj =>
      new Promise<void>((resolve, reject) => {

        const fileExtension = fileObj.name.split('.').pop()?.toLowerCase();
        // Check if the file extension is valid
        if (!fileExtension || !validExtensions.includes(fileExtension)) {
          this.unsupportedFileTypeMessage = `File ${fileObj.name} is not supported.`;
          return reject();
        }    

        // Read the file content
        const reader = new FileReader();
        
        reader.onload = (event: any) => {

          const content = event.target.result;
          const parsedData = parseFileContent(content, fileObj.name, fileExtension);
          // Parse the file content
          // Check if the parsed data is valid and not empty
          if (!parsedData || parsedData.length === 0) {
            this.warningMessage = `File ${fileObj.name} is empty or invalid.`;
            return reject();
          }
          const fileType = identifyFileType(parsedData, fileObj.name);
          const shortName = (fileObj.name || '').replace(/\.[^/.]+$/, '');

          // Check if the file is an expression file
          if (fileType === 'expression') {
            expressionData[shortName] = parsedData;
          } else {
            this.warningMessage = `File ${fileObj.name} must be an expression file.`;
            return reject();
          }

          resolve();

        };

      // Handle file read error      
      reader.onerror = () => {
        this.warningMessage = `Error reading file ${fileObj.name}.`;
        reject();
      };
      reader.readAsText(fileObj.file);

  })
  );
  // Wait for all file processing to complete
  // Process the expression data and merge with annotation data
  Promise.all(dataLoadPromises).then(() => {

    // Get the annotation data
    const annotationData = this.fileDataService.getAnnotationData();
    console.log('Annotation data:', annotationData);
    // Get the existing combined data
    const existingCombined = this.fileDataService.getMultipleCombinedArrays() || [];
    console.log('Existing combined data:', existingCombined);
    // Placeholder for new combined data
    const newCombined: any[][] = [];

    // Iterate through the expression data
    for (const [exprFilename, exprData] of Object.entries(expressionData)) {
      const headerExpr = exprData[0].map(h => h.toLowerCase());
      const geneIndexExpr = headerExpr.findIndex(col => col === 'gene');
      // Check if the gene index is valid
      // If not, skip this file
      if (geneIndexExpr === -1) continue;
      
      // Iterate through the expression data rows
      const mergedGenes: any[] = exprData.slice(1).map(row => {
        const gene = row[geneIndexExpr];
        const geneData: any = { gene };
        // Iterate through the column data
        for (let j = 0; j < row.length; j++) {
          // Skip the gene index column
          // Add the data to the geneData object
          if (j !== geneIndexExpr && headerExpr[j]) {
            geneData[`${exprFilename}_${headerExpr[j]}`] = row[j];
          }
        }
        // Iterate through the annotation data
        for (const [annFile, annData] of Object.entries(annotationData)) {
          const headerAnn = annData[0].map(h => h.toLowerCase());
          const geneIndexAnn = headerAnn.findIndex(col => col === 'sequence.name' || col.includes('gene') || col === 'id');
          if (geneIndexAnn === -1) continue;

          const annRow = annData.find(row => row[geneIndexAnn] === gene);
          if (annRow) {
            for (let k = 0; k < annRow.length; k++) {
              if (k !== geneIndexAnn && headerAnn[k]) {
                geneData[`${annFile}_${headerAnn[k]}`] = annRow[k];
              }
            }
          }
        }
        return geneData;
      });
      // find the index of the file in the current files
      const fileIndex = currentFiles.findIndex(f => f.name.replace(/\.[^/.]+$/, '') === exprFilename);
      console.log('File index:', fileIndex);
      // add merged genes to the new combined data in the correct index
      newCombined[fileIndex] = mergedGenes;
    }

    // Map the current files to the new combined data
    const combined = currentFiles.map((f, i) => newCombined[i] || existingCombined.find((_, j) => this.initialExpressionFiles[j]?.name === f.name));
    
    // Set the combined data in the fileDataService
    this.fileDataService.setCombinedData(combined.flat());
    this.fileDataService.setMultipleCombinedArrays(combined);
    // Get the timepoints from the combined data
    this.timepoints = this.rangeFromOne(combined);
    console.log('Timepoints: '+ this.timepoints);
    console.log('Combined data:', combined);
    this.isLoading = true;
    this.LoadingMessage = 'Loading New File Data...';
    // Process the new files
    this.processNewFiles();
    // Get the Enzyme genes
    this.getEnzymeGenes();
    // Extract EC numbers
    this.extractECNumbers();
    // Current pathways
    const currentPaths = this.pathways;

    const postData = [this.enzymeList, this.pathwayNumber];
    this.enzymeApiServicePost.postEnzymeData(postData).subscribe(
      (response) => {
        // Update the pathways
        console.log('Updated Pathways:', response);
        this.pathwayTally = response[1];
        this.pathwayData = response[0].paths;

        this.loadNames();
        this.loadTally();
        // Compare the pathways
        const result = this.comparePathways(currentPaths, this.pathways);
        this.summaryData = {
          newItems: result.newItems,
          oldItems: result.oldItems,
          similarities: result.similarities,
        };
        this.showSummaryBox = true;
        // Get the map data
        this.getMapData(this.pathwayData);
      },
      (error) => {
        console.error('Error:', error);
        this.isLoading = false;
      }
    );
    // Close the modal
    this.closeUploadedFilesModal();
    }).catch(err => {
      console.warn('Failed to process added files:', err);
    });
  }

    // Helper: check if two arrays have same order
    isSameOrder(arr1: string[], arr2: string[]) {
      if (arr1.length !== arr2.length) return false;
      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
      }
      return true;
    }

    newlyUploadedFiles: File[] = [];
    
    // Handle file input
    handleFileInput(event: any): void {
      const files: FileList = event.target.files;
      const validNewFiles: File[] = [];
      // 
      for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        if (!file) continue;
    
        const isDuplicate =
          this.remainingExpressionFiles.some(f => f.name === file.name) ||
          this.newlyUploadedFiles.some(f => f.name === file.name);
    
        const isInRemovedList = this.filesMarkedForRemoval.find(f => f.name === file.name);
    
        if (isDuplicate) {
          console.warn(`File already exists: ${file.name}`);
          alert(`You have already uploaded this file: ${file.name}`);
          continue;
        }
    
        if (isInRemovedList) {
          // Remove from filesMarkedForRemoval and re-add to main list
          this.filesMarkedForRemoval = this.filesMarkedForRemoval.filter(f => f.name !== file.name);
          this.remainingExpressionFiles.push(file);
        } else {
          validNewFiles.push(file);
        }
      }
      console.log('Valid new files:', validNewFiles);
      this.remainingExpressionFiles = [...this.remainingExpressionFiles, ...validNewFiles];
      this.newlyUploadedFiles = [...this.newlyUploadedFiles, ...validNewFiles];
    }

    // Close modal
    closeUploadedFilesModal() {
      this.newlyUploadedFiles = [];
      this.isUploadedFileModalOpen = false;
    }

  // ------------------- NEW PROJECT subMenu -----------------
  // Open new project
  openUploadPage() {
    // Ask user for confirmation
    const confirmed = window.confirm(
      this.isProjectSaved
        ? 'Are you sure you want to close the current project?'
        : 'Are you sure you want to close the current project? All progress will be lost. Save your project before closing.'
    );
    // If confirmed, reset all project data and navigate to upload page
    if (confirmed) {
      this.resetAllProjectData();
      this.router.navigate(['/upload']);
    }
  }

  // Reset all project data
  resetAllProjectData(): void {
    // Clear file-related arrays
    this.UploadedAnnoationFiles = [];
    this.UploadedExpressionFiles = [];
    this.remainingExpressionFiles = [];
    this.filesMarkedForRemoval = [];
  
    // Reset flags and state
    this.skipInitProcessing = false;
    this.isProjectSaved = false;
    this.isLoading = false;
    this.LoadingMessage = '';
    this.warningMessage = '';
    this.unsupportedFileTypeMessage = '';
  
    // Reset expression and annotation data
    this.fileDataService.clearAnnotationData();
    this.fileDataService.clearExpressionData();
    this.fileDataService.clearCombinedData();
    this.fileDataService.clearMultipleCombinedArrays();
    this.fileDataService.clearUploadedExpressionFiles();
    this.fileDataService.clearUploadedAnnotationFiles();
    this.fileDataService.clearPathwayCount();
  
    // Reset individual project data fields
    this.pathwayResponse = [];
    this.pathwayNumber = 0;
    this.filteredGenes = [];
    this.enzymeList = [];
    this.ALLpathwayData = [];
    this.AllKeggPathways = [];
    this.pathwayTally = [];
    this.highlightedPathways = [];
    this.mapData = [];
    this.loadedPathwayData = [];
    this.pathways = [];
    this.colourArray = [];
    this.StatsArray = [];
    this.ExpressionFileNames = [];
    this.pathwayData = [];
  
    console.log('All project data has been reset.');
  }
  
  
  //  ------------------ VIEW TAB -------------------
  customTabOpen: boolean = false;
  customTabExists: boolean = false;
  searchTabOpen: boolean = false;
  searchTabExists: boolean = false;

  //  ------------------ CUSTOMISE subTAB -------------------

  // If we open customisation tab pathways tab closes and search tab if exists closes
  openCustomTab(): void {
    console.log('customTabOpen True');
    console.log('customTabExists True');
    this.customTabOpen = true;
    this.customTabExists = true;
    this.pathwaysOpen = false;
    if (this.searchTabExists){
      this.searchTabOpen = false;
    }
  }

  // If we close customisation tab pathways tab opens
  closeCustomTab(): void {
    this.customTabOpen = false;
    this.customTabExists = false;
    this.pathwaysOpen = true;
    if (this.searchTabExists){
      this.searchTabOpen = false;
    }
  }
  // Pathway open
  isPathwaysActive(): boolean {
    // If both exist and both are closed then make pathways active
    // If custom tab is closed and exists and search tab doesnt exist
    // If search tab closed and exist and custom tab doesnt exist
    return (!this.customTabOpen && this.customTabExists && !this.searchTabOpen && this.searchTabExists)|| (!this.customTabOpen && this.customTabExists && !this.searchTabExists) || (!this.searchTabOpen && this.searchTabExists && !this.customTabOpen);
  }
  // When Pathway tab was clicked
  showPathwaysFromIcon(event: Event): void {
    event.stopPropagation();
    this.customTabOpen = false;
    this.searchTabOpen = false;
    this.pathwaysOpen = true;
  }
  // If customisation tab existed but was hidden and then was clicked
  showCustomiseView(): void {
    this.customTabExists = true;
    this.customTabOpen = true;
    this.searchTabOpen = false;

    console.log('customTabExists true');
    console.log('customTabOpen true');
    console.log('pathwaysOpen false');

  }
  // Print Customisation Option
  selectCustomOption(): void {
    console.log('Customisation option selected');
  }

  // If we close customisation tab with "x" then pathway tab opens
  showPathways() {
    this.customTabOpen = false;
    this.searchTabOpen = false;
    this.pathwaysOpen = true;
  }
  // To open customisation tab
  isCustomiseOpen(): boolean {
    console.log('isCustomiseOpen() called');
    console.log('customTabOpen: ', this.customTabOpen);
    return this.customTabOpen;
  }


  //  ------------------ SEARCH subTAB -------------------

  // If we open search tab customisation tab closes and pathways tab if exists closes
  openSearchTab(): void {
    this.searchTabOpen = true;
    this.searchTabExists = true;
    this.customTabOpen = false;
    this.pathwaysOpen = false;
  }
  // If search tab closes pathway tab opens
  closeSearchTab(): void {
    this.searchTabOpen = false;
    this.searchTabExists = false;
    this.pathwaysOpen = true;
  }
  // If search tab open, pathway tab closes and customisation tab if exists closes
  showSearchView(): void {
    this.searchTabExists = true;
    this.searchTabOpen = true;
    this.pathwaysOpen = false;
    this.customTabOpen = false;

    console.log('customTabExists true');
    console.log('customTabOpen true');
    console.log('pathwaysOpen false');

  }
  // If search that exists, was closed but clicked on the tab
  showTabView(): void {
    this.searchTabExists = true;
    this.searchTabOpen = true;
    this.pathwaysOpen = false;
    this.customTabOpen = false;
  }
  // To open search tab
  isSearchOpen(): boolean {
    console.log('isSearchOpen() called');
    console.log('customTabOpen: ', this.searchTabOpen);
    return this.searchTabOpen;
  }

  //  ------------------ SEARCH TAB -------------------
  
  searchSubmenuOpen = false;

  toggleSearchSubmenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation(); 
    this.searchSubmenuOpen = !this.searchSubmenuOpen;
  }


  //  ------------------ POPULATE SELECT BOXES -------------------
  enzymeOptions: { ec: string; name: string; logfc?: number; colour?: string }[] = [];
  CompoundOptions: string[] = ['Value 1', 'Value 2', 'Value 3'];
  PathwayOptions: string[] = ['Pathway A', 'Pathway B', 'Pathway C'];
  
  selectedEnzyme: string = '';
  selectedCompound: string = '';
  selectedPathwayCustom: string = '';
  selectedEnzymeType: string = '';
  filteredEnzymeOptions: { ec: string, name: string }[] = [];
  
  showEnzymeDropdown: boolean = false;
  showCompoundDropdown: boolean = false;
  showPathwayDropdown: boolean = false;
  
  // Check which box was clicked and show the corresponding dropdown
  onCheckboxChange(checkboxName: 'enzyme' | 'compound' | 'pathway') {
    this.showEnzymeDropdown = false;
    this.showCompoundDropdown = false;
    this.showPathwayDropdown = false;
    
    if (checkboxName === 'enzyme') {
      this.showEnzymeDropdown = !this.showEnzymeDropdown;
    } else if (checkboxName === 'compound') {
      this.showCompoundDropdown = !this.showCompoundDropdown;
    } else if (checkboxName === 'pathway') {
      this.showPathwayDropdown = !this.showPathwayDropdown;
    }
    
    // Reset selected values when a different checkbox is selected
    if (!this.showEnzymeDropdown && checkboxName !== 'enzyme') {
      this.selectedEnzyme = '';
    }
    if (!this.showCompoundDropdown && checkboxName !== 'compound') {
      this.selectedCompound = '';
    }
    if (!this.showPathwayDropdown && checkboxName !== 'pathway') {
      this.selectedPathwayCustom = '';
    }
  }

  // when an enzyme node is clicked form the dropdown
  onEnzymeChange() {
    console.log('Selected enzyme:', this.selectedEnzyme);
    this.selectNodeFromDropdown(this.selectedEnzyme, 'enzyme');
  }  

  // when a compound node is clicked from the dropdown
  onCompoundChange() {
    console.log('Selected compound:', this.selectedCompound);
    this.selectNodeFromDropdown(this.selectedCompound, 'compound');
  }

  // when a pathway node is clicked from the dopdown
  onPathwayChange() {
    console.log('Selected pathway:', this.selectedPathwayCustom);
    this.selectNodeFromDropdown(this.selectedPathwayCustom, 'map');
  }  

  //  ------------------ ARROWS -------------------
  getArrowFontSize(logfc: number | undefined): string | null {
    if (logfc === undefined || logfc === null) {
      return null;
    }
    const absoluteLogfc = Math.abs(logfc);
    const fontSize = (absoluteLogfc % 5 + 1) + 'em';
    return fontSize;
  }

  // connected to the 'X' button in the popups. It closes the popups
  closePopup() {
    this.isPopupVisible = false;
  }

  // connected to the 'Launch' button inside the pathway popups
  goToPathwayFromPopup(nodeData: any): void {
    this.handleMapNodeClick(nodeData);

  }  

  // related to stopping scrolling event signal from being sent to gojs on the gene list in the popup 
  onGeneListScroll(event: WheelEvent | TouchEvent): void {
    event.stopPropagation();
  }  

  // connected to the button for zooming in
  zoomIn() {
    this.myDiagram?.commandHandler.increaseZoom();
  }
  
  // connected to the button for zooming out
  zoomOut() {
    this.myDiagram?.commandHandler.decreaseZoom();
  }

  //  ------------------ TIME SLIDER -------------------
  timepoints = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  selectedTimeIndex: number = 0;
  
  value: number = this.timepoints[this.selectedTimeIndex];
  
  // update the value when the timepoint changes
  updateValue(): void {
    this.value = this.timepoints[this.selectedTimeIndex];
    console.log('Uploaded Expression Files:', this.UploadedExpressionFiles);
    console.log('Timepoint changed');
    console.log('Getting Map for: ');
    const code = this.selectedPathway;
    console.log('Getting Map for: '+code);

    console.log('Resetting Pathway Data');
    const pathwayData = this.ALLpathwayData.find((obj => obj.pathway === code));
    console.log(pathwayData);
    this.setMap(code, this.selectedTimeIndex, pathwayData);

  }

  // Shorten the name of the ticks
  shortenFileName(name: string): string {
    if (name.length > 10) {
      return name.substring(0, 7) + '...';  
    }
    return name;
  }
  // Select time index
  selectTimeIndex(index: number) {
    this.selectedTimeIndex = index;
    this.updateValue(); 
  }
  // Remove file extension from the name
  removeFileExtension(fileName: string): string {
    return fileName.replace(/\.(csv|txt)$/i, '');
  }
  // Check if there are 3 or more files
  hasThreeOrMoreFiles(): boolean {
    return this.ExpressionFileNames.length >= 4;
  }
  // ------------------ ANIMATION ------------------

  isAnimationActive = false;
  
  toggleAnimation(): void {
    this.isAnimationActive = !this.isAnimationActive;
    if (this.isAnimationActive) {
      this.startAnimation();
    } else {
      this.stopAnimation();
    }
  }
  // -------- Delay function --------
  // Delay between each element in the loop 
  // Allows for pathway rendering 
  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  // ---- Animation looping with Delay -------------
  // Setting up Diagram Initialisation with Delay
  async loopWithDelay( links: any[], nodes: any[]): Promise<void> {
    // Number of loops to cycle through before stopping 
      
      // Looping through the maps (one for each timepoint)
      for (let i=0; i<this.UploadedExpressionFiles.length;i++){
        const timeNodes = nodes[i];
        // Updating the Diagram 
        this.currentLogFc = [];
        this.regulatedLinks = [];
        this.updateDiagram(timeNodes,links)
        if (this.myDiagram){
        this.clearAnimations(this.myDiagram);};
        
        await this.delay(2000);// 2 Second between pathway refresh (large pathays take a while to load)
        }
        this.isAnimationActive = false;
    
  }
  // Start the animation
  startAnimation(): void {
    console.log("Time lapse started");

    const name = this.SelectedPathwayName;
    const code = this.selectedPathway;
    console.log(name);
    const data = this.loadedPathwayData.find((obj => obj.pathway === name));
    console.log(data);

    // Clear Diagram
    this.currentLogFc = [];
    this.regulatedLinks = [];
    const emptylinks: any[] = [];
    const emptynodes: any[] = [];
    this.updateDiagram(emptynodes,emptylinks)
    
    const nodes = data.nodes;
    console.log(nodes);
    const pathwayData = this.ALLpathwayData.find((obj => obj.pathway === code));
    
    if (this.isAnimationActive==true){
      const links = pathwayData.edges;
      this.loopWithDelay(links, nodes); // setting up to loop 10 times before stopping 

      this.stopAnimation();
      this.isAnimationActive = false;
  }
    else{
      this.stopAnimation();
    }

  }

  // Stop the animation
  stopAnimation(): void {
    this.isAnimationActive = false;
    console.log("Time lapse stopped");
    const code = this.selectedPathway;
    const pathwayData = this.ALLpathwayData.find((obj => obj.pathway === code));
    this.setMap(code, this.selectedTimeIndex, pathwayData);
  }

  // ------------------ COLOUR PICKER -------------------
  selectedColorHigh: string = '#ff0000'; // Red 
  selectedColorLow: string = '#0000ff';  // Blue
  selectedColorIsoform: string = '#fff44f'; // Yellow
  
  // Taking High Expression Colour from User 
  // Reassiging the global variable
  // Reloading Pathway Data for animation
  onColorChangeHigh(event: Event): string {
    const input = event.target as HTMLInputElement;
    this.selectedColorHigh = input.value;
    console.log('High expression color:', this.selectedColorHigh);
    this.isLoading = true;
    this.LoadingMessage = 'Updating High Expression colour ...';
    this.getLoadedPathways(); // Reloading data with changed colours

    // Update the map with the new colour
    const pathwayData = this.ALLpathwayData.find(obj => obj.pathway === this.selectedPathway);
    if (pathwayData) {
      this.setMap(this.selectedPathway, this.selectedTimeIndex, pathwayData);
    }
    this.isLoading = false;
    return this.selectedColorHigh;
  }

  // Taking Low Expression Colour from User 
  // Reassiging the global variable
  // Reloading Pathway Data for animation
  onColorChangeLow(event: Event): string {
    const input = event.target as HTMLInputElement;
    this.selectedColorLow = input.value;
    console.log('Low expression color:', this.selectedColorLow);
    this.isLoading = true;
    this.LoadingMessage = 'Updating Low Expression colour ...';
    this.getLoadedPathways(); // Reloading data with changed colours
    
    // Update the map with the new colour
    const pathwayData = this.ALLpathwayData.find(obj => obj.pathway === this.selectedPathway);
    if (pathwayData) {
      this.setMap(this.selectedPathway, this.selectedTimeIndex, pathwayData);
    }

    this.isLoading = false;
    return this.selectedColorLow;
  }


  // Taking Paralog Colour from User 
  // Reassiging the global variable
  // Reloading Pathway Data for animation
  onColorChangeIsoform(event: Event): string {
    const input = event.target as HTMLInputElement;
    this.selectedColorIsoform = input.value;
    console.log('Isoform color:', this.selectedColorIsoform);
    this.isLoading = true;
    this.LoadingMessage = 'Updating Isoform colour ...';
    this.getLoadedPathways(); // Reloading data with changed colours
    
    // Update the map with the new colour
    const pathwayData = this.ALLpathwayData.find(obj => obj.pathway === this.selectedPathway);
    if (pathwayData) {
      this.setMap(this.selectedPathway, this.selectedTimeIndex, pathwayData);
    }

    this.isLoading = false;
    return this.selectedColorIsoform;
  }

  // ------------------ SEARCH BAR FOR PATHWAYS -------------------

  // Defining Attributes 
  searchTerm: string = '';
  filteredPathways: string[] = [];
  selectedPathways: string[] = [];
  selectedPathwaysKEGG: string[] = [];
  isDropdownOpen = false;
  isSearchPathwayModalOpen = false;

  // to handle open of the modal
  openSearchPathwayModal() {
    this.isSearchPathwayModalOpen = true;
    this.searchTerm = '';
    this.selectedPathways = [];
    this.selectedPathwaysKEGG = [];
    this.isDropdownOpen = false;
  }

  // to handle close of the modal
  closeSearchPathwayModal() {
    this.isSearchPathwayModalOpen = false;
  }

  // ----- Searhing ALL KEGG Pathways  ----
  
  openDropdown() {
    this.isDropdownOpen = true;
    this.filterPathways();
  }

  // Function to handle search
  filterPathways() {
    if(this.searchTerm == ''){
      this.filteredPathways = this.AllKeggPathways;
    }else{
      const term = this.searchTerm.toLowerCase();
      this.filteredPathways = this.AllKeggPathways.map(p => p.name).filter(name => name.toLowerCase().includes(term) && !this.selectedPathways.includes(name));
    }
  }

  // Function to handle selection of a pathway
  addPathway(pathway: string) {
    if (!this.selectedPathwaysKEGG.includes(pathway)) {
      this.selectedPathwaysKEGG.push(pathway);
    }
      this.searchTerm = '';
      this.isDropdownOpen = false;
      this.filterPathways();
  }
  
  // Function to remove a pathway from the selected list
  removePathway(pathway: string) {
    this.selectedPathwaysKEGG = this.selectedPathwaysKEGG.filter(p => p !== pathway);
    this.filterPathways(); 
  }

  // Function to handle click outside the dropdown
  onOutsideClick = (event: Event) => {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.search-input-wrapper');
  
    if (!clickedInside && this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }
  
  // when search button is clicked
  SearchForPathway() {
    // Getting pathways from 'highlighted' tab
    const selectedPathways = this.highlightedPathways.filter(p => p.selected);
    console.log('Selected pathways:', selectedPathways);
    var newSelectedPathways: any[] = [];
    selectedPathways.forEach(item => {
      newSelectedPathways.push(item.name)
    });

    // Getting pathways selected in All KEGG tab
    console.log('KEGG ALL: ', this.selectedPathwaysKEGG);

    // Combing the two pathways - one should be empty
    const combinedSearch = [...newSelectedPathways, ...this.selectedPathwaysKEGG];

    // Filtering against already loaded pathways 
    const filteredPathways = this.getMatches(combinedSearch);
    // Matching against All kegg pathways to get pathway codes in correct format
    const pathwayData = this.processPathways(filteredPathways);

    // Sending a Post request to the backend
    this.getMoreMapData(pathwayData);

    this.isSearchPathwayModalOpen = false; // close the modal
  }


 // ------- Search processing function -------

  // Compare to already loaded pathways, and remove any that match
  private getMatches(selectedPathwaysKEGG: any[]){
    var matchingList: any[] = [];
    // Checking if Pathway data is already loaded 
    selectedPathwaysKEGG.forEach(pathway=>{
        const matchingItems = this.ALLpathwayData.find((obj => obj.name === pathway));

        if (matchingItems){
          console.log('Match Found');
          matchingList.push(matchingItems.name);
        }else{
          console.log('No match found in Loaded Files');
          } 
      });
      // Remove matching Pathway --> only retrieve pathways that are not already loaded 

      const filteredArray = selectedPathwaysKEGG.filter(item => !matchingList.includes(item));
      console.log(filteredArray);
      return filteredArray;
  }

  // Process the selected pathways to get the correct format
  private processPathways(selectedPathwaysKEGG: any[]) {
    var pathwayData: any[] = [];
    console.log(selectedPathwaysKEGG);
    selectedPathwaysKEGG.forEach(pathway=>{
      let data = this.AllKeggPathways.find((obj => obj.name === pathway))
      console.log(data);
      pathwayData.push(data);
    });
    console.log(pathwayData);
    return pathwayData;
  }

  // Check if the pathway is already in the list
  isAlreadyInList(pathwayName: string): boolean {
    return this.pathways.includes(pathwayName);
  }

  // ---- To deal with the Highlighted Pathways selection in a Table ----
  activeTab: 'highlight' | 'all' = 'highlight';

  selectedHighlightPathway: any = null;

  // Select pathway
  onHighlightRowClick(pathway: any) {
    this.selectedHighlightPathway = pathway;
    console.log('Clicked Pathway:', pathway);
  }

  // Clear All ticked pathways
  clearAllSelections() {
    this.highlightedPathways.forEach(p => p.selected = false);
  }

  // Select All pathways
  selectAll(): void {
    this.highlightedPathways.forEach(pathway => pathway.selected = true);
  }

  // Get the count of selected pathways from the table
  get selectedHighlightedCount(): number {
    return this.highlightedPathways.filter(p => p.selected).length;
  }
  
  // Keep tract of a tab
  setActiveTab(tab: 'highlight' | 'all') {
  if (tab === 'highlight' && this.activeTab !== 'highlight') {
    // Clear KEGG All tab selections
    this.searchTerm = '';
    this.selectedPathways = [];
    this.selectedPathwaysKEGG = [];
    this.filteredPathways = [];
    this.isDropdownOpen = false;
  } else if (tab === 'all' && this.activeTab !== 'all') {
    // Clear Highlighted tab selections
    this.highlightedPathways.forEach(p => p.selected = false);
    this.selectedHighlightPathway = null;
  }

  this.activeTab = tab;
  }
  // remove the EC prefix from the pathway name
  removeEcPrefix(pathway: string): string {
    return pathway?.replace(/^ec/, '') || '';
  }

  // ---------- SAVE PROJECT -------------
  showModal = false;
  isProjectSaved: boolean =  false;

  openSaveModal() {
    this.showModal = true;
  }

  onSaveProject(projectName: string): void {

    this.isLoading = true;
    this.LoadingMessage = 'Saving Project...';
    this.showModal = false;
    this.isLoading = true;
    this.LoadingMessage = "Saving File";

  
    const zip = new JSZip();

    // Assigning each required file to a local variable
    // File Service files
    const multiData = JSON.stringify(this.fileDataService.getMultipleCombinedArrays());
    const combinedData = JSON.stringify(this.fileDataService.getCombinedData());
    const annoData = JSON.stringify(this.fileDataService.getAnnotationData());
    const expressData = JSON.stringify(this.fileDataService.getExpressionData());
    const pathways = JSON.stringify(this.fileDataService.getPathways());
    const pathwayCount = JSON.stringify(this.fileDataService.getPathwayCount());
    const uploadedexpressFiles = JSON.stringify(this.fileDataService.getUploadedExpressionFiles());
    const uploadedAnnoFile = JSON.stringify(this.fileDataService.getUploadedAnnoationFiles());

    // File Processing files from display.component
    const filteredGenes = JSON.stringify(this.filteredGenes);
    const enzymeList = JSON.stringify(this.enzymeList);
    const pathwayNumber = JSON.stringify(this.pathwayNumber);
    const  pathwayData = JSON.stringify(this.pathwayData);
    const AllKeggPathways = JSON.stringify(this.AllKeggPathways);
    const pathwayTally = JSON.stringify(this.pathwayTally);
    const highlightedPathways  = JSON.stringify(this.highlightedPathways);

    const MapData = JSON.stringify(this.mapData);
    const thispathways = JSON.stringify(this.pathways);
    const pathwayResponse = JSON.stringify(this.pathwayResponse);

    const allPathwayData = JSON.stringify(this.ALLpathwayData);
    const loadedPathwayData = JSON.stringify(this.loadedPathwayData);
    const colourArray = JSON.stringify(this.colourArray);
    const statsArray = JSON.stringify(this.StatsArray);

    const ExpressionFileNames = JSON.stringify(this.ExpressionFileNames);
    const enzymeCategories = JSON.stringify(this.enzymeCategories);
    const enzymeCategoryMap = JSON.stringify(this.enzymeCategoryMap);
    const compoundList = JSON.stringify(this.compoundList);
    const pathwayList = JSON.stringify(this.pathwayList);


    // Defining each file for the ZIP
    const projectFiles = [
      { name: 'multipleCombinedArray.txt', content: multiData },
      { name: 'combineData.txt', content: combinedData },
      { name: 'annoData.txt', content: annoData },
      { name: 'expressData.txt', content: expressData },
      { name: 'pathways.txt', content: pathways },
      { name: 'pathwayResponse.txt', content: pathwayResponse },
      { name: 'pathwayNumber.txt', content: pathwayNumber },
      { name: 'pathwayCount.txt', content: pathwayCount },
      { name: 'uploadedexpressFiles.txt', content: uploadedexpressFiles },
      { name: 'uploadedAnnoFile.txt', content: uploadedAnnoFile },
      { name: 'filteredGenes.txt', content: filteredGenes },
      { name: 'enzymeList.txt', content: enzymeList },
      { name: 'allPathwayData.txt', content: allPathwayData},
      { name: 'AllKeggPathways.txt', content: AllKeggPathways },
      { name: 'pathwayTally.txt', content: pathwayTally },
      { name: 'highlightedPathways.txt', content: highlightedPathways },
      { name: 'MapData.txt', content: MapData },
      { name: 'loadedPathwayData.txt', content: loadedPathwayData },
      { name: 'thispathways.txt', content: thispathways },
      { name: 'colourArray.txt', content: colourArray },
      { name: 'statsArray.txt', content: statsArray },
      { name: 'ExpressionFileNames.txt', content: ExpressionFileNames },
      { name: 'pathwayData.txt', content: pathwayData },
      { name: 'pathwayList.txt', content: pathwayList },
      { name: 'compoundList.txt', content: compoundList},
      { name: 'enzymeCategories.txt', content: enzymeCategories},
      { name: 'enzymeCategoryMap.txt', content: enzymeCategoryMap },
      
    ];
    console.log("Files transformed to file content ");

    // Adding each file to the ZIP
    projectFiles.forEach(file => {
      zip.file(file.name, file.content);
    });
    console.log("Generating ZIP ");
    zip.generateAsync({ type: 'blob' }).then(content => {
      saveAs(content, `${projectName}.zip`);
      this.isProjectSaved = true;
      this.isLoading = false;
    }).catch(err => {
      console.error('Error saving project:', err);
      alert('Failed to save project');
    });
    this.isLoading = false;

  }

  // ------------------ STATS BOX -------------------
  
  // Get the current timepoint label
  get currentTimepointLabel(): string {
    const file = this.ExpressionFileNames[this.selectedTimeIndex];
    return file ? this.removeFileExtension(file) : '';
  }
  
  // ------------------ OPEN PROJECT -------------------
  skipInitProcessing = false;

  openProject(): void {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.zip';
    
    // Set up the file input change event
    fileInput.onchange = async (event: Event) => {
      const input = event.target as HTMLInputElement;
      // If no files are selected, return
      if (!input.files || input.files.length === 0) return;
      
      // Get the selected file
      const zipFile = input.files[0];
      
      // Flag to skip onInit Processing
      this.skipInitProcessing = true;
      // Start Loading screen
      this.isLoading = true;
      this.LoadingMessage = 'Loading Project...';
      
      // Use JSZip to read the zip file
      try {
        console.time('zipLoad');
        const zip = await JSZip.loadAsync(zipFile);
        console.timeEnd('zipLoad');

        const fileContents: { name: string, content: string }[] = [];
        // Read all files in the zip
        console.time('zipParse');
        await Promise.all(
          // Iterate through all files in the zip
          Object.keys(zip.files).map(async (filename) => {
            const file = zip.files[filename];
            // Check if the file is not a directory
            if (!file.dir) {
              // push the file content to the array
              const content = await file.async('string');
              fileContents.push({ name: filename, content });
            }
          })
        );
        console.timeEnd('zipParse');
        // Load the project files into the fileDataService
        await this.projectLoaderService.loadProjectFiles(fileContents, this);
        
        this.isLoading = false;
        alert('Project loaded successfully');
        this.skipInitProcessing = false;
        this.isProjectSaved = true;
      } catch (err) {
        console.error('Failed to open project:', err);
        alert('Failed to open project file');
      }
    };
  
    fileInput.click();

  }
  
} 

