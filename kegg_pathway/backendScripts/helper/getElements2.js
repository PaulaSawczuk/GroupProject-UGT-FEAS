


/*** 
 * // Date: 30/03/2025
 * // Jennifer O'Halloran
 * // IBIX2 Group Project 2025 
***/

const { log } = require("console");

/***
// Function  - GetEntryNames
// Inputs: Enzyme Pathway code for selected organism e.g ec00020 
// Outputs: 'Elements' containing list of genes and compounds for that pathway
                          // Each Compound has id (Kegg Compound ID e.g CO...), name 


// Takes pathway code and makes Get request for Pathway Entry from KEGG API
// Parsed Text response and processes to extract relevant information 
***/


// Function to fetch URL and save response as an array of lines
async function fetchAndParseURL(url) {
    try {
      // Fetch the URL response
      const response = await fetch(url);
  
      // Check if the response is ok (status 200-299)
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      // Get the text content of the response
      const text = await response.text();
  
      // Split the text into an array of lines
      const lines = text.split('\n');
  
      // Return the array of lines
      return lines;
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
    }
  }

// Functionto extract compoounds 
function getCompounds(anno_data){
    var compounds=[];
    var start;
    var end;
    for (let i = 0; i < anno_data.length; i++) {
        if (anno_data[i].includes('COMPOUND')) {
          //console.log(`'COMPOUND' found at line ${i + 1}: $(anno_data[i]}`);
          //console.log(anno_data[i]);
          start = i;
          //console.log(start);
        }
        if (anno_data[i].includes('REFERENCE')||anno_data[i].includes('REL_PATHWAY')) {
            end = i;
            //console.log(end);
            break;
        }else{continue
          
        }
      }
    
    for (let i = 0; i < anno_data.length; i++) {
        //console.log(anno_data[i]);
        //console.log(start);
        var match = anno_data[start].match(/C\d+(.*)/);
        var matches = anno_data[start].match(/C(\d+)(?=\s|$)/g);
        // Check if a match is found and log the result
        var name;
        var id;
        if (start != end) {
            //console.log(match[1]);
            if (match) {
              //console.log("Found:", match[1]);
              //compound_names += compound_names + match[1];
              name = match[1];
              name = name.trimStart()

              } else {
              //console.log("No match found.");
            }
            
            //console.log(matches);
            // Log the matches
            if (matches) {
              //console.log("Found:", matches);
              //compound_id += compound_id + matches;
              id = matches;

            } else {
              //console.log("No match found.");
              matches = 0;
            }

            //console.log(matches.length)
            if (matches.length>=1){
              //console.log("adding to compound array")
              compounds.push({
                    id: id[0],
                    name: name
              });
            }
            start ++;
            }else{
                break
            }
    }
    return compounds;
}

function getEnzymes(anno_data){
  var names=[];
  var ec_codes=[];
  var enzymeNames=[];
  var start;
  var end;
  for (let i = 0; i < anno_data.length; i++) {
      if (anno_data[i].includes('ORTHOLOGY')) {
        start = i;
        //console.log(start);
      }
      if (anno_data[i].includes('COMPOUND')) {
          end = i;
          //console.log(end);
          break;
      }
    }
  for (let i = start; i < anno_data.length; i++) {
      var line = anno_data[i].split('  ');
      names.push(line);
      //console.log(line);
      if (start != end-1) {
      
      //const match = anno_data[i].match(/\d+/);
      //const match2 = anno_data[i].match(/\d+(.*?)\[/);
      var ko_matches = [...anno_data[i].matchAll(/\[K[^\]]*\]/g)];
      //ko_matches = ko_matches.map(match => match[0]);
      //console.log(ko_matches);

      var ec_matches = [...anno_data[i].matchAll(/\[EC:[^\]]*\]/g)];
      ec_matches = ec_matches.map(match => match[0]);
      //console.log(ec_matches);
      ec_codes.push(ec_matches);
      start++
      }else{
        break;
      }

    }

    let filteredArray = names.map(sublist => sublist.filter(item => item !== ''));
    filteredArray = filteredArray.filter(sublist => !sublist.some(item => item.includes('ORTHOLOGY')));
    //console.log(filteredArray);

    let updatedArray = filteredArray.map(sublist => {
      // Check if the last element contains '[EC:...]'
      const lastElement = sublist[sublist.length - 1];
      if (lastElement && lastElement.includes('[EC:')) {
        // Split the last element into two parts and remove the brackets
        const [description, ecCode] = lastElement.split(' [EC:');
        // Remove the closing bracket from the EC code and reassemble the string
        const ec = ecCode ? ecCode.replace(']', '') : '';
        // Return the updated sublist with the EC code properly formatted
        return [...sublist.slice(0, -1), description, `EC:${ec}`];
      }

      return sublist;
    });


    updatedArray.forEach(item =>{
      //console.log(item);
      //console.log(item[0]);
      enzymeNames.push({
        name: item[1],
        KO: item[0],
        EC: item[2],
      })
    })


  //console.log(enzymeNames);
  return enzymeNames;
}


async function getElements(pathway){

    var anno_data='';
    const url = 'https://rest.kegg.jp/get/'+pathway;
    console.log(url);
    var elements = await fetchAndParseURL(url).then(lines => {
    anno_data=lines;
    //console.log(anno_data);
    const compounds = getCompounds(anno_data);
    //console.log(compounds);

    return compounds;
  });
  //console.log(elements);
  return elements;
}

async function getEnzymeNames(pathway){
  

  var anno_data='';
  const url = 'https://rest.kegg.jp/get/'+pathway;
  console.log(url);
  var elements = await fetchAndParseURL(url).then(lines => {
  anno_data=lines;
  const names = getEnzymes(anno_data);

  return names;
});


return elements;
}


function getEnzymeCodes(nodes){
  const enzymeList = new Set();
  for (let i=0; i<nodes.length; i++){
    if (nodes[i].type == 'enzyme'){
      //console.log(nodes[i].text)
      enzymeList.add(nodes[i].text);
    }
  }
  //console.log(enzymeList);
  return enzymeList;
}


function logfcToRGB(logFoldChange){
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

function findMean(arr) {
  // Ensure the array is not empty
  if (arr.length === 0) return 0;

  // Convert string numbers to actual numbers and sum them
  const sum = arr
    .map(Number) // Convert each string to a number
    .reduce((acc, current) => acc + current, 0);

  // Calculate the mean by dividing the sum by the length of the array
  return sum / arr.length;
}

function matchGenes(genes, nodes){
  var enzymeSet = new Set();
  console.log(genes);


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
          logfcList.push(logfc);
          //console.log(logfc);

        }
        
      }
      //console.log(geneList);
        if (geneList[0]){
          nodes[i].gene = geneList;
          console.log(nodes[i]);
        }else{
          continue;
        }
        if (logfcList[0]){
          console.log(logfcList);
          let mean = findMean(logfcList)
          console.log(mean);
          nodes[i].logfc = mean;
          let rgb = logfcToRGB(mean);
          console.log(rgb);
          nodes[i].colour = rgb;
          //console.log(nodes[i]);
        }else{
          continue;
        }
    }
    }
    console.log(enzymeSet);
  }




module.exports = {
  getElements,
  getEnzymeNames,
  getEnzymeCodes,
  matchGenes
};




