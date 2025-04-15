import { Component, ViewChild, ElementRef , HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { enzymeApiServicePost } from '../services/kegg_enzymepathwaysPost.serice';
import * as go from 'gojs';
import { FileDataService } from '../services/file-data.service';
import { filter, first } from 'rxjs';
import { parseFileContent, identifyFileType } from '../helper/file-utils';
import {MatSliderModule} from '@angular/material/slider';
import { match } from 'assert';



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

  // Creating a GoJS Diagram 
  private myDiagram: go.Diagram | null = null;


  // the below is a part of blocker logic to make the popup not transparent
  // private activePopups: { nodeKey: any, blocker: go.Part }[] = [];

  // to track the number of popups
  private activePopups: { nodeKey: any }[] = [];

  // Creating the Back-end API Service 
  constructor(private enzymeApiServicePost: enzymeApiServicePost,
    private fileDataService: FileDataService
  ) {};

  // ------------- SETTING UP PROCESSING FUNCTIONS -------------------------

  /** --------  INPUT Data Processing Functions -------- **/

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

private getLineWidth(logfc: number, baseline = 3) {
  const difference = Math.abs(logfc - baseline);

  // Set min and max width values
  const minWidth = 3;
  const maxWidth = 20;

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
        console.log(logfcList);
        let mean = this.findMean(logfcList); // Calculating mean of Genes logfc
        let rgb = this.newlogfcToRGB(mean, this.selectedColorLow,this.selectedColorHigh); // Getting colout relative to logfc
        let result = this.resizeNodeByLogFC(mean); // resizing node
        let height = result[0];
        let width = result[1];
        newNodes[i].width = width; // Assign node attributes 
        newNodes[i].height = height;
        newNodes[i].logfc = mean;
        newNodes[i].colour = rgb;
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
  console.log("--------------------")
  console.log('Extracting Logfc Data - Comparing to Enzymes');
  // Get Genes with logfc for the timepoint  (index this in future)
  const localNodes = nodes;
  console.log("--------------------")
  console.log('Selected Timepoint: '+timepoint);
  const genes = this.filteredGenes[timepoint];
  // Taking Genes from file and matching them to enzyme nodes 
  // Change enzyme node attributes accordingly 
  //console.log(genes);
  //console.log(localNodes);
  const elements = this.matchGenes(genes, localNodes)
  const updatedNodes = elements[0];
  const colourArray = elements[1];
  const stats = elements[2];
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
  console.log('Selected Timepoint: '+timepoint);
  const genes = this.filteredGenes[timepoint];
  // Taking Genes from file and matching them to enzyme nodes 
  // Change enzyme node attributes accordingly 
  //console.log(genes);
  //console.log(localNodes);
  const elements = this.matchGenesNoSize(genes, localNodes)
  const updatedNodes = elements[0];
  const colourArray = elements[1];
  const stats = elements[2];
  const finalNodes = this.getMultipleGenes(updatedNodes);
  return [finalNodes, colourArray, stats];
}


private getIsoforms(nodes: any[]): any[]{

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
              }*/
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






// Identification of enzyme Nodes that have multiple differentially regualted genes 

private getMultipleGenes(nodes: any[]): any[]{

  console.log('Finding Isoforms/Multiple Genes...')

  var newNodes = nodes.map(node => ({ ...node }));
  //console.log(newNodes);
  // Looping through all the nodes
  for (let i = 0; i < newNodes.length; i++) {
    if (newNodes[i].type === 'enzyme' && (newNodes[i].gene)){
      const firstGenes = newNodes[i].gene;
      if (firstGenes.length>1){
        const key1 = newNodes[i].key;
        console.log('Changing Colour - multiple Genes');
        newNodes[i].colour = '#FFF44F';

      }
    }
  }    
  return newNodes;

}






private getMetabolicFlux(nodes: any[], links: any[]){


  var newNodes = nodes.map(node => ({ ...node }));
  var newLinks = links.map(link => ({ ...link}));
  for (let i = 0; i < newNodes.length; i++) {
    // Get all enzyme nodes that have been effected but not by isoforms (coloured yellow)
    if (newNodes[i].type === 'enzyme' && (newNodes[i].gene) && newNodes[i].colour != '#FFF44F'){

      const key = newNodes[i].key;
      const colour = newNodes[i].colour;
      const logfc = newNodes[i].logfc;
      const rIndex = key.indexOf("R");
      if (rIndex !== -1) {
        const reactKey = key.substring(rIndex);
        console.log(reactKey); 

        // Loop through links to get any that match with that reaction key
      for (let j = 0; j < newLinks.length; j++) {
        if (newLinks[j].to == reactKey){
          //console.log('Match Found: (Link to) ');
          let category = newLinks[j].category;
          //console.log(category);

        }
        if (newLinks[j].from == reactKey){
          console.log('Match Found: (Link from) ');
          let category = newLinks[j].category;
          console.log(category);
          newLinks[j].colour = colour;
          const width = this.getLineWidth(logfc);
          newLinks[j].size = width;
          
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
  console.log(newLinks);
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
  console.log(pathwayData);
  
  
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
      console.log(updatedEdges);

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
    console.log("Number of enriched pathways to return:")
    console.log(this.pathwayNumber);

    // Setting up Data Array to send to back-end API
    // Sending list of enzymes (from ExtractECNUmber()) and Number of top pathways to get (e.g. 10))
    const data = [this.enzymeList, this.pathwayNumber];
    this.enzymeApiServicePost.postEnzymeData(data).subscribe(
      (response) => {
        // Handle the successful response
        this.pathwayData = response;

        // Loading Pathway names -- for displaying to user
        this.loadNames();
        console.log("--------------------")
        console.log('Received from backend:', response);
        console.log("--------------------")
        console.log('Getting Mapping Data');
        this.getMapData();

      },
      (error) => {
        // Handle errors
        console.error('Error:', error);
        this.isLoading = false; 

        //this.responseMessage = 'Error sending data';
      }
    );
  };



// --------------- Retrieving Mapping Data -------------------
// Sends Map code (Post Request)(e.g. ec:00030)
// Returns Mapping Data for relevant pathways (Nodes and Links)
// Calls Data Processing functions (loadNodes, loadLinks)
  getMapData(): void {

  // Sending top 10 Pathways to back-end to retrieve Mapping Data 
  const data = [this.pathwayData];
  this.isLoading = true;
  console.log("--------------------")
  console.log('Sending Request for Pathway Mapping Data');
  this.LoadingMessage = 'Loading Pathway Mapping Data...';
  this.enzymeApiServicePost.postALLMapData(data).subscribe(
    (response) =>{
    console.log(response);
    
    const ALLpathwayData = response;
    this.pathwayResponse = response;
    this.ALLpathwayData = ALLpathwayData;
    console.log(this.ALLpathwayData);

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
    console.log(pathwayData.pathway);
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
      console.log(pathwayData);
      pathwayData[0].name= pathwayName;
      console.log(pathwayData);
      this.ALLpathwayData.push(pathwayData[0]);
      console.log(this.ALLpathwayData);
      console.log("--------------------")
      console.log('Pathway Data Loaded Successfully');
      console.log("--------------------")

      //console.log(this.pathways);
      this.pathways.push(pathwayName);
      //console.log(this.pathways);
      //console.log(this.pathwayData);
      this.pathwayData.push(pathwayData[0]);
      console.log(this.pathwayData);

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

  // --------------- Retrieving Data and Calling Mapping Functions-------------------
  // Gets correct Mapping Data before calling the Diagram Updating Functions
  setMap(code: string, timepoint: number, pathwayData: {name: string, pathway: string,
               nodes: any[], edges: any[], enzymes: []}): void {
    console.log("--------------------");
    console.log("Getting Map Data: "+code);
    console.log(pathwayData);
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
    const stats = elements[2];
    console.log(stats);
    //console.log(updatedNodes);
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
          new go.Shape("Rectangle").bind("fill","colour").bind("width").bind("height")
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
    this.myDiagram.model = model;
    this.setLegend(this.myDiagram);
  }
  

  // --------------- Updating GO.js Model -------------------
  // Updates the pre-existing Diagram Model
  updateDiagram(nodes: any[], links: any[]): void{
    if (this.myDiagram){
    console.log('Updating Diagram');  
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
      this.myDiagram.model = new go.GraphLinksModel([], []);
      console.log('Diagram Data Cleared')
      this.updateDiagram(nodes,links);
      this.setLegend(this.myDiagram);

    }else{
    // Create a new a Diagram with template
      this.createGoJSMap(nodes, links);}
      
  }



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




  private setLegend(myDiagram: go.Diagram): void{
    const $ = go.GraphObject.make;


    const legend = $(
      go.Part, "Table",
      {
        name: "Legend",
        layerName: "ViewportForeground",  // Ensures it's in the foreground and fixed in the viewport
        isLayoutPositioned: false,        // Prevents layout from affecting its position
        selectable: false,
        alignment: go.Spot.BottomLeft,    // Aligns to the bottom-left of the viewport
        alignmentFocus: go.Spot.BottomLeft,
        margin: new go.Margin(10, 10, 10, 10) // Adds padding from the viewport edges
      },
    
      // Title
      $(go.TextBlock, "Legend",
        {
          row: 0,
          font: "bold 12pt sans-serif",
          stroke: "#333",
          margin: new go.Margin(0, 0, 6, 0),
          columnSpan: 2
        }
      ),
    
      // Node Type: Compound
      $(go.Panel, "Horizontal", { row: 1 },
        $(go.Shape, "Circle", { width: 15, height: 15, fill: "#ccc", margin: 2 }),
        $(go.TextBlock, "Compound", { margin: 2 })
      ),
    
      // Node Type: Linked Pathway
      $(go.Panel, "Horizontal", { row: 2 },
        $(go.Shape, "RoundedRectangle", { width: 15, height: 15, fill: "lightblue", margin: 2 }),
        $(go.TextBlock, "Linked Pathway", { margin: 2 })
      ),

      // Node Type: Enzyme - No change 
      $(go.Panel, "Horizontal", { row: 3 },
        $(go.Shape, "Rectangle", { width: 15, height: 15, fill: 'lightgrey', margin: 2 }),
        $(go.TextBlock, "Enzyme", { margin: 2 })
      ),

      // Node Type: Selected Upregulated Colour
      $(go.Panel, "Horizontal", { row: 4 },
        $(go.Shape, "Rectangle", { width: 15, height: 15, fill: this.selectedColorHigh, margin: 2 }),
        $(go.TextBlock, "Upregulated", { margin: 2 })
      ),

      // Node Type: Selected Downregulated Colour
      $(go.Panel, "Horizontal", { row: 5 },
        $(go.Shape, "Rectangle", { width: 15, height: 15, fill: this.selectedColorLow, margin: 2 }),
        $(go.TextBlock, "Downregulated", { margin: 2 })
      ),

      // Node Type: Selected Isoform Colour
      $(go.Panel, "Horizontal", { row: 6 },
        $(go.Shape, "Rectangle", { width: 15, height: 15, fill: '#FFF44F', margin: 2 }),
        $(go.TextBlock, "Isoform", { margin: 2 })
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
        $(go.TextBlock, "Reversible", { margin: 2 })
      ),
    
      // Link: Irreversible
      $(go.Panel, "Horizontal", { row: 8 },
        $(go.Shape, {
          geometryString: "M0 0 L30 0",
          stroke: "black",
          strokeWidth: 2,
          margin: 2
        }),
        $(go.TextBlock, "Irreversible", { margin: 2 })
      )
    );
    
    // Add the legend to the diagram
    myDiagram.add(legend);

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
    //console.log(code);

    // Set Time index to defualt value of 0 -- open up on first timepoint 
    //console.log(this.selectedTimeIndex);

    // Retrieving Mapping Data from stored arrays
    // Specifcying the timepoint -- can be set default to 0 (first file)
    const pathwayData = this.ALLpathwayData.find((obj => obj.pathway === code));
    //console.log(pathwayData);
    this.setMap(code, this.selectedTimeIndex, pathwayData);
  }

  // ------------------ SORT BY FUNCTIONALITY -------------------
  sortDropdownOpen = false;
  
  toggleSortDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.sortDropdownOpen = !this.sortDropdownOpen;
  }

  // -------  PATHWAY SORTING FUNCTIONS -----------

  // Determining Pathway Size - Ranking complexity 
  // Called from sortPathways 
  pathwaySize(): any[]{
    let list = this.pathways;
    let data = this.ALLpathwayData;
    //console.log(list);
    //console.log(data);
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

  //console.log('Combined data:', combinedData); // Add debug logging
    var geneEnzymes: any[] = []; // Use Set to avoid duplicates
    //var filteredSet: Set<any> = new Set()
    
    if (file && file.length > 0) {
      // Loop through the combined data to find EC numbers
      for (const item of file) {
        //console.log(item.gene);
        //console.log(item.log)
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


  private getNewPathways(arr1: any[], arr2: any[]): any[] {
  // Filter arr1 to get items that don't exist in arr2
  const uniqueInArr1 = arr1.filter(item1 => 
    !arr2.some(item2 => item1.id === item2.id)
  );

  // Filter arr2 to get items that don't exist in arr1
  const uniqueInArr2 = arr2.filter(item2 => 
    !arr1.some(item1 => item1.id === item2.id)
  );

  // Combine both results into one array
  return [...uniqueInArr1, ...uniqueInArr2];
}

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
    //console.log(newFilteredGenes);
    //var newArray = originalData.push(newFilteredGenes);
    console.log('Adding New Filtered Data to Array');
    //console.log(newArray);
    newFilteredGenes.forEach(item =>{
      this.filteredGenes.push(item);
    })
    //this.filteredGenes.push(newFilteredGenes);
    console.log(this.filteredGenes);
    
    //this.updatePathways(newFilteredGenes);
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
  private compareArrays(arr1: string[], arr2: string[]) {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
  
    // Similar elements
    const similar = [...set1].filter(item => set2.has(item));
  
    // Different elements
    const different = [
      ...arr1.filter(item => !set2.has(item)),
      ...arr2.filter(item => !set1.has(item))
    ];
  
    return {
      similar,
      different
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
              this.pathwayData = response;

              console.log('Current Pathways:');
              console.log(currentPaths)

              //console.log('New pathway list:')
              //console.log(this.pathwayData);


              // Loading Pathway names -- for displaying to user
              this.loadNames();

              // Comparing pathways to inform the user 
              console.log('Updated Pathways:');
              console.log(this.pathways)

              const result = this.compareArrays(currentPaths,this.pathways);
              const similar = result.similar;
              const different = result.different;

              console.log('Similar Pathways: ');
              console.log(similar)
              console.log('Different Pathways: ');
              console.log(different)

              console.log('Received from backend:', response);
              console.log('-----------------------------');
              console.log('Getting Mapping Data');
              this.getMapData();

              console.log('-------- NEW PATHWAYS LOADED -------');

            },
            (error) => {
              // Handle errors
              console.error('Error:', error);
              this.isLoading = false; 

              //this.responseMessage = 'Error sending data';
            }
          );

          //console.log('-------- NEW PATHWAYS LOADED -------');

          this.closeUploadModal(); // Close modal after merge

          //this.isLoading = false;
        }).catch(err => {
          console.warn('Failed to process added files:', err);
        });
      } else {
        console.error('No files selected!');
      }
    }
  

  //  ------------------ FILTERING PATHWAYS -------------------
  isFilterPathwayModalOpen: boolean = false;
  selectedFilters: string[] = [];

  openFilterPathwayModal() {
    this.isFilterPathwayModalOpen = true;
  }

  closeFilterPathwayModal() {
    this.isFilterPathwayModalOpen = false;
  }

  updateFilter(event: any) {
    const filterValue = event.target.id;
    if (event.target.checked) {
      this.selectedFilters = [...this.selectedFilters, filterValue];
    } else {
      this.selectedFilters = this.selectedFilters.filter(filter => filter !== filterValue);
    }
    console.log('Selected Filters:', this.selectedFilters);
  }

  FilterPathways() {
  // TODO: Add Filtering of pathways functionality
    this.closeFilterPathwayModal();
  }

  //  ------------------ CUSTOMISATION TAB -------------------
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
        
        await this.delay(750);// 1 Second between pathway refresh (large pathays take a while to load)
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

  
} 


