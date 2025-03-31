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

const { getElements } = require('./getElements2');
const { getNodesEdges } = require('./get_go_map');
const { processKGML } = require('./get_go_map');
const { processRN } = require('./get_go_map');
const { getCompoundLinks } = require('./get_go_map');
const { addCompoundLinks } = require('./get_go_map');
const init = require('./visualise_map');


function getCompoundNames(compounds, nodes){
    console.log('------------');
    console.log('Matching Entry Names to Nodes');
    console.log('------------');
    //console.log(compounds);
    //console.log(nodes)

    //console.log(compounds[0]['id'])

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

    // -----------------------------------------------
    // 
function matchEnzymes(data, nodes) {
        //console.log('matching nodes')
        // Check if the values for the given kesy match in both objects
        for (let i=0;i<data.length;i++){
            //console.log(data[i]);
            for (let j=0;j<nodes.length;j++){
                //console.log(data[i].enzyme);
                //console.log(nodes[j].text);
                if (data[i].enzyme === nodes[j].text){
                //console.log('match');
                // If they match, update the specified attribute in object1
                nodes[j].colour = data[i].value;
                }else{
                    continue
                }
            }
        }
    }

function getLogFCColor(data) {
        /**
         * Maps a log fold change (logfc) value to a color where:
         * - Positive logfc is a shade of green.
         * - Negative logfc is a shade of red.
         * - Zero logfc is white.
         */
        data.forEach(logfc=>{
            let color;
            if (logfc.value > 0) {
                // If logfc is positive, we create a green color (0, g, 0)
                const greenValue = Math.min(1, logfc.value);  // Scale the green intensity
                color = `rgb(0, ${Math.round(greenValue * 255)}, 0)`; // RGB for green
            } else if (logfc.value < 0) {
                // If logfc is negative, we create a red color (r, 0, 0)
                const redValue = Math.min(1, -logfc.value);  // Scale the red intensity
                color = `rgb(${Math.round(redValue * 255)}, 0, 0)`; // RGB for red
            } else {
                // If logfc is zero, return white
                color = "rgb(255, 255, 255)"; // RGB for white
            }
            logfc.value = color;
        });
        return data;
    }
    
    const enzymes = [
        'ec:1.1.1.360',
        'ec:1.1.1.359',
        'ec:4.3.1.29',
        'ec:5.3.1.27',
        'ec:5.3.1.29',
        'ec:2.7.1.212',
        'ec:1.2.1.90']
    
    const values =[
        -0.580737821,
        -1.255226049,
        1.019565292,
        -0.524723441,
        -0.74399641,
        -6.096992804,
        1.040871759,]
    
    var data = [];
    for (let i=0; i<enzymes.length;i++){
        data.push({
            enzyme: enzymes[i],
            value: values[i]
        })
    }

async function processInput(code) {
    console.log('processing');
    console.log(code);

    // Here we will just echo back the input, but you can modify this function
    // to perform any logic like math operations, string manipulations, etc.
    var ec_pathway = code;
    var rn_pathway = code.replace(/^ec/, 'rn');
    
    // -------------------------------------------------------------
    // Getting Compounds for the organism specific pathway - used for labelling and indexing 
    // NEED TO BE RE-IMPLEMENTED
    var compounds = await getElements(ec_pathway);
    console.log(compounds);
    
    // -----------------------Converting LOGFC to RBG --------------------------------------
    // EXPERIMENTAL FUNCTION -- MOVE TO FRONT END???
    // Replacing the LogFC with realtive RGB value 
    //getLogFCColor(data);

     // -----------------Data --> Reactions, Entries, and Relations-----------------------------
    
    // Processing the whole KGML parsed
    var kgml_elements = await processKGML(ec_pathway);

    var rn_elements = await processKGML(rn_pathway)

    // ------------------Taking Entries, Reactions and Relations --> Nodes and Edges ----------------------------
    //Getting Element names
    //Getting mapping nodes and edges 
    var map_elements = getNodesEdges(kgml_elements.entries, kgml_elements.reactions,kgml_elements.relations)
    

    // ----------------------Matching Enzymes to Nodes - change colour -------------------------
    // Matching enzyme names of data to nodes - TRIAL WITH MOCK DATA
    
    matchEnzymes(data,map_elements.uniqueNodes);




    var compoundLinks = processRN(rn_elements.entries, rn_elements.relations, rn_elements.reactions, map_elements.uniqueNodes);
    addCompoundLinks(compoundLinks.entryLinks,map_elements.edges);
    
    // --------------------Re-Labelling Compounds---------------------------
    // Linking names retireved in getElements to Nodes and re-labelling 
    getCompoundNames(compounds, map_elements.uniqueNodes);
    

    // ------------------Processing Diagram Model -----------------------------
    // Removing duplicate nodes and enzymes
    const processedElements = init.initialiseMap(map_elements.uniqueNodes,map_elements.edges);


    // ---------------- Parsing the data to the front-end -----------------------
    let nodeData = processedElements.finalNodes;
    //console.log(nodeData);
    let linkData = processedElements.edgesProcessed;
    //console.log(linkData);
    return {nodeData,linkData};
  }
module.exports = {
    processInput
  };
