import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { enzymeApiServicePost } from '../services/kegg_enzymepathwaysPost.serice';
import * as go from 'gojs';
import { FileDataService } from '../services/file-data.service';
import { filter } from 'rxjs';

declare var figure: any; 

@Component({
  selector: 'app-display',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  //const firstFile = combinedData[0];
  var filteredFiles = [];
  //console.log('First File: '+firstFile);
  for (let i=0; i<combinedData.length; i++){
    const file = combinedData[i];
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
          if (key.includes('_log2FoldChange')&& item[key]){
            logfc = item[key];
          }

          if (key.includes("_EC") && item[key]) {
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
  const tally = this.tallyStrings(items);       // Step 1
  const sortedTally = this.sortTally(tally);    // Step 2

  // Step 3: Select the top 100 items and extract only the names (keys)
  const top100Names = sortedTally.slice(0, 1000).map(entry => entry[0]);
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

    // Assinging filenames from ExpressionData 
    // Can be used to create list to select which to view 
    // Also good for debugging 
    const files = this.fileDataService.getExpressionData();
    const fileNames = Object.keys(files);
    console.log(fileNames);
    this.fileNames = fileNames;
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
          return "Square";
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
  pathwaysOpen = false;
  exportOpen = false;
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
        console.log(this.selectedTimeIndex);
      }
    }
  }

  isCustomisationPanelOpen: boolean = false;

  onCustomisationPanelToggle() {
    this.isCustomisationPanelOpen = !this.isCustomisationPanelOpen;
  }
}

