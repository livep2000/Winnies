
// fast key / value pair register
module.exports = (function () {
	var storage = null;
	var user = {};
	var register = ({
		imports: function (apiToImport, name) {
			this[name] = apiToImport;
			console.log("core.register :: " + name + " imported.");
		},
		
		init: function (){
			user = BVFS.authentication.user;
			storage = window.localStorage;
			if (typeof (Storage) !== "undefined") register.ready("register ready.");
			else register.ready("Browser not suitable for localstorage?????");
		},
	
		get: function (key) {
			key = user.UID + "." + key;
			return (JSON.parse(storage.getItem(key)));
		},

		set: function (key, registerObject) {
			key = user.UID + "." + key;
			storage.setItem(key, JSON.stringify(registerObject));
		},

		remove: function (key) {
			key = user.UID + "." + key;
			storage.removeItem( key);
		},

		extend: function (key, registerObject) {
			key = user.UID + "." + key;
			if (this.exists(key)) {
				var val = this.get(key);
				var extended = $.extend(true, val, registerObject);
				this.set(key, extended);
			}
			else this.set(key, registerObject);
		},

		exists: function (key) {
			key = user.UID + "." + key;
			if (storage[key]) return (true);
			else return (false);
		},

		stripFromArray: function(key, value) {
			var list = core.register.get(key);
			var index = list.indexOf(value);
			if (index > 0 ) list.splice(index, 1);
			else if (index == 0)  list.shift();
			this.set(key, list);
		},

		// Global settings (for this user)
		getSetting: function (subKey, settingKey) {
			var settings = register.get("winnies.settings");
			if (!settings[subKey]) return (null);
			if (!settings[subKey][settingKey]) return (null);
			return settings[subKey][settingKey];
		},
		
		setSetting: function (subKey, settingKey, value) {
			var settings = register.get("winnies.settings");
			if (!settings[subKey]) settings[subKey] = {};
			settings[subKey][settingKey] = value;
			register.set("winnies.settings", settings)
		},

		ready: function (metaData) {
			console.log("Register :: " + metaData);
		}
	});
	return register;
})();