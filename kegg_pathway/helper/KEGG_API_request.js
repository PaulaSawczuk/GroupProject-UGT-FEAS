
// Script for getting Requests from KEGG API
// Prints the output to console 


const https = require('https');




var pathway; 

// Hard-coded pathway request - this can be changed through input from user

https.get('https://rest.kegg.jp/get/bna00020/kgml', (res) => {
    console.log('statusCode:', res.statusCode);
    console.log('headers:', res.headers);
    
    res.on('data', (d) => {
        // Outputs to console KGML as string
        process.stdout.write(d);
        //pathway += pathway + d;
        //console.log(pathway)
        //console.log("pathway saved")
    });
    //console.log(pathway.d);


    }).on('error', (e) => {
    console.error(e);

    });