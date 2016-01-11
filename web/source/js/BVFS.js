window.$ = null;  // Let's do a statement here :)
window.BVFS = require('./BVFS/index.js');
window.oldConsole = window.console;
window.booting = true;

document.addEventListener("DOMContentLoaded", function (event) {

	var body = window.document.getElementsByTagName("body")[0];
	var innerBox = document.createElement("div");
	innerBox.setAttribute("style", "position:absolute;left:10Px;top:10Px;font-size:16Px;width:800Px;height:500Px;background-color:black;z-index:100000;padding:10Px;overflow:auto;border-radius:5Px;");
	innerBox.setAttribute("id", "bootlogbox");
	body.appendChild(innerBox);

	var bootlog = function(msg, color) {
		if (window.booting) {
			var lb = document.createElement("br");
			var span = document.createElement("span");
			span.setAttribute("style", "font-size:25Px;color:" + color + ";");
			var textnode = document.createTextNode("> " + msg);
			span.appendChild(textnode);
			span.appendChild(lb);
			innerBox.insertBefore(span, innerBox.firstChild);
		}
	}

	window.console = {
		log: function (msg) {
			bootlog(msg, "white");
			oldConsole.log(msg);
		},
		info: function (msg) {
			bootlog(msg, "green");
			oldConsole.info(msg);
		},
		debug: function (msg) {
			bootlog(msg, "gray");
			oldConsole.warn(msg);
		},
		warn: function (msg) {
			bootlog(msg, "yellow");
			oldConsole.warn(msg);
		},
		error: function (msg) {
			bootlog(msg, "red");
			oldConsole.error(msg);
		},
	}

	var BVFSoptions = { display: "", bootscript: "repository/boot/boot.js", mode: "dev" };
	BVFS.bootstrap(BVFSoptions, function (err, nrInstalled, nrErrors, installedObject, _user) {
		if (err) { console.log("FATAL!:" + err); return; }
		BVFS.logging("BVFS is ready now, current user: " + _user.USN);
	
		BVFS.fs.readFile('/winnies/system/winnies/index.js', 'utf8', function (err, script) {
			if (err) { console.error(err); return; }
			BVFS.logging("core loaded from BVFS");
			var header = window.document.getElementsByTagName("html")[0].childNodes[0];
			var scriptTag = document.createElement("script");
			var textNode = window.document.createTextNode(script);
			scriptTag.appendChild(textNode);
			header.appendChild(scriptTag);
			$(function () {
				window.core.start();	// start the OS
			});
		});
	});
});

