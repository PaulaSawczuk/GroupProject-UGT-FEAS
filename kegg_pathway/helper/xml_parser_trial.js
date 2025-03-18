var eyes = require('eyes');
var https = require('https');
var fs = require('fs');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var xpath = require("xml2js-xpath");
const { inspect } = require('util');

// Function for Getting get Request and attempting to read as XML to JSON format 
// 

parser.on('error', function(err) { console.log('Parser error', err); });

var data = '';
var data_json = '';
var reactions= '';
var relations = '';
var entries= '';

https.get('https://rest.kegg.jp/get/bna00010/kgml', function(res) {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      res.on('data', function(data_) { 
        data += data_.toString(); });
      res.on('end', function() {


        xml2js.parseString(data, function(err, json) {

            //find all elements: returns xml2js JSON of the element
            //console.log(json);
            entries = xpath.find(json, "//entry");
            // find the first element, and get its id:
            //graphics = xpath.find(json, "//entry","graphics");
            //console.log(graphics);
            relations = xpath.find(json, "//relation")
            //console.log(relations);
            reactions = xpath.find(json, "//reaction")
            //console.log(reactions);
            //console.log(json["entry"])


          });


        //console.log('data', data);
        parser.parseString(data, function(err, result) {
            data_json = result;
            //console.log('FINISHED', err, result);
            console.log('FINISHED');

            //console.log(data_json);
            //console.log(relations);
            //console.log(reactions);
            

        
        });
      });

    }

  });