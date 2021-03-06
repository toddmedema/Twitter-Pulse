// remove click delay on mobile - from http://cubiq.org/remove-onclick-delay-on-webkit-for-iphone
function NoClickDelay(el) {
	this.element = el;
	if( window.Touch ) this.element.addEventListener('touchstart', this, false);
}
NoClickDelay.prototype = {
	handleEvent: function(e) {
		switch(e.type) {
			case 'touchstart': this.onTouchStart(e); break;
			case 'touchmove': this.onTouchMove(e); break;
			case 'touchend': this.onTouchEnd(e); break;
		}
	},
	onTouchStart: function(e) {
		e.preventDefault();
		this.moved = false;
		this.element.addEventListener('touchmove', this, false);
		this.element.addEventListener('touchend', this, false);
	},
	onTouchMove: function(e) {
		this.moved = true;
	},
	onTouchEnd: function(e) {
		this.element.removeEventListener('touchmove', this, false);
		this.element.removeEventListener('touchend', this, false);
		if( !this.moved ) {
			var theTarget = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
			if(theTarget.nodeType == 3) theTarget = theTarget.parentNode;
			var theEvent = document.createEvent('MouseEvents');
			theEvent.initEvent('click', true, true);
			theTarget.dispatchEvent(theEvent);
		}
	}
};
// string hash function, from http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
function hashString(string){
    var hash = 0, i, char;
    if (string.length == 0) return hash;
    for (i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};
// turns a search term into a URL & CSS safe string
function enc_name(name) {
    var encoded = encodeURIComponent(name);
    var CSS_safe = encoded.replace(/%/g,"").replace(/'/g, "");
    return CSS_safe;
}
// modified from: https://developer.mozilla.org/en-US/docs/Canvas_tutorial/Drawing_shapes
function draw_rrectangle(ctx, x1, y1, x2, y2, radius, style) {
	// to prevent rounded edge issues, flip 1 and 2 if they're inverted
	if (x2 < x1) {var t = x1; x1 = x2; x2 = t;}
	if (y2 < y1) {var t = y1; y1 = y2; y2 = t;}
	var x = x1, y = y1;
	var width = Math.abs(x2 - x1);
	var height = Math.abs(y2 - y1);
	// create a path with the rounded rectangle
	ctx.beginPath();
	ctx.moveTo(x,y+radius);
	ctx.lineTo(x,y+height-radius);
	ctx.quadraticCurveTo(x,y+height,x+radius,y+height);
	ctx.lineTo(x+width-radius,y+height);
	ctx.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
	ctx.lineTo(x+width,y+radius);
	ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
	ctx.lineTo(x+radius,y);
	ctx.quadraticCurveTo(x,y,x,y+radius);
	ctx.closePath();
	if (style === "stroke")
		ctx.stroke();
	else if (style === "fill")
		ctx.fill();
	else if (style === "clear") {
		ctx.save();
		ctx.clip();
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.restore();
	}
}
// 10 colors optimally spaced for minimum confusion
// based off http://web.media.mit.edu/~wad/color/palette.html
var COLOR_MAX = 10;
function random_color() {
    var colors = ['#000000', '#0000FF', '#FF0000', '#00FF00', '#FFFF00',
                '#FF00FF', '#FF8080', '#808080', '#800000', '#FF8000'];
    return colors[Math.floor(Math.random()*colors.length)];
}
// from http://stackoverflow.com/questions/2901102/how-to-print-number-with-commas-as-thousands-separators-in-javascript
function coma_number(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}
// take a block of text, and insert <a> tags whereever there are URLs
// from http://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
function linkify(text) {
    var urlRegex = /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi;
    // var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;  
    return text.replace(urlRegex, function(url) {  
        return '<a href="' + url + '" target="_blank">' + url + '</a>';  
    })  
}
/* REPORT ERRORS TO MIXPANEL */
// Browser detection (http://www.quirksmode.org/js/detect.html)
var BrowserDetect = {
    init: function () {
        this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
        this.version = this.searchVersion(navigator.userAgent)
            || this.searchVersion(navigator.appVersion)
            || "an unknown version";
        this.OS = this.searchString(this.dataOS) || "an unknown OS";
    },
    searchString: function (data) {
        for (var i=0;i<data.length;i++)    {
            var dataString = data[i].string;
            var dataProp = data[i].prop;
            this.versionSearchString = data[i].versionSearch || data[i].identity;
            if (dataString) {
                if (dataString.indexOf(data[i].subString) != -1)
                    return data[i].identity;
            }
            else if (dataProp)
                return data[i].identity;
        }
    },
    searchVersion: function (dataString) {
        var index = dataString.indexOf(this.versionSearchString);
        if (index == -1) return;
        return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
    },
    dataBrowser: [
        {
            string: navigator.userAgent,
            subString: "Chrome",
            identity: "Chrome"
        },
        {   string: navigator.userAgent,
            subString: "OmniWeb",
            versionSearch: "OmniWeb/",
            identity: "OmniWeb"
        },
        {
            string: navigator.vendor,
            subString: "Apple",
            identity: "Safari",
            versionSearch: "Version"
        },
        {
            prop: window.opera,
            identity: "Opera",
            versionSearch: "Version"
        },
        {
            string: navigator.vendor,
            subString: "iCab",
            identity: "iCab"
        },
        {
            string: navigator.vendor,
            subString: "KDE",
            identity: "Konqueror"
        },
        {
            string: navigator.userAgent,
            subString: "Firefox",
            identity: "Firefox"
        },
        {
            string: navigator.vendor,
            subString: "Camino",
            identity: "Camino"
        },
        {        // for newer Netscapes (6+)
            string: navigator.userAgent,
            subString: "Netscape",
            identity: "Netscape"
        },
        {
            string: navigator.userAgent,
            subString: "MSIE",
            identity: "Explorer",
            versionSearch: "MSIE"
        },
        {
            string: navigator.userAgent,
            subString: "Gecko",
            identity: "Mozilla",
            versionSearch: "rv"
        },
        {         // for older Netscapes (4-)
            string: navigator.userAgent,
            subString: "Mozilla",
            identity: "Netscape",
            versionSearch: "Mozilla"
        }
    ],
    dataOS : [
        {
            string: navigator.platform,
            subString: "Win",
            identity: "Windows"
        },
        {
            string: navigator.platform,
            subString: "Mac",
            identity: "Mac"
        },
        {
            string: navigator.userAgent,
            subString: "iPhone",
            identity: "iPhone/iPod"
        },
        {
            string: navigator.platform,
            subString: "Linux",
            identity: "Linux"
        }
    ]

};
BrowserDetect.init();


// Error reporting
window.onerror = function(errorMessage, url, lineNumber) {
    try {
        if (navigator.userAgent.indexOf('Firefox') !== -1 &&
                errorMessage === 'Error loading script') {
            // Firefox generates this error when leaving a page
            // before all scripts have finished loading
        }
        else if (navigator.userAgent.indexOf('Safari') !== -1 &&
                errorMessage === 'JavaScript execution exceeded timeout') {
            // Bug on Safari on iOS devices
            // After ANY page causes a timeout, this will be thrown after ~1ms of
            // JavaScript execution on every page until the browser is restarted.
            // http://stackoverflow.com/questions/7447731/javascript-execution-exceeded-timeout-jquery-mobile
        }
        else {
            var report = {};
            report['message'] = errorMessage;
            report['browser'] = BrowserDetect.browser + " " + BrowserDetect.version;
            report['OS'] = BrowserDetect.OS;
            report['scriptURL'] = url;
            report['browserURL'] = window.location.toString();
            report['line'] = lineNumber;
            report['trace'] = printStackTrace().join('\n');

            mixpanel.track("JS_error", report);
        }
    }
    catch (e) {
        // prevent recursive onerror calls if above function has error
    }
    // Also fire the default handler
    return false;
};