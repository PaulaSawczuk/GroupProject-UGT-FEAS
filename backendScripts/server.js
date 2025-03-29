

// Date: 28/03/2025
// Jennifer O'Halloran
// IBIX2 Group Project 2025 


// Function  - API SERVER

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { processInput } = require('./helper/merge.js');
const {getEnzymePathways} = require('./helper/getEnzymePathways.js');
const {getPathwayNames} = require('./helper/getPathwayName.js')


const app = express();

// Middleware
app.use(cors()); // To allow cross-origin requests
app.use(bodyParser.json()); // To parse JSON request bodies



// Enter Random code at the moment --- Code is currentl hard coded 
// Calles Process Input from Merge.js 
app.get('/api/getModel/:code', (req, res) => {
    console.log('Getting Diagram Model');
    // Wait for response - async function
    processInput(req.params.code).then(elements => res.json(elements));

  });



  // POST REQUEST FROM SERVER 
  app.post('/api/getEnzymePathways/enzymes3', (req, res) => {
    // Handling a post request of Enzyme codes?? - list of enzyme code expected
    console.log('Getting Enzyme Pathways');
    console.log(req.body);
    var enzymes = req.body;
    getEnzymePathways(enzymes).then(pathways => getPathwayNames(pathways))
        .then((result)=>{
            //console.log(result)
            //console.log(result.paths[0]);
            res.json(result.paths);
        });

  });

// GET REQUEST  - REDUNDANT 
  app.get('/api/getEnzymePathways/enzymes2', (req, res) => {
    // Handling a post request of Enzyme codes?? - list of enzyme code expected
    const enzymes = [
        'ec:1.1.1.360',
        'ec:1.1.1.359',
        'ec:4.3.1.29',
        'ec:5.3.1.27',
        'ec:5.3.1.29',
        'ec:2.7.1.212',
        'ec:1.2.1.90'];
    
    getEnzymePathways(enzymes).then(pathways => getPathwayNames(pathways))
        .then((result)=>{
            //console.log(result)
            console.log(result.paths[0]);
            res.json(result.paths);
        });
  });



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});