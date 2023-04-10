// Add all scripts to the JS folder
(function(){
    //variables for data join
    var attrArray = ["Computer_and_electronic_product_manufacturing",
                    "Transportation_and_warehousing",
                    "Transit_and_ground_passenger_transportation",
                    "Real_estate_and_rental_and_leasing",
                    "Educational_services_and_health_care,_and_social_assistance"];
    var expressed = attrArray[0];
    var csv_len

    window.onload = setMap();

    //set up choropleth map
    function setMap(){
        //map frame dimensions
        var width = window.innerWidth * 0.4,
            height = 460;

        //create new svg container for the map
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        //create Albers equal area conic projection centered on US
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
        promises.push(d3.csv("data/stateGDP_perC.csv")); //load attributes from csv    
        promises.push(d3.json("data/us_50state_4326.topojson")); //load background spatial data    
        promises.push(d3.json("data/us_50state_4326.topojson")); //load background spatial data    
        Promise.all(promises).then(callback);

        function callback(data){
            csvData = data[0],    
            basemap = data[1],
            states = data[2];

            setGraticule(map, path);


            //translate TopoJSON
            var basemap = topojson.feature(basemap, basemap.objects.us_50state_4326);
            var us_states = topojson.feature(states, states.objects.us_50state_4326).features;

            var base = map.append("path")
                .datum(basemap)
                .attr("class", "states")
                .attr("d", path);
            
            var colorScale = makeColorScale(csvData);
            
            us_states = joinData(us_states, csvData);
            setEnumerationUnits(us_states, map, path, colorScale);

            setChart(csvData, colorScale);
        };
    };

    //function to create coordinated bar chart
    function setChart(csvData, colorScale){
        //chart frame dimensions
        var chartWidth = window.innerWidth * 0.55,
            chartHeight = 473,
            leftPadding = 50,
            rightPadding = 2,
            topBottomPadding = 5,
            chartInnerWidth = chartWidth - leftPadding - rightPadding,
            chartInnerHeight = chartHeight - topBottomPadding * 2,
            translate = "translate(" + leftPadding + "," + topBottomPadding + ")";


        //create a second svg element to hold the bar chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");

            //create a rectangle for chart background fill
        var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

        //create a scale to size bars proportionally to frame and for axis
        var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 4000]);

        
        //set bars for each province
        //set bars for each province
        var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.name;
        })
        .attr("width", chartInnerWidth / csv_len - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csv_len) + leftPadding;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return colorScale(d[expressed]);
        });

        //create a text element for the chart title
        var chartTitle = chart.append("text")
            .attr("x", 80)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text("Number of "+ expressed+ " GDP in each state");

        //create vertical axis generator
        var yAxis = d3.axisLeft()
            .scale(yScale);

        //place axis
        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);

        //create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);


    };

    function setGraticule(map, path){
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

        // //create graticule background
        // var gratBackground = map.append("path")
        //     .datum(graticule.outline()) //bind graticule background
        //     .attr("class", "gratBackground") //assign class for styling
        //     .attr("d", path) //project graticule

    };

    function joinData(us_states, csvData){
        //loop through csv to assign each set of csv attribute values to geojson region
        csv_len = csvData.length // calculate the length of csv data
        statelst_len = us_states.length // calculate the length of us state list
        for (var i=0; i<csv_len; i++){
            var csvState = csvData[i]; // each state data in CSV
            var csvKey = csvState.name; //the CSV primary key

            //loop through geojson regions to find correct region
            for (var j = 0; j < statelst_len; j++){

                var geojsonProps = us_states[j].properties; //the current state geojson properties
                var geojsonKey = geojsonProps.NAME; //the geojson primary key

                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey){

                    //assign all attributes and values
                    attrArray.forEach(function(attr){
                        var val = parseFloat(csvState[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });
                };
            };
        };
        return us_states;
    };

    //function to create color scale generator
    function makeColorScale(data){
        var colorClasses = [
            "#D4B9DA",
            "#C994C7",
            "#DF65B0",
            "#DD1C77",
            "#980043"
        ];

        //create color scale generator
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        //build array of all values of the expressed attribute
        csv_len = csvData.length
        var domainArray = [];
        for (var i = 0; i < csv_len; i++){
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };

        //assign array of expressed values as scale domain
        colorScale.domain(domainArray);

        return colorScale;
    };

    function setEnumerationUnits(us_states, map, path, colorScale){
        var states = map.selectAll(".states")
                .data(us_states)
                .enter()
                .append("path")
                .attr("class", function(d){
                    return "states" + d.properties.name
                })
                .attr("d", path)
                .style("fill", function(d){
                    return colorScale(d.properties[expressed])
                });

    };

})();