import { Component, ViewChild, ElementRef , HostListener, ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { enzymeApiServicePost } from '../services/kegg_enzymepathwaysPost.serice';
import * as go from 'gojs';
import { FileDataService } from '../services/file-data.service';
import { filter, first } from 'rxjs';
import { parseFileContent, identifyFileType } from '../helper/file-utils';
import {MatSliderModule} from '@angular/material/slider';
import { match } from 'assert';

interface GuideElement {
  title: string;
  fullContent: string;
}

export interface StatsArrayType {
  totalGenes: number;
  uniqueGenes: number;
  enzymesEffected: number;
}

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSliderModule],
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.css']
})

export class DisplayComponent {
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

  enzymePathwayList: string[] = [];

  filteredGenes: any[] = []; // Array of Genes, Logfc and EC number of combined Data 

  pathwayNumber: number = 10; // Hard Coded - but can add functionality for user to change this

  fileNames: any[] = [];

  pathwaySizeData: any[] = []; // Stores sorted files size data 

  loadedPathwayData: any[] = []; // Array for Storing Loaded Pathways (name, nodes (parallel to filtered Genes))

  colourArray: any[] = []; // Array for storing only the colours of nodes and corresponding key

  enzymeList: any[] = []; // Array for storing list of Enzymes filtered from input expression files

  pathwayTally: any[] = [];

  highlightedPathways: any[] = [];

  regulatedLinks: any[] = [];

  animatedParts: go.Part[] = []; // Store animated parts (dots)
  
  animatedIntervals: number[] = [];

  StatsArray: any[] = [];

  // Creating a GoJS Diagram 
  private myDiagram: go.Diagram | null = null;


  // the below is a part of blocker logic to make the popup not transparent
  // private activePopups: { nodeKey: any, blocker: go.Part }[] = [];

  // to track the number of popups
  private activePopups: { nodeKey: any }[] = [];

  // Creating the Back-end API Service 
  constructor(
    private enzymeApiServicePost: enzymeApiServicePost,
    private fileDataService: FileDataService,
    private cdr: ChangeDetectorRef
  ) {
    document.addEventListener('click', this.handleClickOutside.bind(this));
    document.addEventListener('click', this.onOutsideClick.bind(this));
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
  //console.log('filtered files: '+filteredFiles)
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
  const top100Names = sortedTally.slice(0, 750).map(entry => entry[0]);
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


// Getting line width realtive to logfc value of the enzyme ndoe
// Used to highlight metabolix flux
private getLineWidth(logfc: number, baseline = 3) {
  const difference = Math.abs(logfc - baseline);

  // Set min and max width values
  const minWidth = 3;
  const maxWidth = 15;

  // You can tweak this multiplier for scaling effect
  const scaleFactor = 2;

  let width = minWidth + difference * scaleFactor;

  // Clamp the width so it doesn't go beyond max
  width = Math.min(width, maxWidth);

  return width;
}


// ----------- Matching Genes to Enzyme Ndoes ----------------
// Called when changing Node information when map is selected/ timepoint changes 

// Mathing Enzyme Nodes to Enzymes present in Expression file selected 
// Changing Enzyme node colour based on LogFC if match is found
// Adding Genes to Enzyme node 

// TWO BRACNHES
// - 'No Size' - This does not changes node size -- required for Animation functionality (links dont move)
// - Other branch includes size change - this is called on demand when the user selects individual timepoints/ maps
//        Enhances node size for easier viewing -- Map link move in response 

// No Size Change
private matchGenesNoSize(genes: any[], nodes: any[]): any[] {
  // Matching Genes to Enzymes in Selected Map Data 

  var enzymeSet = new Set();
  var GeneSet = new Set();
  var allGenes = [];
  var colourArray = [];
  var stats = [];
  //console.log(genes);

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
        let logfc = genes[j].logfc; // Logfc Value 

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
        let mean = this.findMean(logfcList); // Calculating mean of Genes logfc
        let rgb = this.newlogfcToRGB(mean, this.selectedColorLow,this.selectedColorHigh); // Getting colout relative to logfc
        //let result = this.resizeNodeByLogFC(mean); // resizing node
        //let height = result[0];
        //let width = result[1];
        //newNodes[i].width = width; // Assign node attributes 
        //newNodes[i].height = height;
        newNodes[i].logfc = mean;
        newNodes[i].colour = rgb;
        newNodes[i].logfcList = logfcList;
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
  return [newNodes,colourArray, stats];
}

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
        let logfc = genes[j].logfc; // Logfc Value 

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
        //console.log(logfcList);
        let mean = this.findMean(logfcList); // Calculating mean of Genes logfc
        let rgb = this.newlogfcToRGB(mean, this.selectedColorLow,this.selectedColorHigh); // Getting colout relative to logfc
        let result = this.resizeNodeByLogFC(mean); // resizing node
        let height = result[0];
        let width = result[1];
        newNodes[i].width = width; // Assign node attributes 
        newNodes[i].height = height;
        newNodes[i].logfc = mean;
        newNodes[i].colour = rgb;
        newNodes[i].logfcList = logfcList;
      }
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

  return [newNodes,colourArray, stats];
}


// ----------- Processing Function Before Matching Nodes ----------------
// Takes nodes of selected Map 
// Gets relevant timepoint, retrieves annotated genes
// Both function indentical but call variations in matchGenes(NoSize) 
// Dependent on User interaction

