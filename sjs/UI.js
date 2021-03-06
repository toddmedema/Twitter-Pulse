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
    this.tps_chart = null;
    
    this.tweet_queue = []; // queue of tweets to display
    this.tweet_display_speed = 1000; // will be shortened if there's a long queue to display
    this.tweet_display_min_speed = 100; // minimum amount of time to show each new tweet
    this.tweet_display_max_count = 30; // maximum number of tweets to show in DOM before removing old ones
    this.tweet_mode = "stream";
    this.active_filters = []; // list of active search terms for the tweet page
}

Ui.prototype.update = function(interval) {
    if (TWITTER !== undefined && interval) {
        // if no new data from Twitter, fill in data to keep the chart moving
        if (!TWITTER.new_search) {
            for (var i = 0; i < SEARCHES.length; i++) {
                var encoded_search = enc_name(SEARCHES[i]);
                var current = TWITTER.tweets_per_second[encoded_search][0];
                if (TWITTER.error) { current = 0; }
                TWITTER.tweets_per_second[encoded_search].unshift(current);
            }
        } else {
            TWITTER.new_search = false;
        }
    }
    // analytics page only
    if (!$('#analytics_page').is(":hidden")) {
        // update charts
        for (var i = 0; i < UI.charts.length; i++) {
            UI.charts[i].update();
        }
        $("#total_tweets").text(coma_number(TWITTER.tweets.length));
        // show #'s per topic and topic combo
        $("#per_topic").html("");
        UI.relational_output(TWITTER.tweets_dict, "");
    }
    // tweets page only
    if (!$('#tweets_page').is(":hidden")) {
        if (UI.tweet_queue.length > UI.tweet_display_max_count) {
            $("#new_tweet_count").text(coma_number(UI.tweet_display_max_count)+"+");
        } else {
            $("#new_tweet_count").text(coma_number(UI.tweet_queue.length));
        }
    }
    // update tweet #'s and search colors (search bar + charts)
    for (var i = 0; i < SEARCHES.length; i++) {
        var search = SEARCHES[i];
        var encoded_search = enc_name(search);
        $("#"+encoded_search+"_listing .tweet_count").text(coma_number(TWITTER.tweets_dict[search].total_count));
        $('.color'+i).css('background-color', COLORS[i])
                .css('stroke', COLORS[i]);
    }
    if (interval) {
        setTimeout(function() {UI.update(interval);}, interval);
    }
}

