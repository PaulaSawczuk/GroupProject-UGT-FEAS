/*** 
 * // Date: 38/03/2025
 * // Jennifer O'Halloran
 * // IBIX2 Group Project 2025 
***/

/***
// Function  - merge.js
// Central script that calls the processing functions 
// Utilised by server.js to link front and backend 
***/

const { getElements, getEnzymeNames, getEnzymeCodes, getEnzymeType } = require('./getElements2');
const { getNodesEdges } = require('./get_go_map');
const { processKGML } = require('./get_go_map');
const { processRN } = require('./get_go_map');
const { addCompoundLinks } = require('./get_go_map');
const { getMapNodes } = require('./visualise_map');


// Takes Compound Name extracted from KEGG text response
// Assignns names to matching and updating Nodes
function getCompoundNames(compounds, nodes){
    console.log('------------');
    console.log('Matching Compound Entry Names to Nodes');
    console.log('------------');

    for (let i = 0; i< nodes.length; i++){
        if (nodes[i].type == 'compound'){
            //console.log(nodes[i]);
            //console.log(nodes[i].text);
            var name = nodes[i].text;
            name = name.replace(/^cpd:/, '');
            //console.log(name);

            
            for (let j = 0; j< compounds.length; j++){
                //console.log(compounds[j].id);
                if (compounds[j].id == name ){
                    //console.log(compounds[j].id);
                    //console.log(name);
                    //console.log(compounds[j].name);
                    nodes[i].text = compounds[j].name
                } else {
                    continue
                }

            }
            //console.log(nodes[i]) 
        }else{
            continue;
        }
    }
    console.log('ALL DONE - getCompound Names');
}

// Takes Enzyme Names extracted from KEGG text response
// Assignns names to matching enzymes -- updates nodes
function matchEnzymeNames(enzymeNames, nodes){
    console.log('------------');
    console.log('Matching Enzyme Names to Nodes');
    console.log('------------');
    //console.log(compounds);
    //console.log(nodes)

    //console.log(compounds[0]['id'])

    for (let i = 0; i< nodes.length; i++){
        if (nodes[i].type == 'enzyme'){
            //console.log(nodes[i]);
            //console.log(nodes[i].text);
            var name = nodes[i].text;
            //name = name.replace(/^cpd:/, '');
            //console.log(name);

            
            for (let j = 0; j< enzymeNames.length; j++){
                let enzyme = enzymeNames[j].EC;
                //console.log(enzyme);
                if (enzyme != undefined){
                    enzyme = enzyme.replace('EC', 'ec');
                    //console.log(enzyme);
                    if (name == enzyme){
                        nodes[i].name = enzymeNames[j].name;

                    } else {
                        continue
                    }
                }else{
                    continue
                }

            }
            //console.log(nodes[i]) 
        }else{
            continue;
        }
    }
    console.log('ALL DONE - getEnzymeNames');
    console.log('------------');
}

// --------- MAIN PROCESSING FUNCTION --------
// Takes individual code 
// Combines internal and external function for KEGG API requests, Data Extraction, 
// Processing and Annotation.
// Returns Nodes, Edges, Enzymes List for each pathway entered.
async function processInput(code) {
    console.log('Processing');
    console.log(code);
    console.log('------------');


    // Changing the inputted code to make alternative KEGG requests 
    var ec_pathway = code; // Original Code (ec)
    var rn_pathway = code.replace(/^ec/, 'rn'); // Reaction Code  (rn)
    var ko_pathway = code.replace(/^ec/, 'ko'); // KEGG Orthology Code (ko)
    
    // -------------------------------------------------------------
    // Getting Compounds for the organism specific pathway - used for labelling and indexing 
    var compounds = await getElements(ko_pathway);
    var enzymeNames = await getEnzymeNames(ko_pathway);
    console.log('------------');
    
     // -----------------Data --> Reactions, Entries, and Relations-----------------------------
    
    // Processing the whole KGML parsed
    var kgml_elements = await processKGML(ec_pathway);

    var rn_elements = await processKGML(rn_pathway);
    console.log('------------');


    // ------------------Taking Entries, Reactions and Relations --> Nodes and Edges ----------------------------
    //Getting Element names
    //Getting mapping nodes and edges 
    var map_elements = getNodesEdges(kgml_elements.entries, kgml_elements.reactions,kgml_elements.relations)
    console.log('------------');
    

    // -------- Processing Reaction KGML and Realtions Absent in EC KGML------------


    var RNcompoundLinks = processRN(rn_elements.entries, rn_elements.relations, rn_elements.reactions, map_elements.uniqueNodes);
    var finalEdges = addCompoundLinks(RNcompoundLinks.entryLinks,map_elements.edges);


    // --------------------Re-Labelling Compounds---------------------------
    // Linking names retireved in getElements to Nodes and re-labelling 
    getCompoundNames(compounds, map_elements.uniqueNodes);

    matchEnzymeNames(enzymeNames,map_elements.uniqueNodes);
    

    // ------------------Processing Diagram Model -----------------------------
    // Removing duplicate nodes and enzymes
    const processedElements = getMapNodes(map_elements.uniqueNodes,finalEdges);


    // ----------------------Matching Enzymes Enzyme Type  -------------------------
    // Matching enzyme types to nodes - based on EC Brite Hierarchy Number 

    getEnzymeType(processedElements.finalNodes);


    // ---------------- Parsing the data to the front-end -----------------------
    // Extracting Nodes and Edges 
    let nodeData = processedElements.finalNodes;
    let linkData = processedElements.edgesProcessed;

    // Generating list of enzymes present in map
    var enzymeList = getEnzymeCodes(nodeData);
    enzymeList = Array.from(enzymeList);

    console.log('------------');
    console.log('All Links and Nodes Generated');
    console.log('------------');
    //console.log(nodeData);
    //console.log(linkData);
    return {nodeData,linkData,enzymeList};
  }



// ------ Parsing Function for an Array of Pathways -----
// Takes array of Pathway Objects sent from Front-end (Name:, Pathway(code):)
// Loops through each pathway and passes into processInput()
// KGML Data Extraction and processing response is pushed to an array
// Once all the pathways are processed the output is returned to the front-end.
async function processPathways(pathways){

    console.log(pathways);
    console.log('------------');
    var codes = [];
    pathwayData = [];
    for (let i=0; i<pathways.length;i++){
        //console.log(pathways[i].name);
        //console.log(pathways[i].pathway);
        let name = pathways[i].name;
        let code = pathways[i].pathway;
        //codes.push(code);
        let elements = await processInput(code);
        pathwayData.push({
            name: name,
            pathway: code,
            nodes: elements.nodeData,
            edges: elements.linkData,
            enzymes: elements.enzymeList
        });
        console.log('------------');
        console.log('Pathway Added')
        console.log('------------');
    }
    return pathwayData;
}


// ------ Parsing Function for an Individual Pathway Code -----
// Takes single pathway code of interest
// KGML Data Extraction and processing response is pushed to an array
// Data is sent back to front-end
// Used for Node-Map Click through and Searching for single Pathways 
async function processIndividualPathway(code){

    console.log(code);
    console.log('------------');
    //var codes = [];
    pathwayData = [];
    let elements = await processInput(code);
    pathwayData.push({
        //name: name,
        pathway: code,
        nodes: elements.nodeData,
        edges: elements.linkData,
        enzymes: elements.enzymeList
    });
    console.log('------------');
    console.log('Pathway Added')
    console.log('------------');
    return pathwayData;
}


module.exports = {
    processInput,
    processPathways,
    processIndividualPathway
  };
