
/*** 
 * // Date: 28/03/2025
 * // Jennifer O'Halloran
 * // IBIX2 Group Project 2025 
***/

/***
// Function  - Express API SERVER
// Endpoints for the Front-end Angular Post Requests 
***/

// Importing all required functions
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
app.use(express.text()); // To parse selected ec code from user as string 



  //------------ Retrieving Mapping Data -------------
  // 
app.post('/api/getMap', (req, res) => {
    console.log('------------');
    console.log('Getting Diagram Model');
    console.log('------------');
    console.log(new Date());
    console.log('------------');
    var response = req.body;
    var pathway = response[0];
    var genes = response[1];
    //console.log(genes);
    //console.log(pathway);
    processInput(pathway,genes).then((elements) => {
        console.log('------------');
        console.log('Sending to FrontEnd');
        console.log('------------');
        console.log(new Date());
        console.log('------------');
        res.json(elements)});

  });


  //------------ Retrieving Enzyme Pathways -------------
  // Takes list of EC codes from Front-end 
  //  - Gets Enzyme Map Codes (e.g. ec00030) - getEnzymePathways()
  //  - Gets Corresponding Name - getPathwayNames()
  //  - Returns Array of Pathway Objects with Name and Pathway Code

app.post('/api/getPathways', (req, res) => {
    // Handling a post request of Enzyme codes?? - list of enzyme code expected
    console.log('------------');
    console.log('Getting Enzyme Pathways');
    console.log('------------');
    console.log(new Date());
    console.log(req.body);
    console.log('------------');
    var enzymes = req.body;
    getEnzymePathways(enzymes).then(pathways => getPathwayNames(pathways))
        .then((result)=>{
          console.log('Sending to Frontend');
          console.log('------------');
          console.log(new Date());
          console.log('------------');
            res.json(result.paths);
        });
  });


// This works for Paula lol please don't delete for now 
// let requestCount = 0;

// app.post('/api/getPathways', (req, res) => {
//     requestCount++;
//     console.log(`Received request #${requestCount} for getPathways`);
//     console.log(req.body);
    
//     var enzymes = req.body;
//     getEnzymePathways(enzymes).then(pathways => getPathwayNames(pathways))
//         .then((result)=>{
//             res.json(result.paths);
//         });
// });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});