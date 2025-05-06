
/*** 
 * // Date: 25/03/2025
 * // Jennifer O'Halloran
 * // IBIX2 Group Project 2025 
***/

/***
// Map Initilaisation Function

// Creates a instance of a Go.JS to compare and remove nodes 
// Removes duplicate reaction nodes by comparing parent and child compound ndoes 
// Removes enzymes within the same reaction group 
***/

const go = require('gojs');


// ----- Removing Duplicate Reaction Nodes ---- 
  // Function to remove duplicate reaction-type nodes
  // Regroups Enzymes based on reaction nodes removed 
function removeDuplicateReactionNodes(myDiagram) {
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
    enzyme_groups.forEach(function(enzyme){

      for (let i=0; i<nodesToRemove.length;i++){

        if (enzyme.group == nodesToRemove[i]){

          enzyme_matches.push({
            key: enzyme.key,
            group: enzyme.group
          });
        }
      }
    })

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
          console.error("Node not found!");
          return [];
        }
      
        // Get the parent node (nodes that have outgoing links from the current node)
        const parentNodes = new Set();
        diagram.links.each(link => {
          if (link.toNode === node) {
            parentNodes.add(link.fromNode);  // The 'fromNode' is the parent
          }
        });
      
        if (parentNodes.size === 0) {
          console.log("This node has no parent.");
          return [];
        }
      
        // Get the child nodes (nodes that are connected via outgoing links from the current node)
        const childNodes = new Set();
        diagram.links.each(link => {
          if (link.fromNode === node) {
            childNodes.add(link.toNode);  // The 'toNode' is the child
          }
        });
      
        // Find nodes that share the same parent and child nodes
        const result = [];
        diagram.nodes.each(otherNode => {
          if (otherNode === node) return;  // Skip the node itself
      
          // Check if the node shares the same parent
          const otherNodeParentNodes = new Set();
          diagram.links.each(link => {
            if (link.toNode === otherNode) {
              otherNodeParentNodes.add(link.fromNode);  // Get the parents for the other node
            }
          });
      
          // Check if the node shares the same children
          const otherNodeChildNodes = new Set();
          diagram.links.each(link => {
            if (link.fromNode === otherNode) {
              otherNodeChildNodes.add(link.toNode);  // Get the children for the other node
            }
          });
          
          // Compare the parent and child nodes
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
        // Assessing nodes for parent and child relationships
        const nodesWithSameParentAndChild = getNodesWithSameParentAndChild2(myDiagram, node);
        
        let filteredNodes = removeMatchingObjects(nodesWithSameParentAndChild,nodesToRemove);

        corresponding_reactions.push({
          removednode: node,
          matchingnodes: filteredNodes[0].key
        })
    });

    enzyme_matches.forEach(match=>{
      //console.log(match);
      nodesToRemove.forEach(node=>{
        if (node == match.group){

          var enzyme_node = myDiagram.findNodeForKey(match.key);

          

          if (enzyme_node) {
            corresponding_reactions.forEach(node_removed=>{

              if (enzyme_node.data.group == node_removed.removednode){

                let group = node_removed.matchingnodes
                myDiagram.model.setDataProperty(enzyme_node.data, "group", group);
              }
            })

          }
          var enzyme_node = myDiagram.findNodeForKey(match.key);

        }
      })
    });


    nodesToRemove.forEach(function(nodeId) {
      var node = myDiagram.findNodeForKey(nodeId);
      if (node) {
        myDiagram.remove(node);
      }
    });

    console.log("Removed Duplicate Nodes:", nodesToRemove);
  }

// --------------  Processing Function ------------------
// Creates Go.js model to assign nodes and edges 
// Calls above functions 
// Returns Processed Nodes and Edges for Mapping 

function getMapNodes(inputNodes,inputEdges){


  var $ = go.GraphObject.make;
  
  // Create the GoJS Diagram
  var myDiagram = $(go.Diagram, "myDiagramDiv", {
    initialContentAlignment: go.Spot.Center,
    "undoManager.isEnabled": true,
    initialAutoScale: go.AutoScale.Uniform
  });

  // Assigning Nodes and Links to model - this will be parsed through and assigned
  var model = $(go.GraphLinksModel);
  model.nodeDataArray = inputNodes; 
  model.linkDataArray = inputEdges;
  
  myDiagram.model = model;

 // Call the function to remove duplicate reaction-type nodes
  removeDuplicateReactionNodes(myDiagram);
  //removeDuplicateEnzymeNodes(myDiagram);

  let seenNames = new Set();
  let seenReactions = new Set();

  // Remove Replicate Enzymes Nodes
  myDiagram.nodes.each(function(node) {

    if (node.data.type == 'enzyme'){
    // Get the name of the current node
      let nodeName = node.data.text;
      let reaction =node.data.group;

      // If the name has already been seen, remove this node
      if (seenNames.has(nodeName)&& seenReactions.has(reaction)) {

        myDiagram.remove(node);

        } else {
        seenNames.add(nodeName);
        seenReactions.add(reaction);
      }
  }
  });

  // Retrieves the model of the diagram 
  const diagramModel = myDiagram.model;

  // Extracts the Links and Nodes from the Model
  const nodesProcessed = diagramModel.nodeDataArray;
  const edgesProcessed = diagramModel.linkDataArray;

  // Turns the go.Object of Nodes into an Array of Objects to be parsed to the front end.
  var finalNodes = [];

  nodesProcessed.forEach((nodeData) => {
    finalNodes.push(nodeData);
    return finalNodes;
  });

  // Parses Nodes and Edges as Arrays back to merge.js to be sent to the front-end
  return {finalNodes,edgesProcessed};

}


module.exports = {
  getMapNodes
};
