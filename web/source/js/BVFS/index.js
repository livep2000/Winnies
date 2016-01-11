// Browser Virtual File System

module.exports = (function () {

	var BVFS = ({
		doLog: true,
		path: null,
		buffer: null,
		appcnt : 0,
		errorcnt :0,
		fs: null,
		sh: null,
		objectUrls: {},
		host: window.location,
		authentication: null,
		imports: function (apiToImport, name) {
			this[name] = apiToImport;
			console.log("BVFS :: " + name + " imported.");
		},
		installedObject: {},
		options: { maxlines: 50, fontSize: "16Px", display: "", mode:"prod", flags: [], bootscript: 'repository/boot/boot.js' },
		bootstrap: function (_options, callback) {
			window.async = require('./async.js');					// super handy 
			BVFS.authentication = require('./authentication');		// auth is part of BVFS bootrapping
			var self = this;
			BVFS.logging("bootstrapping BVFS api");
			if (typeof (_options) !== 'undefined') for (key in _options) BVFS.options[key] = _options[key];
			self.authentication.preAuthentication(function (err, user) {
				self.drive(user.USN ,[], function (err, result) {
					if (err) callback(err, null);
					else {
						self.sh.tempDir(function (err, tempdir) {
							self.sh.wget(self.options.bootscript, tempdir, function (err, result) {
								self.sh.exec("/tmp/boot.js", BVFS, function (err, nrInstalled, nrErrors, _installedObject, onlyInstalled) {
									self.installedObject = _installedObject;
									BVFS.createObjectUris(BVFS.sh.env.get("OBU"), function (err, uris) {
										BVFS.objectUrls = uris;
										var nrUrls = Object.keys(uris).length;
										nrInstalled += nrUrls;
										self.logging(nrInstalled + " new items installed, with " + nrErrors + " error(s).");
										self.logging(Object.keys(self.installedObject.system).length + " system.");
										self.logging(Object.keys(self.installedObject.apps).length + " app(s).");
										self.logging(Object.keys(self.installedObject.widgets).length + " widget(s).");
										self.logging(Object.keys(self.installedObject.plugins).length + " plugin(s).");
										self.logging(Object.keys(self.installedObject.apis).length + " api(s).");
										self.logging(Object.keys(self.installedObject.dialogs).length + " dialog(s).");
										self.logging(Object.keys(self.installedObject.templates).length + " templates(s).");
										self.logging(Object.keys(self.installedObject.wallpapers).length + " wallpaper(s).");
										self.logging(Object.keys(self.installedObject.themes).length + " theme(s).");
										self.logging(nrUrls + " objectUrl(s).");
										callback(err, nrInstalled, nrErrors, self.installedObject, user);
									});
								});
							});
						});
					}
				});
			});
		},

		/* createObjectUris:
		 * 
		 * If you put javascript files in the /system/winnies/objectUris folder, the system creates
		 * objectUrl's wich can be found in the BVFS.objectUris object. (by filename, without .js)
		 * This becomes usefull if a webworker need a dependecy
		 * 
		 */
		createObjectUris: function (path, callback) {
			var self = this;
			var tmpUrisObj = {};
			BVFS.sh.ls(path, function (err, stats) {
				if (stats.length === 0) { callback(err, {}); return; }
				async.each(stats, function (stat, ittCallback) {
					if (stat.type === "FILE") { // read the file and convert to objectUrl
						BVFS.fs.readFile(path + "/" + stat.path, 'utf8', function (err, fileData) {
							if (err) { console.error(err); ittCallback(); return; }
							var blob = new Blob([fileData]);
							var objUri = window.URL.createObjectURL(blob);
							tmpUrisObj[stat.path] = objUri;
							ittCallback();
						});
					} else ittCallback();
				}, function (err) {
					self.logging("Script URL's ready.");
					callback(null, tmpUrisObj);
				});
			});
		},

		infoType: function (info) {
			var type;
			if (typeof (info) === 'object') { type = "install_object"; }
				//else if (BVFS.path.extname(info).toLowerCase() === ".json") { // else: named_instance
			else if (BVFS.path.basename(info).toLowerCase() === "install.json") { type = "installfile"; }
			else if (info.substr(0, 7).toLowerCase() === "http://") { type = "local_repository"; }
			else if (info.substr(0, 6).toLowerCase() === "ws://") { type = "global_repository"; }
			else  type = "named_instance";
			return type;
		},

		// can be confusing: core.app holds also install & uninstall
		// here we do the primary work, adding removing info to the system files
		// These functions in core.app should be used when BVFS is fully bootstrapped.
		// It does things like removing startmenu items, and will call the functions here
		// Install accepts:
		// 1. url to local repository, must be of type URL
		// 2. Object that holds 1 or more references to an repository installable
		// 3. Location to an install.json file
		// 4. named instance of an saved but not removed installable
		// callback(err, _nrInstalled, _nrErrors, _installedObject);

		install: function (info, callback) {
			appcnt = 0;
			errorcnt = 0;
			var type = BVFS.infoType(info); // switch types & determine if it is possible
			switch (type) {
				case "local_repository":
					BVFS.installBylocalRepositoryUrl(info, function (err, _nrInstalled, _nrErrors, _installedObject, onlyInstalled) {
						if (err) return callback(err, 0, 0, null, null);
						callback(err, _nrInstalled, _nrErrors, _installedObject, onlyInstalled);
					});
					break;
				case "install_object":
					BVFS.installByObject(info.items, function (err, _nrInstalled, _nrErrors, _installedObject, onlyInstalled) {
						callback(err, _nrInstalled, _nrErrors, _installedObject, onlyInstalled);
					});
					break;
				case "named_instance":
					BVFS.installByNamedInstance(info, function (err, _nrInstalled, _nrErrors, _installedObject, onlyInstalled) {
						callback(err, _nrInstalled, _nrErrors, _installedObject, onlyInstalled);
					});
					break;
				default: return callback("Cannot perform install on " + info, 0, 0, null, null);
			}
		},

		isInstalled: function(appItem, appName) {
			if (BVFS.installedObject[appItem]) {
				if (BVFS.installedObject[appItem][appName]) return (true);
			}
			return (false);
		}, 

		installByNamedInstance: function (name, callback) {
			var repoUrl = core.register.getSetting("general", "repository");
			if (!repoUrl) return callback("No repository URL set, cannot install a named instance", 0, 0, null, null);
			BVFS.logging("Loading repository index at " + repoUrl);
			BVFS.wread(repoUrl + "/boot/repositorycontent.json", function (err, content) {
				if (err) return callback("Cannot reach " + repoUrl, 0, 0, null, null);
				var index = JSON.parse(content);
				BVFS.searchRepository(index, name, function (err, itemKey, appKey, instance) {
					if (err) return callback(err, 0, 0, null, null);
					if (BVFS.isInstalled(itemKey, appKey)) {
						return callback(appKey + " is allready installed.", 0, 0, null, null);
					}
					BVFS.logging("Found! " + itemKey + " => " + appKey);
					instance.repository = "/repository";
					var info = {};
					info[itemKey] = {};
					info[itemKey][appKey] = instance;
					BVFS.installByObject(info, function (err, _nrInstalled, _nrErrors, _installedObject, onlyInstalled) {
						if (err) return callback(err, 0, 0, null, null);
						callback(err, _nrInstalled, _nrErrors, _installedObject, onlyInstalled);
					});
				});
			});
		},

		searchRepository: function(index, name, callback) {
			var items = index.items;
			for(itemKey in items){
				for (appKey in items[itemKey]) {
					if (name.toLowerCase() === appKey.toLowerCase()) {
						return callback(null, itemKey, appKey, items[itemKey][appKey]);
					}
				}
			}
			return callback(name + " not found in repository.", null, null, null);
		},

		installBylocalRepositoryUrl: function (url, callback) {
			this.appcnt = 0;
			this.errorcnt = 0;
			// var repoUrl = getDefault( BVFS.authentication.user ).general.repository;
			BVFS.sh.wget(url + "/boot/preinstalled.json", BVFS.sh.env.get('WIN'), function (err, result) { // copy the file to the winnies dir
				if (err) console.error("Error fetching " + url + "/boot/preinstalled.json, try to use old version.");
				var fileName = BVFS.sh.env.get('WIN') + "preinstalled.json";
				BVFS.fs.readFile(fileName, "utf8", function (err, content) { // fetch the file to the winnies dir
					if (err) return callback("No saved preinstalled file found, skip preinstalling process.", 0);
					else {
						var obj = JSON.parse(content);
						BVFS.setDefaults(obj.settings, BVFS.authentication.user, function (err, result) { // set settings in LS if neede
							BVFS.installByObject(obj.items, function (err, _nrInstalled, _nrErrors, _installedObject, onlyInstalled) {
								callback(err, _nrInstalled, _nrErrors, _installedObject, onlyInstalled);
							});
						});
					}
				});	
			});
		},
		
		getDefaults: function ( user) {
			var key = user.UID + ".winnies.settings";
			if (!window.localStorage.getItem(key)) return window.localStorage.getItem(key);
			else return null;
		},

		setDefaults: function (settings, user, callback) {
			var key = user.UID + ".winnies.settings";
			if (!window.localStorage.getItem(key)) { window.localStorage.setItem(key, JSON.stringify(settings)); }
			callback(null, true);
		},

		installByObject: function (appInfObject, callback) {
			this.appcnt = 0;
			this.errorcnt = 0;
			BVFS.fs.readFile("/winnies/installed.json", "utf8", function (err, content) {
				if (err) var installed = { apis: {}, widgets: {}, apps: {}, system: {}, dialogs: {}, templates: {}, wallpapers: {}, themes: {}, plugins: {} }; // Empty object = nothing installed so far
				else var installed = JSON.parse(content);
				var onlyInstalled = {};
				async.each(Object.keys(appInfObject), function (cat, ittCallback) { // loop cats
					BVFS.installCategory(appInfObject[cat], installed[cat], cat, function (err, installedCat) {
						if (err) return callback(err, appcnt, errorcnt, installed);
						installed[cat] = installedCat;
						if (!onlyInstalled[cat]) onlyInstalled[cat] = {};
						onlyInstalled[cat] = appInfObject[cat];
						ittCallback();
					}); // end : install category
				}, function (err) {
					BVFS.installedObject = installed;
					BVFS.fs.writeFile("/winnies/installed.json", JSON.stringify(installed), function (err) {
						callback(err, appcnt, errorcnt, installed, onlyInstalled);
					}); // End: fs.writeFile
				});// end : loop cats
			}); // end : fs.readFile
		},

		installCategory: function (catObject, installedCat, cat, callback) {
			async.each(Object.keys(catObject), function (appName, ittCallback1) { // itterate the installed objects
				if (BVFS.isInstalled(cat, appName)) return callback(appName + " is allready installed", null);
				if (!installedCat[appName] ) { // this app was not installed

					BVFS.appendInfoFromRepository(catObject[appName], appName, cat, function (err, appInf) { //appendInfoFromRepository
						if (err) {
							BVFS.errorcnt += 1;
							callback(err, null);// error in repository, cannot install
							ittCallback1();  // error in repository, cannot install
						}
						else { // appInf = per instance
							async.each(Object.keys(appInf['files']), function (dirName, ittCallback2) { // create & copy files(structure) from repository
								var fileArray = appInf['files'][dirName];
								var srcPath = appInf['repository'] + "/" + cat + "/" + appName + dirName;
								var dstPath = "/winnies/" + cat + "/" + appName + dirName;
								BVFS.createSubFolder(dstPath, srcPath, fileArray, self, function (err) {
									if (err) {
										BVFS.errorcnt += 1;
										callback(err, null)
									}
									ittCallback2(err);
								}); // End: createSubFolder
							}, function (err) {
								if (err) {
									BVFS.errorcnt += 1;
									callback(err, null);
									console.error(err);
								} // else ?
								else {
									installedCat[appName] = appInf; // register as installed
									appcnt = appcnt + 1;
								}
								ittCallback1(); // 'async's each' callback itt after installing
							});;
						} // end: error in repository
					}); // End: appendInfoFromRepository
				}
				else ittCallback1(); // callback itt if allready installed
			}, function (err) { callback(err, installedCat); }); // end: async.each  installed objects
		}, // End: installByObject

		clean: function (path) { // huh??? BVFS.path!!
			if (!path.startsWith("/")) path = "/" + path;
			if (!path.endsWith("/")) path = path + "/";
			path = path.replace("//", "/");
			path = path.replace("//", "/");
			return (path);
		},

		appendInfoFromRepository: function(appInf, appName, cat, callback) {
			var installJsonFileLoc = appInf['repository'] + "/" + cat + "/" + appName + "/install.json";
			BVFS.wread(installJsonFileLoc, function (err, content) {
				if (err) callback(err, null);
				else {
					try {
						var obj = JSON.parse(content)[cat][appName];
						if (appInf.enabled) obj.enabled = appInf.enabled;
						else obj.enabled = true;
						callback(err, obj); // obj contains now the complete install object
					}
					catch (e) { if (!obj) callback("Error: inconsistence in install or preinstall files: (" + appName + ")", null);}
				}
			});
		},

		createSubFolder: function (dstPath, srcPath, fileArray, self, callback) {
			BVFS.fs.mkdir(dstPath, function (err) {
				if (err) callback(err, null);
				else {
					BVFS.copyFiles(dstPath, srcPath, fileArray, self, function (err, result) {
						callback(err, true);
					});
				}
			});
		},

		copyFiles: function (dstPath, srcPath, fileArray, self, callback) {
			async.each(fileArray, function (fileName, ittCallback2) {
				var source = srcPath + "/" + fileName;
				var destination = dstPath;
				source = source.replace("//", "/");
				destination = destination.replace("//", "/");
				BVFS.wget(source, destination, function (err, result) {
					ittCallback2(err, result);
				});
			}, function (err) { callback(err, true); }); // end: itterate over files	
		}, // end : copyFiles
		
		uninstall: function (installJson, callback) {
			alert("Not implemented yet :(");
			callback(null, "success");
		},

		format: function (driveName, mainCallback) {
			// todo: wipe localstorage or this user
			var self = this;
			var thisDrive = self.fs.name;
			if (thisDrive !== driveName) mainCallback("Can only format drive " + thisDrive, false);
			else {
				self.drive(driveName, ['FORMAT'], function (err, result) {
					mainCallback(err, self.fs.name + " formatted");
				});
			}
		},

		wget: function (url, path, callback) {
			var self = this;
			var splitted = url.split("/");
			var fileName = splitted[splitted.length - 1];
			if (!fileName.startsWith("/")) fileName = "/" + fileName;
			var ext = BVFS.path.extname(url).toLowerCase();				// determine filetype by extention
			if (ext.charAt(0) === '.') ext = ext.slice(1);
			var request = new XMLHttpRequest();
			request.open('GET', url, true);
			if (ext == "txt" || ext == "js" || ext == "json" || ext == "html") request.responseType = 'text';
			else request.responseType = 'arraybuffer';
			request.onload = function () {
				if (request.status >= 200 && request.status < 400) {
					var content;
					if (request.responseType === 'text') content = request.responseText;
					else content = request.response;
						if (request.responseType == 'text') {
						var msg = "File " + fileName + "  written to " + path;
						BVFS.fs.writeFile(path + fileName, content, function (err) {
							if (err) msg = err.message;
							if (callback) callback(err, msg);
						});
					}
					else {
						var buffer = new BVFS.buffer(content);
						var msg = "File " + fileName + "  written to " + path;
						BVFS.fs.open(path + fileName, 'w', function (err, fd) {
							if (err) msg = err.message;
							var expected = buffer.length, written = 0;
							function writeBytes(offset, position, length) {
								length = length || buffer.length - written;
								BVFS.fs.write(fd, buffer, offset, length, position, function (err, nbytes) {
									if (err) msg = err.message;
									written += nbytes;
									if (written < expected) writeBytes(written, null);
									else {
										BVFS.fs.close(fd);
										if (err) msg = err.message;
										if (callback) callback(null, msg);
									}
								});
							}
							writeBytes(0, 0);
						});
					}
				} else if (callback) callback("Error requesting " + url, false);
			};
			request.onerror = function () {
				if (callback) callback("Error requesting " + url, false);
			};
			request.send();
		},

		wread: function (url, callback) {
			var request = new XMLHttpRequest();
			request.open('GET', url, true);
			request.onload = function () {
				if (request.status >= 200 && request.status < 400) {
					var content = request.responseText;
					if (callback) callback(null, content);
				} else if (callback) callback("Error requesting " + url, false);
			};
			request.onerror = function () {
				if (callback) callback("Error requesting " + url, false);
			};
			request.send();
		},

		drive: function (driveName, flags, callback) {
			var self = this;
			BVFS.currentDrive = driveName;
			var Filer = require("filer");
			var FileSystem = Filer.FileSystem;
			var providers = FileSystem.providers;
			BVFS.path = Filer.Path;
			BVFS.buffer = Filer.Buffer;
			BVFS.fs = new FileSystem({
				name: driveName,
				flags: flags,
				provider: new providers.IndexedDB()
			}, function (err, fs) {
				// install & uninstall should be an instance of BVFS, not prototype of sh
				Filer.Shell.prototype.install = self.install;
				Filer.Shell.prototype.uninstall = self.uninstall;
				Filer.Shell.prototype.wread = self.wread;
				Filer.Shell.prototype.wget = self.wget;
				Filer.Shell.prototype.format = self.format;
				//Filer.Shell.prototype.launch = self.launch;
				//Filer.Shell.prototype.kill = self.kill;
				//Filer.Shell.prototype.show = self.show;
				//Filer.Shell.prototype.hide = self.hide;
				self.sh = new fs.Shell();
				callback(err, "Drive " + driveName + " mounted or created");
			});
		},

		logging: function (message) {
			if (this.doLog) console.log("BVFS :: " + message);
		}
	});

	

	return BVFS;
})();