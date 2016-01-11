var applicationSourceCache = {};
var applicationHtmlCache = {};
module.exports = (function () { // app system events, routed to the whole system
	var app = ({
		doLog: false,
		imports: function (apiToImport, name) {
			this[name] = apiToImport;
			console.log("core.app :: " + name + " imported.");
		},

		install: function (info, callback) {
			BVFS.install(info, function (err, nrInstalled, nrErrors, installedObject, onlyInstalled) {
				if(!err) {
					$(app).triggerHandler('installed', { err: err, onlyInstalled: onlyInstalled });
					if (onlyInstalled.widgets) { // launche widgets
						app.launchWidgets(onlyInstalled.widgets, function (err, result) {
							if (err) oldConsole.error(err);
						});
					}
				}
				if(callback) callback(err, nrInstalled, nrErrors, installedObject, onlyInstalled);
			});
		},

		uninstall: function (info, callback) {
			BVFS.uninstall(info, function (err, nrInstalled, nrErrors, installedObject, onlyUninstalled) {
				$(app).triggerHandler('uninstalled', { err: err, onlyUninstalled: onlyUninstalled });
				if (callback)  callback(err, nrInstalled, nrErrors, _installedObject, onlyUninstalled);
			});
		},

		// TODO: launch can be more compact, but it's not ready yet, keep it for now this way
		launch: function (info, _options, callback) {
			var options = null;
			if (!callback) callback = _options;
			else options = _options;

			switch (core.util.infoType(info)) {
				case "appname":
					app.getInstalledObjectByAppName(info, function (err, _installedObject) {
						if (err) { callback(err, null); return; }
						app._launcheByAppInstalledObject(_installedObject, null, options,function (err, _launchedObject) {
							if (err) { callback(err, null); return; }
							$(app).triggerHandler('launched', { err: err, appinfo: _launchedObject });
							callback(err, _launchedObject);
						});
					});
					break;
				case "guid":
					var _guid = info;
					var appDimensions = core.register.get("winnies.appdimensions." + _guid);	// add guid, so no new is created
					app.getInstalledObjectByAppName(appDimensions.appName, function (err, _installedObject) {	// get info from installed object
						if (err) { callback(err, null); return; }
							app._launcheByAppInstalledObject(_installedObject, _guid, options, function (err, _launchedObject) {
							if (err) { callback(err, null); return; }
							$(app).triggerHandler('launched', { err: err, appinfo: _launchedObject });
							callback(err, _launchedObject);
						});
					});
					break;
				default: return callback("App type is not recognized.", null);
			}
		},

		launchWidgets: function (installedWidgets, callback) {
			async.forEachOf(installedWidgets, function (appObject, appName, ittCallback) {
				app.getInstalledObjectByAppName(appName, function (err, _installedObject) {
					if (err) { callback(err, null); return; }
					app._launcheByAppInstalledObject(_installedObject, null, null, function (err, _launchedObject) {
						if (err) { callback(err, null); return; }
						$(app).triggerHandler('launched', { err: err, appinfo: _launchedObject });
						ittCallback(err, _launchedObject);
					});
				});
			}, function (err) {
				callback(err, "Widgets launched.!");
			})	
		},

		// TODO: :)
		kill: function (info, callback) {
			app.getInstalledObjectByAppName(info, function (err, appInfo) {
				$(app).triggerHandler('killed',{err:err, appinfo:appInfo});
				if (callback) callback(err, appInfo);
			});
		},

		show: function (info, callback) {
			app.getAppInfoObject(info, function (err, appInfo) {
				$(app).triggerHandler('showed', {err:err, appinfo:appInfo});
				if (callback) callback(err, appInfo);
			});
		},

		hide: function (info, callback) {
			app.getAppInfoObject(info, function (err, appInfo) {
				$(app).triggerHandler('hidden', {err:err, appinfo:appInfo});
				if (callback) callback(err, appInfo);
			});
		},

		getInstalledObjectByAppName: function (info, callback) {
			var instObj= BVFS.installedObject;
			var appType = "";
			if (instObj['apps'][info]) apptype = "apps";
			else if (instObj['widgets'][info]) apptype = "widgets";
			else if (instObj['dialogs'][info]) apptype = "dialogs";
			else return callback(info + " hase no installed canidate", null);
			var tmpObj = {}
			tmpObj[apptype] = {};
			tmpObj[apptype][info] = instObj[apptype][info];
			callback(null, tmpObj);
		},

		_getAppHtml: function (path, appName, appType, guid, callback) {
			if (applicationHtmlCache[appName]) {
				var toReturn = applicationHtmlCache[appName];   // return the saved clone
				applicationHtmlCache[appName] = toReturn.clone(); // set new clone
				return callback(null, toReturn, guid);
			}
			var path = "/winnies/" + appType + "/" + appName;
			BVFS.sh.cd(path, function (err, result) {
				var fullPath = path + "/template.html";
				BVFS.fs.readFile(fullPath, "utf8", function (err, html) {
					if (err) {return callback(err, null); return; }
					core.util.convertSrc($(html), true, function (err, convertedHtml) {
						applicationHtmlCache[appName] = convertedHtml.clone(); // save a clone
						return callback(err, convertedHtml, guid);

					});
				});
			});
		},

		_getAppSource: function (path, appName, appType, guid, callback) {
			if (applicationSourceCache[appName]) return callback(null, applicationSourceCache[appName], guid);
			var path = "/winnies/" + appType + "/" + appName;
			BVFS.sh.cd(path, function (err, result) {
				var fullPath = path +  "/index.js";
				BVFS.fs.readFile(fullPath, "utf8", function (err, script) {
					if (err) { callback(err, null); return; }
					applicationSourceCache[appName] = script;
					callback(err, script, guid);
				});
			});
		},

		_launcheByAppInstalledObject: function(_installedObject, _guid, optionalOptions, callback) {
			var appType = Object.keys(_installedObject)[0];
			var content = _installedObject[appType];
			var appName = Object.keys(content)[0];
			var defaults = _installedObject[appType][appName];
			if (optionalOptions) var options = $.extend({}, defaults, optionalOptions);
			else var options = defaults;

			app._getAppHtml("/winnies", appName, appType, _guid, function (err, html, __guid) {
				if (err) { callback(err, null); return; }
				var newApp = $('<div>');
				newApp.append(html);
				if (appType == 'apps') {				// an app needs an guid
					if (!__guid) var __guid = core.util.guid();
					else {
						var dim = core.register.get("winnies.appdimensions." + __guid); // can't be ok!
						options.dim = dim;
					}
					newApp.attr('guid', __guid);
				}
				if ($()[appName]) {
				
					newApp[appName](options);
					return callback(null,newApp);
				}
				
				app._getAppSource("/winnies", appName, appType, __guid, function (err, script, myGuid) {
		
						if (err) { callback(err, null); return; }
						try { eval(script); }		// evil ??
						catch (err) {
							callback(err, null);
						}
						finally {
							newApp[appName](options);
							return callback(null, newApp);
						}
					
				});
			});
		},

		saveOrder: function () {
			var range = $('body').find("[guid]");		// get ordered list with id's
			var list = [];
			for (var i = 0; i < range.length; i++) {
				var id = $(range[i]).attr('guid');
				if (id) list.push(id);
			}
			core.register.set("winnies.windoworder", list);		// save it in the register
		},

		logging: function (msg) {
			if (this.doLog) console.log("core.app :: " + msg);
		},
    });

    return app;
})();