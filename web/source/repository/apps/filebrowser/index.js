$.widget("apps.filebrowser", $.winnies.appDialog, {
	version: "1.0.0",
	doLog: true,
	FM: null,
	contentLoaded: function () {
		var options = {
			startPath: "/",
			addressBar: true,
			filePane: true,
			fileBuffer: null
		};
		this.element.css("overflow", "hidden");
		this.FM = this.fec("container");
		this.FM.height(this.element.height());
		this.FM.filemanager(options);
	},

	resize: function (data) {
		this.FM.height(this.element.height());
	},

	fec: function (subClassName) {
		return this.element.find("._winnies_" + this.widgetName + "_" + subClassName);
	},

	_trigger: function (type, ev, data) {
		if (type == 'close') {
			this.FM.filemanager("destroy"); // IMPORTANT!!
			this.FM = null;
			this._destroy();
		}
		if (type == 'contentLoaded') {
			this.contentLoaded(data);
		}
		if (type == 'resize') {
			this.FM.filemanager("option", "resizeAll", data);
			this.resize(data);
		}
		this._super(type, ev, data);
	},

	_destroy: function () {
		this._super();
	},

	logging: function (mess) {
		if (this.doLog) console.log(this.widgetName + " :: " + mess);
	}

});