
$.widget("apps.info", $.winnies.appDialog, {
	version: "1.0.0",

	_init: function () {
		this._super();
	},

	_create: function () {
		this._super();
	},

	_setOption: function (key, value) {
		this._super(key, value);
	},

	_setOptions: function (options) {
		this._super(options);
	},

	_destroy: function () {
		this._super();
	},

	_trigger: function (type, ev, data) {
		if (type == 'close') this._destroy();
		if (type == 'open') {
			// size and position in data
		}
		this._super(type, ev, data);
	},

});






