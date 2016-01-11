module.exports = (function () {
	var system = ({
		doLog: true,

		imports: function (apiToImport, name) {
			this[name] = apiToImport;
			this.logging(name + " imported.");
		},

		alertBox: function (message, withSound) {
			if (withSound == null) withSound = true;
			if (withSound) api.sound.play("9snd");
			var box = $("<div>");
			$("body").append(box);
			box.addClass('alertBox');
			box.css('left', Math.round($('body').width() / 4));
			box.html(message);
			box.hide();
			box.fadeIn(1500, function () {
				var that = this;
				setTimeout(function () { $(that).fadeOut(1500, function () { $(that).remove(); }); }, 5000);
			});
		},


		/* registerPlugins
		 * 'Plugins' are just jquery-ui widgets,
		 * to make core functionality accessable they are derived from the winnies.superplugin
		 * wich is an dummy and hase no content
		 */
		registerPlugins: function (plugins, callback) {
			var self = this;
			var len = Object.keys(plugins).length;
			var cnt = 0;
			$.each(plugins, function (key, obj) {
				var path = BVFS.sh.env.get("PLU") + key + "/index.js";
				BVFS.fs.readFile(path, "utf8", function (err, script) {
					if (err) return callback(err, null);
					try { eval(script); }		// evil ??
					catch (err) { return callback(err, null); }
					finally { //$()[key]({});  //  how wierd is this pattern ??
						cnt += 1;
						if (cnt >= len) {
							self.logging("plugins registered");
							callback(null, true);
						}
					}
				});
			});
		},

		/* restoreDesktop
		 * Restore the last desktop state.
		 * A very, very strange way to run sync functions in async mode
		 */
		 restoreDesktop: function (callback) {
		 	var self = this;
		 	var list = core.register.get("winnies.windoworder");
		 	if (!list || list.length ==0) {		// nothing to restore
		 		callback(null, "ready");
		 		$(system).triggerHandler('restoredesktopprogress', 100);
		 		return;
		 	}
		 	var percPerApp = parseInt(100 / list.length);
		 	var progressPercentage = 0;

		 	launchSync(list, null, function(err, result){
		 		callback(err, "ready");
		 	});

		 	function launchSync(range, pos, callback) {
		 		var self = this;
		 		if (!pos) var pos = 0;
		 		var _err = null;
		 		core.app.launch(range[pos], function (err, result) {
		 			if (err) { pos = range.length; _err = err; }
		 			pos += 1;
		 			progressPercentage += percPerApp;
		 			$(system).triggerHandler('restoredesktopprogress', progressPercentage);

		 			if (pos < range.length) launchSync(range, pos, callback);
		 			else {
		 				if (progressPercentage != 100) $(system).triggerHandler('restoredesktopprogress', 100);
		 				callback(_err, "ready");
		 				}
		 			});
		 		};
		 },

		/* applySetting
		*  Apply all settings stored in the register
		*/
		 applySettings: function () {
		 	core.util.setStyle(core.register.getSetting('desktop', 'theme'));
		 	core.util.setBackground(core.register.getSetting('desktop', 'wallpaper'));
		 },

		 fileChanged: function (fileChangedInfo) {
		 	$(system).triggerHandler('filesystemchanged', fileChangedInfo);
		 },

		// realy an handy test function to cold restart fast.
		 wipe:function(callback) {
		 	window.localStorage.clear();
		 	BVFS.format("Guest", function (err, res) {
		 		window.location.reload();
		 	});
		 },

		 logging: function (msg) {
		 	if (this.doLog) console.log("core.system :: " + msg);
		 },
		
	});
	return system;
})();