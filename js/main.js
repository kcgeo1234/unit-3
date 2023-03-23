// Add all scripts to the JS folder
//SVG dimension variables
var w = 900, h = 500;

//Example 1.2 line 1...container block
window.onload = function(){
    var container = d3.select('body')
    .append("svg") //put a new svg in the body
   .attr("width", w) //assign the width
   .attr("height", h) //assign the height
   .attr("class", "container") //always assign a class (as the block name) for styling and future selection
   .style("background-color", "rgba(0,0,0,0.2)"); //only put a semicolon at the end of the block!

   //innerRect block
   var innerRect = container.append("rect")
   .datum(400) //a single value is a DATUM
   .attr("width", function(d){ //rectangle width
       return d * 2; //400 * 2 = 800
   })
   .attr("height", function(d){ //rectangle height
       return d; //400
   })
   .attr("class", "innerRect") //class name
   .attr("x", 50) //position from left on the x (horizontal) axis
   .attr("y", 50) //position from top on the y (vertical) axis
   .style("fill", "#FFFFFF"); //fill color
};