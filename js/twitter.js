function Twitter() {
    this.update_interval = 5000;
    this.new_search = false; // lets UI know when a new search has been done
    this.error = false;
    this.tweets = {}; // list tweets for each search term
    this.cross_tweets = []; // tweets that show up under multiple terms
    this.tweets_per_second = {}; // history of tweets per second, per search term
    this.start_time = 0; // time last search ended
    this.end_time = (new Date()).getTime(); // time next search starts
}
    
// check for new tweets
Twitter.prototype.update = function() {
    for (var i = 0; i < SEARCHES.length; i++) {
        var search = SEARCHES[i];
        TWITTER.update_thread(search);
    }
    setTimeout(TWITTER.update, TWITTER.update_interval);
    TWITTER.start_time = TWITTER.end_time;
    TWITTER.end_time = (new Date()).getTime() + TWITTER.update_interval;
    UI.update();
}
Twitter.prototype.update_thread = function(search) {
    var encoded_search = enc_name(search);
    var initial_tweet_count = TWITTER.tweets[encoded_search].length;
    $.getJSON("http://search.twitter.com/search.json?q="+encodeURIComponent(search)+"&rpp=100&callback=?", function(data) {
        if (data.error !== undefined && !TWITTER.error) {
            TWITTER.error = true;
            TWITTER.update_interval *= 2;
            alert("Twitter rate limit exceeded - slowing refresh interval. "
                 +"To return to normal speed, please reduce your number of searches.");
        }
        $(data.results).each(function(i,v) {
            TWITTER.add_tweet(search, this);
        });
        // make sure the search hasn't been deleted, then store tps data
        if (TWITTER.tweets[encoded_search] !== undefined) {
            var tps = (TWITTER.tweets[encoded_search].length - initial_tweet_count) * 1000 / TWITTER.update_interval;
            TWITTER.tweets_per_second[encoded_search].unshift(tps);
            TWITTER.new_search = true;
        }
    });
}

// tracks another tweet - if it was already found, show as cross-topic
Twitter.prototype.add_tweet = function(search, tweet) {
    var hash = hashString(tweet.text);
    var encoded_search = enc_name(search);
    // add it to the search term's list of tweets if it's not already there
    if (TWITTER.tweets[encoded_search].indexOf(hash) === -1) { 
        TWITTER.tweets[encoded_search].push(hash);
        
        // if we haven't caught it yet, check to see if it contains other search keywords
        if (TWITTER.cross_tweets.indexOf(hash) === -1) {
            var lower_text = tweet.text.toLowerCase();
            var keywords = [];
            for (var check = 0; check < SEARCHES.length; check++) {
                var check_search = SEARCHES[check];
                if (lower_text.indexOf(check_search) !== -1) {
                    keywords.push(check_search);
                }
            }
            
            // if we've seen it in other searches, show it to the user
            if (keywords.length > 1) {
                tweet.keywords = keywords;
                TWITTER.cross_tweets.push(hash);
                UI.add_tweet(tweet);
            }
        }
    }
}

// add another search to monitor
Twitter.prototype.add_search = function(name) {
    // generate a fairly distinct random color that's not already in the array
    if (COLORS.length >= COLOR_MAX) {
        alert("Max simultaneous search count reached");
    } else {
        var color = "#000000";
        while (COLORS.indexOf(color) !== -1) {
            color = random_color();
        } 
        
        name = name.toLowerCase();
        var encoded_search = enc_name(name);
        if (SEARCHES.indexOf(name) != -1) {
            alert("You're already searching for that phrase");
        } else {
            SEARCHES.push(name);
            COLORS.push(color);
            TWITTER.tweets[encoded_search] = [];
            TWITTER.tweets_per_second[encoded_search] = [0];
            UI.add_search(name);
        }
    }
}
// remove search from monitor and delete all related data
Twitter.prototype.remove_search = function(name) {
    var index = SEARCHES.indexOf(name);
    if (index != -1) {
        // if the refresh rate has been slowed due to an error, reset
        if (TWITTER.error) {
            TWITTER.error = false;
            TWITTER.update_interval /= 2;
        }
        var encoded_search = enc_name(name);
        SEARCHES.splice(index, 1);
        // preserve other terms' colors
        COLORS.splice(index, 1);
        for (var i = index; i <= SEARCHES.length; i++) {
            $(".color"+i).removeClass("color"+i).addClass("color"+(i-1));
        }
        delete TWITTER.tweets[encoded_search];
        delete TWITTER.tweets_per_second[encoded_search];
    }
}