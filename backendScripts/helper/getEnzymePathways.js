// Date: 28/03/2025
// Jennifer O'Halloran
// IBIX2 Group Project 2025 

// Function - getEnzymePathway
        // Takes a list KEGG Enzyme IDs returns Array of KEGG EC pathways that contain 
        // these genes
// Inputs:
//     - KEGG Enzyme Code list - String Array
//     - Organism Code - String

// Outputs - Array of EC pathway IDs for that organism that match the KEGG IDs inputted
// This is to be parsed back to the front end to be displayed as a list for the user to select 


async function getEnzymePathways(enzymeIDs){

  var all_paths=[];

  for (const id of enzymeIDs) {

    

    var url = 'https://rest.kegg.jp/link/pathway/'+id
    console.log(url);
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

      addUniqueElements(all_paths,paths);
      //console.log(all_paths);

      //return paths
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
    }

  };
  //console.log(all_paths);
  return all_paths;
  }



function addUniqueElements(all_paths, paths) {

    paths.forEach(path => {
        // Check if the element is not already in the array
        if (!all_paths.includes(path)) {
            all_paths.push(path);  // Add the element if it's unique
        }
    });
    return all_paths;
}

/*
function getPathwayNames(all_paths){

  for (const path of all_paths) {
    var url = 'https://rest.kegg.jp/get/'+path;
      console.log(url);
      try {
        // Fetch the URL response
        const response = await fetch(url);
    
        // Check if the response is ok (status 200-299)
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const text = await response.text();
        const lines = text.split('\n');
        const result = lines.map(line => line.split('\t'));
        console.log(result);
        /*
        for (let i = 0; i < result.length; i++) {
          if (anno_data[i].includes('NAME')+anno_data[i]) {
            console.log(`NAME`+);
            start = i;
            //console.log(start);
          }
          if (anno_data[i].includes('REFERENCE')) {
              end = i;
              //console.log(end);
              break;
          }
        }
      }
  };
};
*/

module.exports = {
  getEnzymePathways
};


