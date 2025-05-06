
/*** 
 * // Date: 27/03/2025
 * // Jennifer O'Halloran
 * // IBIX2 Group Project 2025 
***/

/*** 
// Function  - get_go_map.js
// Inputs: 
// Outputs: 


// Takes EC pathway code and fetches KGML of that pathway from KEGG API.
// ProcessKGML - Returns Relations, Entries and Reactions for the KGML
// getNodesEdges - Takes KGML elements and gets NODEs and LINKS in GO.JS format for visualisation
***/


const xml2js = require('xml2js');
const xpath =require ("xml2js-xpath");
const https = require('https')
const util = require('util');

// ---- URL requesting function ------
// Sets up URL request with mapCode provided 
// Parses the data as a string chunk
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

// ----------- KGML PARSING FUNCTIONS -----------
// Parsing Functions that get each element within the KGML
// Takes text data retrieved from KEGG API
// Find specific defined tokens "entry", "reaction", "relation"
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


// ------ Retrieving and Processing KGML ---------
// Takes relevant mapcode.
// Calls getKGML fetch request and then passes into KGML extraction functions
// to retrieve entries, reactions  & relations (get.....)(defined above)
 async function processKGML(mapCode) {

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


// ----- Extracting Enzymes -----
// Extracts and Transforms EC KGML to get Enzyme Nodes 
function getNodesEdges(entries, reactions, relations){
    //console.log(reactions);
    var nodes = [];
    var edges = []; 
    var reaction_nodes=[];
    
    // Processing Reactions Nodes
    var reactionData = getReactionNodes(reactions,entries);
    reaction_nodes = reactionData.reaction_nodes;
    nodes = reactionData.nodes;
    edges = reactionData.edges;

    var compoundNodes = getCompoundNodes(entries);
    //console.log('No of compound nodes: '+compoundNodes.length);

    // Adding Map Nodes
    var mapNodes = getMapNodes(entries);
    mapNodes.forEach(node=>{
        nodes.push(node);
    });

    // Adding Enzyme Nodes
    var enzymeNodes = getEnzymeNodes(reaction_nodes,entries)
    enzymeNodes.forEach(node=>{
        nodes.push(node);
    });

    // Adding Map Links
    var mapLinks = getMapLinks(nodes,relations);
    mapLinks.forEach(link=>{
        edges.push(link);
    });
    
    //uniqueNodes = nodes;

    var count = 0;
    for (let i = 0; i < nodes.length; i++){
        if (nodes[i].type =='compound'){
            count ++;
        }

    }

    //console.log('No of compound Nodes from rn: '+count);
    //console.log('No of nodes: '+nodes.length);
    
    const uniqueNodes = nodes.filter((value, index, self) => 
    index === self.findIndex((t) => (
        t.key === value.key

        ))
    );
    console.log('No of nodes: '+uniqueNodes.length);

    edges=removeDuplicates(edges);

    //console.log(uniqueNodes);
    //console.log('Number of Nodes: ',uniqueNodes.length);
    //console.log('Number of Edges:',edges.length);

    // Adding lost compounds
    const compoundIDs = getCompoundEntries(entries);

    var compoundNodes = addCompounds(uniqueNodes,compoundIDs,entries);
    compoundNodes.forEach(node=>{
        nodes.push(node);
    });

    console.log('------------');
    console.log('ALL DONE - processKGML');
    console.log('------------');
    return{ uniqueNodes, edges}
}


// --- Processing RN KGML elements ---
// Checks against already extracted nodes from the EC KGML
// Find compound-compound entries that are missing 

function processRN(entries, relations, reactions, nodes){
    // get list of reaction names 
    var rn_reactions = [];
    for (let i = 0; i < entries.length; i++){
        if (entries[i].$.type=='reaction'){
            //console.log(entries[i].$);
            //console.log(entries[i].$.reaction);
            var reaction = entries[i].$.reaction;
            var reaction = reaction.split(" ");
            //console.log(reaction);
            reaction.forEach(reaction=> rn_reactions.push(reaction))
            //rn_reactions.push(reaction);

        }

    }
    //console.log(rn_reactions);
    var node_reactions=[];
    for (let i = 0; i < nodes.length; i++){
        if (nodes[i].type == 'reaction'){
            //console.log(nodes[i]);
            let reaction = nodes[i].text;
            //console.log(reaction);

            if (rn_reactions.includes(reaction))
                //console.log('match');
                node_reactions.push(reaction);
        }
    }

    //console.log(rn_reactions);
    //console.log(node_reactions);

    let uniqueToList1 = rn_reactions.filter(item => !node_reactions.includes(item));

    // Find elements in list2 that are not in list1
    let uniqueToList2 = node_reactions.filter(item => !rn_reactions.includes(item));

    // Combine both results to get non-overlapping elements
    let nonOverlapping = [...uniqueToList1, ...uniqueToList2];
    //console.log(nonOverlapping);
    let uniqueList = [...new Set(nonOverlapping)];
    //console.log(uniqueList);
    
    // Matching Unique Reaction to entries in RN
    for (let i = 0; i < entries.length; i++){
        for (let j=0; j<uniqueList.length;j++){
            let reaction = uniqueList[j]
            //console.log(reaction);
            //console.log(entries[i].$.reaction);
            if (entries[i].$.reaction==reaction){
                //console.log(entries[i].$);


            }
        }

    }

    var compoundLinks = [];
    var entryLinks = [];

    for (let i = 0; i < reactions.length; i++){
        //console.log(reactions[i]);
        for (let j=0; j<uniqueList.length;j++){
            let reaction = uniqueList[j]
            //console.log(reaction);
            //console.log(entries[i].$.reaction);
            if (reactions[i].$.name==reaction){
                //console.log(reaction);
                //console.log(reactions[i].substrate);
                //console.log(reactions[i].substrate[0].$.id);
                let substrate = reactions[i].substrate[0].$.id;
                //console.log(reactions[i].product);
                let product = reactions[i].product[0].$.id;
                //console.log(reactions[i].product[0].$.id);
                //console.log('---------------')
                for (let k=0; k<entries.length;k++){
                    var entry1;
                    var id1;
                    var entry2;
                    var id2;
                    if (entries[k].$.id==substrate && entries[k].$.type == 'compound'){
                        //console.log(entries[k].$);
                        entry1=entries[k].$.name;
                        id1=entries[k].$.id;
                        //console.log('entry1: '+entry1);
                    }
                    if (entries[k].$.id==product && entries[k].$.type == 'compound'){
                        //console.log(entries[k].$);
                        entry2=entries[k].$.name;
                        id2=entries[k].$.id;
                        //console.log('entry2: '+entry2);
                        //console.log('Adding Compounds');
                        compoundLinks.push({
                            entry1:entry1,
                            entry2:entry2 
                        })
                        entryLinks.push({
                            from: id1,
                            to: id2
                        })
                    }

                }
            }
        }
    }
    //console.log(compoundLinks);
    console.log('------------');
    console.log('ALL DONE - processRN');
    console.log('------------');
    return {compoundLinks, entryLinks};
}


// -------- GETTING KEGG LINKS ----------
// Extracts URL KEGG link for each entry passed.
// Prevents re-writing the same script repeatedly 
// Only for compound entries
function getURLLinks(entries,id){
    var link;
    for (let i=0; i<entries.length; i++){
        if (entries[i].$.id==id &&  entries[i].$.type=="compound"){
            link = entries[i].$.link;
        }
    }
    return link;

}

// -------- GETTING REACTION NODES ----------
// Extract all reactions within KGML
// Manually creates ID and Node object 
// Finds substrates and products --> transforms to Nodes
// Converts substrate - reaction / reaction - product into link 
function getReactionNodes(reactions,entries){

    var nodes = [];
    var edges = [];
    var reaction_nodes = [];

    for (let i = 0; i < reactions.length; i++) {
        const reaction_id = "R"+reactions[i].$.id
        nodes.push({
            // Adding Reaction Nodes
                    key: reaction_id,
                    text: reactions[i].$.name,
                    type: 'reaction',
                    category:'reaction',
                    isGroup: true
            });
        
        // Finding Substrates
        for (let j = 0; j < reactions[i].substrate.length; j++){

            let link = getURLLinks(entries, reactions[i].substrate[j].$.id);
            nodes.push({
            // Adding Substrate Nodes
                    key: reactions[i].substrate[j].$.id,
                    text: reactions[i].substrate[j].$.name,
                    type: 'compound',
                    category:"compound",
                    link: link
        });
            // Adding Edges 
            edges.push({
                    //id: edge_id,
                    from: reactions[i].substrate[j].$.id,
                    to: reaction_id,
                    category: reactions[i].$.type,
            });
            // Adding Reaction Node to list of Reaction nodes
            reaction_nodes.push({
                data: {
                    id: reaction_id,
                    name: reactions[i].$.name,
                }

            });
        };

        // Finding Products 
        for (let j = 0; j < reactions[i].product.length; j++){
            
            let link = getURLLinks(entries, reactions[i].product[j].$.id);
            nodes.push({
                // Adding Product Nodes
                    key: reactions[i].product[j].$.id, // Entry key
                    text: reactions[i].product[j].$.name, //Entry Name
                    type: 'compound',
                    category: 'compound',
                    link: link // Adding KEGG Website Link 
                    
        });// Adding associated Edge/Link - with Reaction Node 
            edges.push({
                    from: reaction_id,
                    to: reactions[i].product[j].$.id,
                    category: reactions[i].$.type,
        });
        };
    };
    return {nodes, edges, reaction_nodes};
}

// -------- GETTING ENZYME NODES ----------
// Extract all entries in KGML with type 'enzyme'
// Tranforms to a Node object 
// Groups each to a reaction node 
function getEnzymeNodes (reaction_nodes, entries){
    var nodes = [];

    for (let i = 0; i < entries.length; i++){
        //console.log(entries[i]);
        if (entries[i].$.type=='enzyme'){
            var matches=[];
            for (let j = 0; j < reaction_nodes.length; j++){
                //console.log(reaction_nodes[j]);

                // If reaction assigned to Enzyme matches the name of stored reaction 
                if (entries[i].$.reaction == reaction_nodes[j].data.name){
                    matches.push(reaction_nodes[j].data.id);
                    //console.log(matches);
                    matches = matches.filter((value, index, self) => self.indexOf(value) === index);
                    //console.log(matches);
                    for (let k = 0; k < matches.length; k++){
                        var edge_id = entries[i].$.id+matches[k];

                        nodes.push({
                            // Adding Enzyme Nodes
                                key: edge_id, // Original ID 
                                text: entries[i].$.name, // Entry Name
                                type: 'enzyme',
                                category:'enzyme',
                                colour: "lightgrey", // Standard colour for enzyme nodes
                                group: matches[k], // Reaction grouping
                                link: entries[i].$.link, // KEGG website link 
                                width: 75, // Standard Height and width for enzyme nodes
                                height: 40
                            });
                    }
                }
            }
        }
    }
    return nodes;

}

// -------- GETTING MAP NODES ----------
// Extract all entries in KGML with type 'map'
// Tranforms to a Node object 
function getMapNodes(entries){
    var nodes = [];
    for (let i = 0; i < entries.length; i++){
        if (entries[i].$.type=='map'){

            nodes.push({
                // Adding Map Nodes
                        key: entries[i].$.id,
                        text: entries[i].$.name, // Entry Code
                        name: entries[i].graphics[0].$.name, // Entry Name
                        link: entries[i].$.link, // KEGG Website Link
                        type: 'map',
                        category:'map'
    
    
            });
        }
    } // Removing Map node that contains title -- prevents it from floating
    for (let i=0; i<nodes.length; i++){
        //console.log(nodes[i].name);
        if (nodes[i].name.includes('TITLE:')){
        //console.log(nodes[i]);
        let index=i;
        nodes.splice(index, 1)
        }

    }

    return nodes;
}

// -------- GETTING COMPOUND NODES ----------
// Extract all entries in KGML with type 'map'
// Tranforms to a Node object 
// Ensure no gaps 
// All compound are present even if no reaction associated with it
function getCompoundNodes(entries){
    var nodes = [];
    for (let i = 0; i < entries.length; i++){
        if (entries[i].$.type=='compound'){

            nodes.push({
                // Adding Compound Nodes
                        key: entries[i].$.id,
                        text: entries[i].$.name,
                        name: entries[i].graphics[0].$.name,
                        link: entries[i].$.link,
                        type: 'compound',
                        category:'compound'
    
    
            });
        }
    }

    return nodes;
}


// --------- Gets unique Map links -------------
// Find all map realtion entries
// To simplify the visualisation, links with same parent and child ndoes 
// are removed.

function getMapLinks(nodes, relations){

        var links =[];
        var seenLinks=new Set();
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
    
                            var pair = [key,relations[j].subtype[0].$.value];
                            if (isPairInMap(pair,seenLinks) == false){
                                links.push({
                                    from: key,
                                    to: relations[j].subtype[0].$.value,
                                    category: 'maplink'
                                });
                                seenLinks.add(pair);
                            }
                        }
                        if (key == entry2){
                            var pair = [key,relations[j].subtype[0].$.value];
                            if (isPairInMap(pair,seenLinks) == false){
                                links.push({
                                    //id: edge_id,
                                    from: relations[j].subtype[0].$.value,
                                    to: key,
                                    category: 'maplink'
                                });
                                seenLinks.add(pair);
                            }
                        }else{
                            continue
                        }
                    }
                }
            }
        }
        //console.log(links);
        return links;
    }


