$.widget("apps.appstudio", $.winnies.appDialog, {
	version: "2.0.0",
	doLog: true,
	tabHolder: null,
	uniqueLabel: null,
	myTabs: null,
	innerHeight: 0,
	innerWidth: 0,
	editors :{},
	menus: {},
	extFilters: [{ "json file": ".json" }, { "Webpage": ".html" }, { "JavaScript": ".js" }, { "Plain text": ".txt" }, { "All files": ".*" }],
	options: {

	},
	contentLoaded: function () {
		var self = this;
		this.element.css("overflow", "hidden");
		this.menuEvents();
		this.createToolbar();
		var getIdFied = this.idFy("tabholder");
		this.uniqueLabel = getIdFied.id;
		this.tabHolder = getIdFied.element;
		this.myTabs = this.tabHolder.dynamictabs({
			activate: function (event, ui) {
				self.resize();
			},
			beforetabclose: function (event, guid) {
				var savedState = self.myTabs.dynamictabs("get_tabData", guid).savedState;
				if (!savedState) {
					core.system.dialogs.dialog("confirmdialog", {
						title: "Save file first?",
						okText: "Save file",
						noButton: true,
						noButtonText: "No",
						okButtonEnabled:true,
						content: "The file was not saved.<br/>Doe you want to save it now?"
					}, function (err, dialogInstance) {
						$(dialogInstance).on("confirmdialogconfirm", function (ev, obj) {
							if (obj.err) return alert(err.message);
							var tabData = self.myTabs.dynamictabs("get_tabData", guid);
							var fullPath = tabData.data.fullPath;
							var content = self.editors[guid].editor.getValue();
							var fileName = BVFS.path.basename(fullPath);
							var startPath = BVFS.path.dirname(fullPath);
							var fileBuffer = new BVFS.buffer(content, 'utf8');

							core.system.dialogs.dialog("filedialog", {
								title: "Save file",
								fileName: fileName,
								startPath: startPath,
								extFilters: self.extFilters,
								fileBuffer: fileBuffer,
								handles: "save"
							}, function (err, dialogInstance) {
								$(dialogInstance).on("filedialogconfirm", function (ev, obj) {
									self.myTabs.dynamictabs("close_tab", guid);
									self.editors[guid] = null;
								    delete (self.editors[guid]);
								});
							});
						});

						$(dialogInstance).on("confirmdialognoconfirm", function (ev, obj) {
							if (obj.err) return alert(err.message);
							self.myTabs.dynamictabs("close_tab", guid);
							self.editors[guid] = null;
							delete (self.editors[guid]);
						});
					});
				}
				else {
					self.myTabs.dynamictabs("close_tab", guid);
					self.editors[guid] = null;
					delete (self.editors[guid]);
				}
			},
		});
		this.resize();
	},

	createEditorTabByFile: function (fullPath, fileBuffer) {
		var self = this;
		var ext = BVFS.path.extname(fullPath);
		var mode = "text";
		if (ext == ".json") mode = "json";
		if (ext == ".js") mode = "javascript";
		if (ext == ".html") mode = "html";
		if (ext == ".css") mode = "css";
		var title = BVFS.path.basename(fullPath);
		var content = fileBuffer.toString('utf8');
		console.log("MODE: " + mode);
		var newTab = {
			title: title,
			content: content,
			savedState: true,
			data: { fullPath: fullPath, ext:ext }
		};
		var guid = this.myTabs.dynamictabs("create_newtab", newTab);

		this.myTabs.dynamictabs("open_tab", guid);
		this.editors[guid] = {};
		this.editors[guid].editor = ace.edit("tab-" + guid);
		this.editors[guid].editor.setTheme("ace/theme/monokai");
		this.editors[guid].editor.getSession().setMode("ace/mode/" + mode);
		this.editors[guid].editor.width = 1; // must be set to 'something'
		this.editors[guid].editor.height = 1;
		this.editors[guid].editor.setOptions({
			fontSize: "16px"
		});
		this.editors[guid].editor.on('input', function () {
			if (!self.editors[guid].editor.session.getUndoManager().isClean())
				self.myTabs.dynamictabs("set_state", guid, false);
		});
		this.myTabs.dynamictabs("select_tab", guid);
		this.resize();
	},

	createToolbar: function () {
		var self = this;
		this.fec("filebutton").button();
		this.fec("editbutton").button();
		this.fec("viewbutton").button();
		this.fec("templatebutton").button();
		this.fec("aboutbutton").button();

		$.contextMenu({
			selector: 'button._winnies_appstudio_filebutton',
			trigger: 'left',
			items: self.menus['file']
		});
		$.contextMenu({
			selector: 'button._winnies_appstudio_editbutton',
			trigger: 'left',
			items: self.menus['edit']
		});
		$.contextMenu({
			selector: 'button._winnies_appstudio_viewbutton',
			trigger: 'left',
			items: self.menus['view']
		});
		$.contextMenu({
			selector: 'button._winnies_appstudio_templatebutton',
			trigger: 'left',
			items: self.menus['template']
		});
		$.contextMenu({
			selector: 'button._winnies_appstudio_aboutbutton',
			trigger: 'left',
			items: self.menus['about']
		});

	},

	menuEvents: function () {
		var self = this;
		this.menus['file'] = {
			openfile: {
				name: "Open file",
				callback: function (key, opt) {
					core.system.dialogs.dialog("filedialog", {
						title: "Open file",
						startPath: "/home",
						extFilters: self.extFilters,
						handles: "open"
					}, function (err, dialogInstance) {
						$(dialogInstance).on("filedialogconfirm", function (ev, obj) {
							if (obj.err) return alert(err.message);
							self.createEditorTabByFile(obj.result.path, obj.result.buffer);
						});
					});
				}
			},
			savefile: {
				name: "Save file",
				callback: function (key, opt) {
					var guid = self.myTabs.dynamictabs("get_selected");
					var tabData = self.myTabs.dynamictabs("get_tabData", guid);
					var fullPath = tabData.data.fullPath;
					var content = self.editors[guid].editor.getValue();
					var fileName = BVFS.path.basename(fullPath);
					var startPath = BVFS.path.dirname(fullPath);
					var fileBuffer = new BVFS.buffer(content, 'utf8');

					core.system.dialogs.dialog("filedialog", {
						title: "Save file",
						fileName: fileName,
						startPath: startPath,
						extFilters: self.extFilters,
						fileBuffer: fileBuffer,
						handles: "save"
					}, function (err, dialogInstance) {
						$(dialogInstance).on("filedialogconfirm", function (ev, obj) {
							console.log("confirmed save file!!");
							self.myTabs.dynamictabs("set_state", guid, true);
							self.editors[guid].editor.session.getUndoManager().markClean()
						});
					});
				}
			},
			saveall: {
				name: "Save all files",
				callback: function (key, opt) {
					alert("Clicked on " + key);
				}
			},
			newfile: {
				name: "New file",
				callback: function (key, opt) {}
			}
		};

		this.menus['edit'] = {
			cut: {
				name: "Cut",
				callback: function (key, opt) {}
			},
			copy: {
				name: "Copy",
				callback: function (key, opt) {}
			},
			paste: {
				name: "Paste",
				callback: function (key, opt) {}
			},
			deletesel: {
				name: "Delete",
				callback: function (key, opt) {}
			},
			find :{
				name: "Find",
				callback: function (key, opt) {}
			}
		};
		this.menus['view'] = {
			dummy: {
				name: "dummy",
				callback: function (key, opt) { }
			}
		};
		this.menus['template'] = {
			dummy: {
				name: "dummy",
				callback: function (key, opt) { }
			}
		};
		this.menus['about'] = {
			dummy: {
				name: "dummy",
				callback: function (key, opt) { }
			}
		};
	},
	idFy: function (subClassName) {
		var getElByClass = this.fec(subClassName);
		var uniqueLabel = core.util.guid();
		getElByClass.attr({ "id": uniqueLabel });
		return ({ element: getElByClass, id: uniqueLabel });
	},

	fec: function (subClassName) {
		return this.element.find("._winnies_" + this.widgetName + "_" + subClassName);
	},

	logging: function (msg) {
		if (this.doLog) console.log(this.widgetName + " :: " + msg);
	},

	resize: function () {
		this.myTabs.height(this.innerHeight - 30);
		this.myTabs.width(this.innerWidth + 5);
		var guid = this.myTabs.dynamictabs("get_selected");	

		if (guid) {
			$("#tab-" + guid).height(this.innerHeight - 90);
			this.myTabs.dynamictabs("refresh");
			if (this.editors[guid]) {
				this.editors[guid].editor.resize();
			}
		}
	},

	_trigger: function (type, ev, data) {
		if (type == 'close') this._destroy();
		if (type == 'contentLoaded') {
			this.innerHeight = data.size.innerHeight;
			this.innerWidth = data.size.innerWidth;
			this.contentLoaded();
		}
		if (type == 'resize') {
			this.innerHeight = data.size.innerHeight;
			this.innerWidth = data.size.innerWidth;
			this.resize();
		}
		this._super(type, ev, data);
	},

	_destroy: function () {
		this._super();
	}

});
