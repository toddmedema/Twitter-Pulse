window.onresize = function(event) {
    // resize the search text input
    var padding = 38; 
    if (window.innerWidth < 700) { padding = 50; }
    var width = $("#add_search_field").parent().width() - padding;
    $("#add_search_field").width(width);
    // resize UI
    if (UI !== undefined) {
        if ($("#pages").width() !== UI.page_width) {
            $("#content").scrollTop(0);
            UI.page_width = $("#pages").width();
            if (window.innerWidth < 700) { UI.page_width -= 10; }
        }
        UI.update();
    }
}

function Ui() {
    this.loading = new loading();
    this.page_width = $("#pages").width();
    this.charts = [];
    
    this.tweet_queue = []; // queue of tweets to display
    this.tweet_display_speed = 1000;
    this.tweet_display_max = 30; // maximum number of tweets to show in DOM
}

Ui.prototype.update = function() {
    // update charts
    for (var i = 0; i < UI.charts.length; i++) {
        UI.charts[i].update();
    }
    // update tweet #'s and search colors
    for (var i = 0; i < SEARCHES.length; i++) {
        var search = SEARCHES[i];
        var encoded_search = enc_name(search);
        $("#"+encoded_search+"_listing .tweet_count").html(String(TWITTER.tweets[encoded_search].length));
        $('.color'+i).css('background-color', COLORS[i]).css('stroke', COLORS[i]);
    }
}

/* UI interaction events */
$(".tab").click(function() {
    if (!$(this).hasClass("active_tab")) {
        // hide old active tab & page
        if ($(".active_tab").length > 0) {
            var page_id = $(".active_tab").text($(".active_tab").text().replace("> ", "").replace(" <", ""))
                                .removeClass("active_tab").attr('id').replace("_tab", "_page");
            $("#"+page_id).hide().css('visibility', 'hidden');
        }
        // show new
        var page_id = $(this).text("> " + $(this).text() + " <")
                            .addClass("active_tab").attr('id').replace("_tab", "_page");
        $("#"+page_id).show().css('visibility', 'visible');

    }
});
$("#add_search_field").focus(function() {
    if ($(this).val() === "Add a search term") {
        $(this).val("");
        $(this).removeClass("blurred");
    }
});
$("#add_search_field").blur(function() {
    if ($(this).val() === "") {
        $(this).val("Add a search term");
        $(this).addClass("blurred");
    }
});
// have pressing enter submit new search term
$('#add_search_field').keydown(function(event) {
    if (event.which == 13) {
        $("#add_search_button").click();
        event.preventDefault();
    }
});
$("#add_search_button").click(function() {
    if ($("#add_search_field").val() === "") {
        alert("Please enter a search term to add");
    } else {
        TWITTER.add_search($("#add_search_field").val());
        $("#add_search_field").val("");
    }
});
$(document).on("click", ".del_search_button", function() {
    var search = $(this).attr("id").replace("_del", "");
    TWITTER.remove_search(search);
    $(this).parent().remove();
});
$(document).on("click", ".add_trending_button", function() {
    var search = $(this).attr("id").replace("_add", "");
    $(this).parent().remove();
    TWITTER.add_search(search);
});

/* UI Insertion Events */
Ui.prototype.add_search = function(search) {
    var encoded_search = enc_name(search);
    var spot = SEARCHES.length-1;
    var del = $("<button>X</button>").attr("id", encoded_search+"_del").addClass("del_search_button");
    var col = $("<div class='color_block color" + spot + "' style='background-color: " + COLORS[spot] + ";'></div>");
    var text = $("<span class='term'>" + search + "</span> <span>(<span class='tweet_count'>0</span> tweets)</span>");
    var div = $("<div></div>").attr("id", encoded_search + "_listing").append(del).append(col).append(text);
    $("#searches").prepend(div);
}
Ui.prototype.add_tps_chart = function() {
    UI.charts.push(new tps_chart());
}

Ui.prototype.add_tweet = function(tweet) {
    UI.tweet_queue.push(tweet);
}
Ui.prototype.display_next_tweet = function() {
    var display_speed = UI.tweet_display_speed;
    if (UI.tweet_queue.length > 0 && !$('#tweets_page').is(":hidden")) {
        // if there's a big queue to display, move faster (but still with a delay)
        display_speed = Math.max(display_speed - (UI.tweet_queue.length * 10), 100);
        var tweet = UI.tweet_queue.shift();
        var div = $("<div class='tweet'></div>");
        var text = $("<p>" + tweet.text + "<br/>- </p>");
        var link = $("<a href='http://twitter.com/" + tweet.from_user + "'>" + tweet.from_user + "</a> ");
        var keywords = $("<span class='keywords'></span>");
        for (var i = 0; i < tweet.keywords.length; i++) {
            var keyword = tweet.keywords[i];
            var spot = SEARCHES.indexOf(keyword);
            keywords.append($("<div class='color_block color" + spot + "' style='background-color: " + COLORS[spot] + ";'></div>"));
        }
        
        text.append(keywords).append(link);
        div.html(text);
        $("#tweets").prepend(div);
        $(div).hide().fadeIn(display_speed);
        // if too many tweets in DOM, remove old ones
        if ($(".tweet").length > UI.tweet_display_max) {
            $(".tweet:last").remove();
        }
    }
    setTimeout(UI.display_next_tweet, display_speed);
}