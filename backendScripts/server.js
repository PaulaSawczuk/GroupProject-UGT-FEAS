

// Date: 28/03/2025
// Jennifer O'Halloran
// IBIX2 Group Project 2025 


// Function  - API SERVER

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { processInput } = require('./helper/merge.js');


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


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});