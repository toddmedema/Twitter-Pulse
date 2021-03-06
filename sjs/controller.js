var UI; // UI object
var TWITTER; // Twitter object
var SEARCHES = []; // all searches currently running, as plain english
var COLORS = []; // the color for each search term

$(document).ready(function() {
    UI = new Ui();
    window.onresize(); // make sure the UI fits the screen
    TWITTER = new Twitter();
    TWITTER.add_search("romney", true);
    TWITTER.add_search("obama", true);
    TWITTER.update(); // begins fetching twitter data
    UI.update(1000); // start having UI update regularly (every 1000ms)
    $("#analytics_tab").click();
    update_trending();
    new NoClickDelay($('a'));
    new NoClickDelay($('.clickable'));
});

// loads & displays trending topics as suggestions to user, refreshes once per minute
function update_trending() {
    $.ajax({
        url: 'http://api.twitter.com/1/trends/1.json?callback=?',
        dataType: 'json',
        success: function( data ) {
            $("#trending").html("");
            for (var loc = 0; loc < data.length; loc++) {
                for (var i = 0; i < data[loc]["trends"].length; i++) {
                    var name = data[loc]["trends"][i]["name"];
                    if (SEARCHES.indexOf(name.toLowerCase()) === -1) {
                        var encoded_name = enc_name(name);
                        var add = $("<button>+</button>").attr("id", encoded_name+"_add").addClass("add_trending_button");
                        var text = $("<span class='term'>" + name + "</span>");
                        var div = $("<div></div>").attr("id", encoded_name).append(add).append(text);
                        $("#trending").prepend(div);
                    }
                }
            } 
        }
    });
    setTimeout(update_trending, 60000);
}