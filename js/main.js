// Add all scripts to the JS folder
//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    //map frame dimensions
    var width = 960, height = 460;
    
    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
    
    //create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([-90, 60])
        .rotate([50, 40, -2])
        .parallels([30, 49])
        .scale(400)
        .translate([width / 2, height / 2]);
    
    var path = d3.geoPath()
        .projection(projection);

    //use Promise.all to parallelize asynchronous data loading
    var promises = [];    
    promises.push(d3.csv("data/stateGDP.csv")); //load attributes from csv    
    promises.push(d3.json("data/us_50state_4326.topojson")); //load background spatial data    
    promises.push(d3.json("data/us_50state_4326.topojson")); //load background spatial data    
    Promise.all(promises).then(callback);

    function callback(data){
        csvData = data[0];    
        basemap = data[1];
        states = data[2];
        //translate europe TopoJSON
        var basemap = topojson.feature(basemap, basemap.objects.us_50state_4326);
        var us_states = topojson.feature(states, states.objects.us_50state_4326).features;
        // console.log(us_states)

        var base = map.append("path")
            .datum(basemap)
            .attr("class", "states")
            .attr("d", path)

        var states = map.selectAll(".regions")
            .data(us_states)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions" + d.properties.name
            })
            .attr("d", path);

        //create graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

        //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines

         //Example 2.6 line 1...create graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

        // //create graticule background
        // var gratBackground = map.append("path")
        //     .datum(graticule.outline()) //bind graticule background
        //     .attr("class", "gratBackground") //assign class for styling
        //     .attr("d", path) //project graticule

        //Example 2.6 line 5...create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines

    };
};