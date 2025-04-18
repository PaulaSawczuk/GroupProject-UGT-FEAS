/*** 
 * // Date: 28/03/2025
 * // Jennifer O'Halloran
 * // IBIX2 Group Project 2025 
***/


/*** 
// Function - getEnzymePathway
        // Takes a list KEGG Enzyme IDs returns Array of KEGG EC pathways that contain 
        // these genes
// Inputs:
//     - KEGG Enzyme Code list - String Array
//     - Organism Code - String

// Outputs - Array of EC pathway IDs for that organism that match the KEGG IDs inputted
// This is to be parsed back to the front end to be displayed as a list for the user to select 
***/



// Filtering only Unique pathways
// Only one instance of each pthway code sent back to user
function addUniqueElements(all_paths, paths) {

  paths.forEach(path => {
      // Check if the element is not already in the array
      if (!all_paths.includes(path)) {
          all_paths.push(path);  // Add the element if it's unique
      }
  });
  return all_paths;
}


function getTally(paths, number){
  let tally = {};

  // Loop through the array to count each element
  paths.forEach(item => {
    // If the item is already in the tally object, increment the count, otherwise initialize it
    tally[item] = (tally[item] || 0) + 1;
  });

  //console.log(tally);
  let tallyArray = Object.entries(tally);

// Step 3: Sort the array by frequency in descending order
  tallyArray.sort((a, b) => b[1] - a[1]);
  //console.log(tallyArray);

// Step 4: Select the top 10 elements (or fewer if there are less than 10 unique elements)
  let top = tallyArray.slice(0, number);

  //console.log(top);
  // get only pathway names (not count)
  var pathways = [];
  top.forEach(entry =>{
    let pathway = entry[0];
    pathways.push(pathway);



  })
  //console.log(pathways);
  return [pathways, tallyArray];

}

// ------------- KEGG Requests to get a list of EC Pathway Codes --------
//  - Makes KEGG API request
//  - Text response split and filtered to get the Name of the pathway requested 
//  - Returns a list of Enzyme Pathway codes (e.g. ec00030)
//  - These are parsed to getPathwayNames() to retireve their corresponding name

async function getEnzymePathways(enzymeIDs,number){
  //console.log(enzymeIDs);
  console.log("Getting Enzyme Pathways");
  console.log("----------------------");
  var all_paths=[];
  var every_path=[];
  //const number = 10;

  for (const id of enzymeIDs) {
    //console.log(id);
    var url = 'https://rest.kegg.jp/link/pathway/'+id
    //console.log(url);
    try {
      // Fetch the URL response
      const response = await fetch(url);
  
      // Check if the response is ok (status 200-299)
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      // Get the text content of the response
      const text = await response.text();
      //console.log(text);

      // Split the text into an array of lines
      const lines = text.split('\n');
      const result = lines.map(line => line.split('\t'));

      var paths = [];
      for (let i = 0; i < result.length; i++) {
        //console.log(result[i]);
        result[i].forEach(item => {
            //console.log(item);

            if (item.includes('path:ec')) {
                //console.log(`Found 'path:'`);
                const match = item.match(/path:\s*(.*)/); // Match everything after 'path:'
                //console.log('match',match[1]);
                paths.push(match[1]);
        }
      });
      };
      //console.log(paths);
      paths.forEach(path=>{
        every_path.push(path);
      });
      addUniqueElements(all_paths,paths);
      //console.log(all_paths);

      //return paths
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
    }

  };

  console.log(all_paths);


  // Creating Tally of all the returned paths 
  // Selecting the top enriched paths based on user input 

 // Hard-coded blacklist of pathway codes not to accept.
  const blacklist = new Set([
    'ec01120',
    'ec01100',
    'ec01110',
    'ec00190',
    'ec00533']);

  let filteredPaths = all_paths.filter(path => !blacklist.has(path));

  let filteredAllPaths = every_path.filter(path => !blacklist.has(path));
  //console.log('All Filtered Pathways:');
  //console.log(filteredAllPaths);

  var elements = getTally(filteredAllPaths,number);
  const top_paths = elements[0];
  const tallyArray = elements[1];
  console.log(top_paths);
  console.log(tallyArray);
  //console.log('Filtered Pathways:');
 // console.log(filteredPaths); 

  return [top_paths, tallyArray];
  }


module.exports = {
  getEnzymePathways
};


