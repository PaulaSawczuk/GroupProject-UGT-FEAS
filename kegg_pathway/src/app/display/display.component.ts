import { Component, ViewChild, ElementRef , HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { enzymeApiServicePost } from '../services/kegg_enzymepathwaysPost.serice';
import * as go from 'gojs';
import { FileDataService } from '../services/file-data.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { filter } from 'rxjs';


declare var figure: any; 

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './display.component.html',
  styleUrls: ['./display.component.css']
})

export class DisplayComponent {
  


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

  enzymePathwayList: string[] = [];

  filteredGenes: any[] = []; // Array of Genes, Logfc and EC number of combined Data 

  pathwayNumber: number = 10; // Hard Coded - but can add functionality for user to change this

  fileNames: any[] = [];

  pathwaySizeData: any[] = [];

  // Creating a GoJS Diagram 
  // Initially set as NULL 
  private myDiagram: go.Diagram | null = null;
  //@ViewChild('myDiagramDiv') private diagramDiv!: ElementRef;

  // the below is a part of blocker logic to make the popup not transparent
  // private activePopups: { nodeKey: any, blocker: go.Part }[] = [];

  // to track the number of popups
  private activePopups: { nodeKey: any }[] = [];

  // Toggle for nodes dropdown visibility
  nodesOpen: boolean = false;

  // List of enzyme categories: e.g., ['Oxidoreductase', 'Transferase']
  enzymeCategories: string[] = [];

  // Map of category → list of enzymes in the displayed pathway
  enzymeCategoryMap: { [category: string]: { ec: string, name: string }[] } = {};


  // List of compounds in the displayed pathway
  compoundList: string[] = [];

  // List of pathways in the displayed pathway
  pathwayList: string[] = [];

  // Floating mini map's overview variable
  myOverview: go.Overview | null = null;

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

