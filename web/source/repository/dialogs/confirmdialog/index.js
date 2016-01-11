$.widget("dialogs.confirmdialog", $.winnies.dialogs, {
	version: "1.0.0",
	FM: null,
	currentDir: "",
	currentFile: "",
	options: {
		dialogType: "confirm",
		title: "Are you sure?",
		content: "",
		okButtonEnabled : false
	},

	_cancel: function () {
		this._trigger("cancel", null, null);
	},

	_confirmation: function () { 
		var self = this;
		var err = null;
		var result = true;
		self._trigger("confirm", null, { err: err, result: null });
		
	},

	_noConfirmation: function () {
		var self = this;
		var err = null;
		var result = true;
		self._trigger("noconfirm", null, { err: err, result: null });

	},

	contentLoaded: function () {
		var self = this;
		this.element.append(this.options.content);
	},

	resize: function (data) {
	
	},

	fec: function (subClassName) {
		return this.element.find("._winnies_" + this.widgetName + "_" + subClassName);
	},

	_destroy: function () {
		this._super();
	},

	_trigger: function (type, ev, data) {
		if (type == 'close') {
			this._destroy();
		}
		if (type == 'open') {
			this.contentLoaded();
		}
		if (type == 'resize') {
			this.resize(data);
		}
		this._super(type, ev, data);
	}
});






