
// Date: 27/03/2025
// Jennifer O'Halloran
// IBIX2 Group Project 2025 

// Function - link.js - links other functions together to Parse, label and visualise KGML
        // Takes a list Kegg ID Gene Entries and returns Array of KEGG pathways that contain 
        // these genes


// Outputs - Array of links and nodes to visualised in GOJS-angular


import { loadEnvFile } from 'process';
import { getElements } from './getElements.js';
import { getNodesEdges } from './get_go_map.js';
import { processKGML } from './get_go_map.js';
import util from 'util';
//import { initialiseMap } from './go_trial_parse.js';


const ids = ['106353174'];
var pathway = 'bna00030';
var ec_pathway = 'ec00030';

// -------------------------------------------------------------
// Getting Genes and Compounds for the organism specific pathway - used for labelling and indexing 
var elements = await getElements(pathway);

//console.log(elements.compounds);
//console.log(elements.genes);


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

// Replacing the LogFC with realtive RGB value 
getLogFCColor(data);


//------------------------------------------------
// Fetching the relevent ec KGML and processing 
// Extracting relations, entries and reactions 

var kgml_elements = await processKGML(ec_pathway);

//console.log(kgml_elements.entries);
//console.log(kgml_elements.entries[0].graphics);
//console.log(kgml_elements.relations);
//console.log(kgml_elements.reactions[0]);



// ----------------------------------------------
//Getting Element names
//Getting mapping nodes and edges 
var map_elements = getNodesEdges(kgml_elements.entries, kgml_elements.reactions,kgml_elements.relations)


// -----------------------------------------------
function matchEnzymes(data, nodes) {
    //console.log('matching nodes')
    // Check if the values for the given kesy match in both objects
    for (let i=0;i<data.length;i++){
        console.log(data[i]);
        for (let j=0;j<nodes.length;j++){
            console.log(data[i].enzyme);
            console.log(nodes[j].text);
            if (data[i].enzyme === nodes[j].text){
            console.log('match');
            // If they match, update the specified attribute in object1
            nodes[j].colour = data[i].value;
            }else{
                continue
            }
        }
    }
}

//console.log(map_elements.uniqueNodes);

// -----------------------------------------------
// Matching enzyme names of data to nodes - TRIAL WITH MOCK DATA

matchEnzymes(data,map_elements.uniqueNodes)



// -----------------------------------------------
// Function for matching compound names from getElements to Node Names
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

getCompoundNames(elements.compounds, map_elements.uniqueNodes);




// Function for mapping -- parse the links and nodes in here 

//initialiseMap(map_elements.uniqueNodes, map_elements.edges);




// Printing the NODES and LINKs to the terminal 

console.log(util.inspect(map_elements.uniqueNodes,{maxArrayLength: null}));
console.log(util.inspect(map_elements.edges,{maxArrayLength: null}));


