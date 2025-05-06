/*** 
 * // Date: 10/04/2025
 * // Jennifer O'Halloran
 * // IBIX2 Group Project 2025 
***/


/*** 
// Function - getAllPathways
        // Queries kegg for a list of all EC pathways code and names 
// Inputs:
//     - Fetch Request to Key
//     

// Outputs - Array of EC pathway ID and Names
// This is to be parsed back to the front-end to compare and index for future kegg queries
// Likely used for User specified KGML path retrival and click-through map function 
***/

async function getAllPathways(){
    console.log("----------------------");
    console.log("Retrieving all EC Pathways");
    console.log("----------------------");
    var all_paths=[];

    // Defining blacklist of pathways 
    const blacklist = new Set([
        'ec01120',
        'ec01100',
        'ec01110',
        'ec00190',
        'ec00533',
        'ec01310']);

    // URL for KEGG API - retrieves list of EC pathways 
    var url = 'https://rest.kegg.jp/list/pathway/ec'


    try {
        // Fetch the URL response
        const response = await fetch(url);
        console.log(url);
    
        // Check if the response is ok (status 200-299)
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const text = await response.text();
        // Splitting text by line
        const lines = text.split('\n');
        // splitting text by tab (\t)
        const result = lines.map(line => line.split('\t'));
        
        // Extracting only EC pathway codes (exclusing 'map___' codes)
        for (let i=0; i<result.length;i++){
            if (result[i][0].startsWith('ec')){

                // Adding to an array 
                // Storing name and code
                all_paths.push({
                    name:result[i][1],
                    pathway:result[i][0]
                })
            }else{
                continue
            }
        }
                
        
    }catch(error) {
        console.error('There was a problem with the fetch operation:', error);
    }

    console.log('Filtering against blacklist')
    console.log("----------------------");
    // Filtering pathway code against blacklist 
    // removed if matches
    const filteredPaths = all_paths.filter(obj => !blacklist.has(obj.pathway));
    
    // Returning filtered list of all KEGG metabolic pathways 
    return filteredPaths;
}

module.exports = {
    getAllPathways
  };