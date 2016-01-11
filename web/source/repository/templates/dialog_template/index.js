$.widget("dialogs.template", $.winnies.dialogs, {
	version: "1.0.0",
	options: {
		dialogType: "confirm"
	},
	_init: function () {
		this._super();
	},

	_cancel: function () {
		this._trigger("cancel", null,null);
	},

	_confirmation: function() {
		this._trigger("confirm", null, "data");
		this.close();
	},

	contentReady: function () {
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
			this.contentReady();
		}
		this._super(type, ev, data);
	},
});






