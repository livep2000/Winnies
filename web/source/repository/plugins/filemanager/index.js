$.widget("plugins.filemanager", $.winnies.pluginSuperwidget, {
	doLog: true,
	version: "1.0.0",
	uniqueLabel: null,
	containerDiv: null,
	appTabLayout: null,
	addressBar: null,
	plugins: ['unique', 'contextmenu', 'changed'],
	crossIndex: null,
	fileTree: null,
	fileTreeInst: null,
	directoryTree: null,
	fileRootId: null,

	dirTreeInst: null,
	itWasMe: false,
	options: {
		startPath: "/home",
		addressBar: true,
		filePane: true,
		fileBuffer: null,
	},
	tmpPath: "",

	_contentLoaded: function () {
		oldConsole.log(this.options);
		var self = this;
		this.crossIndex = new core.util.crossIndex({ indexes: { relativePath: "", nodeId: "" }, data: { node: {} } });
		this.setupLayout();
		this.createDirTree();
		this.createFileTree();
		this.directoryTree.on('changed.jstree', function (e, Obj) {
			if (Obj.action === 'ready') { // must be the root node
				self.logging("jstree :: tree ready");
				self.addCrossindexItem("/", Obj.selected[0], { populated: false, opened: false });
				self.expandTo(self.options.startPath, function (err, lastNode) {
					self.populateFileTree(lastNode, function (err, result) {
						self.dirTreeEvents();
						self.fileSystemChangedEvents(); // start sending & listening to changes
					});
				});
			}
		});
	},

	dirTreeEvents: function () {
		var self = this;
		this.directoryTree.on('select_node.jstree', function (e, Obj) {
			var nodeId = Obj.node.id;
			self.crossIndex.find(nodeId, "nodeId", function (err, resultObj) {	
				self.populateFileTree(Obj.node, function (err, result) {
					var fullPath = resultObj.indexes.relativePath;
					if (self.options.addressBar) self.addressBar.text(fullPath);
					self._trigger("activatedir", null, { err: null, path: fullPath });
					if (!resultObj.data.populated) { 
						self.expandDirNode(nodeId, fullPath, function (err, res) {
							self.itWasMe = false; 
							if (err) console.log(err);
						});
					}
				else self.itWasMe = false; 
				});
			});
		});

		this.directoryTree.on('close_node.jstree', function (e, Obj) {
			self.dirTreeInst.deselect_all(true);
			self.dirTreeInst.select_node(Obj.node);
			self.crossIndex.update(Obj.node.id, "nodeId", { data: { opened: false } });
		});

		this.directoryTree.on('open_node.jstree', function (e, Obj) {
			self.dirTreeInst.deselect_all(true);
			self.dirTreeInst.select_node(Obj.node);
			self.crossIndex.update(Obj.node.id, "nodeId", { data: { opened: true } });
		});

	},

	fileSystemChangedEvents: function () {
		var self = this;
		this.directoryTree.on("create_node.jstree", function (node, refNode, event, data) { self.changes(node, refNode, event, data, "dir"); });
		this.directoryTree.on("rename_node.jstree", function (node, refNode, event, data) { self.changes(node, refNode, event, data, "dir"); });
		this.directoryTree.on("delete_node.jstree", function (node, refNode, event, data) { self.changes(node, refNode, event, data, "dir"); });
		this.directoryTree.on("move_node.jstree", function (node, refNode, event, data) { self.changes(node, refNode, event, data, "dir"); });
		this.directoryTree.on("copy_node.jstree", function (node, refNode, event, data) { self.changes(node, refNode, event, data, "dir"); });

		this.fileTree.on("create_node.jstree", function (node, refNode, event, data) { self.changes(node, refNode, event, data, "file"); });
		this.fileTree.on("rename_node.jstree", function (node, refNode, event, data) { self.changes(node, refNode, event, data, "file"); });
		this.fileTree.on("delete_node.jstree", function (node, refNode, event, data) { self.changes(node, refNode, event, data, "file"); });
		this.fileTree.on("move_node.jstree", function (node, refNode, event, data) { self.changes(node, refNode, event, data, "file"); });
		this.fileTree.on("copy_node.jstree", function (node, refNode, event, data) { self.changes(node, refNode, event, data, "file"); });

		$(core.system).on('filesystemchanged.' + this.uniqueLabel, function (event, info) {

			self.crossIndex.find(info.relativePath, "relativePath", function (err, resultObj) {
				if (err) return;//  just not present in this tree
				var nodeId = resultObj.indexes.nodeId;
				if (info.tree === 'dir') {
					if ($(self.directoryTree).attr('id') === info.treeId) {
						if (info.type === 'delete_node') {
							self.crossIndex.remove(nodeId, "nodeId", function (err, result) {
								if (err) return core.system.alertBox(err, false);
							});
						}
						else if (info.type === 'create_node') {
							if (self.itWasMe) return;
							if (info.relativePath.endsWith("/")) var newPath = info.relativePath + info.newInfo + "/";
							else var newPath = info.relativePath + "/" + info.newInfo + "/";
							self.addCrossindexItem(newPath, info.newId, { populated: false, opened: false });
							BVFS.fs.mkdir(newPath, function (err) {
								if (err) return core.system.alertBox(err.message, false);
							});
						}
						else if (info.type === 'rename_node') {
							var splitted = info.relativePath.split("/");
							var newRelativePath = "";
							for (var i = 0; i < splitted.length - 2; i++) {
								newRelativePath += splitted[i];
								newRelativePath += "/";
							}
							newRelativePath += info.newInfo + "/";
							// find underlaying range :)
							self.crossIndex.find(info.relativePath, "relativePath", function (err, resultArr) {
								$.each(resultArr, function (key, Obj) {
									var updatedPath = Obj.indexes.relativePath.replace(info.relativePath, newRelativePath);
									self.crossIndex.update(Obj.indexes.relativePath, "relativePath", { indexes: { relativePath: updatedPath } });
								});
							}, { l: true, in: true }); // larger then, inclusive
							if (info.relativePath !== newRelativePath) {
								BVFS.fs.rename(info.relativePath, newRelativePath, function (err) {
									if (err) return core.system.alertBox( err.message, false);
								});
							}
						}
						return;
					}
					else {
						var nodeId = resultObj.indexes.nodeId;
						if (info.type === 'delete_node') {
							self.itWasMe = true; // prevent closed loop
							self.dirTreeInst.delete_node(nodeId);
							self.crossIndex.remove(info.relativePath, "relativePath", function (err, result) {
								if (err) return core.system.alertBox(err, false);
							});
						}
						else if (info.type === 'create_node') { // so, create that node
							self.itWasMe = true; // prevent closed loop
							if (info.relativePath.endsWith("/")) var newPath = info.relativePath + info.newInfo + "/";
							else var newPath = info.relativePath + "/" + info.newInfo + "/";
							var newNodeId = self.dirTreeInst.create_node(nodeId, { "type": "folder", "text": info.newInfo });
							self.addCrossindexItem(newPath, newNodeId, { populated: false, opened: false });
						}
						else if (info.type === 'rename_node') {
							self.itWasMe = true;
							var splitted = info.relativePath.split("/");
							var newRelativePath = "";
							for (var i = 0; i < splitted.length - 2; i++) {
								newRelativePath += splitted[i];
								newRelativePath += "/";
							}
							newRelativePath += info.newInfo + "/";
							// find underlaying range :)
							self.crossIndex.find(info.relativePath, "relativePath", function (err, resultArr) {
								$.each(resultArr, function (key, Obj) {
									var updatedPath = Obj.indexes.relativePath.replace(info.relativePath, newRelativePath);
									self.crossIndex.update(Obj.indexes.relativePath, "relativePath", { indexes: { relativePath: updatedPath } });
								});
							}, { l: true, in: true }); // larger then, inclusive				
							self.dirTreeInst.rename_node(nodeId, info.newInfo);
						}
						else if (info.type === 'copy_node') { }
						else if (info.type === 'move_node') { }
						else { }
					}
				}
				else if (info.tree === 'file') {
					if ($(self.fileTree).attr('id') === info.treeId) {
						if (info.type === 'delete_node') {
							self.crossIndex.remove(nodeId, "nodeId", function (err, result) {
								if (err) return core.system.alertBox(err, false);
							});
						}
						else if (info.type === 'create_node') {
							if (self.itWasMe) return;
							var path = resultObj.indexes.relativePath + "New file";
							BVFS.fs.open(path, 'w', function (err, fd) {
								self.addCrossindexItem(path, info.newId, { populated: false, opened: false });
								BVFS.fs.close(fd);
							});
						}
						else if (info.type === 'rename_node') {
							var splitted = info.relativePath.split("/");
							var newRelativePath = "";
							for (var i = 0; i < splitted.length - 1; i++) {
								newRelativePath += splitted[i];
								newRelativePath += "/";
							}
							newRelativePath += info.newInfo ;
							self.crossIndex.update(nodeId, "nodeId", { indexes: { relativePath: newRelativePath } })

							if (info.relativePath !== newRelativePath) {

								console.log("rename: " + info.relativePath);
								console.log("to: " + newRelativePath);

								BVFS.fs.rename(info.relativePath, newRelativePath, function (err) {
									if (err) return core.system.alertBox("*1* " + err.message, false);
								});
							}

						}
						else if (info.type === 'copy_node') { }
						else if (info.type === 'move_node') { }
						else { }
					}
					else {
						oldConsole.log("Triggered from remote: " + info.type);
						if (info.type === 'delete_node') {
							self.itWasMe = true; // prevent closed loop
							self.fileTreeInst.delete_node(nodeId);
							self.crossIndex.remove(nodeId, "nodeId", function (err, result) {
								if (err) return core.system.alertBox(err, false);
							});
						}
						else if (info.type === 'create_node') {
							self.itWasMe = true; // prevent closed loop
							self.fileTreeInst.deselect_all(true);
							var path = resultObj.indexes.relativePath + "New file";
							var nodeJson = self.createNode("New file", "jstree-file", null, true, false);
							var newNodeId = self.fileTreeInst.create_node("#", nodeJson);
							self.fileTreeInst.select_node(newNodeId);
							self.addCrossindexItem(path, newNodeId, { populated: false, opened: false });
						}
						else if (info.type === 'rename_node') {
							self.itWasMe = true;
							var splitted = info.relativePath.split("/");
							var newRelativePath = "";
							for (var i = 0; i < splitted.length - 1; i++) {
								newRelativePath += splitted[i];
								newRelativePath += "/";
							}
							newRelativePath += info.newInfo;
							self.crossIndex.update(nodeId, "nodeId", { indexes: { relativePath: newRelativePath } })
							self.fileTreeInst.rename_node(nodeId, info.newInfo);
						}
						else if (info.type === 'copy_node') { }
						else if (info.type === 'move_node') { }
						else { }
					}
				}
				else { } // else what ???

			}); // crossindex.find reltivepath
		}); // on filesystemchanged
	},

	populateFileTree: function (node, callback) {
		if (!this.options.filePane) return false;
		var self = this;
		var nodes = self.fileTreeInst.get_node("#").children.slice(); // HA! jstree is popping out the array
		for (var i = 0; i < nodes.length; i++) {
			self.itWasMe = true; // do not trigger events on tree population
			self.fileTreeInst.delete_node(nodes[i]);		// remove from tree
			self.crossIndex.remove(nodes[i], "nodeId");		// remove from crossindex
		}
		this.crossIndex.find(node.id, "nodeId", function (err, indexObj) {
			if (err) return core.system.alertBox(err, false);
			if (self.options.addressBar) self.addressBar.text(indexObj.indexes.relativePath);
			var fullPath = indexObj.indexes.relativePath;
			BVFS.sh.ls(fullPath, function (err, entries) {
				if (err) return callback(err.message, null);
				async.each(entries, function (entry, ittCallback) {
					if (entry.type === 'FILE') {
						self.itWasMe = true; // do not trigger events on tree population
						var filePath = fullPath + entry.path;
						var fileNodeJson = self.createNode(entry.path, "jstree-file", { filePath: filePath, entryPath: entry.path }, false, false);
						// TODO: idea ! add fileproperties as nodes?  later !!
						var newNodeId = self.fileTreeInst.create_node("#", fileNodeJson);
						self.addCrossindexItem(filePath, newNodeId, { directory: entry.path });
					}
					ittCallback();
				}, function (err) {
					self.itWasMe = false;
					return callback(err, true);
				});
			});
		});
	},

	createDirTree: function () {
		var self = this;
		this.directoryTree.jstree({
			'plugins': self.plugins,
			'contextmenu': {
				"items": function (node) { return self.createContextMenu(node); }
			},
			'core': {
				'check_callback': true,
				"themes": { "stripes": true },
				'data': function (node, callback) {
					var rootNode = self.createNode("/", "jstree-folder", null, true, false);
					callback.call(this, rootNode);
				}
			},
		});
		this.dirTreeInst = this.directoryTree.jstree(true);
	},

	createFileTree: function () {
		var self = this;
		if (this.fileTree) { this.fileTree.jstree("destroy"); }
		this.fileTree.jstree({
			'plugins': self.plugins,
			'contextmenu': {
				"items": function (targetNode) { return self.createFileContextMenu(targetNode); }
			},
			'core': {
				'check_callback': true,
				"themes": { "stripes": true },
				'data': null
			}
		});
		this.fileTreeInst = this.fileTree.jstree(true);
		this.fileTree.on('select_node.jstree', function (e, Obj) {
			var nodeId = Obj.node.id;
			self.crossIndex.find(nodeId, "nodeId", function (err, resultObj) {
				var fullPath = resultObj.indexes.relativePath;
				if (self.options.addressBar) self.addressBar.text(fullPath);
				self._trigger("activatefile", null, { err: null, path: fullPath });
			});
		});
	},

	createFileContextMenu: function (targetNode) {
		var self = this;
		var menu = {
			openFile: { // not for now....
				label: "Open file", action: function (Obj) { self.openFile(Obj, targetNode); },
				_disabled: true,
				separator_after: true
			},
			createFile: {
				label: "New file", action: function (Obj) { self.createFile(Obj, targetNode); }
			},
			renameFile: {
				label: "Rename file", action: function (Obj) { self.renameFile(Obj, targetNode); }
			},
			DeleteFile: {
				label: "Delete file", action: function (Obj) { self.deleteFile(Obj, targetNode); },
				separator_after: true
			}
		};
		menu.edit = {label: 'Edit'};	
		menu.edit.submenu = {
			copyFile: {
				label: "Copy", action: function (Obj) { self.copyFile(Obj, targetNode); }
			},
			cutFile: {
				label: "Cut", action: function (Obj) { self.cutFile(Obj, targetNode); }
			},
			pasteFile: {
				label: "Paste", action: function (Obj) { self.pasteFile(Obj, targetNode); },
				_disabled: true
			}
		};	
		return menu;
	},

	openFile: function (Obj, targetNode) {
		console.log("open file");
		this.notReadyAlert();
	},
	copyFile: function (Obj, targetNode) {
		console.log("copy file");
		this.notReadyAlert();
	},
	cutFile: function (Obj, targetNode) {
		console.log("cut file");
		this.notReadyAlert();
	},
	pasteFile: function (Obj, targetNode) {
		console.log("paste file");
		this.notReadyAlert();
	},

	createFile: function (Obj, targetNode) {
		var self = this;
		self.fileTreeInst.deselect_all(true);
		var nodeJson = this.createNode("New file", "jstree-file", null, true, false);
		var newNodeId = this.fileTreeInst.create_node("#", nodeJson);
		self.fileTreeInst.select_node(newNodeId);
		self.fileTreeInst.edit(newNodeId);
	},

	renameFile: function (Obj, targetNode) {
		this.fileTreeInst.edit(targetNode);
	},

	deleteFile: function (Obj, targetNode) {
		var self = this;
		this.crossIndex.find(targetNode.id, "nodeId", function (err, indexObj) {
			if (err) return core.system.alertBox(err, false);
			BVFS.fs.unlink(indexObj.indexes.relativePath, function (err) {
				if (err) return core.system.alertBox(err.message, false);
				self.fileTreeInst.delete_node(targetNode.id);
			});
		});
	},

	createContextMenu: function (targetNode) {
		var self = this;
		var menu = {};
		
		menu.SaveInfolder = {
				label: "Save file", action: function (Obj) { self.saveInFolder(Obj, targetNode); },
				separator_after: true
			};
		
		if (self.options.fileBuffer === null) menu.SaveInfolder._disabled = true;

		menu.CreateFolder = {
			label: "Add folder", action: function (Obj) { self.createFolder(Obj, targetNode); }
		};
		menu.Rename = {
			label: "Rename folder", action: function (Obj) { self.renameFolder(Obj, targetNode); }
		};
		menu.Delete = {
			label: "Delete folder", action: function (Obj) { self.deleteFolder(Obj, targetNode); },
			separator_after: true
		};
		menu.edit = {label: 'Edit'};
		menu.edit.submenu = {
			copyFolder: {
				label: "Copy", action: function (Obj) { self.copyFolder(Obj, targetNode); }
			},
			cutFolder: {
				label: "Cut", action: function (Obj) { self.cutFolder(Obj, targetNode); }
			},
			pasteFolder: {
				label: "Paste", action: function (Obj) { self.pasteFolder(Obj, targetNode); },
				_disabled: true
			}
		};
			
		return menu;
	},

	saveInFolder: function (Obj, targetNode) {
		console.log("save file");
	},

	renameFolder: function (Obj, targetNode) {
		this.dirTreeInst.edit(targetNode);
	},

	createFolder: function (Obj, targetNode) {
		var newNodeId = this.dirTreeInst.create_node(targetNode.id, { "type": "folder" });
		this.dirTreeInst.edit(newNodeId);
	},

	deleteFolder: function (Obj, targetNode) {
		var self = this;
		this.crossIndex.find(targetNode.id, "nodeId", function (err, indexObj) {
			if (err) return core.system.alertBox(err, false);
			BVFS.fs.rmdir(indexObj.indexes.relativePath, function (err) {
				if (err) return core.system.alertBox(err.message, false);
				self.dirTreeInst.delete_node(targetNode.id);
			});
		});
	},

	copyFolder: function (Obj, targetNode) {
		this.notReadyAlert();
	},

	cutFolder: function (Obj, targetNode) {
		this.notReadyAlert();
	},

	pasteFolder: function (Obj, targetNode) {
		this.notReadyAlert();
	},

	changes: function (node, refNode, event, data, tree) {
		if (this.itWasMe) {
			this.itWasMe = false;
			return;
		}

		if (tree == 'dir') var treeId = $(this.directoryTree).attr('id');
		else var treeId = $(this.fileTree).attr('id');

		var findNodeId;
		if (node.type === 'create_node') findNodeId = refNode.parent;			// The parent node
		else findNodeId = refNode.node.id; // The node itself
		if (findNodeId === '#') findNodeId = this.dirTreeInst.get_selected()[0]; // get id of selected node in dirtree;

		var eventObj = { type: node.type, treeId: treeId, tree: tree };

		this.crossIndex.find(findNodeId, "nodeId", function (err, resultObj) {
			if (err) return console.error(err);

			if (node.type === 'create_node') {
				eventObj.relativePath = resultObj.indexes.relativePath;			// in this case the parentPath
				eventObj.newInfo = refNode.node.text;
				eventObj.newId = refNode.node.id;
			}
			else if (node.type === 'rename_node') {
				eventObj.relativePath = resultObj.indexes.relativePath;
				eventObj.oldInfo = refNode.old;
				eventObj.newInfo = refNode.text;
			}
			else if (node.type === 'delete_node') {
				eventObj.relativePath = resultObj.indexes.relativePath;
			}
			else if (node.type === 'move_node') { }
			else if (node.type === 'copy_node') { }
			else { console.error(node.type + " Not recognized"); }

			core.system.fileChanged(eventObj);
		});
	},

	expandEachSync: function (splittedPath, pos, callback) {
		var self = this;
		if (!pos) var pos = 0;
		var err = null;
		if (!this.tmpPath) this.tmpPath = "/";
		else this.tmpPath += splittedPath[pos] + "/";
		self.crossIndex.find(self.tmpPath, 'relativePath', function (err, Obj) {
			pos += 1;
			if (err) core.system.alertBox(err, false);
			else {
				self.expandDirNode(Obj.indexes.nodeId, self.tmpPath, function (err, result) {
					if (pos < splittedPath.length) self.expandEachSync(splittedPath, pos, callback);
					else { // select targeted node (last node)
						var node = self.dirTreeInst.get_node(Obj.indexes.nodeId);
						self.dirTreeInst.deselect_all(true); // deselect all others
						self.dirTreeInst.select_node(node);  // <--- also the filetree target
						callback(err, node);
					}
				});
			}
		});
	},

	expandTo: function (fullPath, callback) {
		var self = this;
		var splittedPath = ["/"];
		if (fullPath !== '/') splittedPath = fullPath.split("/");
		this.tmpPath = "";
		this.expandEachSync(splittedPath, 0, function (err, lastNode) {
			callback(err, lastNode);
		});
	},

	createNode: function (text, icon, data, selected, opened) {
		var node = {
			'icon': icon,
			'text': text,
			'data': data,
			'state': {
				'opened': opened,
				'selected': selected
			}
		};		
		return node;
	},

	expandDirNode: function (nodeId, fullPath, callback) {
		var self = this;
		var currentNode = self.dirTreeInst.get_node(nodeId);
		BVFS.sh.ls(fullPath, function (err, entries) {
			if (err) throw err;
			async.each(entries, function (entry, ittCallback) {
				self.itWasMe = true;
				if (entry.type === 'DIRECTORY') {
					var newNode = self.createNode(entry.path, "jstree-folder", null, false, true);
					var newPath = fullPath + entry.path + "/";
					var newNodeId = self.dirTreeInst.create_node(currentNode, newNode, 'last');
					self.addCrossindexItem(newPath, newNodeId, { populated: false, opened: false }); // create new, marked as not populated
				}
				ittCallback();
			}, function (err) {
				self.crossIndex.update(nodeId, 'nodeId', { data: { populated: true, opened: true } }, function (err, res) { // mark as populated
					callback(err, res);
				});
			});
		});
	},

	addCrossindexItem: function (relativePath, nodeId, data) {
		var tmpObj = this.crossIndex.baseObject();
		tmpObj.indexes.relativePath = relativePath;
		tmpObj.indexes.nodeId = nodeId;
		tmpObj.data = data;
		this.crossIndex.add(tmpObj);
	},

	setupLayout: function () {
		var self = this;
		$.jstree.defaults.core.data = true;
		this.element.css("overflow", "hidden");
		this.element.addClass("nonselectable");
		this.uniqueLabel = core.util.guid();							// must have unique id
		this.addressBar = this.fec("addressbar");
		this.addressBar.attr({ contenteditable: true });
		this.addressBar.keypress(function (e) {
			if (e.keyCode == 13) {
				event.preventDefault();
				var value = $(this).text();
				console.log(value);
			}
		});
		// layout
		this.containerDiv = this.fec("container");						// get by className
		this.containerDiv.attr({ "id": this.uniqueLabel });				// give unique id
		this.appTabLayout = this.containerDiv.layout({					// from now on we got references to the layout & container
			initClosed: false,
			applyDefaultStyles: true,
			paneClass: self.uniqueLabel + "-pane"						// prevents interaction with others instances
		});
		this.containerDiv.height(this.element.height());
		this.appTabLayout.options.east.size = this.element.width() - 240; // the way to set the center pane width 
		this.appTabLayout.options.north.resizable = false;
		this.appTabLayout.resizeAll();
		if (!this.options.filePane) this.appTabLayout.hide("east");
		else {
			this.appTabLayout.open("east");
			this.filePane = this.fec("files");
			this.fileTree = this.fec("filetree");
			this.fileTree.attr({ "id": "filetree" + this.uniqueLabel });
		}
		if (!this.options.addressBar) this.appTabLayout.hide("north");
		else this.appTabLayout.open("north");
		// directory tree
		this.directoryTree = this.fec("directorytree"); 				// config tree
		this.directoryTree.attr({ "id": "tree" + this.uniqueLabel });	// unique id the tree
	},

	resizeAll: function (resizeData) {
		this.containerDiv.height(this.element.height());
		this.appTabLayout.resizeAll();
	},

	_setOption: function (key, value) {

		oldConsole.log("OPTION", key, value);

		if (key === 'resizeAll') {
			this.resizeAll(value);
		}
		if (key === 'saveFile') {
			var selectedPath = this.addressBar.text();
			var fullPath = selectedPath + this.options.fileName;
			var buffer = this.options.fileBuffer;

			console.log("PATH: " + fullPath);

			BVFS.fs.open(fullPath, 'w', function (err, fd) {
				if (err) return console.error(err.message);
				var expected = buffer.length, written = 0;
				function writeBytes(offset, position, length) {
					length = length || buffer.length - written;

					BVFS.fs.write(fd, buffer, offset, length, position, function (err, nbytes) {
						if (err) throw error;
						written += nbytes;
						if (written < expected)
							writeBytes(written, null);
						else
							BVFS.fs.close(fd);
					});
				}
				writeBytes(0, 0);
			});
		}
		this._super(key, value);
	},

	notReadyAlert: function() {
		core.system.alertBox("Sorry, that function is not ready (yet).", false);
	},
	fec: function (subClassName) {
		return this.element.find("._winnies_" + this.widgetName + "_" + subClassName);
	},

	logging: function (msg) {
		if (this.doLog) console.log(this.widgetName + " :: " + msg);
	},

	_trigger: function (type, ev, data) {
		this._super(type, ev, data);
	},

	_destroy: function () {
		this.crossIndex.destroy();
		this.directoryTree.off();
		$(core.system).off('filesystemchanged.' + this.uniqueLabel);
		this._super();
	}
});