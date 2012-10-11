function Ui(){this.loading=new loading;this.page_width=$("#pages").width();this.charts=[];this.tps_chart=null;this.tweet_queue=[];this.tweet_display_speed=1e3;this.tweet_display_min_speed=100;this.tweet_display_max_count=30;this.tweet_mode="stream";this.active_filters=[]}window.onresize=function(e){var t=$("#add_search_field").parent().width()-38;$("#add_search_field").width(t);if(UI!==undefined&&$("#pages").width()!==UI.page_width){$("#content").scrollTop(0);UI.page_width=$("#pages").width();window.innerWidth<700&&(UI.page_width-=10);for(var n=0;n<UI.charts.length;n++)UI.charts[n].resize();UI.update()}};Ui.prototype.update=function(e){if(TWITTER!==undefined&&e)if(!TWITTER.new_search)for(var t=0;t<SEARCHES.length;t++){var n=enc_name(SEARCHES[t]),r=TWITTER.tweets_per_second[n][0];TWITTER.error&&(r=0);TWITTER.tweets_per_second[n].unshift(r)}else TWITTER.new_search=!1;if(!$("#analytics_page").is(":hidden")){for(var t=0;t<UI.charts.length;t++)UI.charts[t].update();$("#total_tweets").text(coma_number(TWITTER.tweets.length));$("#per_topic").html("");UI.relational_output(TWITTER.tweets_dict,"")}$("#tweets_page").is(":hidden")||(UI.tweet_queue.length>UI.tweet_display_max_count?$("#new_tweet_count").text(coma_number(UI.tweet_display_max_count)+"+"):$("#new_tweet_count").text(coma_number(UI.tweet_queue.length)));for(var t=0;t<SEARCHES.length;t++){var i=SEARCHES[t],n=enc_name(i);$("#"+n+"_listing .tweet_count").text(coma_number(TWITTER.tweets_dict[i].total_count));$(".color"+t).css("background-color",COLORS[t]).css("stroke",COLORS[t])}e&&setTimeout(function(){UI.update(e)},e)};$(".tab").click(function(){if(!$(this).hasClass("active_tab")){if($(".active_tab").length>0){var e=$(".active_tab").text($(".active_tab").text().replace("> ","").replace(" <","")).removeClass("active_tab").attr("id").replace("_tab","_page");$("#"+e).hide().css("visibility","hidden");mixpanel.track("Nav",{page:$(this).text()})}var e=$(this).text("> "+$(this).text()+" <").addClass("active_tab").attr("id").replace("_tab","_page");$("#"+e).show().css("visibility","visible");$(".active_tab").text()==="> Tweets <"&&UI.display_next_tweet();UI.update()}});$("#add_search_field").focus(function(){$(this).val()==="Add a search term"&&$(this).val("").removeClass("blurred")});$("#add_search_field").blur(function(){$(this).val()===""&&$(this).val("Add a search term").addClass("blurred")});$("#add_search_field").keydown(function(e){if(e.which===13){$("#add_search_button").click();e.preventDefault()}});$("#add_search_button").click(function(){if($("#add_search_field").val()===""||$("#add_search_field").val()==="Add a search term")alert("Please enter a search term to add");else{TWITTER.add_search($("#add_search_field").val());$("#add_search_field").val("")}});$("#tweet_mode_toggle").click(function(){if($(this).text()==="Read Mode"){$(this).text("Stream Mode");UI.tweet_mode="read";$("#new_read_tweets").show()}else{$(this).text("Read Mode");UI.tweet_mode="stream";$("#new_read_tweets").hide()}mixpanel.track("Tweet mode",{mode:UI.tweet_mode})});$("#new_read_tweets").click(function(){$(".tweet").css("opacity",.5);UI.display_tweets(UI.tweet_display_max_count);UI.update()});$("#trending_toggle").click(function(){if($(this).hasClass("icon-chevron-down")){$(this).addClass("icon-chevron-up").removeClass("icon-chevron-down");$("#trending").show()}else{$(this).addClass("icon-chevron-down").removeClass("icon-chevron-up");$("#trending").hide()}});$(document).on("click",".del_search_button",function(){var e=$(this).parent().children(".term").text(),t=SEARCHES.indexOf(e);$(".color"+t).remove();$(this).parent().remove();TWITTER.remove_search(e);var n=UI.active_filters.indexOf(e);UI.active_filters.splice(n);UI.update()});$(document).on("click",".add_trending_button",function(){var e=$(this).parent().children(".term").text();$(this).parent().remove();TWITTER.add_search(e)});$(document).on("click",".filter",function(){var e=$(this).data("term");if($(this).hasClass("off")){$(this).removeClass("off");UI.active_filters.push(e)}else{$(this).addClass("off");var t=UI.active_filters.indexOf(e);t!==-1&&UI.active_filters.splice(t,1)}UI.change_filters()});Ui.prototype.relational_output=function(e,t){for(var n in e)if(e.hasOwnProperty(n)&&e[n].total_count>0){$("#per_topic").append("<tr><td>"+e[n].total_count+"</td><td>"+t+n+"</td></tr>");UI.relational_output(e[n],t+n+"+")}};Ui.prototype.add_search=function(e){var t=enc_name(e),n=SEARCHES.length-1,r=$("<button>X</button>").attr("id",t+"_del").addClass("del_search_button").addClass("clickable"),i=$("<div class='color_block color"+n+"' style='background-color: "+COLORS[n]+";'></div>"),s=$("<span class='term'>"+e+"</span> <span>(<span class='tweet_count'>0</span> tweets)</span>"),o=$("<div></div>").attr("id",t+"_listing").append(r).append(i).append(s);$("#searches").prepend(o);UI.active_filters.push(e);var u=$("<div class='color_block filter clickable color"+n+"' style='background-color: "+COLORS[n]+";'></div>");u.data("term",e);$("#tweet_filters").append(u);UI.change_filters()};Ui.prototype.add_tweet=function(e){UI.tweet_queue.push(e)};Ui.prototype.display_next_tweet=function(){if(!$("#tweets_page").is(":hidden")){var e=UI.tweet_display_speed;if(UI.tweet_queue.length>0&&UI.tweet_mode==="stream"){var t=UI.tweet_queue.pop();e=Math.max(e-UI.tweet_queue.length*10,UI.tweet_display_min_speed);UI._add_tweet_to_ui(t).hide().fadeIn(e)}setTimeout(UI.display_next_tweet,e)}};Ui.prototype.display_tweets=function(e){e>UI.tweet_display_max_count&&(e=UI.tweet_display_max_count);for(var t=0;t<e;t++)UI.tweet_queue.length>0&&UI._add_tweet_to_ui(UI.tweet_queue.pop()).hide().fadeIn(500)};Ui.prototype._add_tweet_to_ui=function(e){var t=$("<div class='tweet'></div>"),n=$("<p>"+linkify(e.text)+"<br/>- </p>"),r=$("<a href='http://twitter.com/"+e.from_user+"' target='_blank' class='author'>"+e.from_user+"</a> "),i=$("<span class='keywords'></span>");for(var s=0;s<SEARCHES.length;s++)e.keywords.indexOf(SEARCHES[s])!==-1?i.append($("<div class='color_block color"+s+"' style='background-color: "+COLORS[s]+";'></div>")):i.append($("<div class='color_block'></div>"));n.append(i).append(r);t.html(n);$("#tweets").prepend(t);var o=$(".tweet").length;o>UI.tweet_display_max_count&&$(".tweet:last").remove();o>2?$("#tweets_to_top").show():$("#tweets_to_top").hide();return t};Ui.prototype.add_tps_chart=function(){UI.tps_chart=new tps_chart;UI.charts.push(UI.tps_chart);UI.update()};Ui.prototype.change_filters=function(){$("#tweets").html("");UI.tweet_queue=[];var e=TWITTER.tweets_dict;for(var t=0;t<SEARCHES.length;t++)SEARCHES.indexOf(UI.active_filters[t])!==-1&&(e=e[SEARCHES[t]]);for(var t=0;t<e.tweets.length;t++){var n=e.tweets[t],r=TWITTER.tweets.getItem(n);r.keywords=UI.active_filters;UI.tweet_queue.push(r)}UI.display_tweets(UI.tweet_display_max_count);UI.update()};