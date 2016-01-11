$.widget("winnies.dialogs", $.ui.dialog, {
	okButton: null,
	options: {
		modal:true,
		usebvfs: false,
		closable: true,
		resizable: false,
		cancelText: "Cancel",
		doLog: false,
		//okButton: true,
		okButtonEnabled: false,
		okText: "OK",
		noButton: false,
		noButtonText : "No",
		dialogType: "message", // form, confirm
		dim: {
			height: 100,
			width: 100,
			left: 100,
			top: 100,
			appType: "dialogs",
		}
	},


	_init: function () {
		this.logging("init");
		this.element.hide();  
		this._super();
	},

	_create: function () {
		this.options.position = core.util.toPosition(this.options.dim.left, this.options.dim.top);
		this.options.width = this.options.dim.width;
		this.options.height = this.options.dim.height;
		return this._super();
	},

	_confirmButtonEnabled: function (isEnabled) {
		if (isEnabled) this.okButton.button("enable");
		else this.okButton.button("disable");
	},

	appendButtonPane:function () {
		var self = this;
		console.debug(this.options.dialogType);
		if (this.options.dialogType == "form") return;
		var buttonPane = $('<div>');
		buttonPane.addClass("ui-dialog-buttonpane");
		buttonPane.addClass("ui-widget-content");
		buttonPane.addClass("ui-helper-clearfix");
		var buttonSet = $('<div>');
		buttonSet.addClass("ui-dialog-buttonset");

		if (this.options.dialogType == "confirm" || this.options.dialogType == "message") {

			if (this.options.noButton) {
				this.noButton = $('<button>');
				this.noButton.button({
					label: self.options.noButtonText
				}).click(function (event) {
					self._noConfirmation();
					self.close();
				});

				buttonSet.append(this.noButton);
			}
			this.okButton = $('<button>');
			this.okButton.button({
				label: self.options.okText
			}).click(function (event) {
				self._confirmation();
				self.close();
			});
			if(this.options.okButtonEnabled == false) this.okButton.button("disable");
			buttonSet.append(this.okButton);
		}

		if (this.options.dialogType == "confirm") {
			var cancelButton = $('<button>');
			cancelButton.button({
				label: self.options.cancelText,
			}).click(function (event) {
				self._cancel();
				self.close();
			});

			buttonSet.append(cancelButton);
		}
		buttonPane.append(buttonSet);
		this.uiDialog.append(buttonPane);
	},
	_setOption: function (key, value) {
		this.logging("setoption key: " + key + " value:" + value);
		return this._super(key, value);
	},

	_setOptions: function (options) {
		this.logging("setoptions len = key: " + Object.keys(options).length);
		return this._super(options);
	},

	_destroy: function () {
		this.logging("destroy");
		return this._super();
	},

	_trigger: function (type, ev, data) {
		if (type == 'open') {
			this.element.show();
			this.appendButtonPane();
		}
		if (type == 'close') this._destroy();
		return this._super(type, ev, data);
	},

	logging: function (msg) {
		if (this.doLog) console.log("dialogs :: " + msg);
	},

});