// With Size Change - called when user selects individual pathways/timepoints
private compareEnzymes(nodes: any[],timepoint: number): any[]{
  //console.log("--------------------")
  //console.log('Extracting Logfc Data - Comparing to Enzymes');
  // Get Genes with logfc for the timepoint  (index this in future)
  const localNodes = nodes;
  //console.log("--------------------")
  //console.log('Selected Timepoint: '+timepoint);
  const genes = this.filteredGenes[timepoint];
  // Taking Genes from file and matching them to enzyme nodes 
  // Change enzyme node attributes accordingly 
  //console.log(genes);
  //console.log(localNodes);
  const elements = this.matchGenes(genes, localNodes)
  const updatedNodes = elements[0];
  const colourArray = elements[1];
  const stats = elements[2];
  this.StatsArray = elements[2];
  const finalNodes = this.getMultipleGenes(updatedNodes);
  return [finalNodes, colourArray, stats];
}
// No size change - called from getLoadedPathways
private compareEnzymesNoSize(nodes: any[],timepoint: number): any[]{
  console.log("--------------------")
  console.log('Extracting Logfc Data - Comparing to Enzymes');
  // Get Genes with logfc for the timepoint  (index this in future)
  const localNodes = nodes;
  console.log("--------------------")
  //console.log('Selected Timepoint: '+timepoint);
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

/*

private getIsoforms(nodes: any[]): any[]{
  console.log("--------------------")
  console.log('Finding Isoforms')

  var newNodes = nodes.map(node => ({ ...node }));
  //console.log(newNodes);
  // Looping through all the nodes
  for (let i = 0; i < newNodes.length; i++) {
    if (newNodes[i].type === 'enzyme' && (newNodes[i].gene)){
      const firstGenes = newNodes[i].gene;
      //console.log('First Genes:')
      //console.log(firstGenes);
      const key1 = newNodes[i].key;
      

      // Looping through list again to find matching gene entries 
      for (let j = 0; j < newNodes.length; j++) {
        if (newNodes[j].type === 'enzyme'&&(newNodes[j].gene) ) {
          const secondGenes = newNodes[j].gene;
          const key2 = newNodes[j].key;
          
          //console.log(firstGenes);
          //console.log('Second Genes:')
          //console.log(secondGenes);
          // Making sure that the nodes dont match to themselves 
          if (key1 != key2){
            /*
            for (const gene1 of firstGenes) {
              for (const gene2 of secondGenes) {
                if (gene1 === gene2) {
                  console.log("match:", gene1);
                  console.log(key1);
                  console.log(key2);
                  //matchFound = true;
                  }
                }
              }
             if (firstGenes==secondGenes){
              console.log("match:");
              console.log(key1);
              console.log(key2);
              console.log(firstGenes);
              console.log(secondGenes);
             }
            }


          }
          

        }
      }
  }
  return [];

}

*/


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

  console.log('Finding Paralogs...')

  var newNodes = nodes.map(node => ({ ...node }));
  //console.log(newNodes);
  // Looping through all the nodes
  for (let i = 0; i < newNodes.length; i++) {
    if (newNodes[i].type === 'enzyme' && (newNodes[i].gene)){
      const firstGenes = newNodes[i].gene;

      // If the list of Genes is greater than 1 and there is differential regulation direactionality
      if (firstGenes.length>1 && this.hasMixedSigns(newNodes[i].logfcList)==true){
        console.log(newNodes[i].logfcList);
        const key1 = newNodes[i].key;
        console.log('Changing Colour - Paralog with differential regulation directionality');
        newNodes[i].colour = this.selectedColorIsoform;

      }
    }
  }    
  return newNodes;

}



// ------------- METABOLIC FLUX - LINE WIDTHS -----------------
// Gets enzyme nodes that are impacted by genes and are not due to isoforms (by colour)
// Gets the node group key and finds 'from' links by match the key to the link key (e.g. Group: 76, Link 37R76)
// Ensures that 
// Extracts the logfc for that 

private getMetabolicFlux(nodes: any[], links: any[]){


  var newNodes = nodes.map(node => ({ ...node }));// Deep cloning Nodes and Links 
  var newLinks = links.map(link => ({ ...link}));
  var regulatedLink = [];
  for (let i = 0; i < newNodes.length; i++) {

    // Get all enzyme nodes that have been effected but not by isoforms (coloured yellow)
    if (newNodes[i].type === 'enzyme' && (newNodes[i].gene) && newNodes[i].colour != this.selectedColorIsoform){

      const key = newNodes[i].key;
      const colour = newNodes[i].colour;
      const logfc = newNodes[i].logfc;
      const rIndex = key.indexOf("R"); // Finding 'R' character in link key 
      if (rIndex !== -1) {
        const reactKey = key.substring(rIndex);
        //console.log(reactKey); 

        // Loop through links to get any that match with that reaction key
      for (let j = 0; j < newLinks.length; j++) { // Matching 'to' links
        if (newLinks[j].to == reactKey){
          //console.log('Match Found: (Link to) ');
          let category = newLinks[j].category;
          //console.log(category);

        }
        if (newLinks[j].from == reactKey){ // Matching 'from' links
          //console.log('Match Found: (Link from) ');
          let category = newLinks[j].category;
          //console.log(category);
          newLinks[j].colour = colour; // Adding new colour attribute to link 
          //const width = this.getLineWidth(logfc); // Calculating line width realtive to logFc
          //newLinks[j].size = width; // Assinging caluclated width to the link 
          regulatedLink.push(reactKey);
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
  this.regulatedLinks = regulatedLink;
  //console.log(newLinks);
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
  //console.log(pathwayData);
  
  
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
      //const genes = timepointData[j];
      //console.log('Genes to match: ');
      //console.log(genes);

      var elements = this.compareEnzymesNoSize(nodes,j);
      // Extract Colour and Nodes
      //console.log(elements)
      var updatedNodes = elements[0];
      var updatedEdges = this.getMetabolicFlux(updatedNodes,edges);
      //console.log(updatedEdges);

      var colours = elements[1];
      //console.log(colours);

      var stats = elements[2];
      //console.log(stats);
      
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
  //this.ALLpathwayData = response; // You might still want to keep this for reference

  console.log('--------- LoadMapData Finished -------');
}

  /** -------- Data Processing Functions -------- **/

  // Function for loading Names of each pathway that is fetched from the backend
  // Produces a list of pathway names to display in the menu
  loadNames(): void {
    console.log("--------------------")
    console.log('Processing Pathway Names');
    this.LoadingMessage = 'Processing Pathway Names...';
    this.pathways = this.pathwayData.map(pathway => pathway.name);
  }

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

  // -------------- Sending Pathway Request to Back-end ---------------------
  // Fetches relevant pathways when the Display component is initialised



// --------------- INITIAL FUNCTION - PROCESSING + POSTING -------------------
  // Display Initalisation Function - First Function called when Display.component is opened
  async ngOnInit(): Promise<void> {

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
    //console.log("Number of enriched pathways to return:")
    //console.log(this.pathwayNumber);

    // Setting up Data Array to send to back-end API
    // Sending list of enzymes (from ExtractECNUmber()) and Number of top pathways to get (e.g. 10))
    const data = [this.enzymeList, this.pathwayNumber];
    this.enzymeApiServicePost.postEnzymeData(data).subscribe(
      (response) => {
        console.log('Response from Backend:')
        console.log(response);
        //console.log(response[0]);
        //console.log(response[1]);
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
        // Handle errors
        console.error('Error:', error);
        this.isLoading = false; 

        //this.responseMessage = 'Error sending data';
      }
    );

    this.filteredPathways = [...this.pathways];
    

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
    
    const ALLpathwayData = response;
    this.pathwayResponse = response;
    this.ALLpathwayData = ALLpathwayData;
    //console.log(this.ALLpathwayData);

    // Loading Pathway Data to Loaded Pathway Array
    // Loads edited Nodes (logfc, genes, colour)
    this.getLoadedPathways();
    const loadedData = this.loadedPathwayData;
    //console.log(loadedData);
    console.log("--------------------")
    console.log('Pathway Data Loaded Successfully');
    this.isLoading = false;
    },
    (error) => {
      console.error('Error:', error);
      this.isLoading = false;
    });
  };

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

      console.log(this.ALLpathwayData);
      pathwayResponse.forEach(item => {
        this.ALLpathwayData.push(item);
      });

      console.log(this.ALLpathwayData);

      // Adding to list of names to display 
      console.log(this.pathways);
      pathwayResponse.forEach(item => {
        this.pathways.push(item.name);
      });
      console.log(this.pathways);

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
      this.isLoading = false;
      },
      (error) => {
        console.error('Error:', error);
        this.isLoading = false;
      });
    };
  
  

  /** --------  GET REQUEST Functions -------- **/