/* UI interaction events */
$(".tab").click(function() {
    if (!$(this).hasClass("active_tab")) {
        // hide old active tab & page, report to mixpanel
        if ($(".active_tab").length > 0) {
            var page_id = $(".active_tab").text($(".active_tab").text().replace("> ", "").replace(" <", ""))
                            .removeClass("active_tab").attr('id').replace("_tab", "_page");
            $("#"+page_id).hide().css('visibility', 'hidden');
            mixpanel.track("Nav", {"page": $(this).text()});
        }
        // show new
        var page_id = $(this).text("> " + $(this).text() + " <")
                        .addClass("active_tab").attr('id').replace("_tab", "_page");
        $("#"+page_id).show().css('visibility', 'visible');
        if ($(".active_tab").text() === "> Tweets <") {
            UI.display_next_tweet(); // start the tweet display function
        }
        UI.update();
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
    if (event.which === 13) {
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
$("#tweet_mode_toggle").click(function() {
    if ($(this).text() === "Read Mode") {
        $(this).text("Stream Mode");
        UI.tweet_mode = "read";
        $("#new_read_tweets").show();
    } else {
        $(this).text("Read Mode");
        UI.tweet_mode = "stream";
        $("#new_read_tweets").hide();
    }
    mixpanel.track("Tweet mode", {"mode": UI.tweet_mode});
});
$("#new_read_tweets").click(function() {
    $(".tweet").css('opacity', 0.5);
    UI.display_tweets(UI.tweet_display_max_count);
    UI.update();
});
$("#trending_toggle").click(function() {
    if ($(this).hasClass("icon-chevron-down")) {
        $(this).addClass("icon-chevron-up").removeClass("icon-chevron-down");
        $("#trending").show();
    } else {
        $(this).addClass("icon-chevron-down").removeClass("icon-chevron-up");
        $("#trending").hide();
    }
});
// these use $(document) to dynamically add listeners to new objects
$(document).on("click", ".del_search_button", function() {
    var search = $(this).parent().children(".term").text();
    var index = SEARCHES.indexOf(search);
    $(".color"+index).remove();
    $(this).parent().remove();
    TWITTER.remove_search(search);
    var filter_index = UI.active_filters.indexOf(search);
    UI.active_filters.splice(filter_index);
    UI.update();
});
$(document).on("click", ".add_trending_button", function() {
    var search = $(this).parent().children(".term").text();
    $(this).parent().remove();
    TWITTER.add_search(search);
});
$(document).on("click", ".filter", function() {
    var search = $(this).data('term');
    if ($(this).hasClass('off')) {
        $(this).removeClass('off');
        //$(this).css('opacity', 1);
        UI.active_filters.push(search);
    } else {
        $(this).addClass('off');
        //$(this).css('opacity', 0.3);
        var index = UI.active_filters.indexOf(search);
        if (index !== -1) {
            UI.active_filters.splice(index, 1);
        }
    }
    UI.change_filters();
});

/* Events that insert things into the UI */
Ui.prototype.relational_output = function(dic, previous) {
    for (var key in dic) {
        if (dic.hasOwnProperty(key)) {
            if (dic[key].total_count > 0) {
                $("#per_topic").append("<tr><td>" + dic[key].total_count + "</td><td>" + previous + key + "</td></tr>");
                UI.relational_output(dic[key], previous + key + "+");
            }
        }
    }
}
    
Ui.prototype.add_search = function(search) {
    var encoded_search = enc_name(search);
    var spot = SEARCHES.length-1;
    var del = $("<button>X</button>").attr("id", encoded_search+"_del").addClass("del_search_button").addClass("clickable");
    var col = $("<div class='color_block color" + spot + "' style='background-color: " + COLORS[spot] + ";'></div>");
    var text = $("<span class='term'>" + search + "</span> <span>(<span class='tweet_count'>0</span> tweets)</span>");
    var div = $("<div></div>").attr("id", encoded_search + "_listing").append(del).append(col).append(text);
    $("#searches").prepend(div);
    
    UI.active_filters.push(search);
    var filter = $("<div class='color_block filter clickable color" + spot + "' style='background-color: " + COLORS[spot] + ";'></div>");
    filter.data('term', search);
    $("#tweet_filters").append(filter);
    UI.change_filters();
}
Ui.prototype.add_tweet = function(tweet) {
    UI.tweet_queue.push(tweet);
}
Ui.prototype.display_next_tweet = function() {
    if (!$('#tweets_page').is(":hidden")) {
        var display_speed = UI.tweet_display_speed;
        if (UI.tweet_queue.length > 0 && UI.tweet_mode === "stream") {
            var tweet = UI.tweet_queue.pop();
            // if there's a big queue to display, move faster (but still with a delay)
            display_speed = Math.max(display_speed - (UI.tweet_queue.length * 10), UI.tweet_display_min_speed);
        
            UI._add_tweet_to_ui(tweet).hide().fadeIn(display_speed);
        }
        setTimeout(UI.display_next_tweet, display_speed);
    }
}
// adds count # of tweets from queue to UI
Ui.prototype.display_tweets = function (count) {
    if (count > UI.tweet_display_max_count) {
        count = UI.tweet_display_max_count;
    }
    for (var i = 0; i < count; i++) {
        if (UI.tweet_queue.length > 0) {
            UI._add_tweet_to_ui(UI.tweet_queue.pop()).hide().fadeIn(500);
        }
    }
}
Ui.prototype._add_tweet_to_ui = function(tweet) {
    var div = $("<div class='tweet'></div>");
    var text = $("<p>" + linkify(tweet.text) + "<br/>- </p>");
    var link = $("<a href='http://twitter.com/" + tweet.from_user + "' target='_blank' class='author'>" + tweet.from_user + "</a> ");
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
    
    var displayed_tweets = $(".tweet").length;
    // if too many tweets in DOM, remove old ones
    if (displayed_tweets > UI.tweet_display_max_count) {
        $(".tweet:last").remove();
    }
    // if multiple tweets, show scroll to top button
    if (displayed_tweets > 2) { $("#tweets_to_top").show(); }
    else { $("#tweets_to_top").hide(); }
    return div;
}
Ui.prototype.add_tps_chart = function() {
    UI.tps_chart = new tps_chart();
    UI.charts.push(UI.tps_chart);
    UI.update();
}
Ui.prototype.change_filters = function() {
    // clear out old tweets, queue newly relevant tweets for display, and force fill the page with old ones
    $("#tweets").html("");
    UI.tweet_queue = [];
    var tweets = TWITTER.tweets_dict;
    // descend the tweet dictionary in the proper order
    for (var i = 0; i < SEARCHES.length; i++) {
        if (SEARCHES.indexOf(UI.active_filters[i]) !== -1) {
            tweets = tweets[SEARCHES[i]];
        }
    }
    // attach keyword info to tweets
    for (var i = 0; i < tweets['tweets'].length; i++) {
        var hash = tweets['tweets'][i];
        var tweet = TWITTER.tweets.getItem(hash);
        tweet['keywords'] = UI.active_filters;
        UI.tweet_queue.push(tweet);
    }
    // fill display with tweets and update UI
    UI.display_tweets(UI.tweet_display_max_count);
    UI.update();
}