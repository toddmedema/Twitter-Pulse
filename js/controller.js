var UI;
var TWITTER;
var CHARTS;
var SEARCHES = []; // all searches currently running
var COLORS = []; // the color for each search term

$(document).ready(function() {
    UI = new Ui();
    window.onresize(); // make sure the UI fits the screen
    TWITTER = new Twitter();
    TWITTER.add_search("apple");
    TWITTER.add_search("iphone");
    TWITTER.update(); // begins fetching twitter data
    UI.update(true); // start having UI update regularly
    UI.display_next_tweet(); // start the tweet display function
    $("#analytics_tab").click();
});

// loads & displays trending topics as suggestions to user
function onTrendData(data) {
    for (var loc = 0; loc < data.length; loc++) {
        for (var i = 0; i < data[loc]["trends"].length; i++) {
            var name = data[loc]["trends"][i]["name"];
            var encoded_name = enc_name(name);
            var add = $("<button><div>+</div></button>").attr("id", encoded_name+"_add").addClass("add_trending_button");
            var text = $("<span class='term'>" + name + "</span>");
            var div = $("<div></div>").attr("id", encoded_name).append(add).append(text);
            $("#trending").prepend(div);
        }
    }
}