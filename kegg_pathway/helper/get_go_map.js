

// Date: 27/03/2025
// Jennifer O'Halloran
// IBIX2 Group Project 2025 


// Function  - get_go_map.js
// Inputs: 
// Outputs: 


// Takes EC pathway code and fetches KGML of that pathway from KEGG API.
// ProcessKGML - Returns Relations, Entries and Reactions for the KGML
// getNodesEdges - Takes KGML elements and gets NODEs and LINKS in GO.JS format for visualisation








import xml2js from 'xml2js';
import xpath from "xml2js-xpath";
import https from 'https'
import util from 'util';






async function getKGML(mapCode) {
    var url = 'https://rest.kegg.jp/get/'+mapCode+'/kgml';
    console.log(url);
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let data = '';
            
            // Listen to the data event to collect chunks
            response.on('data', chunk => {
                data += chunk.toString();;
            });

            // When the response ends, resolve the promise with the collected data
            response.on('end', () => {
                resolve(data);
            });

            // Handle errors in the request
            response.on('error', (err) => {
                reject(err);
            });
        });
    });
}

function getEntries(data){
    var entries = '';
    xml2js.parseString(data, function(err, json) {
                    entries = xpath.find(json, "//entry");

                  });
    return entries;
}

function getReactions(data){
    var reactions = '';
    xml2js.parseString(data, function(err, json) {
                    reactions = xpath.find(json, "//reaction");

                  });
    return reactions;
}

function getRelations(data){
    var relations = '';
    xml2js.parseString(data, function(err, json) {
                    relations = xpath.find(json, "//relation");

                  });
    return relations;
}

export async function processKGML(mapCode) {

    //var mapCode='ec00020'
    var data='';
    try {
        
        // Wait for the data to be fetched from the URL
        console.log("Getting Data");
        data = await getKGML(mapCode); // Wait for the data before continuing

    } catch (error) {
        console.error('Error:', error);
    }
    //console.log(data);
    //convertKGML(data);
    const entries = getEntries(data);
    //console.log(entries);
    const relations = getRelations(data);
    //console.log(relations);
    const reactions = getReactions(data);
    //console.log(reactions);

    return {entries, relations, reactions};
}


function getPosition(entry){

    //console.log(entry.graphics);
        //console.log(entries[i].graphics['$'])
    const element = entry.graphics;
        //console.log(entry[0]['$'].name);
    //console.log(element[0]['$'].x);
    const x = element[0]['$'].x;
    //console.log(element[0]['$'].y);
    const y = element[0]['$'].y;
    return{x,y};
}

function findNodesByKeyPrefix(prefix) {

    nodes.each(function(node) {
      if (node.key.toString().startsWith(prefix.toString())) {
        console.log("Found node with key starting with: " + prefix);
        console.log("Node data: ", node);  // Output the node data
        // Do something with the node, e.g., select it
        //node.isSelected = true;  // Select the matching node
      }
      return
    });
  }



