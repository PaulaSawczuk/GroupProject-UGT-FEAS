// Date: 23/03/2025
// Jennifer O'Halloran
// IBIX2 Group Project 2025 

// Function - getGenePathway
        // Takes a list Kegg ID Gene Entries and returns Array of KEGG pathways that contain 
        // these genes
// Inputs:
//     - KEGG gene entry IDs - Array
//     - Organism Code - String

// Outputs - Array of pathway IDs for that organism that match the KEGG IDs inputted


async function getGenePathways(keggIDs){

  //console.log(keggIDs);
  var all_paths=[];

  for (const id of keggIDs) {

    
    var url = 'https://rest.kegg.jp/link/pathway/bna:'+id

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
        console.log(result[i]);
        result[i].forEach(item => {
            //console.log(item);

            if (item.includes('path:')) {
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
const keggIDs = ['106395458','106349218','106348']
const org = 'bna'*/


getGenePathways(keggIDs).then(paths =>{
  console.log(paths);
});
//console.log(request);
