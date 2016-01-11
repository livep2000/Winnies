$.widget("apps.template", $.winnies.appDialog, {
	version		: "1.0.0",                                  
	doLog: true,

	_init: function () {
		this._super();
	},
	_create: function () {
		this._super();
	},

	contentLoaded: function() {
		this.logging("content ready");
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
			this.contentReady();
		}
		if (type == 'contenloaded') {
			this.contentLoaded();
		}
		this._super(type, ev, data);
	},
	logging: function (msg) {
		if (this.doLog) oldConsole.log("template :: " + msg);
	}

});
