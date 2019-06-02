function buildMetadata(sample) {

  // @TODO: Complete the following function that builds the metadata panel
  // Use `d3.json` to fetch the metadata for a sample
  // Use d3 to select the panel with id of `#sample-metadata`
  var selection = d3.select("#sample-metadata");
  // Use `.html("") to clear any existing metadata
  selection.html("");
  // Use `Object.entries` to add each key and value pair to the panel
  // Hint: Inside the loop, you will need to use d3 to append new
  // tags for each key-value in the metadata.
  d3.json(`/metadata/${sample}`).then(pairs => {
    Object.entries(pairs).forEach((pair) => {
      selection.append("p").text(`${pair[0]} : ${pair[1]}`);
    });

    // BONUS: Build the Gauge Chart
    // buildGauge(data.WFREQ);
    // ALERTALERTALERT
    // THIS IS TAKEN DIRECTLY FROM the plot.ly website for guage charts.
    // Enter a speed between 0 and 180
    var level = Object.values(pairs)[5];
    // console.log(level);
    // Trig to calc meter point
    var degrees = 180 - level*20,
        radius = .5;
    var radians = degrees * Math.PI / 180;
    var x = radius * Math.cos(radians);
    var y = radius * Math.sin(radians);

    // Path: may have to change to create a better triangle
    var mainPath = 'M -.0 -0.025 L .0 0.025 L ',
        pathX = String(x),
        space = ' ',
        pathY = String(y),
        pathEnd = ' Z';
    var path = mainPath.concat(pathX,space,pathY,pathEnd);

    // Colorscheme to be used
    var guageColorScheme = [];
    for (let i=0; i<9; i++) { guageColorScheme.push(`rgba(255, ${255/9*i}, ${255/9*i}, .8)`)};
    guageColorScheme.push("rgba(0,0,0,0)");

    var data = [{ type: 'scatter',
      x: [0], y:[0],
        marker: {size: 28, color:'850000'},
        showlegend: false,
        name: 'wash',
        text: level,
        hoverinfo: 'text+name'},
      { values: [50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50],
      rotation: 90,
      text: ['Overzealous(8-9)', 'Squeaky Clean(7-8)', 'Stellar(6-7)', 'Decent(5-6)', 'ThinCleanLine(4-5)', 'Meh(3-4)', 'Ech(2-3)',
                'Blech(1-2)', 'Super Gross(0-1)', ''],
      textinfo: 'text',
      textposition:'inside',
      marker: {colors:guageColorScheme},
      labels: ['8-9', '7-8', '6-7', '5-6', '4-5', '3-4', '2-3', '1-2', '0-1', ''],
      hoverinfo: 'label',
      hole: .5,
      type: 'pie',
      showlegend: false
    }];

    var layout = {
      shapes:[{
          type: 'path',
          path: path,
          fillcolor: '850000',
          line: {
            color: '850000'
          }
        }],
      title: '<b>Belly Button Wash Frequency</b>',
      xaxis: {zeroline:false, showticklabels:false,
                showgrid: false, range: [-1, 1]},
      yaxis: {zeroline:false, showticklabels:false,
                showgrid: false, range: [-1, 1]}
    };

    Plotly.newPlot("guage", data, layout);
    
  });

  // BONUS: Build the Gauge Chart
  // buildGauge(data.WFREQ);
  // THIS IS TAKEN DIRECTLY FROM the plot.ly website for guage charts.

  
}

function buildCharts(sample) {

  // @TODO: Use `d3.json` to fetch the sample data for the plots
  // @TODO: Build a Bubble Chart using the sample data

  // @TODO: Build a Pie Chart
  // HINT: You will need to use slice() to grab the top 10 otu_values,
  // otu_ids, and labels (10 each).
  d3.json(`/samples/${sample}`).then(returned => {

    // Colorscheme to be used
    var pieColorScheme = [];
    for (let i=0; i<10; i++) { pieColorScheme.push(`rgba(255, ${255/10*i}, ${255/10*i}, .8)`)};

    // Sorts the pie chart value to get the ten largest + index, label, id.
    var topTenID = [];
    var topTen = [];
    var topTenLabels = [];
    var indexes = [];
    for (let j=0;j<10;j++) {
      // gets current max, and its index, and sets it to -1 to find next max
      topTen.push(d3.max(returned["sample_values"]));
      let spot = returned["sample_values"].indexOf(topTen[j]);
      returned["sample_values"][spot] = -1;
      indexes.push(spot);

      // gets max's labels and ids
      topTenID.push(returned["otu_ids"][spot]);
      topTenLabels.push(returned["otu_labels"][spot]);
    };

    // Resets the data to fix the bubble graph
    for (let z=0;z<10;z++) {
      returned["sample_values"][indexes[z]] = topTen[z];
    };

    // Create Layout
    // The widths affect the graph size, but not the svg width.
    // Would require too much time to get it fixed.
    pieLayout = {
      title: "Top Ten Largest Barcterial Infections",
      // width: window.innerHeight
    };

    pieFilling = [{
      values: topTen,
      labels: topTenID,
      hovertext: topTenLabels,
      hoverinfo: "text+label+value",
      marker: {colors:pieColorScheme},
      type: "pie"
    }];
    Plotly.newPlot("pie",pieFilling, pieLayout);


    // Create Layout
    bubbleLayout = {
      title: "Infection Size by ID",
      // width: .5*window.innerHeight
    };

    bubbleBath = [{
      x: returned["otu_ids"],
      y: returned["sample_values"],
      text: returned["otu_labels"],
      mode: "markers",
      marker: {
        color: returned["otu_ids"],
        size: returned["sample_values"]
      }
    }];
    Plotly.newPlot("bubble",bubbleBath,bubbleLayout);
  });
}

function init() {
  // Grab a reference to the dropdown select element
  var selector = d3.select("#selDataset");

  // Use the list of sample names to populate the select options
  d3.json("/names").then((sampleNames) => {
    sampleNames.forEach((sample) => {
      selector
        .append("option")
        .text(sample)
        .property("value", sample);
    });

    // Use the first sample from the list to build the initial plots
    // Building the pie chart overflows the page for some reason the first time.
    // Easy solution was to have init build them twice to bypass that.
    const firstSample = sampleNames[0];
    buildCharts(firstSample);
    buildMetadata(firstSample);
    buildCharts(firstSample)
  });
}

function optionChanged(newSample) {
  // Fetch new data each time a new sample is selected
  buildCharts(newSample);
  buildMetadata(newSample);
}

// Initialize the dashboard
init();
