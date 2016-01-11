/* core */

module.exports = (function () {
	var core = ({
		doLog : true,
		imports: function (apiToImport, name) {
			this[name] = apiToImport;
			console.log("core :: " + name + " imported.");
		},

		start: function () {

			core.system.applySettings(); // apply stored settings for this user

			var mode = "restore"; //  testing purpose, normal operation = restore

			core.system.registerPlugins(BVFS.installedObject.plugins, function (err, result) {
				core.app.launchWidgets(BVFS.installedObject.widgets, function (err, result) {
					if (err) return console.error(err);
					if (mode == "dev") {
						console.warn("DEVELOPPER MODE!");
						var range = [ 'tester', 'appstudio'];
						core.launchSync(range, null, function (err, result) {
							core.logging("ready");
							window.booting = null;
							$("#bootlogbox").remove();
						});
					}
					else if (mode == 'restore') {
						core.system.restoreDesktop(function (err, result) {
							if (err) { core.logging(err); return; }
							else core.logging(result);
							window.booting = null;
							$("#bootlogbox").remove();
						});
					}
				});
			});

			listenToEvents();

			function listenToEvents() {
				// progress tracking
				$(core.system).on("restoredesktopprogress", function (event, percentage) {
					if (percentage >= 100) {
						core.logging("restoredesktop ready event");
					}
				});

				$(core.sound).on('soundprogress', function (event, percentage) {
					if (percentage >= 100) {
						core.logging("sound progress ready event " + percentage);
					}
				});

				// A ton of system events to listen to (or not)
				$(core.app).on("showed", function (event, result) {
					core.logging("event showed");
				
				});

				$(core.app).on("hidden", function (event, result) {
					core.logging("event hidden");
		
				});

				$(core.app).on("launched", function (event, appInstance) {
					//core.logging("event launched");
				});

				$(core.app).on("killed", function (event, result) {
					core.logging("event killed ");
			
				});

				$(core.app).on("installed", function (event, result) {
					//core.logging("event installed ");
				});

				$(core.app).on("uninstalled", function (event, result) {
					core.logging("event uninstalled");
			
				});

				$(BVFS.authentication).on("online", function (event, userObject) {
					core.logging("event online " + user.CST + ", " + user.USN);
				});

				$(BVFS.authentication).on("offline", function (event, user) {
					core.logging("event offline " + user.CST + ", " + user.USN);
				
				});

				$(BVFS.authentication).on("performlogoff", function (event, userObject) {
					core.logging("event performlogoff " + userObject.CST);
				});

				$(BVFS.authentication).on("performlogon", function (event, userObject) {
					core.logging("event performlogon " + userObject.CST);
				});

				$(BVFS).on("ready", function (event, msg) {
					core.logging("BVFS ready event");
				});
			}

		},
		/* launchSync
		*
		* This whole system is driven by async functions.
		* thats okay! But launching widgets or apps need to be done in order.
		* To maintain the z-index
		*/
		launchSync: function (range, pos, callback) {
			if (!pos) var pos = 0;
			var err = null;
			core.app.launch(range[pos], function (err, result) {
				if (err) pos = range.length;
				pos += 1;
				if (pos < range.length) core.launchSync(range, pos, callback);
				else callback(err, "ready");
			});
		},
		logging: function (message) {
			if (core.doLog) console.log("core :: " + message);
		}
	});

	return core;
})();