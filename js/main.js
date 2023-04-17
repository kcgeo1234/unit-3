// Add all scripts to the JS folder
(function(){
    //variables for data join
    var attrArray = ["Computer_and_electronic_product_manufacturing",
                    "Transportation_and_warehousing",
                    "Transit_and_ground_passenger_transportation",
                    "Real_estate_and_rental_and_leasing",
                    "Educational_services_and_health_care_and_social_assistance"];
    var expressed = attrArray[0];
    var csv_len

    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.45,
    chartHeight = 473,
    leftPadding = 50,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
    .range([463, 0])
    .domain([0, 18000]);

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
        var projection = d3.geoAlbersUsa()
            .scale(800)
            .translate([width / 2, height / 2]);

        var path = d3.geoPath()
            .projection(projection);

        //use Promise.all to parallelize asynchronous data loading
        var promises = [];    
        promises.push(d3.csv("data/stateGDP_perC.csv")); //load attributes from csv    
        promises.push(d3.json("data/us_50state_4326.topojson")); //load background spatial data    
        Promise.all(promises).then(callback);

        function callback(data){
            csvData = data[0],    
            basemap = data[1],
            states = data[1];

            //translate TopoJSON
            var basemap = topojson.feature(basemap, basemap.objects.us_50state_4326);
            var us_states = topojson.feature(states, states.objects.us_50state_4326).features;

            var base = map.append("path")
                .datum(basemap)
                .attr("class", "basemap")
                .attr("d", path);
            
            var colorScale = makeColorScale(csvData);
            
            us_states = joinData(us_states, csvData);
            setEnumerationUnits(us_states, map, path, colorScale);

            setChart(csvData, colorScale);

            createDropdown(csvData);
        };
    };

    //function to create coordinated bar chart
    function setChart(csvData, colorScale){
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
        
        //set bars for each province
        var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.name;
        })
        .attr("width", chartInnerWidth / csv_len - 1)
        .on("mouseover", function(event,d){
            highlight_chart(d)
            setLabel_chart(d)
        })
        .on("mouseout", function(event,d){
            dehighlight()
        })
        .on("mousemove", moveLabel);

        updateChart(bars, csv_len, colorScale)


        //create a text element for the chart title
        var chartTitle = chart.append("text")
            .attr("x", 60)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text("Number of "+ expressed.split("_").join(" ")+ " GDP per capita in each state");

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

    //function to highlight enumeration units and bars
    function highlight(props){
        //change stroke
        var selected = d3.selectAll("." + props.NAME)
            .style("stroke", "blue")
            .style("stroke-width", "2");
    };

    //function to highlight enumeration units and bars
    function highlight_chart(props){
        //change stroke
        var selected = d3.selectAll("." + props.name)
            .style("stroke", "blue")
            .style("stroke-width", "2");
    };

    //function to dehighlight enumeration units and bars
    function dehighlight(){
        //change stroke
        var states = d3.selectAll(".states")
            .style("stroke", "black")
            .style("stroke-width", "0.5");

        var states = d3.selectAll(".bar")
            .style("stroke", "none")
            .style("stroke-width", "0");
        // remove info label
        var selected = d3.select(".infolabel")
            .remove();
    };


    function setEnumerationUnits(us_states, map, path, colorScale){
        var states = map.selectAll(".states")
                .data(us_states)
                .enter()
                .append("path")
                .attr("class", function(d){
                    return "states " + d.properties.NAME
                })
                .attr("d", path)
                .style("fill", function(d){
                    return colorScale(d.properties[expressed])
                })
                .on("mouseover", function(event,d){
                    highlight(d.properties)
                    setLabel(d.properties)
                })
                .on("mouseout", function(event,d){
                    dehighlight()
                })
                .on("mousemove", moveLabel);

    };

    function createDropdown(csvData){
        //add select element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function(){
                changeAttribute(this.value, csvData)
            });
    

        // add initial option
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Selet Attribute");
        
        //add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){
            d = d.split("_").join(" ")
            return d
        });
    }

    //dropdown change event handler
    function changeAttribute(attribute, csvData) {
        //change the expressed attribute
        expressed = attribute;

        //recreate the color scale
        var colorScale = makeColorScale(csvData);

        //recolor enumeration units
        var states = d3.selectAll(".states")
            .transition()
            .duration(1000)
            .style("fill", function (d) {
                var value = d.properties[expressed];
                if (value) {
                    return colorScale(d.properties[expressed]);
                } else {
                    return "#ccc";
                }
        });

        //Sort, resize, and recolor bars
        var bars = d3.selectAll(".bar")
            //Sort bars
            .sort(function(a, b){
                return a[expressed] - b[expressed];
            })
            .transition()
            .delay(function(d, i){
                return i * 20
            })
            .duration(500);
        updateChart(bars, csv_len, colorScale)
    }
    //function to position, size, and color bars in chart
    function updateChart(bars, n, colorScale){
        //position bars
        bars.attr("x", function(d, i){
                return i * (chartInnerWidth / n) + leftPadding;
            })
            //size/resize bars
            .attr("height", function(d, i){
                return 463 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d, i){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            //color/recolor bars
            .style("fill", function(d){            
                var value = d[expressed];            
                if(value) {                
                    return colorScale(value);            
                } else {                
                    return "#ccc";            
                }    
        });
        
        var chartTitle = d3.select(".chartTitle")
            .text("Number of "+ expressed.split("_").join(" ")+ " GDP per capita in each state");

    };

    //function to create dynamic label
    function setLabel(props){
        //label content
        var labelAttribute = "<h1>" + props[expressed].toFixed(2) +
            "</h1><b>" + expressed.split("_").join(" ") + "</b>";

        //create info label div
        var infolabel = d3.select("body")
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.NAME + "_label")
            .html(labelAttribute);

        var stateName = infolabel.append("div")
            .attr("class", "labelname")
            .html(props.NAME.split("_").join(" "));
    };

    function setLabel_chart(props){
        //label content
        var labelAttribute = "<h1>" + parseFloat(props[expressed]).toFixed(2) +
            "</h1><b>" + expressed.split("_").join(" ") + "</b>";

        //create info label div
        var infolabel = d3.select("body")
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.name + "_label")
            .html(labelAttribute);

        var stateName = infolabel.append("div")
            .attr("class", "labelname")
            .html(props.name.split("_").join(" "));
    };

    //function to move info label with mouse
    function moveLabel(){
        //get width of label
        var labelWidth = d3.select(".infolabel")
            .node()
            .getBoundingClientRect()
            .width;


        //use coordinates of mousemove event to set label coordinates
        var x1 = event.clientX + 10,
            y1 = event.clientY - 75,
            x2 = event.clientX - labelWidth - 10,
            y2 = event.clientY + 25;

        //horizontal label coordinate, testing for overflow
        var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
        //vertical label coordinate, testing for overflow
        var y = event.clientY < 75 ? y2 : y1; 

        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    };

})();