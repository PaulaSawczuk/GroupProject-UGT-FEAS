/*** 
 * // Date: 38/03/2025
 * // Jennifer O'Halloran
 * // IBIX2 Group Project 2025 
***/

/*** 
// Function - getPathwayNames
        // Takes a list KEGG Enzyme IDs returns Array of KEGG EC pathways that contain 
        // these genes
// Inputs:
//     - KEGG Enzyme Code list - String Array
//     - Organism Code - String

// Outputs - Array of EC pathway IDs for that organism that match the KEGG IDs inputted
// This is to be parsed back to the front end to be displayed as a list for the user to select 
***/



// ------------- KEGG Requests to get a list of EC Pathway Names --------
//  - Text response split and filtered to get the Name of the pathway requested 
//  - Returns a Array of objects:
              // Name: e.g. Glycolysis 
              // pathway: e.g. ec00020
//  - These are parsed back to the front end to be displayed in the pathway menu in Display.component

async function getPathwayNames(all_paths){
  console.log("Getting Pathway Names");
  console.log("----------------------");
  var paths=[];
  const allpaths = all_paths[0];
  //console.log(allpaths);
  const tally = all_paths[1];
  //console.log(tally);
  for (const path of allpaths) {
      //console.log(path);
      var url = 'https://rest.kegg.jp/get/'+path;
      //console.log(url);
      try {
        // Fetch the URL response
        const response = await fetch(url);
    
        // Check if the response is ok (status 200-299)
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const text = await response.text();
        const lines = text.split('\n');
        //const result = lines.map(line => line.split('\t'));
        //console.log(lines);
        
        for (let i = 0; i < lines.length; i++) {
          //console.log(result[i]);
          if (lines[i].startsWith('NAME')) { 
             //console.log(lines[i]);
             let line = lines[i].split(/ {4,}/);
             //console.log(line);
             let name = line[1];
             //console.log(name);
             paths.push({
              name: name,
              pathway: path
             })

          }
          
        }
      }catch (error) {
    console.error('There was a problem with the fetch operation:', error);
          }
  }
  //console.log(paths);
  return [{paths},tally];
}

module.exports = {
  getPathwayNames
};


