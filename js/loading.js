function loading() {
    var loaded = false; // not done loading until we have the first twitter tps data
    
    var canvas = document.getElementById("loading");
    var ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#444444";
    ctx.fillStyle = "#FFFFFF";
    
    var fps = 1000/30; // fps at 30fps
    var radius = 10;
    var current_percent = 100; // forces complete redraw at start
    
    var rotations = 0; // tracking rotations for spinner
    var rotations_per_frame = 0.8/fps; // 1 rotation per second
    var start_angle = 0;
    
    var update = function() {
        if (!loaded) { // draw loading spinner and check to see if we're done loading
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            start_angle += Math.PI * 2 * rotations_per_frame
            ctx.arc(canvas.width/2, canvas.height/2, 10, start_angle, start_angle + Math.PI*2*rotations, false);
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.arc(canvas.width/2, canvas.height/2, 5, 2*start_angle, 2*start_angle + Math.PI*2*rotations, false);
            ctx.stroke();
            ctx.closePath();
            rotations += rotations_per_frame;
            if (rotations > 1) { rotations = 0; }
            if (TWITTER !== undefined) {
                for (var i = 0; i < SEARCHES.length; i++) {
                    var encoded_search = enc_name(SEARCHES[i]);
                    if (TWITTER.tweets_per_second[encoded_search].length > 2) {
                        loaded = true;
                        UI.add_tps_chart();
                        break;
                    }
                }
            }
        } else if (!$('#analytics_page').is(":hidden")) {
            var current_time = (new Date()).getTime();
            var percent = (1 - ((TWITTER.end_time - current_time) / TWITTER.update_interval));
            if (percent > 1) { percent = 1; }
            if (current_percent > percent || TWITTER.error) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                draw_rrectangle(ctx, 0, 0, canvas.width, canvas.height, radius, "stroke");
            }
            current_percent = percent;
            var width = current_percent * canvas.width;
            if (width >= canvas.width) { width = canvas.width - 1; }
            if (current_percent * canvas.width >= radius) {
                // have the loading bar turn red if the user is current rate-limited
                if (TWITTER.error) { ctx.fillStyle = "#FF0000"; }
                else { ctx.fillStyle = "#FFFFFF"; }
                draw_rrectangle(ctx, 0, 1, width, canvas.height-1, radius, "fill");
            }
            if (TWITTER.error) {
                ctx.fillStyle = "#000000";
                ctx.textAlign = "center";
                ctx.font = '16px sans-serif';
                ctx.fillText("Waiting on Twitter", canvas.width/2, canvas.height/2 + 6);
            }
            TWITTER.till_next_search -= fps;
        }
        setTimeout(update, fps);
    };
    
    update();
}