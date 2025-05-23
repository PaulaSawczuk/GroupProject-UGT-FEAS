


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

// ------ Function to extract COMPOUND NAMES ---------
// Takes text response from Kegg and Search for the start of the COMPOUND entries
// Splits and processes the extracted lines - returns ID and Name of the compund 
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
              name = match[1];
              name = name.trimStart()

              } else {
              //console.log("No match found.");
            }
            
            // Log the matches
            if (matches) {
              id = matches;

            } else {
              matches = 0;
            }

            if (matches.length>=1){
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


// ------ Function to extract ENZYME NAME ----------
// Takes text response from Kegg and Search for the start of the COMPOUND entries
// Splits and processes the extracted lines - returns KO, EC and Name for annotation
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

      if (start != end-1) {
      
      var ko_matches = [...anno_data[i].matchAll(/\[K[^\]]*\]/g)];

      var ec_matches = [...anno_data[i].matchAll(/\[EC:[^\]]*\]/g)];
      ec_matches = ec_matches.map(match => match[0]);

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


//------- KEGG request defining function ---------
// calls fetchAndParseURL using pathwaycode inputted from merge.js
// Takes text response from KEGG and passes to processing function - getCompounds()
// Handles getting compound names for node annotation
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


// ------ KEGG request defining function-------
// calls fetchAndParseURL using pathwaycode inputted from merge.js
// Takes text response from KEGG and passes to processing function - getEnzymes()
// Handles getting enzymes names for node annotation
async function getEnzymeNames(pathway){
  

  var anno_data='';
  const url = 'https://rest.kegg.jp/get/'+pathway; // Setting up the URL with pathway code
  console.log(url);
  var elements = await fetchAndParseURL(url).then(lines => {
  anno_data=lines;
  const names = getEnzymes(anno_data);

  return names;
});


return elements;
}



// Function for getting a list of enzymes for the map 
// Passed to front end - useful for indexing 
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

// ------ Assinging Enzyme Families---------
// Extracting enzyme name from node and assigning new family attribute 
// Takes KO EC Brite Hierarchy Classfications - Used for search function in front end
function getEnzymeType(nodes){

  for (let i=0; i<nodes.length; i++){
    if (nodes[i].type == 'enzyme'){

      let text = nodes[i].text
      text = text.replace(/^ec:/, "");
      //console.log(text);
      let firstNumber = text.split('.')[0];
      //console.log(firstNumber);
      var brite;

      // Setting up each Family type to assign to appropriate EC code
      switch (firstNumber) {
      case '1':
        //console.log('Oxidoreductase');
        brite = 'Oxidoreductase'; // Determining the Family Type 
        nodes[i].enzymeType = brite; // Assigning new attribute to node
        break;

      case '2':
        //console.log('Transferase');
        brite = 'Transferase';
        nodes[i].enzymeType = brite;
        break;

      case '3':
        //console.log('Hydrolase');
        brite = 'Hydrolase';
        nodes[i].enzymeType = brite;
        break;

      case '4':
        //console.log('Lyase');
        brite = 'Lyase';
        nodes[i].enzymeType = brite;
        break;

      case '5':
        //console.log('Isomerase');
        brite = 'Isomerase';
        nodes[i].enzymeType = brite;
        break;


      case '6':
        //console.log('Ligase')
        brite = 'Ligase';
        nodes[i].enzymeType = brite;
        break;

      case '7':
        //console.log('Translocase')
        brite = 'Translocase';
        nodes[i].enzymeType = brite;
        break;

      default:
          break;
      }
      }
    }

  }

module.exports = {
  getElements,
  getEnzymeNames,
  getEnzymeCodes,
  getEnzymeType
};
