module.exports = (function () {
	var util = ({
		imports: function (apiToImport, name) {
			this[name] = apiToImport;
			console.log("core.util :: " + name + " imported.");
		},
		init: function () {
		},

		timeConverter: function (timestamp) {
			var a = new Date(timestamp);
			var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
			var year = a.getFullYear();
			var month = months[a.getMonth()];
			var date = a.getDate();
			var hour = a.getHours();
			var min = a.getMinutes() < 10 ? '0' + a.getMinutes() : a.getMinutes();
			var sec = a.getSeconds() < 10 ? '0' + a.getSeconds() : a.getSeconds();
			var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
			return time;
		},
		/* guid
		 * Generate simple guid, mainly used for app id's
		 */
		guid: function () {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
				var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			}).toUpperCase();
		},
		/* stripHtml 
		 * Fast but dirty way to convert HTML into text by stripping out all tags.
		 */
		stripHtml: function (html) {
			var tmp = document.createElement("DIV"); tmp.innerHTML = html; return tmp.textContent || tmp.innerText;
		},
		/* toPosition
		* Converts left & top values to the complicated 'position' object used by jquery-ui widgets
		*/
		toPosition: function (left, top) {
			var left = "left+" + left;
			var top = "top+" + +top;
			var my = left + " " + top;
			return({ my: my, at: "left top", of: $('body') });
		},
		/* startsWith extended version
		 * Accepts more than then one char.
		 */
		startsWith: function (str, comp) {
			if (comp.substr(0, str.length) == str) return (true);
			else return (false);
		},
		/* endsWith extended version
		 * Accepts more than then one char.
		 */
		endsWith: function (str, comp) {
			if (comp.substr(comp.length - str.length, str.length) == str) return (true);
			else return (false);
		},

		convertArray: function (arr, callback) {
			var err = null;
			var len = arr.length - 1;

			async.each(arr, function ( value, ittCallback) {
				var path = BVFS.sh.pwd() + value.attr;
				var ext = BVFS.path.extname(path).replace(".", "");
				var verb;  // todo implement other mimetypes ??
				if (ext == "jpg") { ext = "jpeg"; verb = "image" }
				if (ext == "css") verb = "text";
				if (ext == "swf") { verb = "application"; ext = "x-shockwave-flash"; }
				if (ext == "js") {
					BVFS.fs.readFile(path, 'utf8', function (_err, script) {
						if (err) err = _err;
						else value.scriptContent = script; 
						ittCallback();
					});
				} 
				else {
					util.createObjectUrl(path, verb, ext, function (_err, url) {
						if (err) err = _err;
						else value.attr= url;
						ittCallback();
					});
				}
			}, function (err) {
				callback(err, arr);
			});
		},// function contvertArray
	

		/* convertSrc : make files available for the apps html
		* input / output : jqueryfied html oject.
		* If useBvfs is set to false it's not used, it can be set by te usebvfs option
		* Due to its possible hight load, its done in a webworker
		*/
		convertSrc: function (htmlObject, useBvfs, callback) {
			if (!useBvfs) { callback(null, htmlObject);return;}
			var list = htmlObject.find("[bvfs]");

			if (list.length === 0) { callback(null, htmlObject); return; }
			var tmpArr = [];
			list.each(function (index, element) {
				tmpArr[index] = {};
				tmpArr[index].attr = list[index].getAttribute("bvfs");
				tmpArr[index].tagName = list[index].tagName.toLowerCase();
				tmpArr[index].scriptContent = "";
			});

			util.convertArray(tmpArr,function (err, resultArr) {
				var len = resultArr.length - 1; // do something with the result
				$.each(resultArr, function (index, c) {
					var o = list[index];
					// handle script tag a special way
					if (c.tagName === 'script') { o.appendChild(document.createTextNode(c.scriptContent));}
					else {	
						if (c.tagName === 'param') o.value = c.attr;
						if (c.tagName === 'object') o.data = c.attr;
						if (c.tagName === 'img' || c.tagName === 'video') o.src = c.attr;
						if (c.tagName === 'a' || c.tagName === 'link') o.href = c.attr;
					}
					o.removeAttribute('bvfs');
					if (index == len) callback(null, htmlObject);			
				}); // end each
			});
		},

		createObjectUrl: function (fileName, verb, ext, callback) {
			var mimeType = verb + '/' + ext;
			BVFS.fs.open(fileName, 'r', function (err, fd) {
				if (err) return callback(err.message, null);
				BVFS.fs.fstat(fd, function (err, stats) {
					if (err) return callback(err.message, null);
					var buff = new BVFS.buffer(stats.size);
					BVFS.fs.read(fd, buff, 0, buff.length, 0, function (err, nbytes) {
						if (err) return callback(err.message, null);
						var blob = new Blob([buff], { type: mimeType }); // pass a useful mime type here
						var url = window.URL.createObjectURL(blob);
						BVFS.fs.close(fd);
						callback(err, url);
					});
				});
			});
		},

		download: function (path, verb, ext, callback) {
			util.createObjectUrl(path, verb, ext, function (err, url) {
				var link = $('<a>');
				link.attr({ 'href': url, "download": BVFS.path.basename(path) });
				link[0].click();
				callback(err, url, link);
			});
		},

		appendStylesheet: function (path, className, callback) {
			util.createObjectUrl(path, 'text','css;', function (err, url) {
				if (err) return console.error (path + " cannot be found.");
				var styleSheet = $("<link rel='stylesheet' type='text/css' />")
				//var className = BVFS.path.basename(path).replace(".css", "");
				styleSheet.attr({ 'href': url, 'class': "_winnies_stylesheets_" + className });
				$("head").append(styleSheet);
				window.URL.revokeObjectURL(url);
				if (callback) callback(err, url);
			});	
		},

		removeStylesheet: function (styleName, callback) {
			$("head").find("._winnies_stylesheets_" + styleName).remove();
			if (callback) callback(err, null);
		},

		setStyle: function (styleName, callback) {
			util.removeStylesheet("override");
			util.removeStylesheet("treedefault");
			util.removeStylesheet("jquery-contextmenu");
			var oldStyle = core.register.getSetting("desktop", "theme");
			util.removeStylesheet(oldStyle);
			var newFile = BVFS.sh.env.get("THE") + styleName + "/index.css";
			util.appendStylesheet(newFile, styleName, function (err, url) {
				util.appendStylesheet(BVFS.sh.env.get("SYS") + "winnies/override.css", "override", function (err, url) {
					util.appendStylesheet(BVFS.sh.env.get("SYS") + "winnies/treedefault.css", "treedefault", function (err, url) {
						util.appendStylesheet(BVFS.sh.env.get("SYS") + "winnies/jquery-contextmenu.css", "jquery-contextmenu", function (err, url) {
							if (callback) callback(err, url);
						});
					});
				});
			});
		},

		setBackground: function (bgName, callback) {
			var fileName = BVFS.installedObject.wallpapers[bgName].files["/"][0];
			var path = BVFS.sh.env.get("WAL") + bgName +  "/"+ fileName;
			var ext = BVFS.path.extname(fileName).replace(".", "");
			if (ext == "jpg") ext = "jpeg";
			util.createObjectUrl(path, "image",  ext, function (err, url) {
				if (err) return console.error(err);
				$("body").css("background-size", "100%");
				$("body").css("background-image", "url('" +  url+ "')");
				if (callback) callback(null, url);
			});				
		},

		upload: function (files, path, callback) {			
			var file = files[0];
			var reader = new window.FileReader();
			reader.readAsArrayBuffer(file);
			reader.onloadend = function () {
				var buffer = new BVFS.buffer(reader.result);
				BVFS.fs.open(path + "/" + file.name, 'w', function (err, fd) {
					if (err) return callback(err.message, null);
					BVFS.fs.write(fd, buffer, 0, buffer.size, 0, function (err, bytesWritten) {
						BVFS.fs.close(fd);
						if (err) return callback(err.message, null);
						callback(err, bytesWritten);
					});
				});
			}
		},

		/*	infoType (app info type
		 *	the core.app functions : kill, launch, install, uninstall, show and hide,
		 *  accepts multiple types of data, to identify what to do.
		 * infoType try to identify this type. Possible return values:
		 * 1. appName : just the name of an app
		 * 2. guid : guid of an allready running instance.
		 * 4. object : this is allready an appinfo object (can hold multiple instances)
		 * 6. guidArray : like guid, but holding multiple guid's in startorder.
		 * 7. appNameArray : like appName, but holding multiple appnames in startorder. 
		 * 8. file : locations to an install.json file, stored on BVFS
		 * 9. local_repository : url starting with http:// or https:// 
		 * location to an app, stored at the local repository,
		 * in this case the app will first be installed
		 * 10. public_repository : url starting with ws:// or wss:/ pointing to an public repository
		 * in this case the app will first be installed
		 */
		infoType: function (appObject) {
			if ($.isArray(appObject)) return (null);											// cannot handle array
			else if (typeof (appObject) == 'object') return ('object');							// asume appObject
			else if (typeof (appObject) == 'string') {
				if (appObject.length == 36 && appObject.split("-").length == 5) return ('guid');								// uid
				else if (util.startsWith("ws://", appObject) || util.startsWith("wss://", appObject)) { { return ('public_repository'); } }	// websocket repository
				else if ((appObject.length >= 12) && util.endsWith('/install.json', appObject)) {										// assume a file
					if (util.startsWith("http://", appObject) || util.startsWith("https://", appObject)) { { return ('local_repository'); } }		// local repository
					else return ('file');
				}
				else return ('appname');
			}
			else return (null);
		},

		// primary used for jstree node id's
		legalId: function (id) {
			id = id.replace(/\//g, "_");
			id = id.replace(/\./g, "_");
			return id;
		}

	});
	util.init();
	return util;
})();