export function getNodesEdges(entries, reactions, relations){
    //console.log(reactions);
    var nodes = [];
    var edges = []; 
    var reaction_nodes=[];
    

    for (let i = 0; i < reactions.length; i++) {
        const reaction_id = "R"+reactions[i].$.id
        
        //console.log(reactions[i]);
        //getPosition()
        nodes.push({
            // Adding Reaction Nodes
                    key: reaction_id,
                    text: reactions[i].$.name,
                    type: 'reaction',
                    category:'reaction',
                    isGroup: true
            });
        
        for (let j = 0; j < reactions[i].substrate.length; j++){

            nodes.push({
            // Adding Substrate Nodes
                    key: reactions[i].substrate[j].$.id,
                    text: reactions[i].substrate[j].$.name,
                    type: 'compound',
                    category:"compound"


        });
            
            // Adding Edges 
            //const edge_id = reactions[i].substrate[j].$.id+reaction_id;
            edges.push({
                    //id: edge_id,
                    from: reactions[i].substrate[j].$.id,
                    to: reaction_id
                    //type: reactions[i].$.type,
            });

            // Adding Reaction Node to list of Reaction nodes
            reaction_nodes.push({
                data: {
                    id: reaction_id,
                    name: reactions[i].$.name,
                }

            });
        };

        for (let j = 0; j < reactions[i].product.length; j++){
 
            const positions = entries.forEach(function(entry){
                //console.log(entry.$.name)
                if (entry.$.name==reactions[i].product[j].$.name){
                    //console.log('Match');
                    //console.log(entry.$.name);
                    //console.log(reactions[i].product[j].$.name);
                    const positions = getPosition(entry);
                    //console.log(positions);
                    return positions;
                }


            })

            nodes.push({
                // Adding Product Nodes
                    key: reactions[i].product[j].$.id,
                    text: reactions[i].product[j].$.name,
                    type: 'compound',
                    category: 'compound',
                    position: positions
                    //type: "P",
        });
            const edge_id = reaction_id+reactions[i].product[j].$.id
            //console.log(edge_id);
            edges.push({
                    //id: edge_id,
                    from: reaction_id,
                    to: reactions[i].product[j].$.id,
                    //type: reactions[i].$.type,
        });


        };

    };

    for (let i = 0; i < entries.length; i++){
        if (entries[i].$.type=='map'){

            nodes.push({
                // Adding Substrate Nodes
                        key: entries[i].$.id,
                        text: entries[i].$.name,
                        name: entries[i].graphics[0].$.name,
                        type: 'map',
                        category:'map'
    
    
            });

        }

        }
    
    // Getting Enzyme Entries 
    for (let i = 0; i < entries.length; i++){
        //console.log(entries[i]);
        
        if (entries[i].$.type=='enzyme'){
            var matches=[];
            for (let j = 0; j < reaction_nodes.length; j++){
                //console.log(reaction_nodes[j]);
                
                if (entries[i].$.reaction == reaction_nodes[j].data.name){

                    matches.push(reaction_nodes[j].data.id);
                    //console.log(matches);
                    matches = matches.filter((value, index, self) => self.indexOf(value) === index);
                    //console.log(matches);
                    
                    for (let k = 0; k < matches.length; k++){
                        //console.log('Reaction Node ID: '+matches[k]);
                        //console.log('Enzyme Node ID: '+entries[i].$.id);
                        var edge_id = entries[i].$.id+matches[k];
                        //console.log('Edge ID: '+edge_id);

                        const positions= getPosition(entries[i]);
                        //console.log(positions);

                        nodes.push({
                            // Adding Enzyme Nodes
                                key: edge_id,
                                text: entries[i].$.name,
                                type: 'enzyme',
                                category:'enzyme',
                                colour: "lightgrey",
                                group: matches[k],
                                position: positions,
                                //type: "E",
                            });
                    }
                }
            }
        }
    }
    
    for (let i=0; i<nodes.length;i++){
        //console.log(nodes[i]);
        if (nodes[i].type == "map"){
            //console.log(nodes[i].key);
            let key = nodes[i].key;
            for (let j=0; j<relations.length;j++){
                //console.log(relations[j].$.type);
                if (relations[j].$.type == 'maplink'){
                    //console.log(relations[j].$.type);
                    //console.log(relations[j]);
                    let entry1 = relations[j].$.entry1
                    let entry2 = relations[j].$.entry2
                    if (key == entry1){

                        edges.push({
                            //id: edge_id,
                            from: key,
                            to: relations[j].subtype[0].$.value,
                            category: 'maplink'
                        });
                    }
                    if (key == entry2){

                        edges.push({
                            //id: edge_id,
                            from: relations[j].subtype[0].$.value,
                            to: key,
                            category: 'maplink'
                        });

                    }else{
                        continue
                    }
                }
            }
        }
    }






    const uniqueNodes = nodes.filter((value, index, self) => 
    index === self.findIndex((t) => (
        t.key === value.key
        ))
    );

    function removeDuplicates(list) {
        let uniqueObjects = [];  // To store unique objects
        let seen = new Set();  // To track unique {from, to} combinations
        
        list.forEach(function(item) {
          // Create a unique identifier based on the {from, to} properties
          let identifier = `${item.from}-${item.to}`;
          
          // Check if this combination has been seen before
          if (!seen.has(identifier)) {
            // If not, add it to the unique objects list and mark it as seen
            uniqueObjects.push(item);
            seen.add(identifier);
          }
        });
      
        return uniqueObjects;  // Return the list without duplicates
      }
    
    edges=removeDuplicates(edges);

    //console.log(uniqueNodes);
    //console.log('Number of Nodes: ',uniqueNodes.length);
    //console.log('Number of Edges:',edges.length);


    //console.log(uniqueNodes)

    console.log('------------');
    console.log('ALL DONE - processKGML');
    return{ uniqueNodes, edges}

    //int.initializeCytoscape(uniqueNodes, edges);
}



//processKGML();