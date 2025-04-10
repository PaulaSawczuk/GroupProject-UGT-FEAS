import { Component, ViewChild, ElementRef , HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { enzymeApiServicePost } from '../services/kegg_enzymepathwaysPost.serice';
import * as go from 'gojs';
import { FileDataService } from '../services/file-data.service';
import { filter, interval } from 'rxjs';
import { parseFileContent, identifyFileType } from '../helper/file-utils';
import {MatSliderModule} from '@angular/material/slider';


declare var figure: any; 

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSliderModule],
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.css']
})

export class DisplayComponent {
  LoadingMessage: string = '';


  // ------------------  MOCK DATA ----------------
  // Random list of enzymes to get Pathways to display in menu 
  enzymeList = [
      "ec:1.1.1.1",  // Alcohol dehydrogenase
      "ec:1.1.1.2"// Aldehyde dehydrogenase
    ];

  //enzymeList: string[] = [];
  // Array for the Fetch Data - contains Pathway Objects - Name and Pathway (ec No.)
  pathwayData: any[] = [];
  // Array of only names in the same order as pathwayData but for display purposes
  pathways: any[] = [];

  // Array for storing response of getMapData
  mapData: any[] = [];

  ALLpathwayData: any[] = []; // Global attribute for storing all Pathway Data - Name, code, Edges, Nodes and EnzymeList

  NEWpathwayData: any[]= []; // Global attribute for storing NEWLY UPLOADED Pathway Data to update pathway list

  enzymePathwayList: string[] = [];

  filteredGenes: any[] = []; // Array of Genes, Logfc and EC number of combined Data 

  pathwayNumber: number = 10; // Hard Coded - but can add functionality for user to change this

  fileNames: any[] = [];

  pathwaySizeData: any[] = [];

  loadedPathwayData: any[] = [];

  colourArray: any[] = [];

  // Creating a GoJS Diagram 
  // Initially set as NULL 
  private myDiagram: go.Diagram | null = null;
  //@ViewChild('myDiagramDiv') private diagramDiv!: ElementRef;

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
  const combinedData = this.fileDataService.getMultipleCombinedArrays();
  //console.log('MultiCombined: '+combinedData);
  //console.log('First File: '+combinedData[0]);
  console.log('Number of Files: '+combinedData.length);
  //const firstFile = combinedData[0];
  var filteredFiles = [];
  //console.log('First File: '+firstFile);
  for (let i=0; i<combinedData.length; i++){
    const file = combinedData[i];
    console.log(file);
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
      //console.log(geneEnzymes);
      filteredFiles.push(geneEnzymes);
    }
  }
  //console.log('filtered files: '+filteredFiles)
  //console.log(geneEnzymes); //Array of Genes with EC matched 
  this.filterEnzymeGenes(filteredFiles); // pass to 
}

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


// Called from getEnzymeGenes()
// Filters genes to those only with corresponding ec codes and reformats them in the correct order
private filterEnzymeGenes(filteredFiles:any[]):void{
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
  this.filteredGenes = filteredFiles_enzymes;
}

// Same function as above for Newly uploaded files
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


// ---------------- Extraction of enzymes in filtered Constrast Datasets ---------------------
// This Gets a processed list of all the enzymes present in the input files that have corresponding DEGs
// Returns the top 1000 (or otherwise specified) list of enzymes to be queried to KEGG to get paths

private extractECNumbers(): void {

  // Set this up to loop through all files -- total enzymes 
  console.log('Extracting Enzymes to Search');
  //console.log(this.filteredGenes);
  //var enzymeList: Set<any> = new Set()
  var enzymeList: any[]=[];
  //const file_number=0; // default to first file

  //console.log(this.filteredGenes.length);
  //console.log(this.filteredGenes);
  for (let i=0; i<this.filteredGenes.length;i++){
    const genes = this.filteredGenes[i];
    console.log(genes);
    for (let i=0; i<genes.length; i++){
      let enzyme = genes[i].enzyme[0];
      //console.log(enzyme);
      enzymeList.push(enzyme);
    }
    //const topEnzymes = this.getTop100Names(enzymeList);
  }
  console.log(enzymeList);
  const topEnzymes = this.getTopEnzymes(enzymeList);
  //console.log(enzymeList)
  this.enzymeList = Array.from(topEnzymes);

}

