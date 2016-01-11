module.exports = (function () {
	var dialogs = ({
		dolog: true,
		installedDialogs: null,
		imports: function (apiToImport, name) {
			this[name] = apiToImport;
			dialogs.logging(  name + " imported.");
		},

		init: function () {
			this.installedDialogs = BVFS.installedObject.dialogs;
		},

		dialog: function (dialogName, optionalOptions, callback) {
			this.init();
			if (!this.installedDialogs[dialogName.toLowerCase()]) return console.error( "'" + dialogName + "' hase no installed candidate.", null);
			core.app.launch(dialogName, optionalOptions, function (err, dialogInstance) {
				callback(err, dialogInstance);
			});
		},
	
		logging: function (message) {
			if (dialogs.doLog) console.log("core.system.dialogs :: " + message);
		}
	});
	dialogs.init();
	return dialogs;
})();