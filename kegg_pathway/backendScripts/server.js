
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
const { processInput, processPathways, processIndividualPathway } = require('./helper/merge.js');
const {getEnzymePathways} = require('./helper/getEnzymePathways.js');
const {getPathwayNames} = require('./helper/getPathwayName.js');
const {getAllPathways} = require('./helper/getAllPathways.js');


const app = express();

// Middleware
app.use(cors()); // To allow cross-origin requests
app.use(bodyParser.json()); // To parse JSON request bodies
app.use(express.text()); // To parse selected ec code from user as string 



  //------------ Retrieving Mapping Data -------------
  // Endpoint 1 for Map data Retrieval 
  // Takes a single pathway code
  // Passes it into the same processing function in merge.js

app.post('/api/getMap', (req, res) => {
    console.log('------------');
    console.log('Getting Diagram Model');
    console.log('------------');
    console.log(new Date());
    console.log('------------');
    //var response = req.body;
    //var pathway = response[0];
    var code = req.body;
    //console.log(genes);
    console.log(code);
    processIndividualPathway(code).then((elements) => {
        console.log('------------');
        console.log('Sending to FrontEnd');
        console.log('------------');
        console.log(new Date());
        console.log('------------');
        res.json(elements)});

  });


  //------------ Retrieving Mapping Data -------------
  // Endpoint 2 for Map data Retrieval 
  // Takes list of all pathways and loops through each
  // Passes it into the same processing function in merge.js

  app.post('/api/getMap2', (req, res) => {
    console.log('------------');
    console.log('Getting Diagram Model');
    console.log('------------');
    console.log(new Date());
    console.log('------------');
    var response = req.body;
    var pathway = response[0];
    //console.log(genes);
    console.log(pathway);
    processPathways(pathway).then((pathwayData) => {
        console.log('------------');
        console.log('Sending to FrontEnd');
        console.log('------------');
        console.log(new Date());
        console.log('------------');
        res.json(pathwayData)});

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
    //console.log(req.body);
    console.log('------------');
    var number= req.body[1];
    console.log(number);
    var enzymes = req.body[0];
    //console.log(enzymes);
    //console.log(enzymes);
    getEnzymePathways(enzymes,number).then(pathways => getPathwayNames(pathways))
        .then((result)=>{
          console.log('Sending to Frontend');
          console.log('------------');
          console.log(new Date());
          console.log('------------');
            res.json(result);
        });
  });



    //------------ Retrieving Pathway Names -------------
  // Get request for an Array of pathway names and codes
  //  - Gets Pathway names and codes (getAllPathways)
  //  - Returns Array of Pathway Objects with Name and Pathway Code


  app.get('/api/getPaths', (req, res) => {
    // Handling a post request of Enzyme codes?? - list of enzyme code expected
    console.log('------------');
    console.log('Getting All Pathway Names');
    console.log('------------');
    console.log(new Date());
    ///console.log(req.body);
    console.log('------------');

    getAllPathways().then(pathwayData => {
      console.log('------------');
      console.log('Sending Pathways to the FrontEnd');
      console.log('------------');
      //console.log(pathwayData);
      console.log('------------');
      console.log(new Date());
      console.log('------------');
      res.json(pathwayData);
    })
  });

  
  // Defining local host port - 4000
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});