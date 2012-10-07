function tps_chart() {
    this.title = "Tweets per Second";
    this.data = TWITTER.tweets_per_second;
    this.height = 200;
    this.width = $("#pages").width();
    this.xPadding = 40;
    this.topPadding = 20;
    this.bottomPadding = 30;
    this.num_to_show = 120; // intervals of data to show
    
    // create chart, with title
    this.chart = d3.select("#analytics")
                .append("svg")
                .attr("width", this.width)
                .attr("height", this.height);
    this.draw_text();
    
    this.update();
}

tps_chart.prototype.update = function() {
    if (!$('#analytics_page').is(":hidden")) {
        this.chart.selectAll("path").remove();
        this.draw_axis();
        // for each search term, plot data
        var xScale = this.xScale;
        var yScale = this.yScale;
        var xPadding = this.xPadding;
        var line = d3.svg.line()
                    .x(function(d,i) { return xScale(i); })
                    .y(function(d) { return yScale(d); })
                    .interpolate("basis");
        for (var i = 0; i < SEARCHES.length; i++) {
            var data = this.data[enc_name(SEARCHES[i])].slice(0, this.num_to_show);
            this.chart.append("svg:path").attr("d", line(data))
                    .attr("class", "chart_line, color"+i)
                    .style("fill", 'rgba(0,0,0,0)')
                    .attr("transform", "translate(" + (xScale(0) - xPadding) + ")")
                    .transition()
                    .ease("linear")
                    .duration(1100)
                    .attr("transform", "translate(" + (xScale(1) - xPadding) + ")");
        }
    }
}
tps_chart.prototype.resize = function() {
    this.width = $("#pages").width();
    this.chart.attr("width", this.width);
    this.draw_text();
}
// regenerate axis (scales to match data range across all searches)
tps_chart.prototype.draw_axis = function() {
    this.chart.selectAll(".axis").remove();
    var max = 1;
    for (var i = 0; i < SEARCHES.length; i++) {
        var new_max = d3.max(this.data[enc_name(SEARCHES[i])], function(d) { return d; });
        if (new_max > max) { max = Math.ceil(new_max); }
    }
    this.xScale = d3.scale.linear()
                .domain([0, this.num_to_show])
                .range([this.xPadding, this.width - this.xPadding]);
    this.xAxis = d3.svg.axis()
                .scale(this.xScale)
                .orient("bottom")
                .ticks(Math.round(this.width/100));
    this.chart.append("g").attr("class", "axis").attr("id", "xAxis")
                .attr("transform", "translate(0, " + (this.height - this.bottomPadding) + ")")
                .call(this.xAxis);
    this.yScale = d3.scale.linear()
                .domain([0, max])
                .range([this.height - this.bottomPadding, this.topPadding]);
    this.yAxis = d3.svg.axis()
                .scale(this.yScale)
                .orient("left")
                .ticks(Math.round(this.height/100));
    this.chart.append("g").attr("class", "axis").attr("id", "yAxis")
                .attr("transform", "translate(" + this.xPadding + ", 0)")
                .call(this.yAxis);
}
tps_chart.prototype.draw_text = function() {
    this.chart.selectAll("text").remove();
    this.chart.append("text")
                .text("Tweets/second")
                .attr("font-size", "20px")
                .attr("x", this.width/2)
                .attr("y", this.topPadding)
                .attr("text-anchor", "middle");
    this.chart.append("text")
                .attr("class", "axis_label")
                .attr("text-anchor", "middle")
                .attr("x", this.width/2)
                .attr("y", this.height - 2)
                .text("time (s)");
    this.chart.append("text")
                .attr("class", "axis_label")
                .attr("text-anchor", "middle")
                .attr("y", 10)
                .attr("x", -(this.height-this.bottomPadding-this.topPadding)/2 - this.topPadding)
                .attr("transform", "rotate(-90)")
                .text("new tweets");
}