
// the super	: $.widget("winnies.appDialog", $.ui.dialog, {
// the widget	: $.widget("app.testwidget1" $.winnies.appDialog, {
$.widget("winnies.appDialog", $.ui.dialog, {
	options: {
		usebvfs : false,
		dim: {				// overridden default options, the 'dim' propertie is the only thing saved
			height: 100,
			width: 100,
			left: 100,
			top: 100,
			state: "custom",
			appName: null,
			appType: "apps",
			guid :null
		}
	},
	vars: {
		doLog: false,
	},
	_init: function () {
		this.element.hide();  // hide until html is ready
		this._super();
	},

	_create: function () {
		var self = this;
		this.options.dim.guid = this.element.attr('guid');			// either new or existing
		this.options.dim.appName = this.widgetName;
		this.options.position = core.util.toPosition(this.options.dim.left, this.options.dim.top) // apply the dimensions from 'dim' part in options
		this.options.width = this.options.dim.width;
		this.options.height = this.options.dim.height;
		this.element.addClass("nonselectable");
		// save all
		core.register.set("winnies.appdimensions." + this.options.dim.guid, this.options.dim);
		core.register.set("winnies.lastdimensionskey." + this.options.dim.appName, this.options.dim.guid);
		core.app.saveOrder();
		return this._super();
	},

	createDimensions: function (el) {
		return {
			position: {
				left: el.position().left,
				top: el.position().top,
			},
			size: {
				height: el.height(),
				width: el.width(),
				innerHeight: el.height() - 65,
				innerWidth: el.width() - 30
			}
		
			};
		},

	_setOption: function (key, value) {
		return this._super(key, value);
	},

	_setOptions: function (options) {
		return this._super(options);
	},

	_destroy: function () {
		this.logging("destroy");
		core.register.remove("winnies.appdimensions." + this.options.dim.guid, this.options.dim);
		core.register.remove("winnies.lastdimensionskey." + this.options.dim.appName, this.options.dim.guid);
		return this._super();
	},

	_trigger: function (type, ev, data) {
		var self = this;
		if (type == 'open') { // not sure if this keeps standing: yess it does !
			self._trigger("contentLoaded", null, self.createDimensions(self.uiDialog));
			var data = self.createDimensions(self.uiDialog);
			self.element.css("padding", 6);
			self.element.show();
		}
		if (type == "beforeClose") {
			core.register.stripFromArray("winnies.windoworder", this.options.dim.guid );
			if (this.options.dim.state == "min") this.options.dim.state = "custom"; // we never start in a min state
			this.saveDim();
		}

		if (type == "dragStop") {
				this.options.dim.left = parseInt(data.position.left);
				this.options.dim.top = parseInt(data.position.top);
			}

		if (type == "resizeStop") {
				this.options.dim.height = parseInt(data.size.height);
				this.options.dim.width = parseInt(data.size.width);
				data.size.innerWidth = data.size.width - 30;
				data.size.innerHeight = data.size.height - 65;
		}

		if (type == "resize") {
			data.size.innerWidth = data.size.width - 30;
			data.size.innerHeight = data.size.height - 65;
		}

		if (type == "focus") {
				core.app.saveOrder(); // save order on focus again
			}

		// save the dimensions
		if (type == 'dragStop' || type == 'resizeStop') {
				this.saveDim();
		}
		
		return this._super(type, ev, data);
	},

	saveDim: function () {
		core.register.set("winnies.appdimensions." + this.options.dim.guid, this.options.dim);
	},

	logging: function (msg) {
		if (this.vars.doLog) console.log("superdialog :: " + msg);
	},
	
});