/* authentication
 * 
 * Provides logon / logof / authentication to the desktop
 */

module.exports = (function () {
	var authentication = ({
		doLog:true,
		imports: function (apiToImport, name) {
			this[name] = apiToImport;
			console.log("authentication :: " + name + " imported.");
		},
		defaultUser: { CST: 0, USN: "Guest", ROL: 0, UID: 0 },		// offline user is always the 'Guest' username and the 'Guest' role
		user: {},
		roles: ["Guest", "Member", "Moderator", "Administrator", "God"],
		preAuthentication: function (callback) {
			var self = this;
			this.logging("bootstrapped.");
			this.user = this.defaultUser;
			// make connection to server (websocket by cookie or php for example)
			// simulate logon process for now
			setTimeout(function () {
				callback(null, self.user);
				self.offline(self.user);
				// or  self.online(self.user)
			}, 100);

		},

		performLogoff: function () {
			if ($) {
				console.debug("triggering performlogoff");
				$(this).triggerHandler('performlogoff');
			}
		},

		// process logonInfo from a login widget
		performLogon: function (logonInfo) {
			// example1 logonInfo : {USN: "piet", UPW: "mysecret"}
			// example2 logonInfo : {UID: 666, CCO, "cookie content"}
			// example3 logonInfo : {USN: "piet", EML, "test@winnies.com"}
			if ($) {
				console.debug("triggering prformlogon");
				$(this).triggerHandler('performlogon');
			}
		},

		online: function (userObject) {
			this.user = userObject;
		
			if ($) {
				console.debug("triggering online");
				$(this).triggerHandler('online', this.user);
			}
		},

		offline: function ( CST ) { // CST holds an integer with information about the logof reason (0 = just not logged on)
			this.user = this.defaultUser; // for now its default
			this.user.CST = CST;
		
	
			if ($) {
				console.debug("triggering offline");
				$(this).triggerHandler('offline', this.user);
			}
		},
		logging: function (msg) {
			if (this.doLog) console.log("authentication :: " + msg);
		}
	});

	return authentication;
})();