// -------------- Get REQUEST for all Pathway Names + Code --------------
// Does Get request for Pathway Names and asscoiated EC pathway codes
// Returns list after filtering against blacklist 

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
        //console.log(this.AllKeggPathways);
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

  }


  // --------------- Creating GO.js Model -------------------
  // Creating the First GoJS MAP
  // Creates the Diagram Template and initialises 
  createGoJSMap(nodes: any[], links: any[] ): void {

    this.activePopups = []; // resetting popup tracker for new diagram

    console.log("--------------------");
    console.log('Initialising Map');

    var $ = go.GraphObject.make;
  
  // Create the GoJS Diagram
    this.myDiagram = $(go.Diagram, "myDiagramDiv", {
    initialContentAlignment: go.Spot.Center,
    "undoManager.isEnabled": true,
    initialAutoScale: go.AutoScale.Uniform
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
          { margin: 5,
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
  
      // Arrowhead at the "to" end of the link (one-way arrow)
      $(go.Shape, 
        {
          toArrow: "Standard",  // Standard arrowhead at the end of the link
          stroke: null  // No border around the arrow
        }).bind('fill','colour'),
    )
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
      $(go.Shape, 
        {
          toArrow: "Standard",  // Standard arrowhead at the end of the link
          fill: "black",  // Set the color of the arrow to black
          stroke: null  // No border around the arrow
        }).bind('fill','colour'),
    )
  );
  
  // TEMPLATE FOR ENZYME NODES
    this.myDiagram.nodeTemplateMap.add("enzyme",  // Custom category for compound nodes
      new go.Node("Auto")  // Use Vertical Panel to place the label above the shape
        .add(
          new go.Shape("Rectangle").bind("fill","colour").bind("width").bind("height").bind('stroke').bind('strokeWidth','border')
        ).add(new go.TextBlock(
          { margin: 2,
            //font: "10px sans-serif",
            wrap: go.TextBlock.WrapFit,
          width: 80 })
          .bind("text")
          .bind("font", "", (node) => {
            const size = node.width; // Get the width of the node
            const result = Math.max(10, size * 0.1);
            const output = `${result}px sans-serif`;
            return output;  // Adjust the font size as 10% of the node's width (minimum size of 10)
        })
        )
    );

    // TEMPLATE FOR MAP NODES
    this.myDiagram.nodeTemplateMap.add("map",  // Custom category for compound nodes
      new go.Node("Auto",
        {
          click: (e: go.InputEvent, obj: go.GraphObject) => {
            const node = obj.part as go.Node;
            const data = node.data;
            this.handleMapNodeClick(data);
        }
      }
      ) 
        .add(
          new go.Shape("RoundedRectangle", {
            fill: "lightblue",
            width: 100,
            height: 60
          })
        ).add(new go.TextBlock(
          { margin: 2,
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



      // to make the nodes to show a pop up window when clicked
      this.myDiagram!.addDiagramListener("ObjectSingleClicked", (e) => {
        //const _this = this;
        const part = e.subject.part;
        if (!(part instanceof go.Node)) return;
      
        const node = part;
        const data = node.data || {};
        const key = data.key;
        const type = data.type || "unknown";
      
        // Prevent duplicate popups
        if (this.activePopups.find(p => p.nodeKey === key)) return;
      
        // Limit to 2 active popups
        if (this.activePopups.length >= 2) {
          const removed = this.activePopups.shift();
          const oldNode = this.myDiagram!.findNodeForKey(removed!.nodeKey);
          if (oldNode) oldNode.removeAdornment("popup");
        }
      
        // Emoji and color mappings
        const emojiMap: { [key: string]: string } = {
          enzyme: "🧬",
          compound: "⚗️",
          map: "🗺️",
          reaction: "🔁",
        };
        const colorMap: { [key: string]: string } = {
          enzyme: "#d4edda",      // Soft green
          compound: "#e6f0ff",    // Soft blue
          map: "#e2e3e5",         // Gray-blue
          reaction: "#fff3cd",    // Soft yellow
          unknown: "#f8d7da"      // Red/pink fallback
        };
      
        const emoji = emojiMap[type] || "❓";
        const bgColor = colorMap[type] || colorMap["unknown"];
        const title = `${emoji} ${type.toUpperCase()}`;
        const contentText = `KEY: ${data.key}\nTEXT: ${data.text ?? "?"}`;
      
        // Build the full popup box
        const box = go.GraphObject.make(go.Adornment, "Spot",
          {
            location: node.getDocumentPoint(go.Spot.Bottom),
            layerName: "Tool",
            opacity: 0,
            zOrder: 10 // higher value to keep the box infront of the blocker
          },
          go.GraphObject.make(go.Panel, "Auto",
            /*{
              pickable: true,
              isActionable: true,
            },*/
            go.GraphObject.make(go.Shape, "RoundedRectangle", {
              fill: bgColor,
              stroke: "#ccc",
              strokeWidth: 1,
              shadowVisible: true,
            }),
            
            /*go.GraphObject.make(go.TextBlock, "", {
              width: 1,
              height: 1,
              opacity: 0,
              isActionable: true,
              mouseDown: (e: go.InputEvent, obj: go.GraphObject) => {
                e.handled = true;
              }
            }),*/

            go.GraphObject.make(go.Panel, "Vertical",
              go.GraphObject.make(go.Panel, "Horizontal",
                {
                  background: "#e6f0ff",
                  padding: new go.Margin(4, 8, 4, 8)
                },
                go.GraphObject.make(go.TextBlock, title, {
                  font: "bold 12px sans-serif",
                  stroke: "#004080",
                  width: 120
                }),
                go.GraphObject.make(go.TextBlock, "✖", {
                  font: "bold 12px sans-serif",
                  stroke: "red",
                  cursor: "pointer",
                  isActionable: true,
                  margin: new go.Margin(4, 4, 0, 0),
                  click: (e, obj) => {
                    console.log("Clicked X"); // ✅ Checkpoint 1
                  
                    if (!obj || !obj.part) {
                      console.warn("No obj.part");
                      return;
                    }
                  
                    const adorned = (obj.part as go.Adornment).adornedPart;
                    if (!adorned) {
                      console.warn("No adornedPart");
                      return;
                    }
                  
                    const key = adorned.data?.key;
                    console.log("Closing for:", key); // ✅ Checkpoint 2
                  
                    adorned.removeAdornment("popup");
                    
                    /*
                    const popupRecord = this.activePopups.find(p => p.nodeKey === key);
                      if (popupRecord?.blocker) {
                        this.myDiagram!.remove(popupRecord.blocker);
                      }
                    */
                    this.activePopups = this.activePopups.filter(p => p.nodeKey !== key);

                    
                  }
                  
                })                
              ),
              go.GraphObject.make(go.TextBlock, contentText, {
                margin: 8,
                font: "12px 'Segoe UI', sans-serif",
                stroke: "#333"
              })
            )
          )
        );        
      
        node.removeAdornment("popup");
        /*
        const blockerShape = go.GraphObject.make(go.Shape, "Rectangle", {
          width: 160,
          height: 60,
          fill: "rgba(255, 0, 0, 0.2)",
          stroke: null,
          cursor: "default",
          isActionable: true,  // Enable interactivity
          click: (e: go.InputEvent, obj: go.GraphObject) => {
            e.handled = true;
            console.log("Blocker clicked, intercepting");
          }
        }); */
        
        /*
        const blocker = go.GraphObject.make(go.Part, "Auto",
          {
            location: node.getDocumentPoint(go.Spot.Bottom),
            layerName: "Tool",
            selectable: false,
            pickable: false,
            zOrder: 1 // lower value than in box to keep this behind the box
          },
          blockerShape
        );  */      
        

        box.adornedObject = node; // Link the popup to the node properly
        node.addAdornment("popup", box);
        //this.activePopups.push({ nodeKey: key ,blocker});
        this.activePopups.push({ nodeKey: key });


        // for making the popup essentially opaque
        //this.myDiagram!.add(blocker);
        //console.log("📍 Blocker added to diagram");


        const anim = new go.Animation();
        anim.duration = 300;
        anim.easing = go.Animation.EaseOutQuad;
        anim.add(box, "opacity", 0, 1);
        anim.add(box, "location", box.location.offset(0, -10), box.location);
        anim.start();
      });      
            
      this.myDiagram!.addDiagramListener("BackgroundSingleClicked", () => {
        this.myDiagram!.clearSelection();
        this.myDiagram!.nodes.each(n => n.clearAdornments());

        // now updates active popups
        this.activePopups = [];
      }); 

    var model = $(go.GraphLinksModel);
    model.nodeDataArray = nodes; 
    model.linkDataArray = links;
    // Assigning the model to the diagram for visualisation
    this.clearAnimations(this.myDiagram);
    this.myDiagram.model = model;
    this.setLegend(this.myDiagram);
    
    this.myDiagram.addDiagramListener("InitialLayoutCompleted", () => {
      if (this.myDiagram) {
        this.clearAnimations(this.myDiagram);
        this.animateLinksFromNodeKeys(this.myDiagram, this.regulatedLinks);
      }
    });
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
    // If diagram exists, clear it first
    console.log("--------------------");
    console.log('Changing Diagram');
    if (this.myDiagram) {
      // Diagram Exists - update the current one 
      console.log("--------------------");
      console.log('Diagram Exists')
      this.clearAnimations(this.myDiagram);
      this.myDiagram.model = new go.GraphLinksModel([], []);
      console.log('Diagram Data Cleared')
      this.updateDiagram(nodes,links);
      this.setLegend(this.myDiagram);
      this.myDiagram.addDiagramListener("InitialLayoutCompleted", () => {
        if (this.myDiagram) {
          this.clearAnimations(this.myDiagram);
          this.animateLinksFromNodeKeys(this.myDiagram, this.regulatedLinks);
        }
      });

    }else{
    // Create a new a Diagram with template
      this.createGoJSMap(nodes, links);}
      
  }


// ------------- Linked Map retrieval Function ----------------
// Handles clicking of map node of pathway data that is not already generated
// Makes new post request to backend with selected pathway code 
// Appends new pathway data to pathway list and data arrays 
// Pathway is added to end of list displayed to user and rendered on the screen

  private handleMapNodeClick(data: any): void {
    console.log("Clicked map node:", data);
    const pathCode = data.text;
    const code = pathCode.replace("path:", "");
    console.log(code);

    const matchingItems = this.ALLpathwayData.find((obj => obj.pathway === code));
    console.log(matchingItems);
    if (matchingItems){
      console.log('Match Found');
      console.log(matchingItems);
      this.setMap(code, this.selectedTimeIndex,matchingItems)
    }else{
      console.log('Searching all Kegg Pathways');
      const allMatch = this.AllKeggPathways.find((obj => obj.pathway === code));
      if (allMatch){
        console.log('Match found in All Kegg Pathways');
        console.log(allMatch);
        this.getSpecificPathway(allMatch);

      }else{
      console.log('No Match Found');

    }}
  }


// ----------- CREATING LEGEND for each map retrieval -------------
// Called each time a map is intialised / changed 
// Legend is updated with user-selected colours 
// Rendered in bottom left-hand corner of the Display Div

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

      // Node Type: Selected Upregulated Colour
      $(go.Panel, "Horizontal", { row: 4 },
        $(go.Shape, "Rectangle", { width: 15, height: 15, fill: this.selectedColorHigh, margin: 2 }),
        $(go.TextBlock, "High Expression", { margin: 2 ,font: "8pt sans-serif"})
      ),

      // Node Type: Selected Downregulated Colour
      $(go.Panel, "Horizontal", { row: 5 },
        $(go.Shape, "Rectangle", { width: 15, height: 15, fill: this.selectedColorLow, margin: 2 }),
        $(go.TextBlock, "Low Expression", { margin: 2,font: "8pt sans-serif"})
      ),

      // Node Type: Selected Isoform Colour
      $(go.Panel, "Horizontal", { row: 6 },
        $(go.Shape, "Rectangle", { width: 15, height: 15, fill: this.selectedColorIsoform, margin: 2 }),
        $(go.TextBlock, "Isoform", { margin: 2,font: "8pt sans-serif"})
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




    // Animation function
  animateLinksFromNodeKeys(diagram: go.Diagram, fromNodeKeys: string[]) {
    if (!diagram) return; // Return early if diagram is null or undefined
    this.clearAnimations(diagram);
    diagram.startTransaction("animate links"); // Start a transaction

    fromNodeKeys.forEach(fromKey => {
      const fromNode = diagram.findNodeForKey(fromKey);
      if (!fromNode) {
        console.warn(`❌ Node not found for key: ${fromKey}`);
        return;
      }

      const it = fromNode.findLinksOutOf();
      it.each((link: go.Link) => {
        const pointsCount = link.pointsCount;
        console.log(`Link from ${link.data?.from} to ${link.data?.to} has ${pointsCount} points`);
        if (pointsCount < 2) {
          console.warn(`⚠️ Link from ${link.data?.from} to ${link.data?.to} has insufficient points`);
        } else {
          this.animateAlongLink(diagram, link);
        }
      });
    });

    diagram.commitTransaction("animate links"); // Commit the transaction
  }
    /*
    // Function to animate the link
    animateAlongLink(diagram: go.Diagram, link: go.Link) {
      if (!link || link.pointsCount < 2) {
        console.warn("⚠️ Link is invalid or has insufficient points");
        return;
      }
  
      const shape = new go.Shape();
      shape.geometryString = "F1 M0 0 A5 5 0 1 1 9 0 A5 5 0 1 1 0 0"; // circle
      shape.fill = "green";
      shape.stroke = null;
      shape.width = 20;
      shape.height = 20;
  
      const part = new go.Part();
      part.layerName = "Foreground";
      part.locationSpot = go.Spot.Center;
      part.add(shape);
  
      diagram.add(part);
  
      const points: go.Point[] = [];
      link.points.each((pt: go.Point) => points.push(pt.copy()));
  
      let i = 0;
      const speed = 150;
  
      const animate = () => {
        i = 0;
    
        const interval = window.setInterval(() => {
          if (i >= points.length) {
            i = 0; // Reset to start
          }
    
          diagram.startTransaction("move shape");
          part.location = points[i];
          diagram.commitTransaction("move shape");
          i++;
        }, speed);
        this.animatedParts.push(part);
        this.animatedIntervals.push(interval);
      };
    
      animate(); // Start the animation
    }*/
   /*

      animateAlongLink(diagram: go.Diagram, link: go.Link) {
        if (!link || link.pointsCount < 2) {
          console.warn("⚠️ Link is invalid or has insufficient points");
          return;
        }
    
        // Clear previous animations before starting a new one
        //this.clearAnimations(diagram);
    
        // Create the shape (dot)
        const shape = new go.Shape();
        shape.geometryString = "F1 M0 0 A5 5 0 1 1 9 0 A5 5 0 1 1 0 0"; // Green circle
        shape.fill = "green";
        shape.stroke = null;
        shape.width = 20;
        shape.height = 20;
    
        // Create the part and add the shape to the diagram
        const part = new go.Part();
        part.layerName = "Foreground";
        part.locationSpot = go.Spot.Center;
        part.add(shape);
        part.category = "animation-dot";
    
        diagram.add(part);
    
        const points: go.Point[] = [];
        link.points.each((pt: go.Point) => points.push(pt.copy()));
    
        let i = 0;
        const speed = 200;
    
        // Animation function to move the dot along the path
        const animate = () => {
          const interval = window.setInterval(() => {
            if (i >= points.length) {
              i = 0; // Reset to start
            }
    
            diagram.startTransaction("move shape");
            part.location = points[i];
            diagram.commitTransaction("move shape");
            i++;
          }, speed);
    
          // Save the interval and part for cleanup
          this.animatedParts.push(part);
          this.animatedIntervals.push(interval);
        };
    
        animate(); // Start the animation
      }*/
        /*
        animateAlongLink(diagram: go.Diagram, link: go.Link) {
          if (!link || link.pointsCount < 2) {
            console.warn("⚠️ Link is invalid or has insufficient points");
            return;
          }
        
          const shape = new go.Shape();
          //shape.geometryString = "F1 M0 0 A5 5 0 1 1 9 0 A5 5 0 1 1 0 0"; // Green circle
          shape.geometryString = "F1 M0 0 L10 5 L0 10 Z"; // Arrow
          shape.fill = "green";
          shape.stroke = null;
          shape.width = 20;
          shape.height = 20;
          shape.angle = 0; 
        
          const part = new go.Part();
          part.layerName = "Foreground";
          part.locationSpot = go.Spot.Center;
          part.category = "animation-dot";
          part.add(shape);
          diagram.add(part);
        
          const rawPoints: go.Point[] = [];
          link.points.each(pt => rawPoints.push(pt.copy()));
        
          // Flatten the points into a list of segments
          const segments: { from: go.Point; to: go.Point; len: number }[] = [];
          let totalLength = 0;
          for (let i = 0; i < rawPoints.length - 1; i++) {
            const from = rawPoints[i];
            const to = rawPoints[i + 1];
            const len = Math.sqrt(from.distanceSquaredPoint(to));
            segments.push({ from, to, len });
            totalLength += len;
          }
        
          // Animation config
          const pixelsPerSecond = 400; // ← your visual speed
          const fps = 60; // smoothness
          const intervalTime = 1000 / fps; // ~16.66ms
          const pixelsPerFrame = (pixelsPerSecond / 1000) * intervalTime;
        
          let distance = 0;
        
          const interval = window.setInterval(() => {
            distance += pixelsPerFrame;
        
            // Wrap around
            if (distance > totalLength) distance = 0;
        
            // Find which segment the current distance falls into
            let distLeft = distance;
            let pos: go.Point | null = null;
        
            for (const seg of segments) {
              if (distLeft <= seg.len) {
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
        
            if (pos) {
              diagram.startTransaction("move shape");
              part.location = pos;
              diagram.commitTransaction("move shape");
            }
          }, intervalTime);
        
          this.animatedParts.push(part);
          this.animatedIntervals.push(interval);
        }*/
          animateAlongLink(diagram: go.Diagram, link: go.Link) {
            if (!link || link.pointsCount < 2) {
              console.warn("⚠️ Link is invalid or has insufficient points");
              return;
            }
          
            const shape = new go.Shape();
            shape.geometryString = "F1 M0 0 L10 5 L0 10 Z"; // Arrow
            shape.fill = "green";
            shape.stroke = null;
            shape.width = 30;
            shape.height = 30;
            shape.angle = 0;
          
            const part = new go.Part();
            part.layerName = "Foreground";
            part.locationSpot = go.Spot.Center;
            part.category = "animation-dot";
            part.add(shape);
            diagram.add(part);
          
            const rawPoints: go.Point[] = [];
            link.points.each(pt => rawPoints.push(pt.copy()));
          
            // Flatten the points into a list of segments
            const segments: { from: go.Point; to: go.Point; len: number }[] = [];
            let totalLength = 0;
            for (let i = 0; i < rawPoints.length - 1; i++) {
              const from = rawPoints[i];
              const to = rawPoints[i + 1];
              const len = Math.sqrt(from.distanceSquaredPoint(to));
              segments.push({ from, to, len });
              totalLength += len;
            }
          
            // Animation config
            const pixelsPerSecond = 400;
            const fps = 60;
            const intervalTime = 1000 / fps;
            const pixelsPerFrame = (pixelsPerSecond / 1000) * intervalTime;
          
            let distance = 0;
          
            const interval = window.setInterval(() => {
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
                // Compute direction angle
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
    
      // Function to clear existing animations
      clearAnimations(diagram: go.Diagram) {
        console.log("Clearing old animations...");
    
        // Clear all intervals (stop animations)
        this.animatedIntervals.forEach(id => clearInterval(id));
        this.animatedIntervals = [];
    
        // Remove all animation parts (dots) from the diagram
        this.animatedParts.forEach(part => {
          if (diagram.findPartForKey(part.key)) {
            diagram.remove(part);
          }
        });
        this.animatedParts = [];

        diagram.parts.each(part => {
          if (part.category === "animation-dot") {
            diagram.remove(part);
          }
        });
    
        console.log("All old animations cleared.");
      }


    
  

  
  
  





  isMenuOpen = true;
  pathwaysOpen = true;
  targetAnalysisOpen = false;

  exportOptions = ['PDF', 'CSV', 'JSON'];
  targets = ['Target 1', 'Target 2', 'Target 3'];
  
  selectedPathway: string = this.pathways[0];
  SelectedPathwayName: string = '';

  // @ViewChild('sliderLine') set sliderLineRef(sliderLineRef: ElementRef | undefined) {
  //   if (sliderLineRef) {
  //     this.sliderLine = sliderLineRef;
  //     this.initSliderLineListener();
  //   }
  // }

  // get selectedTimepoint() {
  //   return this.timepoints[this.selectedTimeIndex];
  // }

  // initSliderLineListener() {
  //   if (this.sliderLine) {
  //     this.sliderLine.nativeElement.addEventListener('click', (event: MouseEvent) => {
  //       this.updateTimeFromClick(event);
  //     });
  //   }
  // }

  /** --------  USER INTERACTION FUNCTIONS -------- **/

  // ------------------ PATHWAY SIDE BAR -------------------
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    if (!this.isMenuOpen) {
      this.closeAllDropdowns();
      this.sortDropdownOpen = false;
    }else {
      this.pathwaysOpen = true;
    }
  }

  closeAllDropdowns() {
    this.pathwaysOpen = false;
  }

  selectPathway(event: Event, pathway: string) {
    event.stopPropagation();
    this.SelectedPathwayName = pathway;
    console.log("--------------------");
    console.log(this.SelectedPathwayName);
    console.log('Selected:', pathway);
    const nameSelected = pathway;
    // Finding corresponding map code to pathway name
    const path = this.pathwayData.find(path => path.name === nameSelected);
    console.log('Corresponding Code: '+path.pathway)

    // Assinging code of pathway selected 
    this.selectedPathway = path.pathway;
    const code = path.pathway

    const pathwayData = this.ALLpathwayData.find((obj => obj.pathway === code));
    this.setMap(code, this.selectedTimeIndex, pathwayData);
  }

  // ------------------ SORT BY FUNCTIONALITY -------------------
  sortDropdownOpen = false;
  
  toggleSortDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.sortDropdownOpen = !this.sortDropdownOpen;
  }

  onSortClick(sortType: string) {
    console.log('onSortClick called with:', sortType); // Added console log
    this.sortPathways(sortType);
    this.sortDropdownOpen = false;
  }

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

  // Determining Pathway Size - Ranking complexity 
  // Called from sortPathways 
  pathwaySize(): any[]{
    let list = this.pathways;
    let data = this.ALLpathwayData;

    var pathwaysSize = [];
    for (let j=0;j<list.length;j++){
      //console.log(list[j]);
      let pathway = list[j];
      for (let i = 0; i< data.length;i++){
        //console.log(data[i].name);
        //console.log(data[i]);
        if (pathway == data[i].name){
          //console.log(data[i].enzymes);
          let enzymes = data[i].enzymes;
          let number = enzymes.length;
          //console.log(number);
          pathwaysSize.push({
            name: pathway,
            size: number,
          })
        }
      }
    }
    return pathwaysSize;
}

  // ------ SORTING PATHWAYS--------
  // Takes Criteria Selected from User (Drop Down Menu)
  sortPathways(criteria: string) {
    console.log(`Sorting by ${criteria}`);

    // Sort A-Z
    if (criteria == 'name'){
      // sorting A-Z
      let list = this.pathways;
      list = list.sort();
      console.log(list);
      this.pathways = list;
    }
    // Sort Z-A
    if (criteria == 'length'){
      let list = this.pathways;
      list = list.sort((a, b) => b.localeCompare(a));
      console.log(list);
      this.pathways = list;
    }

    // Sorting High to Low Pathway Size
    if (criteria == 'highComp'){
  
      var pathwaysSize = this.pathwaySize()
      pathwaysSize.sort((a, b) => b.size - a.size)
      let sortedNames = pathwaysSize.map(item => item.name);
      this.pathways = sortedNames;
      };

    // Sorting Low to High Pathway Size
    if (criteria == 'lowComp'){

      var pathwaysSize = this.pathwaySize()
      pathwaysSize.sort((a, b) => a.size - b.size);
      let sortedNames = pathwaysSize.map(item => item.name);
      this.pathways = sortedNames;
    }
    
    this.sortDropdownOpen = false;
  }


  // updateTimeFromClick(event: MouseEvent) {
  //   if (this.sliderLine) {
  //     const rect = this.sliderLine.nativeElement.getBoundingClientRect();
  //     const clickPosition = event.clientX - rect.left;
  //     const sliderWidth = rect.width;
  //     const timeIndex = Math.round((clickPosition / sliderWidth) * (this.timepoints.length - 1));

  //     if (timeIndex >= 0 && timeIndex < this.timepoints.length) {
  //       this.selectedTimeIndex = timeIndex;
  //       console.log(this.selectedTimeIndex);
  //     }
  //   }
  // }


  //  ------------------ EXPORTING -------------------
  
  exportSubmenuOpen = false;

  toggleExportSubmenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation(); 
    this.exportSubmenuOpen = !this.exportSubmenuOpen;
  }

  onSubmenuClick(event: MouseEvent) {
    event.stopPropagation(); 
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close submenu if clicked outside
    if (this.exportSubmenuOpen) {
      this.exportSubmenuOpen = false;
    }

    if (this.searchSubmenuOpen) {
      this.searchSubmenuOpen = false;
    }

  }

  exportImage(format: string) {
    if (!this.myDiagram) return;
  
    const diagramBounds = this.myDiagram.documentBounds; // Get the actual bounds of the diagram
    const diagramWidth = diagramBounds.width;
    const diagramHeight = diagramBounds.height;
  
    const maxWidth = 13500; 
    const maxHeight = 2200;

    // Calculate scale to fit the diagram within the maxSize while maintaining the aspect ratio
    const scaleX = maxWidth / diagramWidth;
    const scaleY = maxHeight / diagramHeight;
    const scale = Math.min(scaleX, scaleY);
  
    if (format === 'png') {
      const pngData = this.myDiagram.makeImageData({
        background: "white",
        scale: scale,  // Adjusted scale
        maxSize: new go.Size(maxWidth, maxHeight),
        type: "image/png"
      });
  
      if (pngData) {
        const link = document.createElement('a');
        if (typeof pngData === 'string') {
          link.href = pngData;
        } else {
          console.error('Failed to generate PNG image as a string.');
          return;
        }
        link.download = 'diagram.png';
        link.click();
      } else {
        console.error('Failed to generate PNG image.');
      }
  
    } else if (format === 'svg') {
      const svg = this.myDiagram.makeSvg({
        scale: scale,  // Adjusted scale
        background: 'white'
      });
  
      if (svg) {
        const serializer = new XMLSerializer();
        const svgData = serializer.serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
  
        const link = document.createElement('a');
        link.href = url;
        link.download = 'diagram.svg';
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

/*
  private updatePathways(newFilteredGenes: any[]): void{

  this.isLoading = true; 
  
  console.log('Extracting Enzymes');
  console.log('-----------------------------');
  // Extract Enzymes 
  const enzymes = this.updateExtractECNumbers(newFilteredGenes);
  //console.log(enzymes);
  console.log('Updating Pathway List');
  console.log('-----------------------------');

  // Sending Query to Kegg for new Enzymes
  const data = [enzymes, this.pathwayNumber];
  this.enzymeApiServicePost.postEnzymeData(data).subscribe(
    (response) => {
      // Handle the successful response
      const pathways = response;

      console.log('Received from backend:', response);
      console.log('-----------------------------');
      console.log(this.pathwayData); // Existing pathways 

      // Comparing Existing to New Pathways 
      const uniquePathways = this.getNewPathways(pathways, this.pathwayData);

      //console.log(uniquePathways);
      if (uniquePathways){
        console.log(uniquePathways);
        // RE-RUN PATHWAY REQUEST??
        // COMPLETELY RE-LOAD PATHWAY DATA??

        // LOAD NEW TIMEPOINT DATA

      }else{
        console.log('No Unique Pathways -- Pathway List Preserved');
        // LOAD NEW TIMEPOINT DATA
      }
      this.isLoading = false; 
      // Compare New Pathway List to existing pathways 
    },
    (error) => {
      // Handle errors
      console.error('Error:', error);
      this.isLoading = false; 

      //this.responseMessage = 'Error sending data';
    }
  );
}*/

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
      //console.log("New Data:", allData[i]);
      console.log('Processing New Data');
      const file = allData[i];
      const geneEnzymes = this.updateEnzymeGenes(file);
      filteredFiles.push(geneEnzymes)
    }

    const newFilteredGenes = this.updateFilterEnzymeGenes(filteredFiles);
    //var newArray = originalData.push(newFilteredGenes);
    console.log('Adding New Filtered Data to Array');
    //console.log(newArray);
    newFilteredGenes.forEach(item =>{
      this.filteredGenes.push(item);
    })
    //console.log(this.filteredGenes);
    
  }

  isUploadModalOpen: boolean = false;
  uploadedFiles: { name: string; file: File }[] = [];
  unsupportedFileTypeMessage: string = '';
  validationMessage: string = '';
  warningMessage: string = '';
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
  }

  // Remove a specific file from the uploadedFiles list
  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
    this.showFileList = this.uploadedFiles.length > 0;
  }

  // Add files
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

              console.log('Received from backend:', response);
              console.log('-----------------------------');
              console.log('Getting Mapping Data');
              this.getMapData(this.pathwayData);

            },
            (error) => {
              // Handle errors
              console.error('Error:', error);
              this.isLoading = false; 

              //this.responseMessage = 'Error sending data';
            }
          );
          this.closeUploadModal(); // Close modal after merge

          //this.isLoading = false;
        }).catch(err => {
          console.warn('Failed to process added files:', err);
        });
      } else {
        console.error('No files selected!');
      }
    }
  

  //  ------------------ HELP - GUIDE -------------------
  isFilterPathwayModalOpen = false;
  selectedGuideElement: GuideElement | null = null;
  maxTitleHeight = 0;

  guideElements: GuideElement[] = [
    {
      title: 'File Upload',
      fullContent: `To upload a file, click the Upload button and select your file.
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
      fullContent: `The pathway display offers various interactivity for the user:
- Click on nodes to see detailed information.
- Use the zoom feature to navigate through the pathways.
- Use the search feature to find specific enzymes, compounds or pathways.
- Customise the colours of the gene expression levels.
- The download feature allows you to save the current view as an image.
- If you have a time series data, you can see the changes in the expression levels over time.`,
    },
    {
      title: 'Files',
      fullContent: `At the top of the page in the File section, you will be able to:
- Upload more files.
- Export the current view as an image in svg or png formats.`,
    },
    {
      title: 'View',
      fullContent: `At the top of the page in the View section, you will be able to:
- In Search: Find specific enzymes, compounds or pathways by picking it from a drop down list.
- In Customise: Change the colour of expression of the genes by picking them from a colour picker.`,
    },
    {
      title: 'Time Series',
      fullContent: '',
    },
  ];

  openGuideDetail(element: GuideElement) {
    this.selectedGuideElement = element;
  }

  closeGuideDetail() {
    this.selectedGuideElement = null;
  }

  applyGuide() {
    console.log('Guide Applied');
    this.closeFilterPathwayModal();
  }

  openFilterPathwayModal() {
    this.isFilterPathwayModalOpen = true;
  }

  closeFilterPathwayModal() {
    this.isFilterPathwayModalOpen = false;
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

  isPathwaysActive(): boolean {
    // If both exist and both are closed then make pathways active
    // If custom tab is closed and exists and search tab doesnt exist
    // If search tab closed and exist and custom tab doesnt exist
    return (!this.customTabOpen && this.customTabExists && !this.searchTabOpen && this.searchTabExists)|| (!this.customTabOpen && this.customTabExists && !this.searchTabExists) || (!this.searchTabOpen && this.searchTabExists && !this.customTabOpen);
  }

  showPathwaysFromIcon(event: Event): void {
    event.stopPropagation();
    this.customTabOpen = false;
    this.searchTabOpen = false;
    this.pathwaysOpen = true;
  }

  showCustomiseView(): void {
    this.customTabExists = true;
    this.customTabOpen = true;
    this.searchTabOpen = false;

    console.log('customTabExists true');
    console.log('customTabOpen true');
    console.log('pathwaysOpen false');

  }

  selectCustomOption(): void {
    console.log('Customisation option selected');
  }

  
  showPathways() {
    this.customTabOpen = false;
    this.searchTabOpen = false;
    this.pathwaysOpen = true;
  }

  isCustomiseOpen(): boolean {
    console.log('isCustomiseOpen() called');
    console.log('customTabOpen: ', this.customTabOpen);
    return this.customTabOpen;
  }


  //  ------------------ SEARCH subTAB -------------------

  openSearchTab(): void {
    this.searchTabOpen = true;
    this.searchTabExists = true;
    this.customTabOpen = false;
    this.pathwaysOpen = false;
  }
  closeSearchTab(): void {
    this.searchTabOpen = false;
    this.searchTabExists = false;
    this.pathwaysOpen = true;
  }

  showSearchView(): void {
    this.searchTabExists = true;
    this.searchTabOpen = true;
    this.pathwaysOpen = false;
    this.customTabOpen = false;

    console.log('customTabExists true');
    console.log('customTabOpen true');
    console.log('pathwaysOpen false');

  }

  showTabView(): void {
    this.searchTabExists = true;
    this.searchTabOpen = true;
    this.pathwaysOpen = false;
    this.customTabOpen = false;
  }

  isSearchOpen(): boolean {
    console.log('isSearchOpen() called');
    console.log('customTabOpen: ', this.searchTabOpen);
    return this.searchTabOpen;
  }

  //  ------------------ SEARCH SUBSECTIONS -------------------
  
  searchSubmenuOpen = false;

  toggleSearchSubmenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation(); 
    this.searchSubmenuOpen = !this.searchSubmenuOpen;
  }




  //  ------------------ POPULATE SELECT BOXES -------------------
  // MOCK DATA
  enzymeOptions: string[] = ['Enzyme A', 'Enzyme B', 'Enzyme C'];
  CompoundOptions: string[] = ['Value 1', 'Value 2', 'Value 3'];
  PathwayOptions: string[] = ['Pathway A', 'Pathway B', 'Pathway C'];
  
  selectedEnzyme: string = '';
  selectedCompound: string = '';
  selectedPathwayCustom: string = '';
  
  showEnzymeDropdown: boolean = false;
  showCompoundDropdown: boolean = false;
  showPathwayDropdown: boolean = false;
  
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

  onEnzymeChange() {
    console.log('Selected enzyme:', this.selectedEnzyme);
  }

  onCompoundChange() {
    console.log('Selected compound:', this.selectedCompound);
  }

  onPathwayChange() {
    console.log('Selected pathway:', this.selectedPathwayCustom);
  }


  //  ------------------ TIME SLIDER -------------------
  timepoints = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  selectedTimeIndex: number = 0;
  
  value: number = this.timepoints[this.selectedTimeIndex];

  updateValue(): void {
    this.value = this.timepoints[this.selectedTimeIndex];
    console.log('Timepoint changed');
    console.log('Getting Map for: ');
    const code = this.selectedPathway;
    console.log('Getting Map for: '+code);

    console.log('Resetting Pathway Data');
    const pathwayData = this.ALLpathwayData.find((obj => obj.pathway === code));
    console.log(pathwayData);
    this.setMap(code, this.selectedTimeIndex, pathwayData);

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

  // Delay between each element in the loop 
  // Allows for pathway rendering 
  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  async loopWithDelay( links: any[], nodes: any[]): Promise<void> {
    // Number of loops to cycle through before stopping 
    
      // Looping through the maps (one for each timepoint)
      for (let i=0; i<this.timepoints.length;i++){
        const timeNodes = nodes[i];
        // Updating the Diagram 
        this.updateDiagram(timeNodes,links)
        
        await this.delay(1250);// 1 Second between pathway refresh (large pathays take a while to load)
        }
    
  }

  startAnimation(): void {
    console.log("Time lapse started");

    const name = this.SelectedPathwayName;
    const code = this.selectedPathway;
    console.log(name);
    const data = this.loadedPathwayData.find((obj => obj.pathway === name));
    console.log(data);
    
    const nodes = data.nodes;
    console.log(nodes);
    const pathwayData = this.ALLpathwayData.find((obj => obj.pathway === code));

    if (this.isAnimationActive==true){
    const links = pathwayData.edges;
    this.loopWithDelay(links, nodes); // setting up to loop 10 times before stopping 
    //this.isAnimationActive = false;

    this.stopAnimation();
  }
    else{
      this.stopAnimation();
    }

  }

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
    this.isLoading = false;
    return this.selectedColorLow;
  }

  onColorChangeIsoform(event: Event): string {
    const input = event.target as HTMLInputElement;
    this.selectedColorIsoform = input.value;
    console.log('Isoform color:', this.selectedColorIsoform);
    this.isLoading = true;
    this.LoadingMessage = 'Updating Isoform colour ...';
    this.getLoadedPathways(); // Reloading data with changed colours
    this.isLoading = false;
    return this.selectedColorIsoform;
  }

  // ------------------ SEARCH BAR FOR PATHWAYS -------------------

  searchTerm: string = '';
  filteredPathways: string[] = [];
  selectedPathways: string[] = [];
  selectedPathwaysKEGG: string[] = [];
  isDropdownOpen = false;

  // to handle open and close of the modal
  isSearchPathwayModalOpen = false;

  openSearchPathwayModal() {
    this.isSearchPathwayModalOpen = true;
    this.searchTerm = '';
    this.selectedPathways = [];
    this.selectedPathwaysKEGG = [];
    this.isDropdownOpen = false;
  }

  closeSearchPathwayModal() {
    this.isSearchPathwayModalOpen = false;
  }

  // ----- KEEG ALL ----
  
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

  addPathway(pathway: string) {
    if (!this.selectedPathwaysKEGG.includes(pathway)) {
      this.selectedPathwaysKEGG.push(pathway);
    }
      this.searchTerm = '';
      this.isDropdownOpen = false;
      this.filterPathways();
  }

  removePathway(pathway: string) {
    this.selectedPathwaysKEGG = this.selectedPathwaysKEGG.filter(p => p !== pathway);
    this.filterPathways(); 
  }

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


 // ------- Search processing function

  // Compare to already loaded pathways, and remove any that match
  private getMatches(selectedPathwaysKEGG: any[]){
    var matchingList: any[] = [];
    // Checking if Pathway data is already loaded 
    selectedPathwaysKEGG.forEach(pathway=>{
        const matchingItems = this.ALLpathwayData.find((obj => obj.name === pathway));
        //console.log(matchingItems);
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

  // ---- To deal with the Highlighted Pathways selection in a Table ----
  activeTab: 'highlight' | 'all' = 'highlight';

  selectedHighlightPathway: any = null;

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

  // ---------- STATS DISPLAY -------------



  

} 