  console.log(this.filteredGenes.length);
  console.log(this.filteredGenes);
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



// --------- Enzyme Tally and Processing Functions --------
// Called from extractECNumbers()
// Getting a list of all enzymes present in files
// Mulitple Genes to one enzyme are represented by enzyme duplicated in list 

// Fully Enzyme List is too large query KEGG rest API in succession 
// Enzymes are tallied and sorted in descending order 
// Top 1000 (or can be changed) are selected and submitted to backend to query KEGG
private tallyStrings(items: string[]): Record<string, number> {
  const tally: Record<string, number> = {};

  items.forEach(item => {
    tally[item] = (tally[item] || 0) + 1;
  });

  return tally;
}

// Sorting Enzyme Tally 
private sortTally(tally: Record<string, number>): [string, number][] {
  // Convert the tally object into an array of key-value pairs
  const entries = Object.entries(tally);
  // Sort by the count in descending order
  entries.sort((a, b) => b[1] - a[1]);
  return entries;
}

// Extracting Top enzymes from Tally
private getTopEnzymes(items: string[]): string[] {
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



  
  /** --------  MAP Data Processing Functions -------- **/
  // Function for loading Names of each pathway that is fetched from the backend
  loadNames(): void {
    console.log('Processing Pathway Names');
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
      console.log(response);

      // Storing all the pathways + data to global attribute 
      // This can used to get data for selected map
      this.ALLpathwayData = response;

      console.log('Pathway Data Loaded Successfully');
      this.isLoading = false;
      },
      (error) => {
        console.error('Error:', error);
        this.isLoading = false;
      });
  };

  setMap(code: string, timepoint: number): void {

    console.log("Getting Map Data: "+code);
    // Finding pathway data by its code in pathway array
    const pathway = this.ALLpathwayData.find((obj => obj.pathway === code));
    //console.log(pathway);

    // Extracting nodes and edges 
    var nodes = pathway.nodes;
    var links = pathway.edges;
    console.log('Nodes + Edges Retrieved')
    //console.log(nodes);
    //console.log(links);
    console.log('Loading Differential Expression Data')
    this.compareEnzymes(nodes,timepoint);
    this.changeDiagram(nodes, links);

    // calls this method when user selects another pathway, updates the dropdown node values
    this.populateNodeCategories();

    this.isLoading = false;
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
  
  // Attach the overview panel (floating mini-map)
  this.myOverview = $(go.Overview, "overviewDiv", {
    observed: this.myDiagram,
    contentAlignment: go.Spot.Center,
    drawsGrid: false,
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
        { name: "TEXT", 
          margin: 2,
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
    
      // to make the nodes to show a pop up window when clicked
      this.myDiagram!.addDiagramListener("ObjectSingleClicked", (e) => {
        const part = e.subject.part;
        if (!(part instanceof go.Node)) return;
      
        const node = part;

        
        const data = node.data || {};

        // to check the actual data present in it
        console.log("🧠 Full node data:", data);

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
        const contentText = `
        KEY: ${data.key}
        EC: ${data.text ?? "?"}
        Gene(s): ${Array.isArray(data.gene) ? data.gene.join(", ") : data.gene ?? "N/A"}
        logFC: ${data.logfc ?? "N/A"}
        Name: ${data.name ?? "N/A"}
        `.trim();

      
        // Build the full popup box
        const box = go.GraphObject.make(go.Adornment, "Spot",
          {
            location: node.getDocumentPoint(go.Spot.Bottom),
            layerName: "Tool",
            opacity: 0,
            zOrder: 10 // higher value to keep the box infront of the blocker
          },
          go.GraphObject.make(go.Panel, "Auto",
            go.GraphObject.make(go.Shape, "RoundedRectangle", {
              fill: bgColor,
              stroke: "#ccc",
              strokeWidth: 1,
              shadowVisible: true,
            }),

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
        

        box.adornedObject = node; // Link the popup to the node properly
        node.addAdornment("popup", box);
        //this.activePopups.push({ nodeKey: key ,blocker});
        this.activePopups.push({ nodeKey: key });


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

    // for populating the node categories 
    this.populateNodeCategories();   
    
    // Focus in by default after diagram is initialized, added to make the minimap relevant
    this.myDiagram.addDiagramListener("InitialLayoutCompleted", () => {
      // Delay zoom to ensure layout is fully rendered
      // Animate zoom-in to center of the diagram
      //this.myDiagram!.zoomToFit(); // Show whole map first

      setTimeout(() => {
        const allNodes = this.myDiagram!.nodes;
        const firstNode = allNodes.first();
        if (!firstNode) return;
      
        this.myDiagram!.commandHandler.scrollToPart(firstNode);
        this.myDiagram!.startTransaction("initialZoom");
      
        this.myDiagram!.scale = 0.65; // Controlled zoom-in level
        this.myDiagram!.centerRect(firstNode.actualBounds); // Center the node
        this.myDiagram!.commitTransaction("initialZoom");
      }, 400);
      
      /*
      setTimeout(() => {
        const bounds = this.myDiagram!.documentBounds;
        const center = bounds.center;
        const scale = Math.min(1.5, this.myDiagram!.scale * 1.5);
      
        const anim = new go.Animation();
        anim.duration = 800;
        anim.easing = go.Animation.EaseOutExpo;
        anim.add(this.myDiagram!, "scale", this.myDiagram!.scale, scale);
        anim.add(this.myDiagram!, "position", this.myDiagram!.position, center.offset(-300, -300));
        anim.start();
      }, 300); */     
    });
  }

 // method for populating the node categories
  populateNodeCategories(): void {
    if (!this.myDiagram) return;
  
    //console.log("🧠 Full node data array:", this.myDiagram.model.nodeDataArray);


    const nodeDataArray = this.myDiagram.model.nodeDataArray;
  
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
          this.enzymeCategoryMap[category].push({ ec, name });
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
    this.enzymeOptions = [];
    for (const category of this.enzymeCategories) {
      for (const enzyme of this.enzymeCategoryMap[category]) {
        this.enzymeOptions.push(enzyme);
      }
    }

  this.CompoundOptions = [...this.compoundList];
  this.PathwayOptions = [...this.pathwayList];
  }
  
  // method for highlighting the node when an item in the dropdown is clicked
  selectNodeFromDropdown(nodeKeyOrName: string, nodeType: string): void {
    if (!this.myDiagram) return;
  
    const nodeDataArray = this.myDiagram.model.nodeDataArray;
  
    let match: any;

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
  
    const node = this.myDiagram.findNodeForData(match);
    if (!node) {
      console.warn(`Node instance not found for:`, match);
      return;
    }
    
    // Highlight node
    this.myDiagram.select(node);
    this.myDiagram.centerRect(node.actualBounds);

    // Zoom and center
    this.myDiagram.commandHandler.scrollToPart(node);
    this.myDiagram.scale = 1.1;
    this.myDiagram.centerRect(node.actualBounds);
  }
  

  // --------------- Updating GO.js Model -------------------
  // Updates the pre-existing Diagram Model
  updateDiagram(nodes: any[], links: any[]): void{
    if (this.myDiagram){
    console.log('Updating Diagram');  
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
  timepoints = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  selectedPathway: string = this.pathways[0];
  selectedTimeIndex: number = 0;
  SelectedPathwayName: string = '';
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
    console.log(this.selectedTimepoint);
    console.log(this.selectedTimeIndex);
    //console.log(this.filteredGenes[this.selectedTimepoint][0]);

    // Retrieving Mapping Data from stored arrays
    // Specifcying the timepoint -- can be set default to 0 (first file)
    this.setMap(code, this.selectedTimeIndex);
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


  updateTimeFromClick(event: MouseEvent) {
    if (this.sliderLine) {
      const rect = this.sliderLine.nativeElement.getBoundingClientRect();
      const clickPosition = event.clientX - rect.left;
      const sliderWidth = rect.width;
      const timeIndex = Math.round((clickPosition / sliderWidth) * (this.timepoints.length - 1));

      if (timeIndex >= 0 && timeIndex < this.timepoints.length) {
        this.selectedTimeIndex = timeIndex;
        console.log(this.selectedTimeIndex);
      }
    }
  }


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

  // Add files
  addFiles() {
    if (this.uploadedFiles.length > 0) {
      console.log('Files to be added:', this.uploadedFiles);
      
      // TODO: Add functionality to add and process more files to already existing ones

      this.closeUploadModal(); // Close the modal after adding
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

  openCustomTab(): void {
    console.log('customTabOpen True');
    console.log('customTabExists True');
    this.customTabOpen = true;
    this.customTabExists = true;
    this.pathwaysOpen = false;
  }

  closeCustomTab(): void {
    console.log('closeCustomTab() called');
    this.customTabOpen = false;
    this.customTabExists = false;
    console.log('customTabOpen False');
    console.log('customTabExists False');

  }

  isPathwaysActive(): boolean {
    return !this.customTabOpen && this.customTabExists;
  }

  showPathwaysFromIcon(event: Event): void {
    event.stopPropagation();
    this.customTabOpen = false;
    this.pathwaysOpen = true;

    console.log('customTabOpen false');
    console.log('pathwaysOpen true');

  }

  showCustomiseView(): void {
    this.customTabExists = true;
    this.customTabOpen = true;
    this.pathwaysOpen = false;

    console.log('customTabExists true');
    console.log('customTabOpen true');
    console.log('pathwaysOpen false');

  }

  selectCustomOption(): void {
    console.log('Customisation option selected');
  }

  
  showPathways() {
    this.customTabOpen = false;
    this.pathwaysOpen = true;
  }

  isCustomiseOpen(): boolean {
    console.log('isCustomiseOpen() called');
    console.log('customTabOpen: ', this.customTabOpen);
    return this.customTabOpen;
  }

  //  ------------------ POPULATE SELECT BOXES -------------------
  // Variables to hold the data being populated in the boxes
  enzymeOptions: { ec: string; name: string }[] = [];
  subcategoryOptions: string[] = [];
  CompoundOptions: string[] = [];
  PathwayOptions: string[] = [];
  
  // Selected by the user values - initially empty
  selectedEnzyme: string = '';
  selectedSubcategory: string = '';
  selectedCompound: string = '';
  selectedPathwayCustom: string = '';
  selectedEnzymeType: string = '';
  filteredEnzymeOptions: { ec: string, name: string }[] = [];

  
  onEnzymeTypeChange() {
    this.selectedEnzyme = ''; // reset enzyme selection
    if (this.selectedEnzymeType && this.enzymeCategoryMap[this.selectedEnzymeType]) {
      this.filteredEnzymeOptions = this.enzymeCategoryMap[this.selectedEnzymeType];
    } else {
      this.filteredEnzymeOptions = [];
    }
  }

  onEnzymeChange() {
    if (this.selectedEnzyme) {
      this.selectNodeFromDropdown(this.selectedEnzyme, 'enzyme');
    }
  }

  /*
  onSubcategoryChange() {
    console.log('Selected subcategory:', this.selectedSubcategory);
  }*/
  
  onCompoundChange() {
    if (this.selectedCompound) {
      this.selectNodeFromDropdown(this.selectedCompound, 'compound');
    }
  }
  
  onPathwayChange() {
    if (this.selectedPathwayCustom) {
      this.selectNodeFromDropdown(this.selectedPathwayCustom, 'map');
    }
  }

} 