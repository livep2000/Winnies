$.widget("dialogs.filedialog", $.winnies.dialogs, {
	version: "1.0.0",
	FM: null,
	currentDir: "",
	currentFile: "",
	options: {
		dialogType: "confirm",
		title: "Open file",
		startPath: "/",
		extFilters: [{ "json": ".json" }, { "Webpage": ".html" }, {"JavaScript": ".js"}],
		handles: "open",  // save, select
		fileName: null,
		fileBuffer: null,
	},

	_cancel: function () {
		this._trigger("cancel", null, null);
	},

	_confirmation: function () { // action depending on'handles'
		var self = this;
		if (this.options.handles == "open") { // file read/write should happen in filemanager, not here !!
			BVFS.fs.open(self.currentFile, 'r', function (err, fd) {
				if (err) {
					self._trigger("confirm", null, { err: err, result: null });
					BVFS.fs.close(fd);
					self.close();
				}
				else {
					BVFS.fs.fstat(fd, function (err, stats) {
						if (err) {
							self._trigger("confirm", null, { err: err, result: null });
							BVFS.fs.close(fd);
							self.close();
						}
						else{
							var nbytes = expected = stats.size;
							var buffer = new BVFS.buffer(nbytes);
							var read = 0;
							function readBytes(offset, position, length) {
								length = length || buffer.length - read;
								BVFS.fs.read(fd, buffer, offset, length, position, function (err, nbytes) {
									read += nbytes;
									if (read < expected) readBytes(read, null);
									else {
										BVFS.fs.close(fd);
										self._trigger("confirm", null, { err: err, result: { path: self.currentFile, buffer: buffer } });
										self.close();
									}
								});
							}
						}
						readBytes(0, 0);
					});
				}
			});
		}
		else if (this.options.handles == "save") {
			self.FM.filemanager("option", "saveFile", null);
			self._trigger("confirm", null, { err: null, result: "filestats" });
			self.close();
		}
		else {
			this._trigger("confirm", null, {err: null, result: this.currentDir});
		}
			
	},

	contentLoaded: function () {
		var self = this;
		if (this.options.handles == "open") this.options.okText = "Open file";
		if (this.options.handles == "save") this.options.okText = "Save file";
		if (this.options.handles == "select") this.options.okText = "Select directory";
		this.FM = this.fec("container");
		this.FM.height(this.element.height());
		this.FM.filemanager({
			startPath: self.options.startPath,
			extFilters: self.options.extFilters,
			fileName: self.options.fileName,
			fileBuffer: self.options.fileBuffer,
			addressBar: true,
			filters: false,

			activatedir: function (ev, obj) {
				self.currentDir = obj.path;
				var enable = true;
				if (self.options.handles == "open") enable = false;
				self._confirmButtonEnabled(enable);
			},
			activatefile: function (ev, obj) {
				self.currentFile = obj.path;
				var enable = false;
				if (self.options.handles == "open") var enable = true;
				self._confirmButtonEnabled(enable);
			},
		});
	},

	resize: function (data) {
		this.FM.height(this.element.height());
		this.FM.filemanager("option", "resizeAll", data);
	},

	fec: function (subClassName) {
		return this.element.find("._winnies_" + this.widgetName + "_" + subClassName);
	},

	_destroy: function () {
		this._super();
	},

	_trigger: function (type, ev, data) {
		if (type == 'close') {
			this.FM.filemanager("destroy"); // IMPORTANT!!
			this.FM = null;
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






