

// Jennifer O'Halloran
// IBIX2 Group Project 2025
// Date: 25/03/2025
// Mapping inialisation functions - builds mapping Model



// Initilaisation Function
// This can be exported and called externally in link.js 


function init() {

  var $ = go.GraphObject.make;
  
  // Create the GoJS Diagram
  var myDiagram = $(go.Diagram, "myDiagramDiv", {
    initialContentAlignment: go.Spot.Center,
    "undoManager.isEnabled": true,
    initialAutoScale: go.AutoScale.Uniform
  });

  // TEMPLATE FOR LAYOUT
  myDiagram.layout = new go.LayeredDigraphLayout({
    // Set optional parameters for the layout
    direction: 0,
    layerSpacing: 30,  // Space between layers (nodes grouped in layers)
    columnSpacing: 30,  // Space between columns (nodes within the same layer)
    setsPortSpots: false,  // Don't automatically adjust port spots (ports can be manually set)
    aggressiveOption: go.LayeredDigraphLayout.Aggressive, // Aggressiveness of the layout (adjusts edge crossings)
    initializeOption: go.LayeredDigraphLayout.InitDepthPriority // Set initial node depth ordering (helps to minimize crossings)
  });


  // TEMPLATE FOR COMPOUNDS 
    myDiagram.nodeTemplateMap.add("compound",  // Custom category for compound nodes
      new go.Node("Vertical")  // Use Vertical Panel to place the label above the shape
        .add(
          new go.Shape("Circle", {
            width: 40,
            height: 40,
            fill: "lightgrey",
          })
        ).add(new go.TextBlock(
          { margin: 5,
            font: "15px sans-serif",
            maxSize: new go.Size(100, 20),
            overflow: go.TextBlock.OverflowEllipsis,
            //wrap: go.TextBlock.WrapFit,
            })
          .bind("text","text")
        )
    );

  // TEMPLATE FOR LINKS
    myDiagram.linkTemplate =
    new go.Link({
        routing: go.Routing.AvoidsNodes,
        //routing: go.Link.Bezier,
        //corner: 5    // rounded corners
      })
      .add(
        new go.Shape(),
        new go.Shape( { toArrow: "Standard" })
      );

  // TEMPLATE FOR LINKS for MAPLINKS
  myDiagram.linkTemplateMap.add("maplink",  // Link type category
    $(go.Link,
      {
        relinkableFrom: true,
        relinkableTo: true,
        routing: go.Link.AvoidsNodes,  // Route around nodes
        corner: 5,  // Optional: corner rounding
        reshapable: true,  // Allow reshaping the link
        selectable: true,  // Make link selectable
        layerName: "Foreground",  // Draw link on the foreground layer
      },
      new go.Binding("points").makeTwoWay(),
      
      // Shape of the link (the line itself)
      $(go.Shape, 
        {
          stroke: "darkgrey",  // Set the color of the link (line) to black
          strokeWidth: 3,
          strokeDashArray: [10, 5]  // Set the line to be dashed (10px dashes, 5px gaps)
        }),
  
      // Arrowhead at the "to" end of the link (one-way arrow)
      $(go.Shape, 
        {
          toArrow: "Standard",  // Standard arrowhead at the end of the link
          fill: "black",  // Set the color of the arrow to black
          stroke: null  // No border around the arrow
        })
    )
  );


  // TEMPLATE FOR ENZYME NODES
    myDiagram.nodeTemplateMap.add("enzyme",  // Custom category for compound nodes
      new go.Node("Auto")  // Use Vertical Panel to place the label above the shape
        .add(
          new go.Shape("Rectangle").bind("fill","colour")
        ).add(new go.TextBlock(
          { margin: 2,
            font: "10px sans-serif",
            wrap: go.TextBlock.WrapFit,
          width: 80 })
          .bind("text")
        )
    );

    // TEMPLATE FOR MAP NODES
    myDiagram.nodeTemplateMap.add("map",  // Custom category for compound nodes
      new go.Node("Auto")  // Use Vertical Panel to place the label above the shape
        .add(
          new go.Shape("RoundedRectangle", {
            fill: "lightblue",
            width: 100,
            height: 60
          })
        ).add(new go.TextBlock(
          { margin: 2,
            font: "10px sans-serif",
            wrap: go.TextBlock.WrapFit,
          width: 80 })
          .bind("text", "name")
        ),
        {
          toolTip:  // Create ToolTip when hovering over a node
            $(go.Adornment, "Auto",
              $(go.Shape, { fill: "#FFFFCC" }),  // Tooltip background color
              $(go.TextBlock, { margin: 4 }, new go.Binding("text", "toolTipText"))
            )
        }
    );

  // TEMPLATE FOR REACTION GROUPS
    myDiagram.groupTemplate =
    new go.Group("Horizontal")
      .add(
        new go.Panel("Auto")
          .add(
            new go.Shape("Rectangle", {  // surrounds the Placeholder
                parameter1: 0,
                fill: "#F2F2F2"
              }),
            new go.Placeholder(    // represents the area of all member parts,
                { padding: 10})  // with some extra padding around them
          ),
        new go.TextBlock({         // group title
            visible: false
          })
          .bind("text")
      );



  // Assigning Nodes and Links to model - this will be parsed through and assigned
  var model = $(go.GraphLinksModel);
  model.nodeDataArray = [
    {
      key: 'R41',
      text: 'rn:R06836',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '111',
      text: 'cpd:C01151',
      type: 'compound',
      category: 'compound'
    },
    {
      key: '124',
      text: 'cpd:C00119',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: 'R42',
      text: 'rn:R02739',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '112',
      text: 'cpd:C00668',
      type: 'compound',
      category: 'compound'
    },
    {
      key: '134',
      text: 'cpd:C01172',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: 'R43',
      text: 'rn:R05605',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '122',
      text: 'cpd:C04442',
      type: 'compound',
      category: 'compound'
    },
    {
      key: '114',
      text: 'cpd:C00022',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: '113',
      text: 'cpd:C00118',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: 'R45',
      text: 'rn:R02750',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '130',
      text: 'cpd:C01801',
      type: 'compound',
      category: 'compound'
    },
    {
      key: '131',
      text: 'cpd:C00673',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: 'R46',
      text: 'rn:R02749',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '138',
      text: 'cpd:C00672',
      type: 'compound',
      category: 'compound'
    },
    {
      key: 'R47',
      text: 'rn:R01066',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '132',
      text: 'cpd:C00118',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: 'R48',
      text: 'rn:R01049',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '123',
      text: 'cpd:C00117',
      type: 'compound',
      category: 'compound'
    },
    {
      key: 'R49',
      text: 'rn:R01057',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '125',
      text: 'cpd:C00620',
      type: 'compound',
      category: 'compound'
    },
    {
      key: 'R50',
      text: 'rn:R01051',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '126',
      text: 'cpd:C00121',
      type: 'compound',
      category: 'compound'
    },
    {
      key: 'R51',
      text: 'rn:R01641',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '129',
      text: 'cpd:C05382',
      type: 'compound',
      category: 'compound'
    },
    {
      key: '142',
      text: 'cpd:C00231',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: 'R52',
      text: 'rn:R01056',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '144',
      text: 'cpd:C00199',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: 'R53',
      text: 'rn:R01529',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R54',
      text: 'rn:R01067',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '137',
      text: 'cpd:C00085',
      type: 'compound',
      category: 'compound'
    },
    {
      key: '127',
      text: 'cpd:C00279',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: 'R55',
      text: 'rn:R01068',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '133',
      text: 'cpd:C00354',
      type: 'compound',
      category: 'compound'
    },
    {
      key: 'R56',
      text: 'rn:R00756',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R57',
      text: 'rn:R00762',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R58',
      text: 'rn:R13199',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R59',
      text: 'rn:R02032 rn:R02034',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '119',
      text: 'cpd:C00345',
      type: 'compound',
      category: 'compound'
    },
    {
      key: '128',
      text: 'cpd:C01218',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: 'R60',
      text: 'rn:R02658',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '136',
      text: 'cpd:C06473',
      type: 'compound',
      category: 'compound'
    },
    {
      key: 'R61',
      text: 'rn:R01528',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R62',
      text: 'rn:R02035',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '135',
      text: 'cpd:C01236',
      type: 'compound',
      category: 'compound'
    },
    {
      key: 'R63',
      text: 'rn:R02736',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R64',
      text: 'rn:R01544',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '158',
      text: 'cpd:C03752',
      type: 'compound',
      category: 'compound'
    },
    {
      key: '120',
      text: 'cpd:C00204',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: 'R65',
      text: 'rn:R01541',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R66',
      text: 'rn:R02036',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R67',
      text: 'rn:R01737',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '115',
      text: 'cpd:C00257',
      type: 'compound',
      category: 'compound'
    },
    {
      key: 'R68',
      text: 'rn:R01538',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R69',
      text: 'rn:R01519',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '116',
      text: 'cpd:C00198',
      type: 'compound',
      category: 'compound'
    },
    {
      key: 'R70',
      text: 'rn:R06620',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '117',
      text: 'cpd:C00031',
      type: 'compound',
      category: 'compound'
    },
    {
      key: 'R71',
      text: 'rn:R00305',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R72',
      text: 'rn:R01522',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '118',
      text: 'cpd:C00221',
      type: 'compound',
      category: 'compound'
    },
    {
      key: 'R73',
      text: 'rn:R01520 rn:R01521',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R80',
      text: 'rn:R01522',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R81',
      text: 'rn:R01741',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R82',
      text: 'rn:R08575',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R83',
      text: 'rn:R01057',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R94',
      text: 'rn:R08570',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '139',
      text: 'cpd:C00577',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: 'R96',
      text: 'rn:R08571',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '140',
      text: 'cpd:C00258',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: 'R98',
      text: 'rn:R08572',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '141',
      text: 'cpd:C00631',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: 'R102',
      text: 'rn:R05605',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R108',
      text: 'rn:R01739',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R106',
      text: 'rn:R01621',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '143',
      text: 'cpd:C00231',
      type: 'compound',
      category: 'compound'
    },
    {
      key: 'R150',
      text: 'rn:R05338',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '145',
      text: 'cpd:C06019',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: 'R146',
      text: 'rn:R05805',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R152',
      text: 'rn:R05339',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R156',
      text: 'rn:R10408',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '154',
      text: 'cpd:C20589',
      type: 'compound',
      category: 'compound'
    },
    {
      key: 'R157',
      text: 'rn:R10407',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '121',
      text: 'cpd:C03752',
      type: 'compound',
      category: 'compound'
    },
    {
      key: 'R159',
      text: 'rn:R10324',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R162',
      text: 'rn:R01058',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '161',
      text: 'cpd:C00197',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: 'R163',
      text: 'rn:R08570',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R164',
      text: 'rn:R01538',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R165',
      text: 'rn:R07147',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R166',
      text: 'rn:R07147',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R167',
      text: 'rn:R01541',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R168',
      text: 'rn:R10615',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R174',
      text: 'rn:R01058 rn:R10860',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R175',
      text: 'rn:R10221',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R176',
      text: 'rn:R02736 rn:R10907',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R177',
      text: 'rn:R10907',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R179',
      text: 'rn:R00764',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R184',
      text: 'rn:R13089',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R183',
      text: 'rn:R11535',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: 'R187',
      text: 'rn:R10555',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '185',
      text: 'cpd:C01182',
      type: 'compound',
      category: 'compound',
      position: undefined
    },
    {
      key: 'R193',
      text: 'rn:R01844',
      type: 'reaction',
      category: 'reaction',
      isGroup: true
    },
    {
      key: '192',
      text: 'cpd:C02076',
      type: 'compound',
      category: 'compound'
    },
    {
      key: '44',
      text: 'path:ec00010',
      name: 'Glycolysis / Gluconeogenesis',
      type: 'map',
      category: 'map'
    },
    {
      key: '74',
      text: 'path:ec00010',
      name: 'Glycolysis / Gluconeogenesis',
      type: 'map',
      category: 'map'
    },
    {
      key: '75',
      text: 'path:ec00040',
      name: 'Pentose and glucuronate interconversions',
      type: 'map',
      category: 'map'
    },
    {
      key: '76',
      text: 'path:ec00230',
      name: 'Purine metabolism',
      type: 'map',
      category: 'map'
    },
    {
      key: '77',
      text: 'path:ec00030',
      name: 'TITLE:Pentose phosphate pathway',
      type: 'map',
      category: 'map'
    },
    {
      key: '78',
      text: 'path:ec00240',
      name: 'Pyrimidine metabolism',
      type: 'map',
      category: 'map'
    },
    {
      key: '79',
      text: 'path:ec00340',
      name: 'Histidine metabolism',
      type: 'map',
      category: 'map'
    },
    {
      key: '99',
      text: 'path:ec00040',
      name: 'Pentose and glucuronate interconversions',
      type: 'map',
      category: 'map'
    },
    {
      key: '169',
      text: 'path:ec00052',
      name: 'Galactose metabolism',
      type: 'map',
      category: 'map'
    },
    {
      key: '172',
      text: 'path:ec00052',
      name: 'Galactose metabolism',
      type: 'map',
      category: 'map'
    },
    {
      key: '180',
      text: 'path:ec00750',
      name: 'Vitamin B6 metabolism',
      type: 'map',
      category: 'map'
    },
    {
      key: '189',
      text: 'path:ec00630',
      name: 'Glyoxylate and dicarboxylate metabolism',
      type: 'map',
      category: 'map'
    },
    {
      key: '41R41',
      text: 'ec:2.7.4.23',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R41',
      position: { x: '615', y: '658' }
    },
    {
      key: '42R42',
      text: 'ec:5.3.1.9',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R42',
      position: { x: '207', y: '365' }
    },
    {
      key: '43R43',
      text: 'ec:4.1.2.14',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R43',
      position: { x: '762', y: '319' }
    },
    {
      key: '43R102',
      text: 'ec:4.1.2.14',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R102',
      position: { x: '762', y: '319' }
    },
    {
      key: '45R45',
      text: 'ec:2.7.1.15',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R45',
      position: { x: '398', y: '745' }
    },
    {
      key: '46R46',
      text: 'ec:5.4.2.7',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R46',
      position: { x: '398', y: '777' }
    },
    {
      key: '47R47',
      text: 'ec:4.1.2.4',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R47',
      position: { x: '268', y: '777' }
    },
    {
      key: '48R48',
      text: 'ec:2.7.6.1',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R48',
      position: { x: '536', y: '613' }
    },
    {
      key: '49R49',
      text: 'ec:5.4.2.7',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R49',
      position: { x: '615', y: '569' }
    },
    {
      key: '49R83',
      text: 'ec:5.4.2.7',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R83',
      position: { x: '615', y: '569' }
    },
    {
      key: '50R50',
      text: 'ec:2.7.1.15',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R50',
      position: { x: '615', y: '548' }
    },
    {
      key: '51R51',
      text: 'ec:2.2.1.1',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R51',
      position: { x: '416', y: '588' }
    },
    {
      key: '52R52',
      text: 'ec:5.3.1.6',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R52',
      position: { x: '535', y: '513' }
    },
    {
      key: '53R53',
      text: 'ec:5.1.3.1',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R53',
      position: { x: '476', y: '474' }
    },
    {
      key: '54R54',
      text: 'ec:2.2.1.1',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R54',
      position: { x: '311', y: '474' }
    },
    {
      key: '55R55',
      text: 'ec:4.1.2.13',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R55',
      position: { x: '207', y: '607' }
    },
    {
      key: '56R56',
      text: 'ec:2.7.1.11',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R56',
      position: { x: '182', y: '525' }
    },
    {
      key: '57R57',
      text: 'ec:3.1.3.11',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R57',
      position: { x: '146', y: '504' }
    },
    {
      key: '58R58',
      text: 'ec:5.3.1.9',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R58',
      position: { x: '207', y: '439' }
    },
    {
      key: '59R59',
      text: 'ec:1.1.1.43',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R59',
      position: { x: '499', y: '277' }
    },
    {
      key: '60R60',
      text: 'ec:2.7.1.13',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R60',
      position: { x: '456', y: '244' }
    },
    {
      key: '61R61',
      text: 'ec:1.1.1.44',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R61',
      position: { x: '510', y: '373' }
    },
    {
      key: '62R62',
      text: 'ec:3.1.1.31',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R62',
      position: { x: '456', y: '329' }
    },
    {
      key: '63R63',
      text: 'ec:1.1.1.49',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R63',
      position: { x: '286', y: '319' }
    },
    {
      key: '64R64',
      text: 'ec:4.3.1.9',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R64',
      position: { x: '672', y: '104' }
    },
    {
      key: '65R65',
      text: 'ec:2.7.1.45',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R65',
      position: { x: '647', y: '244' }
    },
    {
      key: '65R167',
      text: 'ec:2.7.1.45',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R167',
      position: { x: '647', y: '244' }
    },
    {
      key: '66R66',
      text: 'ec:4.2.1.12',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R66',
      position: { x: '604', y: '330' }
    },
    {
      key: '67R67',
      text: 'ec:2.7.1.12',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R67',
      position: { x: '540', y: '244' }
    },
    {
      key: '68R68',
      text: 'ec:4.2.1.140',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R68',
      position: { x: '604', y: '166' }
    },
    {
      key: '68R164',
      text: 'ec:4.2.1.140',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R164',
      position: { x: '604', y: '166' }
    },
    {
      key: '69R69',
      text: 'ec:3.1.1.17',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R69',
      position: { x: '427', y: '156' }
    },
    {
      key: '70R70',
      text: 'ec:1.1.5.2',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R70',
      position: { x: '296', y: '241' }
    },
    {
      key: '71R71',
      text: 'ec:1.1.5.9',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R71',
      position: { x: '248', y: '241' }
    },
    {
      key: '72R72',
      text: 'ec:1.1.3.4',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R72',
      position: { x: '273', y: '145' }
    },
    {
      key: '72R80',
      text: 'ec:1.1.3.4',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R80',
      position: { x: '273', y: '145' }
    },
    {
      key: '73R73',
      text: 'ec:1.1.1.47',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R73',
      position: { x: '273', y: '125' }
    },
    {
      key: '80R72',
      text: 'ec:1.1.3.5',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R72',
      position: { x: '273', y: '166' }
    },
    {
      key: '80R80',
      text: 'ec:1.1.3.5',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R80',
      position: { x: '273', y: '166' }
    },
    {
      key: '81R81',
      text: 'ec:1.1.99.3',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R81',
      position: { x: '456', y: '185' }
    },
    {
      key: '82R82',
      text: 'ec:2.2.1.2',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R82',
      position: { x: '357', y: '565' }
    },
    {
      key: '83R49',
      text: 'ec:5.4.2.2',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R49',
      position: { x: '615', y: '590' }
    },
    {
      key: '83R83',
      text: 'ec:5.4.2.2',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R83',
      position: { x: '615', y: '590' }
    },
    {
      key: '94R94',
      text: 'ec:4.1.2.55',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R94',
      position: { x: '762', y: '145' }
    },
    {
      key: '94R163',
      text: 'ec:4.1.2.55',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R163',
      position: { x: '762', y: '145' }
    },
    {
      key: '96R96',
      text: 'ec:1.2.7.5',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R96',
      position: { x: '892', y: '174' }
    },
    {
      key: '98R98',
      text: 'ec:2.7.1.165',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R98',
      position: { x: '975', y: '156' }
    },
    {
      key: '102R43',
      text: 'ec:4.1.2.55',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R43',
      position: { x: '762', y: '340' }
    },
    {
      key: '102R102',
      text: 'ec:4.1.2.55',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R102',
      position: { x: '762', y: '340' }
    },
    {
      key: '106R106',
      text: 'ec:4.1.2.9',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R106',
      position: { x: '268', y: '727' }
    },
    {
      key: '108R108',
      text: 'ec:1.1.1.215',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R108',
      position: { x: '499', y: '216' }
    },
    {
      key: '146R146',
      text: 'ec:2.7.1.146',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R146',
      position: { x: '232', y: '525' }
    },
    {
      key: '150R150',
      text: 'ec:4.1.2.43',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R150',
      position: { x: '456', y: '406' }
    },
    {
      key: '152R152',
      text: 'ec:5.3.1.27',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'rgb(134, 0, 0)',
      group: 'R152',
      position: { x: '298', y: '406' }
    },
    {
      key: '156R156',
      text: 'ec:4.3.1.29',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'rgb(0, 255, 0)',
      group: 'R156',
      position: { x: '672', y: '378' }
    },
    {
      key: '157R157',
      text: 'ec:2.7.1.203',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R157',
      position: { x: '624', y: '405' }
    },
    {
      key: '159R159',
      text: 'ec:1.2.99.8',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R159',
      position: { x: '892', y: '136' }
    },
    {
      key: '162R162',
      text: 'ec:1.2.1.9',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R162',
      position: { x: '892', y: '319' }
    },
    {
      key: '163R94',
      text: 'ec:4.1.2.51',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R94',
      position: { x: '762', y: '166' }
    },
    {
      key: '163R163',
      text: 'ec:4.1.2.51',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R163',
      position: { x: '762', y: '166' }
    },
    {
      key: '164R68',
      text: 'ec:4.2.1.39',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R68',
      position: { x: '604', y: '145' }
    },
    {
      key: '164R164',
      text: 'ec:4.2.1.39',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R164',
      position: { x: '604', y: '145' }
    },
    {
      key: '165R165',
      text: 'ec:1.1.1.360',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'rgb(148, 0, 0)',
      group: 'R165',
      position: { x: '248', y: '220' }
    },
    {
      key: '165R166',
      text: 'ec:1.1.1.360',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'rgb(148, 0, 0)',
      group: 'R166',
      position: { x: '248', y: '220' }
    },
    {
      key: '166R165',
      text: 'ec:1.1.1.359',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'rgb(255, 0, 0)',
      group: 'R165',
      position: { x: '296', y: '220' }
    },
    {
      key: '166R166',
      text: 'ec:1.1.1.359',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'rgb(255, 0, 0)',
      group: 'R166',
      position: { x: '296', y: '220' }
    },
    {
      key: '167R65',
      text: 'ec:2.7.1.178',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R65',
      position: { x: '697', y: '244' }
    },
    {
      key: '167R167',
      text: 'ec:2.7.1.178',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R167',
      position: { x: '697', y: '244' }
    },
    {
      key: '168R168',
      text: 'ec:1.2.1.89',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R168',
      position: { x: '892', y: '155' }
    },
    {
      key: '174R174',
      text: 'ec:1.2.1.90',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'rgb(0, 255, 0)',
      group: 'R174',
      position: { x: '892', y: '340' }
    },
    {
      key: '175R175',
      text: 'ec:1.1.1.343',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R175',
      position: { x: '560', y: '373' }
    },
    {
      key: '176R176',
      text: 'ec:1.1.1.363',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R176',
      position: { x: '261', y: '340' }
    },
    {
      key: '177R177',
      text: 'ec:1.1.1.388',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R177',
      position: { x: '309', y: '340' }
    },
    {
      key: '179R179',
      text: 'ec:2.7.1.90',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R179',
      position: { x: '118', y: '525' }
    },
    {
      key: '183R183',
      text: 'ec:2.7.1.212',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'rgb(255, 0, 0)',
      group: 'R183',
      position: { x: '673', y: '615' }
    },
    {
      key: '184R184',
      text: 'ec:2.7.1.239',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R184',
      position: { x: '723', y: '615' }
    },
    {
      key: '187R187',
      text: 'ec:5.3.1.29',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'rgb(190, 0, 0)',
      group: 'R187',
      position: { x: '759', y: '658' }
    },
    {
      key: '193R193',
      text: 'ec:2.7.1.14',
      type: 'enzyme',
      category: 'enzyme',
      colour: 'lightgrey',
      group: 'R193',
      position: { x: '356', y: '671' }
    }
  ];

  model.linkDataArray = [
    { from: '111', to: 'R41' },
    { from: 'R41', to: '124' },
    { from: '112', to: 'R42' },
    { from: 'R42', to: '134' },
    { from: '122', to: 'R43' },
    { from: 'R43', to: '114' },
    { from: 'R43', to: '113' },
    { from: '130', to: 'R45' },
    { from: 'R45', to: '131' },
    { from: '138', to: 'R46' },
    { from: 'R46', to: '131' },
    { from: '131', to: 'R47' },
    { from: 'R47', to: '132' },
    { from: '123', to: 'R48' },
    { from: 'R48', to: '124' },
    { from: '125', to: 'R49' },
    { from: 'R49', to: '123' },
    { from: '126', to: 'R50' },
    { from: 'R50', to: '123' },
    { from: '132', to: 'R51' },
    { from: '129', to: 'R51' },
    { from: 'R51', to: '142' },
    { from: 'R51', to: '123' },
    { from: '123', to: 'R52' },
    { from: 'R52', to: '144' },
    { from: '144', to: 'R53' },
    { from: 'R53', to: '142' },
    { from: '137', to: 'R54' },
    { from: '132', to: 'R54' },
    { from: 'R54', to: '142' },
    { from: 'R54', to: '127' },
    { from: '133', to: 'R55' },
    { from: 'R55', to: '132' },
    { from: '137', to: 'R56' },
    { from: 'R56', to: '133' },
    { from: '133', to: 'R57' },
    { from: 'R57', to: '137' },
    { from: '112', to: 'R58' },
    { from: 'R58', to: '137' },
    { from: '119', to: 'R59' },
    { from: 'R59', to: '128' },
    { from: '136', to: 'R60' },
    { from: 'R60', to: '128' },
    { from: '119', to: 'R61' },
    { from: 'R61', to: '144' },
    { from: '135', to: 'R62' },
    { from: 'R62', to: '119' },
    { from: '134', to: 'R63' },
    { from: 'R63', to: '135' },
    { from: '158', to: 'R64' },
    { from: 'R64', to: '120' },
    { from: '120', to: 'R65' },
    { from: 'R65', to: '122' },
    { from: '119', to: 'R66' },
    { from: 'R66', to: '122' },
    { from: '115', to: 'R67' },
    { from: 'R67', to: '119' },
    { from: '115', to: 'R68' },
    { from: 'R68', to: '120' },
    { from: '116', to: 'R69' },
    { from: 'R69', to: '115' },
    { from: '117', to: 'R70' },
    { from: 'R70', to: '116' },
    { from: '117', to: 'R71' },
    { from: 'R71', to: '116' },
    { from: '118', to: 'R72' },
    { from: 'R72', to: '116' },
    { from: '118', to: 'R73' },
    { from: 'R73', to: '116' },
    { from: '118', to: 'R80' },
    { from: 'R80', to: '116' },
    { from: '115', to: 'R81' },
    { from: 'R81', to: '136' },
    { from: '132', to: 'R82' },
    { from: '129', to: 'R82' },
    { from: 'R82', to: '137' },
    { from: 'R82', to: '127' },
    { from: '125', to: 'R83' },
    { from: 'R83', to: '123' },
    { from: '120', to: 'R94' },
    { from: 'R94', to: '139' },
    { from: 'R94', to: '114' },
    { from: '139', to: 'R96' },
    { from: 'R96', to: '140' },
    { from: '140', to: 'R98' },
    { from: 'R98', to: '141' },
    { from: '122', to: 'R102' },
    { from: 'R102', to: '114' },
    { from: 'R102', to: '113' },
    { from: '115', to: 'R108' },
    { from: 'R108', to: '136' },
    { from: '143', to: 'R106' },
    { from: 'R106', to: '132' },
    { from: '144', to: 'R150' },
    { from: 'R150', to: '145' },
    { from: '137', to: 'R146' },
    { from: 'R146', to: '133' },
    { from: '145', to: 'R152' },
    { from: 'R152', to: '137' },
    { from: '154', to: 'R156' },
    { from: 'R156', to: '122' },
    { from: '121', to: 'R157' },
    { from: 'R157', to: '154' },
    { from: '139', to: 'R159' },
    { from: 'R159', to: '140' },
    { from: '113', to: 'R162' },
    { from: 'R162', to: '161' },
    { from: '120', to: 'R163' },
    { from: 'R163', to: '139' },
    { from: 'R163', to: '114' },
    { from: '115', to: 'R164' },
    { from: 'R164', to: '120' },
    { from: '117', to: 'R165' },
    { from: 'R165', to: '116' },
    { from: '117', to: 'R166' },
    { from: 'R166', to: '116' },
    { from: '120', to: 'R167' },
    { from: 'R167', to: '122' },
    { from: '139', to: 'R168' },
    { from: 'R168', to: '140' },
    { from: '113', to: 'R174' },
    { from: 'R174', to: '161' },
    { from: '119', to: 'R175' },
    { from: 'R175', to: '144' },
    { from: '134', to: 'R176' },
    { from: 'R176', to: '135' },
    { from: '134', to: 'R177' },
    { from: 'R177', to: '135' },
    { from: '137', to: 'R179' },
    { from: 'R179', to: '133' },
    { from: '125', to: 'R184' },
    { from: 'R184', to: '111' },
    { from: '125', to: 'R183' },
    { from: 'R183', to: '111' },
    { from: '111', to: 'R187' },
    { from: 'R187', to: '185' },
    { from: '192', to: 'R193' },
    { from: 'R193', to: '129' },
    { from: '113', to: '44', category: 'maplink' },
    { from: '114', to: '44', category: 'maplink' },
    { from: '141', to: '44', category: 'maplink' },
    { from: '161', to: '44', category: 'maplink' },
    { from: '112', to: '74', category: 'maplink' },
    { from: '132', to: '74', category: 'maplink' },
    { from: '74', to: '117', category: 'maplink' },
    { from: '74', to: '118', category: 'maplink' },
    { from: '74', to: '132', category: 'maplink' },
    { from: '134', to: '74', category: 'maplink' },
    { from: '144', to: '75', category: 'maplink' },
    { from: '124', to: '76', category: 'maplink' },
    { from: '76', to: '124', category: 'maplink' },
    { from: '124', to: '78', category: 'maplink' },
    { from: '78', to: '124', category: 'maplink' },
    { from: '124', to: '79', category: 'maplink' },
    { from: '120', to: '99', category: 'maplink' },
    { from: '139', to: '169', category: 'maplink' },
    { from: '113', to: '172', category: 'maplink' },
    { from: '172', to: '113', category: 'maplink' },
    { from: '180', to: '127', category: 'maplink' },
    { from: '180', to: '123', category: 'maplink' },
    { from: '185', to: '189', category: 'maplink' }
  ]
;


  myDiagram.model = model;


  // Functions for Removing duplicate reactions and links
  // And changing enzyme groups appropriately -- Will clean up 


  // Function to remove duplicate reaction-type nodes
  function removeDuplicateReactionNodes() {
    var nodesInfo = {};
    var uniqueParentChildCombinations = new Set();

    // Identify all reaction-type nodes
    myDiagram.nodes.each(function(node) {
      if (node.data.type === "reaction") {
        var nodeId = node.data.key;

        // Get the parent nodes (those that link to this node)
        var parents = [];
        myDiagram.links.each(function(link) {
          if (link.toNode === node) {
            parents.push(link.fromNode.data.key);
          }
        });

        // Get the child nodes (those that this node links to)
        var children = [];
        myDiagram.links.each(function(link) {
          if (link.fromNode === node) {
            children.push(link.toNode.data.key);
          }
        });

        // Store the parent-child relationships
        nodesInfo[nodeId] = { parents: parents, children: children };
      }
    });

    // Compare the parent-child relationships of all reaction-type nodes
    var nodesToRemove = [];

    myDiagram.nodes.each(function(node) {
      if (node.data.type === "reaction") {
        var nodeId = node.data.key;
        var nodeData = nodesInfo[nodeId];

        // Create a unique key for the parent-child combination
        var parentChildKey = JSON.stringify(nodeData.parents.sort()) + "_" + JSON.stringify(nodeData.children.sort());

        // If this parent-child combination has already been seen, mark the node for removal
        if (uniqueParentChildCombinations.has(parentChildKey)) {
          nodesToRemove.push(nodeId);
        } else {
          uniqueParentChildCombinations.add(parentChildKey); // Add the unique combination to the set
        }
      }
    });

    // Remove the duplicate nodes
    nodesToRemove = [...new Set(nodesToRemove)]; // Remove duplicates from the removal list


    var enzyme_groups=[];
    myDiagram.nodes.each(function(node) {
      if (node.data.type == "enzyme"){
        enzyme_groups.push({
          key: node.data.key,
          group: node.data.group,
          name: node.data.text,
    });
      }
    });

    var reaction_groups= [];
    myDiagram.nodes.each(function(node) {
      if (node.data.type == "reaction"){
        //console.log(node.data.key);
        //console.log(node.data.group);
        //console.log(node.data.text);
        reaction_groups.push(node.data.key);
      }
    });


    var enzyme_matches=[];
    //console.log(enzyme_groups);
    enzyme_groups.forEach(function(enzyme){
     //console.log(enzyme);
      
      for (let i=0; i<nodesToRemove.length;i++){
        //console.log(nodesToRemove[i]);
        //console.log(enzyme.group);
        //console.log("------------")
        if (enzyme.group == nodesToRemove[i]){
          //console.log("Match! :"+enzyme.group);
          //console.log(nodesToRemove[i]);
          console.log(enzyme.key);
          //console.log("------------")
          enzyme_matches.push({
            key: enzyme.key,
            group: enzyme.group
          });
        }
      }
    })

    function getNodesWithSameParent(diagram, nodeKey) {
      const node = diagram.findNodeForKey(nodeKey); // Get the node by its key
    
      if (!node) {
        console.error("Node not found!");
        return [];
      }
    
      const parentGroupKey = node.data.group; // Get the parent group's key
      if (!parentGroupKey) {
        console.log("This node has no parent (it's not in a group).");
        return [];
      }
    
      // Find all nodes in the same group (same parent)
      const sameParentNodes = [];
      diagram.nodes.each(n => {
        if (n.data.group === parentGroupKey) {
          sameParentNodes.push(n);
        }
      });
    
      return sameParentNodes;
    }

    function getNodesWithSameChild(diagram, nodeKey) {
      const node = diagram.findNodeForKey(nodeKey); // Get the node by its key
    
      if (!node) {
        console.error("Node not found!");
        return [];
      }
    
      const sameChildNodes = [];
      diagram.links.each(link => {
        if (link.fromNode === node) {
          const toNode = link.toNode; // The child node
          // Add nodes that are connected to the same child nodes
          diagram.nodes.each(n => {
            if (n !== node && n !== toNode && (link.toNode === n || link.fromNode === n)) {
              if (!sameChildNodes.includes(n)) {
                sameChildNodes.push(n);
              }
            }
          });
        }
      });
    
      return sameChildNodes;
    }

    function getNodesWithSameParentAndChild(diagram, nodeKey) {
      // Step 1: Get nodes with the same parent
      const sameParentNodes = getNodesWithSameParent(diagram, nodeKey);
      
      // Step 2: Get nodes with the same child
      const sameChildNodes = getNodesWithSameChild(diagram, nodeKey);
    
      // Filter out nodes that are both in the same parent group and share the same child nodes
      const result = sameParentNodes.filter(node => sameChildNodes.includes(node));
    
      return result;
    }


  function areSetsEqual(set1, set2) {
        if (set1.size !== set2.size) {
            return false; // If the sizes are different, the sets are not equal
        }
    
        for (let item of set1) {
            if (!set2.has(item)) {
                return false; // If set2 doesn't have an item from set1, they're not equal
            }
        }
    
        return true; // Sets are equal if all items match
    }

  function getNodesWithSameParentAndChild2(diagram, nodeKey) {
        const node = diagram.findNodeForKey(nodeKey); // Find the node by its key
        
        if (!node) {
          console.error("Node not found!");
          return [];
        }
      
        // Step 1: Get the parent node (nodes that have outgoing links from the current node)
        const parentNodes = new Set();
        diagram.links.each(link => {
          if (link.toNode === node) {
            parentNodes.add(link.fromNode);  // The 'fromNode' is the parent
          }
        });
      
        if (parentNodes.size === 0) {
          console.log("This node has no parent.");
          return [];
        }
      
        // Step 2: Get the child nodes (nodes that are connected via outgoing links from the current node)
        const childNodes = new Set();
        diagram.links.each(link => {
          if (link.fromNode === node) {
            childNodes.add(link.toNode);  // The 'toNode' is the child
          }
        });
      
        // Step 3: Find nodes that share the same parent and child nodes
        const result = [];
        diagram.nodes.each(otherNode => {
          if (otherNode === node) return;  // Skip the node itself
      
          // Step 3a: Check if the node shares the same parent
          const otherNodeParentNodes = new Set();
          diagram.links.each(link => {
            if (link.toNode === otherNode) {
              otherNodeParentNodes.add(link.fromNode);  // Get the parents for the other node
            }
          });
      
          // Step 3b: Check if the node shares the same children
          const otherNodeChildNodes = new Set();
          diagram.links.each(link => {
            if (link.fromNode === otherNode) {
              otherNodeChildNodes.add(link.toNode);  // Get the children for the other node
            }
          });
          
          // Step 3c: Compare the parent and child nodes
          if (areSetsEqual(parentNodes, otherNodeParentNodes) && areSetsEqual(childNodes, otherNodeChildNodes)) {
            result.push(otherNode.data);
          }
        });
      
        return result;
      }




  function removeMatchingObjects(arr, keyList) {
        return arr.filter(obj => !keyList.includes(obj.key));
    }
      
    var corresponding_reactions = [];
    nodesToRemove.forEach(node=>{
        //console.log("Searching: "+node);
        const nodesWithSameParentAndChild = getNodesWithSameParentAndChild2(myDiagram, node);
        //console.log(nodesWithSameParentAndChild);
        let filteredNodes = removeMatchingObjects(nodesWithSameParentAndChild,nodesToRemove);
        //console.log(filteredNodes);
        corresponding_reactions.push({
          removednode: node,
          matchingnodes: filteredNodes[0].key
        })
    });

    //console.log(corresponding_reactions);

    enzyme_matches.forEach(match=>{
      //console.log(match);
      nodesToRemove.forEach(node=>{
        if (node == match.group){
          //console.log(node);
          //console.log("match!");
          var enzyme_node = myDiagram.findNodeForKey(match.key);
          //console.log(enzyme_node.data);
          //console.log(enzyme_node.group);

          if (enzyme_node) {
            corresponding_reactions.forEach(node_removed=>{
              //console.log(node_removed.removednode);
              //console.log(enzyme_node.data.group);
              if (enzyme_node.data.group == node_removed.removednode){
                console.log("match");
                console.log("Current group:"+enzyme_node.data.group);
                console.log('New Reaction group: '+node_removed.matchingnodes);
                let group = node_removed.matchingnodes
                myDiagram.model.setDataProperty(enzyme_node.data, "group", group);
              }
            })
            // Detach the node from the group
            //myDiagram.model.setDataProperty(enzyme_node.data, "group",null );
          }
          var enzyme_node = myDiagram.findNodeForKey(match.key);
          //console.log(enzyme_node.data);
        }
      })
      //console.log("Enzyme-Nodes to Remove matches:" +match);
    });

    nodesToRemove.forEach(function(nodeId) {
      var node = myDiagram.findNodeForKey(nodeId);
      if (node) {
        myDiagram.remove(node);
      }
    });

    console.log("Removed Duplicate Nodes:", nodesToRemove);
  }

  // Call the function to remove duplicate reaction-type nodes
  removeDuplicateReactionNodes();
}



// Initialize the diagram -- called from link.js with Node and Link arrays 
init();
