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


function getCompoundNames(compounds, nodes){
    console.log('------------');
    console.log('Matching Entry Names to Nodes');
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


async function processInput(code) {
    console.log('Processing');
    console.log(code);
    console.log('------------');
    //console.log(genes);
    

    // Here we will just echo back the input, but you can modify this function
    // to perform any logic like math operations, string manipulations, etc.
    var ec_pathway = code;
    var rn_pathway = code.replace(/^ec/, 'rn');
    var ko_pathway = code.replace(/^ec/, 'ko');
    
    // -------------------------------------------------------------
    // Getting Compounds for the organism specific pathway - used for labelling and indexing 
    // NEED TO BE RE-IMPLEMENTED
    var compounds = await getElements(ko_pathway);
    //console.log(compounds);
    var enzymeNames = await getEnzymeNames(ko_pathway);
    console.log('------------');
    
     // -----------------Data --> Reactions, Entries, and Relations-----------------------------
    
    // Processing the whole KGML parsed
    var kgml_elements = await processKGML(ec_pathway);

    var rn_elements = await processKGML(rn_pathway);
    console.log('------------');

    //var ko_elements = await processKGML(ko_pathway)

    // ------------------Taking Entries, Reactions and Relations --> Nodes and Edges ----------------------------
    //Getting Element names
    //Getting mapping nodes and edges 
    var map_elements = getNodesEdges(kgml_elements.entries, kgml_elements.reactions,kgml_elements.relations)
    console.log('------------');
    

    // -------- Processing Reaction KGML and Realtions Absent in EC KGML------------

    //var KOcompoundLinks = processRN(ko_elements.entries, ko_elements.relations, ko_elements.reactions, map_elements.uniqueNodes);
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
    let nodeData = processedElements.finalNodes;
    //console.log(nodeData);
    let linkData = processedElements.edgesProcessed;

    var enzymeList = getEnzymeCodes(nodeData);
    enzymeList = Array.from(enzymeList);
    //console.log(linkData);
    console.log('------------');
    console.log('All Links and Nodes Generated');
    console.log('------------');
    return {nodeData,linkData,enzymeList};
  }


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
