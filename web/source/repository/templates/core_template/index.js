/* template
 * 
 * How to extend core functionality ?
 */
module.exports = (function () {
	var template = ({
		dolog: true,
		
		imports: function (apiToImport, name) {
			this[name] = apiToImport;
			dialogs.logging(name + " imported.");
		},

		init: function () {
		},

		customFunction : function(){},

		logging: function (message) {
			if (template.doLog) console.log("core.template :: " + message);
		}
	});

	template.init();
	return template;
})();