window.onresize = function(event) {
    // resize the search text input
    var width = $("#add_search_field").parent().width() - 38;
    $("#add_search_field").width(width);
    // if the actual content area size has changed, refresh the UI & resize the charts
    if (UI !== undefined) {
        if ($("#pages").width() !== UI.page_width) {
            $("#content").scrollTop(0);
            UI.page_width = $("#pages").width();
            if (window.innerWidth < 700) { UI.page_width -= 10; }
            for (var i = 0; i < UI.charts.length; i++) {
                UI.charts[i].resize();
            }
            UI.update();
        }
    }
}

function Ui() {
    this.loading = new loading();
    this.page_width = $("#pages").width();
    this.charts = []; // list of all charts managed by the UI
    
    this.tweet_queue = []; // queue of tweets to display
    this.tweet_display_speed = 1000; // will be shortened if there's a long queue to display
    this.tweet_display_min_speed = 500; // minimum amount of time to show each new tweet
    this.tweet_display_max_count = 30; // maximum number of tweets to show in DOM before removing old ones
}

Ui.prototype.update = function(interval) {
    if (TWITTER !== undefined && interval) {
        // if no new data from Twitter, fill in data to keep the chart moving
        if (!TWITTER.new_search) {
            for (var i = 0; i < SEARCHES.length; i++) {
                var encoded_search = enc_name(SEARCHES[i]);
                var current = TWITTER.tweets_per_second[encoded_search][0];
                TWITTER.tweets_per_second[encoded_search].unshift(current);
            }
        } else {
            TWITTER.new_search = false;
        }
    }
    // update charts
    for (var i = 0; i < UI.charts.length; i++) {
        UI.charts[i].update();
    }
    // update tweet #'s and search colors for chart lines
    var total_tweets = 0;
    for (var i = 0; i < SEARCHES.length; i++) {
        var search = SEARCHES[i];
        var encoded_search = enc_name(search);
        $("#"+encoded_search+"_listing .tweet_count").text(String(TWITTER.tweets[encoded_search].length));
        $('.color'+i).css('background-color', COLORS[i])
                .css('stroke', COLORS[i]);
        total_tweets += TWITTER.tweets[encoded_search].length;
    }
    $("#total_tweets").text(total_tweets);
    $("#cross_tweets").text(TWITTER.cross_tweets.length);
    if (interval) {
        setTimeout(function() {UI.update(interval);}, interval);
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
        $(this).val("").removeClass("blurred");
    }
});
$("#add_search_field").blur(function() {
    if ($(this).val() === "") {
        $(this).val("Add a search term").addClass("blurred");
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
    if ($("#add_search_field").val() === "" || $("#add_search_field").val() === "Add a search term") {
        alert("Please enter a search term to add");
    } else {
        TWITTER.add_search($("#add_search_field").val());
        $("#add_search_field").val("");
    }
});
$(document).on("click", ".del_search_button", function() {
    var search = $(this).parent().children(".term").text();
    $(this).parent().remove();
    TWITTER.remove_search(search);
    UI.update();
});
$(document).on("click", ".add_trending_button", function() {
    var search = $(this).parent().children(".term").text();
    $(this).parent().remove();
    TWITTER.add_search(search);
});

/* Events that insert things into the UI */
Ui.prototype.add_search = function(search) {
    var encoded_search = enc_name(search);
    var spot = SEARCHES.length-1;
    var del = $("<button>X</button>").attr("id", encoded_search+"_del").addClass("del_search_button");
    var col = $("<div class='color_block color" + spot + "' style='background-color: " + COLORS[spot] + ";'></div>");
    var text = $("<span class='term'>" + search + "</span> <span>(<span class='tweet_count'>0</span> tweets)</span>");
    var div = $("<div></div>").attr("id", encoded_search + "_listing").append(del).append(col).append(text);
    $("#searches").prepend(div);
}
Ui.prototype.add_tweet = function(tweet) {
    UI.tweet_queue.push(tweet);
}
Ui.prototype.display_next_tweet = function() {
    var display_speed = UI.tweet_display_speed;
    if (UI.tweet_queue.length > 0 && !$('#tweets_page').is(":hidden")) {
        var tweet = UI.tweet_queue.pop();
        // if there's a big queue to display, move faster (but still with a delay)
        display_speed = Math.max(display_speed - (UI.tweet_queue.length * 10), UI.tweet_display_min_speed);
        
        var div = $("<div class='tweet'></div>");
        var text = $("<p>" + tweet.text + "<br/>- </p>");
        var link = $("<a href='http://twitter.com/" + tweet.from_user + "'>" + tweet.from_user + "</a> ");
        var keywords = $("<span class='keywords'></span>");
        for (var i = 0; i < SEARCHES.length; i++) {
            if (tweet.keywords.indexOf(SEARCHES[i]) !== -1) {
                keywords.append($("<div class='color_block color" + i + "' style='background-color: " + COLORS[i] + ";'></div>"));
            } else {
                keywords.append($("<div class='color_block'></div>"));
            }
        }
        text.append(keywords).append(link);
        div.html(text);
        $("#tweets").prepend(div);
        $(div).hide().fadeIn(display_speed);
        // if too many tweets in DOM, remove old ones
        if ($(".tweet").length > UI.tweet_display_max_count) {
            $(".tweet:last").remove();
        }
    }
    setTimeout(UI.display_next_tweet, display_speed);
}
Ui.prototype.add_tps_chart = function() {
    UI.charts.push(new tps_chart());
    UI.update();
}