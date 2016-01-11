$.widget("plugins.applicationmanager", $.winnies.pluginSuperwidget, {

	version: "1.0.0",
	sh: null,

	options: {

	},

	_create: function () {
		
		this._super();
	},




	_trigger: function (type, ev, data) {
		this._super(type, ev, data);
	}
});