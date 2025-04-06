import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { enzymeApiServicePost } from '../services/kegg_enzymepathwaysPost.serice';
import * as go from 'gojs';
import { FileDataService } from '../services/file-data.service';

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

  enzymePathwayList: string[] = [];

  filteredGenes: any[] = [];

  pathwayNumber: number = 10;

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

private getEnzymeGenes(): void{
  const combinedData = this.fileDataService.getCombinedData();
  const expresseionData = this.fileDataService.getExpressionData();
  const annotationData = this.fileDataService.getAnnotationData();
  console.log(combinedData.keys());
  console.log(expresseionData);
  console.log(annotationData);

  //console.log('Combined data:', combinedData); // Add debug logging
  var geneEnzymes: any[] = []; // Use Set to avoid duplicates
  var filteredSet: Set<any> = new Set()
  
  if (combinedData && combinedData.length > 0) {
    // Loop through the combined data to find EC numbers
    for (const item of combinedData) {
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
  }
  console.log(geneEnzymes);
  this.filterEnzymeGenes(geneEnzymes);
}

private filterEnzymeGenes(geneEnzymes:any[]):void{

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
  const filteredArray = geneEnzymes.filter(item => {
    return item.enzyme && (!Array.isArray(item.enzyme) || item.enzyme.length > 0);
  });
  //console.log(filteredArray);
  this.filteredGenes = filteredArray;
}

private extractECNumbers2(): void {
  var enzymeList: Set<any> = new Set()

  const genes = this.filteredGenes;
  for (let i=0; i<genes.length; i++){
    let enzyme = genes[i].enzyme[0];
    //console.log(enzyme);
    enzymeList.add(enzyme);
  }
  //console.log(enzymeList)
  this.enzymeList = Array.from(enzymeList);

}

  
  /** --------  MAP Data Processing Functions -------- **/
  // Function for loading Names of each pathway that is fetched from the backend
  loadNames(): void {
    this.pathways = this.pathwayData.map(pathway => pathway.name);
  }

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
  }

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
  }
  isLoading: boolean = false;

  
  // -------------- Sending Pathway Request to Back-end ---------------------
  // Fetches relevant pathways when the Display component is initialised

  /** --------  POST REQUEST Functions -------- **/

  ngOnInit(): void {

    // Loading Screen
    this.isLoading = true;
    // Processing Input Data (1 contrast) - Match Genes and Extracting LogFc + EC numbers
    this.getEnzymeGenes();
    // Getting List of Enzymes from Input Data
    this.extractECNumbers2();
    // Setting up Data Array to send to back-end API
    const data = [this.enzymeList, this.pathwayNumber];
    this.enzymeApiServicePost.postEnzymeData(data).subscribe(
      (response) => {
        // Handle the successful response
        this.pathwayData = response;
        this.loadNames();
        console.log('Received from backend:', response);
        this.isLoading = false; 
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
  // Returns Mapping Data for relevant (Nodes and Links)
  // Calls Data Processing functions (loadNodes, loadLinks)
  // Changes Diagram 
  getMapData(code: string): void {

    const data = [code, this.filteredGenes];
    this.isLoading = true;
    this.enzymeApiServicePost.postMapData(data).subscribe(
      (response) => {

        this.mapData = response;
        console.log('Received from backend:', response);
        console.log('Loading data');
        var nodes = this.loadNodes();
        var links = this.loadLinks();

        // Loading a list of enzymes present in the map
        var enzymes = this.loadEnzymes();



        this.changeDiagram(nodes, links);
        this.isLoading = false;
      },
      (error) => {
        console.error('Error:', error);
        this.isLoading = false;
      }
    );
  };

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
  // Enzyme Node template with node shape as enzyme type
  this.myDiagram.nodeTemplateMap.add("enzyme",
  new go.Node("Auto") // "Auto" layout allows the node to adapt its size automatically
  .add(
    new go.Shape("Rectangle", 
      {
        name: "RECTANGLE",
        fill: "lightgrey", 
        width: 50,
        height: 30, 
        stroke: 'black',             // Border (stroke) color is set to blue
        strokeWidth: 3, 
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
            return "Capsule"
          case "Translocase":
            return "Square";
          case "Isomerase":
              return "TriangleDown";
          default:
            return "Rectangle"; // Default shape
        }
      })
      .bind("fill","colour")
    ).add(new go.TextBlock(
      { margin: 2,
        font: "10px sans-serif",
        wrap: go.TextBlock.WrapFit,
      width: 80 })
      .bind("text")
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

    this.selectedTimeIndex = 0;
    // Retrieving Mapping Data from Backend
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

  isCustomisationPanelOpen: boolean = false;

  onCustomisationPanelToggle() {
    this.isCustomisationPanelOpen = !this.isCustomisationPanelOpen;
  }
}

