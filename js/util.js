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
// generates a base brightness level (base), then randomly adds color to it
// total colors possible: 2 base levels * 6 colorize options = 12 colors
var COLOR_MAX = 12;
function random_color() {
    var base = Math.ceil(Math.random()*2) * 64;
    var red = base, green = base, blue = base;
    var colorize = Math.floor(Math.random()*6);
    if (colorize === 1) { red += 126; }
    else if (colorize === 2) { green += 126; }
    else if (colorize === 3) { blue += 126; }
    else if (colorize === 4) { red += 126; blue += 126; }
    else if (colorize === 5) { green += 126; blue += 126; }
    return '#' + hexify(red, 2) + hexify(green, 2) + hexify(blue, 2);
}
function hexify(num, digits) {
    num = num.toString(16);
    while (num.length < digits) { num = "0" + num; }
    return num;
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
        return '<a href="' + url + '">' + url + '</a>';  
    })  
}