// Same function but for new file processing on upload in display component
private updateExtractECNumbers(filteredGenes: any[]): any[] {

  // Set this up to loop through all files -- total enzymes 
  console.log('Extracting Enzymes to Search');
  //console.log(this.filteredGenes);
  //var enzymeList: Set<any> = new Set()
  var enzymeList: any[]=[];
  //const file_number=0; // default to first file

  //console.log(filteredGenes.length);
  //console.log(filteredGenes);
  for (let i=0; i<filteredGenes.length;i++){
    const genes = filteredGenes[i];
    console.log(genes);
    for (let i=0; i<genes.length; i++){
      let enzyme = genes[i].enzyme[0];
      //console.log(enzyme);
      enzymeList.push(enzyme);
    }
    //const topEnzymes = this.getTop100Names(enzymeList);
  }
  console.log(enzymeList);
  const topEnzymes = this.getTopEnzymes(enzymeList);
  //console.log(enzymeList)
  return Array.from(topEnzymes);
  //this.enzymeList = Array.from(topEnzymes);

}



// --------- Enzyme Tally and Processing Functions --------
// Called from extractECNumbers()
// Getting a list of all enzymes present in files
// Mulitple Genes to one enzyme are represented by enzyme duplicated in list 

// Fully Enzyme List is too large query KEGG rest API in succession 
// Enzymes are tallied and sorted in descending order 
// Top 1000 (or can be changed) are selected and submitted to backend to query KEGG
private tallyStrings(items: string[]): Record<string, number> {
  console.log('Tallying Enzymes');
  
  const tally: Record<string, number> = {};

  items.forEach(item => {
    tally[item] = (tally[item] || 0) + 1;
  });
  return tally;
}

// Sorting Enzyme Tally 
private sortTally(tally: Record<string, number>): [string, number][] {
  this.LoadingMessage = 'Processing Enzyme List...';
  // Convert the tally object into an array of key-value pairs
  const entries = Object.entries(tally);
  // Sort by the count in descending order
  entries.sort((a, b) => b[1] - a[1]);
  return entries;
}

// Extracting Top enzymes from Tally
private getTopEnzymes(items: string[]): string[] {
  console.log('Getting Top Enzymes');
  const tally = this.tallyStrings(items);    
  const sortedTally = this.sortTally(tally);  

  // Step 3: Select the top items and extract only the names
  const top100Names = sortedTally.slice(0, 750).map(entry => entry[0]);
  return top100Names;
}




// ----------- Differential Gene Expression Data Functions ----------------
// Called when changing Node information when map is selected/ timepoint changes 

