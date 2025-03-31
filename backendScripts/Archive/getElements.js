


// Date: 23/03/2025
// Jennifer O'Halloran
// IBIX2 Group Project 2025 


// Function  - GetEntryNames
// Inputs: Pathway code for selected organism e.g bna00020 
// Outputs: 'Elements' containing list of genes and compounds for that pathway
                          // Each gene has id (Kegg Entry ID) name, EC(s) and KO
                          // Each Compound has id (Kegg Compound ID e.g CO...), name 


// Takes pathway code and makes Get request for Pathway Entry from KEGG API
// Parsed Text response and processes to extract relevant information 


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

function getCompounds(anno_data){
    var compounds=[];
    var start;
    var end;
    for (let i = 0; i < anno_data.length; i++) {
        if (anno_data[i].includes('COMPOUND')) {
          //console.log(`'COMPOUND' found at line ${i + 1}: $(anno_data[i]}`);
          start = i;
          //console.log(start);
        }
        if (anno_data[i].includes('REFERENCE')) {
            end = i;
            //console.log(end);
            break;
        }
      }
    
    for (let i = 0; i < anno_data.length; i++) {
        //console.log(anno_data[i]);
        //console.log(start);
        const match = anno_data[start].match(/C\d+(.*)/);
        const matches = anno_data[start].match(/C(\d+)(?=\s|$)/g);
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

function getGenes(anno_data){
    var genes=[];
    var start;
    
    var end;
    for (let i = 0; i < anno_data.length; i++) {
        if (anno_data[i].includes('GENE')) {
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
        const match = anno_data[i].match(/\d+/);
        const match2 = anno_data[i].match(/\d+(.*?)\[/);
        var ko_matches = [...anno_data[i].matchAll(/\[KO:[^\]]*\]/g)];
        ko_matches = ko_matches.map(match => match[0]);
        //console.log(ko_matches);

        var ec_matches = [...anno_data[i].matchAll(/\[EC:[^\]]*\]/g)];
        ec_matches = ec_matches.map(match => match[0]);
        //console.log(ec_matches);

        var name;
        var id;
        var ko;
        var ec;

        if (start != end) {

            if (match) {
              id = match[0];
              } else {
            }
            if (match2) {
              name = match2[1];
              name = name.trimStart()

            } else {
              console.log("No match found.");
            }

            if (ko_matches){
              ko = ko_matches[0];
              //console.log(ko);

              }else{
              }
            
            if (ec_matches.length==0){
              ec = 'N/A'
                }else{
                ec = ec_matches[0];
                }
            
              ko = ko.replace(/[\[\]]/g, "");
              ec = ec.replace(/[\[\]]/g, "");

            //console.log('EC: '+ec);
            ec = ec.split(' ');
            //console.log('EC: '+ec);
            for (let i = 0; i < ec.length; i++) {
              if (!ec[i].startsWith("EC:")) {
                ec[i] = "EC:" + ec[i]; // Add the prefix if it doesn't start with "ec:"
              }
            }
            //ec = ec.replace(/[\[\]]/g, "");
            //console.log('EC: '+ec);
            genes.push({
                    id: id,
                    name: name,
                    EC: ec,
                    KO: ko
              });
            
            start ++;
            }else{
                break
            }
    }
    //console.log(util.inspect(genes, { maxArrayLength: null }))
    return genes;
}


async function getElements(pathway){

    var anno_data='';
    const url = 'https://rest.kegg.jp/get/'+pathway;
    console.log(url);
  var elements = await fetchAndParseURL(url).then(lines => {
    anno_data=lines;

    const compounds = getCompounds(anno_data);
    //console.log(compounds);
    const genes = getGenes(anno_data);
    //console.log(util.inspect(genes, { maxArrayLength: null }));
    // Search for by Gene ID
    return {compounds, genes};
  });
  //console.log(elements);
  return elements;
}


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
        return nodes;
    }

export default {
  getElements,
};





/*
function matchGeneName(id,genes){
  console.log(id);
  //console.log(genes[0]);
  for (let i=0; i<genes.length; i++){
    if (genes[i].id == id){
      console.log('Match Found');
      console.log('ID entered: '+id);
      console.log('Gene ID in Pathway: '+id);
      console.log('Gene Name: '+genes[i].name);
      console.log('KO: '+genes[i].KO);

    }else{
      continue;
    }
  }
}
*/

/*
const ids = ['106353174'];
var pathway = 'bna00020';

var elements = await getElements(pathway);*/
//console.log(elements);
//matchGeneName(ids[0],elements['genes']);





