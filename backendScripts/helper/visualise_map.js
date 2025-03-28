

// Jennifer O'Halloran
// IBIX2 Group Project 2025
// Date: 25/03/2025
// Mapping inialisation functions - builds mapping Model



// Initilaisation Function
// This can be exported and called externally in link.js 


const go = require('gojs');
const util = require('util');

function initialiseMap(inputNodes,inputEdges){
  console.log('Initialising Map');

  var $ = go.GraphObject.make;
  
  // Create the GoJS Diagram
  var myDiagram = $(go.Diagram, "myDiagramDiv", {
    initialContentAlignment: go.Spot.Center,
    "undoManager.isEnabled": true,
    initialAutoScale: go.AutoScale.Uniform
  });
/*
  // TEMPLATE FOR LAYOUT
  myDiagram.layout = new go.LayeredDigraphLayout({
    // Set optional parameters for the layout
    direction: 0,
    layerSpacing: 30,  // Space between layers (nodes grouped in layers)
    columnSpacing: 30,  // Space between columns (nodes within the same layer)
    setsPortSpots: false,  // Don't automatically adjust port spots (ports can be manually set)
    aggressiveOption: go.LayeredDigraphLayout.Aggressive, // Aggressiveness of the layout (adjusts edge crossings)
    initializeOption: go.LayeredDigraphLayout.InitDepthPriority // Set initial node depth ordering (helps to minimize crossings)
  });


  // TEMPLATE FOR COMPOUNDS 
    myDiagram.nodeTemplateMap.add("compound",  // Custom category for compound nodes
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
    myDiagram.linkTemplate =
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
  myDiagram.linkTemplateMap.add("maplink",  // Link type category
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


  // TEMPLATE FOR ENZYME NODES
    myDiagram.nodeTemplateMap.add("enzyme",  // Custom category for compound nodes
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
    );

    // TEMPLATE FOR MAP NODES
    myDiagram.nodeTemplateMap.add("map",  // Custom category for compound nodes
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
        ),
        {
          toolTip:  // Create ToolTip when hovering over a node
            $(go.Adornment, "Auto",
              $(go.Shape, { fill: "#FFFFCC" }),  // Tooltip background color
              $(go.TextBlock, { margin: 4 }, new go.Binding("text", "toolTipText"))
            )
        }
    );

  // TEMPLATE FOR REACTION GROUPS
    myDiagram.groupTemplate =
    new go.Group("Horizontal")
      .add(
        new go.Panel("Auto")
          .add(
            new go.Shape("Rectangle", {  // surrounds the Placeholder
                parameter1: 0,
                fill: "#F2F2F2"
              }),
            new go.Placeholder(    // represents the area of all member parts,
                { padding: 10})  // with some extra padding around them
          ),
        new go.TextBlock({         // group title
            visible: false
          })
          .bind("text")
      );


*/
  // Assigning Nodes and Links to model - this will be parsed through and assigned
  var model = $(go.GraphLinksModel);

  model.nodeDataArray = inputNodes; 

  model.linkDataArray = inputEdges;
  
  myDiagram.model = model;


  // FUNCTION FOR REMOVING DUPLICATES AND REGROUPING ENZYMES
  // Functions for Removing duplicate reactions and links
  // And changing enzyme groups appropriately -- Will clean up 

  // Function to remove duplicate reaction-type nodes
  function removeDuplicateReactionNodes() {
    var nodesInfo = {};
    var uniqueParentChildCombinations = new Set();

    // Identify all reaction-type nodes
    myDiagram.nodes.each(function(node) {
      if (node.data.type === "reaction") {
        var nodeId = node.data.key;

        // Get the parent nodes (those that link to this node)
        var parents = [];
        myDiagram.links.each(function(link) {
          if (link.toNode === node) {
            parents.push(link.fromNode.data.key);
          }
        });

        // Get the child nodes (those that this node links to)
        var children = [];
        myDiagram.links.each(function(link) {
          if (link.fromNode === node) {
            children.push(link.toNode.data.key);
          }
        });

        // Store the parent-child relationships
        nodesInfo[nodeId] = { parents: parents, children: children };
      }
    });

    // Compare the parent-child relationships of all reaction-type nodes
    var nodesToRemove = [];

    myDiagram.nodes.each(function(node) {
      if (node.data.type === "reaction") {
        var nodeId = node.data.key;
        var nodeData = nodesInfo[nodeId];

        // Create a unique key for the parent-child combination
        var parentChildKey = JSON.stringify(nodeData.parents.sort()) + "_" + JSON.stringify(nodeData.children.sort());

        // If this parent-child combination has already been seen, mark the node for removal
        if (uniqueParentChildCombinations.has(parentChildKey)) {
          nodesToRemove.push(nodeId);
        } else {
          uniqueParentChildCombinations.add(parentChildKey); // Add the unique combination to the set
        }
      }
    });

    // Remove the duplicate nodes
    nodesToRemove = [...new Set(nodesToRemove)]; // Remove duplicates from the removal list


    var enzyme_groups=[];
    myDiagram.nodes.each(function(node) {
      if (node.data.type == "enzyme"){
        enzyme_groups.push({
          key: node.data.key,
          group: node.data.group,
          name: node.data.text,
    });
      }
    });

    var reaction_groups= [];
    myDiagram.nodes.each(function(node) {
      if (node.data.type == "reaction"){
        reaction_groups.push(node.data.key);
      }
    });


    var enzyme_matches=[];
    //console.log(enzyme_groups);
    enzyme_groups.forEach(function(enzyme){
     //console.log(enzyme);
      
      for (let i=0; i<nodesToRemove.length;i++){
        if (enzyme.group == nodesToRemove[i]){
          //console.log("Match! :"+enzyme.group);
          //console.log(nodesToRemove[i]);
          //console.log(enzyme.key);
          //console.log("------------")
          enzyme_matches.push({
            key: enzyme.key,
            group: enzyme.group
          });
        }
      }
    })

    function getNodesWithSameParent(diagram, nodeKey) {
      const node = diagram.findNodeForKey(nodeKey); // Get the node by its key
    
      if (!node) {
        //console.error("Node not found!");
        return [];
      }
    
      const parentGroupKey = node.data.group; // Get the parent group's key
      if (!parentGroupKey) {
        //console.log("This node has no parent (it's not in a group).");
        return [];
      }
    
      // Find all nodes in the same group (same parent)
      const sameParentNodes = [];
      diagram.nodes.each(n => {
        if (n.data.group === parentGroupKey) {
          sameParentNodes.push(n);
        }
      });
    
      return sameParentNodes;
    }

    function getNodesWithSameChild(diagram, nodeKey) {
      const node = diagram.findNodeForKey(nodeKey); // Get the node by its key
    
      if (!node) {
        console.error("Node not found!");
        return [];
      }
    
      const sameChildNodes = [];
      diagram.links.each(link => {
        if (link.fromNode === node) {
          const toNode = link.toNode; // The child node
          // Add nodes that are connected to the same child nodes
          diagram.nodes.each(n => {
            if (n !== node && n !== toNode && (link.toNode === n || link.fromNode === n)) {
              if (!sameChildNodes.includes(n)) {
                sameChildNodes.push(n);
              }
            }
          });
        }
      });
    
      return sameChildNodes;
    }

    function getNodesWithSameParentAndChild(diagram, nodeKey) {
      // Step 1: Get nodes with the same parent
      const sameParentNodes = getNodesWithSameParent(diagram, nodeKey);
      
      // Step 2: Get nodes with the same child
      const sameChildNodes = getNodesWithSameChild(diagram, nodeKey);
    
      // Filter out nodes that are both in the same parent group and share the same child nodes
      const result = sameParentNodes.filter(node => sameChildNodes.includes(node));
    
      return result;
    }


  function areSetsEqual(set1, set2) {
        if (set1.size !== set2.size) {
            return false; // If the sizes are different, the sets are not equal
        }
    
        for (let item of set1) {
            if (!set2.has(item)) {
                return false; // If set2 doesn't have an item from set1, they're not equal
            }
        }
    
        return true; // Sets are equal if all items match
    }

  function getNodesWithSameParentAndChild2(diagram, nodeKey) {
        const node = diagram.findNodeForKey(nodeKey); // Find the node by its key
        
        if (!node) {
          //console.error("Node not found!");
          return [];
        }
      
        // Step 1: Get the parent node (nodes that have outgoing links from the current node)
        const parentNodes = new Set();
        diagram.links.each(link => {
          if (link.toNode === node) {
            parentNodes.add(link.fromNode);  // The 'fromNode' is the parent
          }
        });
      
        if (parentNodes.size === 0) {
          //console.log("This node has no parent.");
          return [];
        }
      
        // Step 2: Get the child nodes (nodes that are connected via outgoing links from the current node)
        const childNodes = new Set();
        diagram.links.each(link => {
          if (link.fromNode === node) {
            childNodes.add(link.toNode);  // The 'toNode' is the child
          }
        });
      
        // Step 3: Find nodes that share the same parent and child nodes
        const result = [];
        diagram.nodes.each(otherNode => {
          if (otherNode === node) return;  // Skip the node itself
      
          // Step 3a: Check if the node shares the same parent
          const otherNodeParentNodes = new Set();
          diagram.links.each(link => {
            if (link.toNode === otherNode) {
              otherNodeParentNodes.add(link.fromNode);  // Get the parents for the other node
            }
          });
      
          // Step 3b: Check if the node shares the same children
          const otherNodeChildNodes = new Set();
          diagram.links.each(link => {
            if (link.fromNode === otherNode) {
              otherNodeChildNodes.add(link.toNode);  // Get the children for the other node
            }
          });
          
          // Step 3c: Compare the parent and child nodes
          if (areSetsEqual(parentNodes, otherNodeParentNodes) && areSetsEqual(childNodes, otherNodeChildNodes)) {
            result.push(otherNode.data);
          }
        });
      
        return result;
      }




  function removeMatchingObjects(arr, keyList) {
        return arr.filter(obj => !keyList.includes(obj.key));
    }
      
    var corresponding_reactions = [];
    nodesToRemove.forEach(node=>{
        //console.log("Searching: "+node);
        const nodesWithSameParentAndChild = getNodesWithSameParentAndChild2(myDiagram, node);
        //console.log(nodesWithSameParentAndChild);
        let filteredNodes = removeMatchingObjects(nodesWithSameParentAndChild,nodesToRemove);
        //console.log(filteredNodes);
        corresponding_reactions.push({
          removednode: node,
          matchingnodes: filteredNodes[0].key
        })
    });

    //console.log(corresponding_reactions);

    enzyme_matches.forEach(match=>{
      //console.log(match);
      nodesToRemove.forEach(node=>{
        if (node == match.group){
          //console.log(node);
          //console.log("match!");
          var enzyme_node = myDiagram.findNodeForKey(match.key);

          if (enzyme_node) {
            corresponding_reactions.forEach(node_removed=>{
              //console.log(node_removed.removednode);
              //console.log(enzyme_node.data.group);
              if (enzyme_node.data.group == node_removed.removednode){
                let group = node_removed.matchingnodes
                myDiagram.model.setDataProperty(enzyme_node.data, "group", group);
              }
            })
          }
          var enzyme_node = myDiagram.findNodeForKey(match.key);
          //console.log(enzyme_node.data);
        }
      })
      //console.log("Enzyme-Nodes to Remove matches:" +match);
    });

    nodesToRemove.forEach(function(nodeId) {
      var node = myDiagram.findNodeForKey(nodeId);
      if (node) {
        myDiagram.remove(node);
      }
    });

    //console.log("Removed Duplicate Nodes:", nodesToRemove);
  }

  // Call the function to remove duplicate reaction-type nodes
  removeDuplicateReactionNodes();

  const diagramModel = myDiagram.model;
  //console.log(diagramModel);
  const nodesProcessed = diagramModel.nodeDataArray;
  const edgesProcessed = diagramModel.linkDataArray;

  return {nodesProcessed,edgesProcessed};
}



// Initialize the diagram -- called from link.js with Node and Link arrays 


module.exports = {
  initialiseMap
};