// LogFC to RGB conversion function 
// Takes Logfc value -- returns rgb value to change enzyme node colour
private logfcToRGB(logFoldChange: number): string{
  // Normalize log fold change to be between -1 and 1 for smoother gradient mapping
  const normalized = Math.max(-1, Math.min(1, logFoldChange));

  // Red decreases as the value goes from negative to positive
  const red = normalized < 0 ? 1 : 1 - normalized;

  // Green increases as the value goes from negative to positive
  const green = normalized > 0 ? 1 : -normalized;

  // Blue stays at 0 (we are only using red and green for the gradient)
  const blue = 0;

  // Return the RGB value as a string
  return `rgb(${Math.floor(red * 255)}, ${Math.floor(green * 255)}, ${blue})`;
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


// Mathing Enzyme Nodes to Enzymes present in Expression file selected 
// Changing Enzyme node colour based on LogFC if match is found
// Adding Genes to Enzyme node 
// ----------- JENNYS ------------
private matchGenes(genes: any[], nodes: any[]): void {
  // Matching Genes to Enzymes in Selected Map Data 
  var enzymeSet = new Set();
  //console.log(genes);
  var GeneSet = new Set();
  var allGenes = [];

  for (let i=0; i<nodes.length; i++){
    //console.log(nodes[i].type)
    if (nodes[i].type == 'enzyme'){
      var geneList = [];
      var logfcList = [];
      //console.log(nodes[i].text);
      let nodetext = nodes[i].text;
      //console.log('node: '+nodetext);
      for (let j=0; j<genes.length; j++){
        //console.log(genes[j].enzyme[0]);
        let enzyme = genes[j].enzyme[0];
        let gene = genes[j].gene;
        let logfc = genes[j].logfc;
        if (enzyme == nodetext){
          //console.log('match');
          //console.log(enzyme);
          enzymeSet.add(enzyme);
          //console.log(nodetext);
          //console.log(gene);
          geneList.push(gene);
  
          GeneSet.add(gene);
          allGenes.push(gene);
          //GeneSet.add(gene);
          logfcList.push(logfc);
          //console.log(logfc);

        }
        
      }
      //console.log(geneList);
        if (geneList[0]){
          nodes[i].gene = geneList;
          //console.log(nodes[i]);
        }else{
          continue;
        }
        if (logfcList[0]){
          //console.log(logfcList);
          let mean = this.findMean(logfcList)
          //console.log(mean);
          nodes[i].logfc = mean;
          let rgb = this.logfcToRGB(mean);
          //console.log(rgb);
          nodes[i].colour = rgb;
          //console.log(nodes[i]);
        }else{
          continue;
        }
    }
    }
    //console.log(GeneSet);
    console.log('Number of Unique Genes: '+GeneSet.size);
    //console.log(allGenes);
    console.log('Total Number of instances of Genes: '+allGenes.length);
    //console.log(enzymeSet);
    console.log('Enzymes Effected: '+ enzymeSet.size);
  }




  private matchGenes2(genes: any[], nodes: any[]): any[]|any[] {
    // Matching Genes to Enzymes in Selected Map Data 
    console.log('MatchGenes2');
  
    // Create a deep copy of nodes to avoid mutating the original
    var newnodes = nodes.map(node => ({ ...node }));
  
    var enzymeSet = new Set();
    console.log(genes);
  
    var GeneSet = new Set();
    var allGenes = [];
    var colourArray = [];
  
    for (let i = 0; i < newnodes.length; i++) {
      // Only modify nodes of type 'enzyme'
      if (newnodes[i].type == 'enzyme') {
        var geneList = [];
        var logfcList = [];
        let nodetext = newnodes[i].text;
  
        // Cycle through genes
        for (let j = 0; j < genes.length; j++) {
          let enzyme = genes[j].enzyme[0];
          let gene = genes[j].gene;
          let logfc = genes[j].logfc;
  
          if (enzyme == nodetext) {
            enzymeSet.add(enzyme);
            geneList.push(gene);
            GeneSet.add(gene);
            allGenes.push(gene);
            logfcList.push(logfc);
          }
        }
  
        if (geneList[0]) {
          newnodes[i].gene = geneList;
        } else {
          continue;
        }
  
        if (logfcList[0]) {
          let mean = this.findMean(logfcList);
          let rgb = this.logfcToRGB(mean);
          newnodes[i].logfc = mean;
          newnodes[i].colour = rgb;
        } else {
          continue;
        }
  
        // Collect colours
        colourArray.push({
          node: newnodes[i].key,
          colour: newnodes[i].colour
        });
      }
    }
  
    console.log(GeneSet);
    console.log('Number of Unique Genes: ' + GeneSet.size);
    console.log(allGenes);
    console.log('Total Number of instances of Genes: ' + allGenes.length);
    console.log(enzymeSet);
    console.log('Enzymes Effected: ' + enzymeSet.size);
    console.log(newnodes);
  
    // Returning updated nodes and colour array
    return [newnodes, colourArray];
  }
    

/* ----------- JENNYS -----------------
// Takes nodes of selected Map 
// Gets relevant timepoint, retrieves annotated genes
private compareEnzymes(nodes: any[],timepoint: number): void{
  console.log('Extracting Logfc Data - Comparing to Enzymes');
  // Get Genes with logfc for the timepoint  (index this in future)
  const genes = this.filteredGenes[timepoint];
  // Taking Genes from file and matching them to enzyme nodes 
  // Change enzyme node attributes accordingly 
  this.matchGenes(genes, nodes)
}
*/



// Getting Mapping Data for all the enriched pathways 
// Updated Nodes and Edges for all the timepoints etc
private loadMapData(response: any[]) {
  console.log('----------------------');
  console.log('Loading MapData');
  console.log('----------------------');
  console.log('RESPONSE FROM BACKEND');

  console.log(response);

  // Deep clone the pathwayData to avoid mutation of the original response
  const pathwayData = response.map(item => ({
    ...item,  // Shallow copy of the top level properties
    nodes: item.nodes.map((node: any) => ({ ...node })) // Deep copy of nodes to avoid mutation
  }));
  console.log(pathwayData);

  // Deep clone the timepointData (this.filteredGenes) to avoid mutation of the original array
  const timepointData = this.filteredGenes.map(item => ({ ...item }));  // Deep copy of timepointData
  console.log(timepointData);

  console.log('Number of Files: ' + timepointData.length);

  var loadedPathwayData = [];
  var ALLcolourArray = [];

  // Cycle through number of pathways
  for (let i = 0; i < pathwayData.length; i++) {
    const nodes = pathwayData[i].nodes; // Already a deep copy
    console.log(nodes);

    var nodesArray = [];
    var colourArray = [];

    // Cycle through timepoints
    for (let j = 0; j < timepointData.length; j++) {
      const genes = timepointData[j];

      var elements = this.matchGenes2(genes, nodes);
      // Extract Colour and Nodes
      var updatesNodes = elements[0];
      console.log(updatesNodes);

      var colours = elements[1];
      console.log(colours);
      
      // Add updated nodes and colours to respective arrays
      nodesArray.push(updatesNodes);
      colourArray.push(colours);
    }

    // Push the processed pathway data into the loadedPathwayData array
    loadedPathwayData.push({
      pathway: pathwayData[i].name,
      nodes: nodesArray
    });

    // Push the colour data into the ALLcolourArray
    ALLcolourArray.push({
      pathway: pathwayData[i].name,
      colours: colourArray,
    });
  }

  // Log the result
  console.log(ALLcolourArray);

  // Example of logging the first pathway, first timepoint details
  console.log('First Pathway, First timepoint');
  console.log('Name');
  console.log(loadedPathwayData[0].pathway);
  console.log('Nodes');
  console.log(loadedPathwayData[0].nodes[0]);
  console.log('Colours');
  console.log(ALLcolourArray[0].colours[0]);
  console.log('Edges');
  // console.log(this.ALLpathwayData[0].edges);

  // Assign the processed data to component properties
  this.colourArray = ALLcolourArray;
  this.loadedPathwayData = loadedPathwayData;
  this.ALLpathwayData = response; // You might still want to keep this for reference

  console.log('--------- LoadMapData Finished -------');
}

  
  /** --------  MAP Data Processing Functions -------- **/
  // Function for loading Names of each pathway that is fetched from the backend
  loadNames(): void {
    console.log('Processing Pathway Names');
    this.LoadingMessage = 'Processing Pathway Names...';
    this.pathways = this.pathwayData.map(pathway => pathway.name);
  }
  /* --------- JENNYS ------------------
  // Loads Nodes from mapData 
  loadNodes(): any[] {
    var nodeData=[];
    console.log('Getting Nodes');
    const entries: [string, string][] = Object.entries(this.mapData);
    //this.nodeData = this.mapData.
    const firstEntry: [string, string] = entries[0]; 
    //console.log(firstEntry);
    const nodes = firstEntry[1];
    for (let i=0; i<nodes.length;i++){
      nodeData.push(nodes[i])
    }
    console.log(nodeData);
    return nodeData;
  }*/

  loadEnzymes(): any[] {
    var enzymeData=[];
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
  /* ---------- JENNYS ----------------
  // Loads Links from mapData 
  loadLinks(): any[] {
    console.log('Getting Links');
    var linkData=[];
    const entries: [string, string][] = Object.entries(this.mapData);
    const secondEntry: [string, string] = entries[1]; 
    //console.log(secondEntry);
    const links = secondEntry[1];
    //console.log(links);
    for (let i=0; i<links.length;i++){
      //console.log(links[i]);
      linkData.push(links[i])
    }
    console.log(linkData);
    return linkData;
  }*/

  isLoading: boolean = false;
  
  // -------------- Sending Pathway Request to Back-end ---------------------
  // Fetches relevant pathways when the Display component is initialised

  /** --------  POST REQUEST Functions -------- **/

  ngOnInit(): void {

    // Loading Screen
    this.isLoading = true;

    

    //const numberArray: number[] = Array.from({ length: this.fileDataService.getMultipleCombinedArrays().length }, (_, index) => index);
    //this.timepoints = numberArray;


    // Processing Input Data - Match Genes and Extracting LogFc + EC numbers
    this.getEnzymeGenes();
    // Getting List of Enzymes from Input Data
    this.extractECNumbers();

    // Setting up Data Array to send to back-end API
    // Sending list of enzymes (from ExtractECNUmber()) and Number of top pathways to get (e.g. 10))
    const data = [this.enzymeList, this.pathwayNumber];
    this.enzymeApiServicePost.postEnzymeData(data).subscribe(
      (response) => {
        // Handle the successful response
        this.pathwayData = response;

        // Loading Pathway names -- for displaying to user
        this.loadNames();
        console.log('Received from backend:', response);
        console.log('-----------------------------');
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


  /** --------  Mapping Functions -------- **/

  // --------------- Retrieving Mapping Data -------------------
  // Sends Map code (Post Request)(e.g. ec:00030)
  // Returns Mapping Data for relevant pathways (Nodes and Links)
  // Calls Data Processing functions (loadNodes, loadLinks)
  getMapData(): void {

    // Sending top 10 Pathways to back-end to retrieve Mapping Data 
    const data = [this.pathwayData];
    this.isLoading = true;
    console.log('-----------------------------');
    console.log('Sending Request for Pathway Mapping Data');

    this.enzymeApiServicePost.postALLMapData(data).subscribe(
      (response) =>{
      console.log("Response from backend:");
      console.log(response);
      
      // Storing all the pathways + data to global attribute 
      // This can used to get data for selected map
      this.loadMapData(response);
      console.log('Pathway Data Loaded Successfully');
      this.isLoading = false;
      console.log('------ ALL pathway Data Loaded --------');
      console.log(this.ALLpathwayData);
      },
      (error) => {
        console.error('Error:', error);
        this.isLoading = false;
      });
  };

  updateMapData(newPathways: any[]): void {

    // Sending top 10 Pathways to back-end to retrieve Mapping Data 
    const data = [newPathways];
    this.isLoading = true;
    console.log('-----------------------------');
    console.log('Sending Request for Pathway Mapping Data');
    this.enzymeApiServicePost.postALLMapData(data).subscribe(
      (response) =>{
      console.log(response);

      // Storing all the pathways + data to global attribute 
      // This can used to get data for selected map
      this.NEWpathwayData = response;
      //this.loadMapData(response);
      console.log('Pathway Data Loaded Successfully');
      this.isLoading = false;
      },
      (error) => {
        console.error('Error:', error);
        this.isLoading = false;
      });
  };

  setMap(code: string, timepoint: number, name: string): void {

    console.log("Getting Map Data: "+code);
    // Finding pathway data by its code in pathway array
    const pathway = this.ALLpathwayData.find((obj => obj.pathway === code));
    console.log(name);
    
    //console.log(pathway);
    console.log('Loading Differential Expression Data')

    console.log(this.loadedPathwayData);
    const data = this.loadedPathwayData.find(item => item.pathway === name);
    console.log(data);
    console.log(timepoint);

    // Extracting nodes and edges 
    var nodes = data.nodes[timepoint]; // Default is 0
    console.log(nodes);
    var links = pathway.edges;
    console.log('Nodes + Edges Retrieved')
    //console.log(nodes);
    //console.log(links);
    console.log('Loading Differential Expression Data')
    //this.compareEnzymes(nodes,timepoint);
    this.changeDiagram(nodes, links);
    this.isLoading = false;
    //if(this.myDiagram){
    //this.animateMap(name, 2000, this.myDiagram);
    //}

  }


  // --------------- Creating GO.js Model -------------------
  // Creating the First GoJS MAP
  // Creates the Diagram Template and initialises 
  createGoJSMap(nodes: any[], links: any[] ): void {

    this.activePopups = []; // resetting popup tracker for new diagram


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
        //corner: 5    // rounded corners
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
          stroke: "black",  // Set the color of the link (line) to black
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
          //strokeDashArray: [10, 5]  // Set the line to be dashed (10px dashes, 5px gaps)
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

  /*
  
  // TEMPLATE FOR ENZYME NODES
    this.myDiagram.nodeTemplateMap.add("enzyme",  // Custom category for compound nodes
      new go.Node("Auto")  // Use Vertical Panel to place the label above the shape
        .add(
          new go.Shape("Rectangle").bind("fill","colour")
        ).add(new go.TextBlock(
          { margin: 2,
            font: "10px sans-serif",
            wrap: go.TextBlock.WrapFit,
          width: 80 })
          .bind("text")
        )
    );*/

      // Enzyme node template with little sqaures as type
  this.myDiagram.nodeTemplateMap.add("enzyme",  // Custom category for compound nodes
    new go.Node("Auto")  // Use Vertical Panel to place the label above the shape
      .add(
        new go.Shape("Rectangle").bind("fill","colour")
      ).add(new go.TextBlock(
        { margin: 2,
          font: "10px sans-serif",
          wrap: go.TextBlock.WrapFit,
          width: 80 })
        .bind("text"))
        .add(new go.Shape("Square", {
              alignment: go.Spot.TopRight, width: 14, height: 14,
              visible: true,
              strokeWidth: 1
      }).bind('fill',"enzymeType",function(enzymeType: string): string {
      // Map enzymeType to specific shapes
      switch (enzymeType) {
        case "Oxidoreductase":
          return "#ed6d6d";
        case "Transferase":
          return "#e7f263";
        case "Hydrolase":
          return "#c4a7d6";
        case "Ligase":
          return "#00aeb8";
        case "Lyase":
          return "#75dd2f"
        case "Translocase":
          return "Square";
        case "Isomerase":
            return "#3a5ba0";
        default:
          return "grey"; // Default shape
      }
    }).bind("figure", "enzymeType",function(enzymeType: string): string {
      // Map enzymeType to specific shapes
      switch (enzymeType) {
        case "Oxidoreductase":
          return "Circle";
        case "Transferase":
          return "Rectangle";
        case "Hydrolase":
          return "Diamond";
        case "Ligase":
          return "Triangle";
        case "Lyase":
          return "Rectangle"
        case "Translocase":
          return "Capsule";
        case "Isomerase":
            return "TriangleDown";
        default:
          return "Rectangle"; // Default shape
      }
    })

  ));

    // TEMPLATE FOR MAP NODES
    this.myDiagram.nodeTemplateMap.add("map",  // Custom category for compound nodes
      new go.Node("Auto")  // Use Vertical Panel to place the label above the shape
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
  }
  

  // --------------- Updating GO.js Model -------------------
  // Updates the pre-existing Diagram Model
  updateDiagram(nodes: any[], links: any[]): void{
    if (this.myDiagram){
    console.log('Updating Diagram'); 
    //console.log(nodes); 
    this.myDiagram.model = new go.GraphLinksModel(nodes, links)}
  }

  // ----------- Changing Diagram Upon Selection -------------------
  // Checks for an existing Diagram 
  // If exists - Updates the Model with new nodes + links (updateDiagram()))
  // If doesnt exist - Creates first Diagram Model (createGOJSMap())
  changeDiagram(nodes: any[], links: any[]): void {
    // If diagram exists, clear it first
    console.log('Changing Diagram');
    if (this.myDiagram) {
      // Diagram Exists - update the current one 
      console.log('Diagram Exists')
      this.myDiagram.model = new go.GraphLinksModel([], []);
      console.log('Diagram Data Cleared')
      this.updateDiagram(nodes,links);

    }else{
    // Create a new a Diagram with template
      this.createGoJSMap(nodes, links);}
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
    console.log(this.SelectedPathwayName);
    console.log('Selected:', pathway);
    const nameSelected = pathway;
    // Finding corresponding map code to pathway name
    const path = this.pathwayData.find(path => path.name === nameSelected);
    console.log('Corresponding Code: '+path.pathway)

    // Assinging code of pathway selected 
    this.selectedPathway = path.pathway;
    const code = path.pathway
    console.log(code);

    // Set Time index to defualt value of 0 -- open up on first timepoint 
    //this.selectedTimeIndex = 0;
    // console.log(this.selectedTimepoint);
    console.log(this.selectedTimeIndex);
    //console.log(this.filteredGenes[this.selectedTimepoint][0]);

    // Retrieving Mapping Data from stored arrays
    // Specifcying the timepoint -- can be set default to 0 (first file)
    this.setMap(code, this.selectedTimeIndex, nameSelected);
  }

  // ------------------ SORT BY FUNCTIONALITY -------------------
  sortDropdownOpen = false;
  
  toggleSortDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.sortDropdownOpen = !this.sortDropdownOpen;
  }


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


  
  sortPathways(criteria: string) {
    console.log(`Sorting by ${criteria}`);
    //console.log(criteria);
    //console.log(this.pathways);
    // TODO: Code for sorting the pathways

    // Sort A-Z
    if (criteria == 'name'){
      // sorting A-Z
      let list = this.pathways;
      list = list.sort();
      console.log(list);
      this.pathways = list;
      this.sortDropdownOpen = false;
    }
    // Sort Z-A
    if (criteria == 'length'){
      let list = this.pathways;
      list = list.sort((a, b) => b.localeCompare(a));
      console.log(list);
      this.pathways = list;
      this.sortDropdownOpen = false;
    }

    // Sorting High to Low Pathway Size
    if (criteria == 'highComp'){
  
      var pathwaysSize = this.pathwaySize()
      pathwaysSize.sort((a, b) => b.size - a.size)
      let sortedNames = pathwaysSize.map(item => item.name);
      this.pathways = sortedNames;
      this.sortDropdownOpen = false;
      };

    // Sorting Low to High Pathway Size
    if (criteria == 'lowComp'){

      var pathwaysSize = this.pathwaySize()
      pathwaysSize.sort((a, b) => a.size - b.size);
      let sortedNames = pathwaysSize.map(item => item.name);
      this.pathways = sortedNames;
      this.sortDropdownOpen = false;
    }else{
    
    this.sortDropdownOpen = false;
    }
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

  processNewFiles(): void{

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
    //console.log(this.filteredGenes);
    
    this.updatePathways(newFilteredGenes);
  }


  getNewPathways(arr1: any[], arr2: any[]): any[] {
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

  
  updatePathways(newFilteredGenes: any[]): void{

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
  }

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

        const allCombined = existingCombined.flat();
        this.fileDataService.setCombinedData(allCombined);
        this.fileDataService.setMultipleCombinedArrays(existingCombined);
        console.log('All-files');
        const data = this.fileDataService.getMultipleCombinedArrays();
        console.log(data);
        console.log("Loaded Files");
        console.log(this.filteredGenes);
        
        
        // Process Files
        this.processNewFiles(); // Filter and Extract Enzymes
        

        this.closeUploadModal(); // Close modal after merge
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
  subcategoryOptions: string[] = [];
  CompoundOptions: string[] = ['Value 1', 'Value 2', 'Value 3'];
  PathwayOptions: string[] = ['Pathway A', 'Pathway B', 'Pathway C'];
  
  // Selected by the user values - initially empty
  selectedEnzyme: string = '';
  selectedSubcategory: string = '';
  selectedCompound: string = '';
  selectedPathwayCustom: string = '';

  onEnzymeChange() {
    console.log('Selected enzyme:', this.selectedEnzyme);
    this.selectedSubcategory = '';
    if (this.selectedEnzyme) {
    // TODO: Here logic to populate subcategories box based on chosen enzyme
    // something like if this and that then this.subcategoryOptions = [some list];
      if (this.selectedEnzyme === 'Enzyme A') {
        this.subcategoryOptions = ['Subcategory A1', 'Subcategory A2'];
      }
    }
  }

  onSubcategoryChange() {
    console.log('Selected subcategory:', this.selectedSubcategory);
  }

  onCompoundChange(){
    console.log('Selected compound:', this.selectedCompound);

  }

  onPathwayChange(){
    console.log('Selected enzyme:', this.selectedPathwayCustom);

  }

  //  ------------------ TIME SLIDER -------------------
  timepoints = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  selectedTimeIndex: number = 0;
  
  value: number = this.timepoints[this.selectedTimeIndex];

  updateValue(): void {
    this.value = this.timepoints[this.selectedTimeIndex];
    console.log(this.value);
    console.log('Time index: '+this.selectedTimeIndex);
    const code = this.selectedPathway;
    const name = this.SelectedPathwayName
    const data = this.loadedPathwayData.find(item => item.pathway === name);
    const pathway = this.ALLpathwayData.find((obj => obj.pathway === code));
    console.log(data);
    const time = this.selectedTimeIndex;
    console.log(time);
    var nodes = data.nodes[time]; // Default is 0
    console.log(nodes);
    var links = pathway.edges;
    console.log(links);
    const colourData = this.colourArray.find(item => item.pathway === name);
    console.log('Colour Data: ')
    console.log(colourData);
    
    this.updateDiagram(nodes,links);

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

  startAnimation(): void {
    console.log("Time lapse started");
    const name = this.selectedPathway;
    console.log(name);
    const interval = 3000;
    if(this.myDiagram){
    this.animateMap(name, interval, this.myDiagram);
    }else{
      console.log('No Diagram');
    }
  }

  stopAnimation(): void {
    console.log("Time lapse stopped");
    
  }


  private animateMap(name: string, interval: number, myDiagram:go.Diagram): void{
    console.log('Starting Animation');
    let timePoint = 0; // Starting at timepoint 0
  
    const data = this.colourArray.find(item => item.pathway === name);
    //console.log(data);
    //console.log(data.colours);

    //const node = this.myDiagram.findNodeForKey(nodeKey);
    const timeSeries = data.colours;

    const animationInterval = setInterval(() => {
      if (timePoint < timeSeries.length) {
      // For the current time point, update each node's color
      console.log(timeSeries[timePoint]);
      timeSeries[timePoint].forEach((item: { node: string; colour: string }) => {
          const node = myDiagram.findNodeForKey(item.node);
          //console.log(item);
          if (node) {
            //diagram.startTransaction("Change Color");

            console.log('node match found');
            //console.log(node);
            console.log(item.node);
            //console.log(item);
            console.log(item.colour);
            const key = item.node;
            const colour = item.colour
            const nodeColour = node.data.colour;
            console.log(nodeColour);
            //const nodeColour = node.findObject("Shape").colour;
            //console.log(nodeColour);
            //console.log(item.colour);
            //console.log(item.colour);
            const animation = new go.Animation();
            animation.add(node, "fill", node.data.colour, colour);
            animation.duration = 1000; // Transition duration of 1 second
            animation.start();
          }
        });timePoint++;
      }else{
        clearInterval(animationInterval);
        }
      }, interval);
}
  

    

} 