// called from getMapLinks to evaluate pairs.
function isPairInMap(pair,seenReactions) {
        for (let [key, value] of seenReactions) {
          if (key === pair[0] && value === pair[1]) {
            return true;  // Found the exact match
          }
        }
        return false;  // No match found
    }

// Compares Nodes creates to compounds
// Adds any that are missing.  
function addCompounds(uniqueNodes,compoundIDs,entries){
        var no = 0;
        var knownNodes = [];
        var nodes = [];
        for (let i=0; i<uniqueNodes.length;i++){
            //console.log(map_elements.uniqueNodes[i]);
            let node = uniqueNodes[i];
            //console.log('--------------------')
            if (node.type == "compound"){
                //console.log(node);
                //console.log(node.key)
                no ++;
                knownNodes.push(node.key);
                //console.log(entries[i].$.id);
                }
            }
        //console.log(no);
        //console.log(knownNodes);
    
        let uniqueToList1 = compoundIDs.filter(item => !knownNodes.includes(item));
    
        // Find elements in list2 that are not in list1
        let uniqueToList2 = knownNodes.filter(item => !compoundIDs.includes(item));
    
        // Combine both results to get non-overlapping elements
        let nonOverlapping = [...uniqueToList1, ...uniqueToList2];
    
        //console.log(nonOverlapping);
        //console.log(nonOverlapping.length);
    
        for (let i = 0; i < entries.length; i++){
            if (entries[i].$.type=='compound'&& nonOverlapping.includes(entries[i].$.id)){
                //console.log(entries[i].$.id);
                //console.log(entries[i].$.name);
                //console.log('Compound Added: '+entries[i].$.name);
                nodes.push({
                    // Adding Product Nodes
                        key: entries[i].$.id,
                        text: entries[i].$.name,
                        link: entries[i].$.link,
                        type: 'compound',
                        category: 'compound',
    
            });
            }
        }
        //console.log(nodes);
        return nodes;
    }
  
    
// Get a list of all compound entries present 
// List is used for comparative purposes. 
function getCompoundEntries(entries){
    
        //console.log(entries);
        var compoundList = [];
        for (let i=0; i<entries.length;i++){
    
            if (entries[i].$.type == "compound"){
    
                compoundList.push(entries[i].$.id);
    
            }
        }
        //console.log(compoundList);
        return compoundList;
    
    }

// ------ Adding in Compound-compound RN KGML links ------
// Takes known links identified and already formatted links
// Push each to the links array
function addCompoundLinks(compoundLinks,links){
    //console.log(compoundLinks);
    //console.log(links);
    for (let j = 0; j < compoundLinks.length; j++){
        //console.log('adding Links');
        //console.log(compoundLinks[j]);
        links.push(compoundLinks[j])

        }
    //console.log(links);
    return links;
}
 

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
    

module.exports = {
    processKGML,
    getNodesEdges,
    processRN,
    //getCompoundLinks,
    addCompoundLinks

  };
  





//processKGML();