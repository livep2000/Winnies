var appName = "terminal";
$.widget("apps." + appName, $.winnies.appDialog, {
	version: "1.0.0",

	sh: null,
	terminal: null,
	currentPrompt: null,
	echoOn: true,
	promptOn: true,

	options: {
		fontSize: "16Px",
		display: ""
	},

	crop : function () {
		if (this.terminal.children().length > 50) this.terminal.find('div').first().remove();
	},
	postback : function (msg) {
		if (this.echoOn) this.echoText(msg);
		if (this.promptOn) this.addPrompt();
	},

	addPrompt: function () {
		var self = this;
		if (this.currentPrompt) {
			this.currentPrompt.attr("contenteditable", "false");
			this.currentPrompt.off("keydown");
		}
		var div = $("<div>");
		div.text(this.sh.fs.name + this.sh.pwd() + ">");
		this.currentPrompt = new $('<span>');
		this.currentPrompt.attr("spellchecker", "disabled");
		this.currentPrompt.attr("contenteditable", "true");
		this.currentPrompt.attr("style", "border:0Px;outline:0Px;min-width:1Px;padding-left:5Px;");
		div.append(this.currentPrompt)
		this.terminal.append(div);
		this.crop();
		this.terminal.focus();
		this.currentPrompt.focus();
		this.currentPrompt.bind('copy', function () {
			self.addPrompt();
		});

		this.currentPrompt.on('keydown', function (event) {
			if (event.which == 13) {
				var content = $(this).text();
				if (content == "") self.addPrompt();
				else {
					try {
						var tmpFunc = new Function(content);
						self.engine(tmpFunc, self);
					}
					catch (e) { self.postback(e.message); }
				}
				event.preventDefault();
			}
		});
	},
	normalize: function (path) {
		var currentPath = this.sh.pwd();
		if (currentPath != "/") currentPath = currentPath + "/";
		if (!path) var path = "";
		var normalized = currentPath + path;
		normalized = normalized.replace("//", "/");
		console.log("Normalized: " + normalized);
		return (normalized);

	},

	engine: function (tmpFunc, self) {
		supressPrompt = false,
		hide = function () { self.terminal.hide(); },
		show = function () { },
		launch = function (pluginId, optionalOptions, callback) {
			supressPrompt = true;
			if (!optionalOptions) var optionalOptions = {};
			core.app.launch(pluginId, optionalOptions, function (err, result) {
				if (callback) callback(err, result);
				var msg = pluginId + " launched.";
				if (err) msg = "Error: " + err;
				self.postback(msg);
			});
		},
		kill = function (pluginId, callback) {
			supressPrompt = true;
			core.app.kill(pluginId, function (err, result) {
				if (callback) callback(err, result);
				var msg = pluginId + " Killed.";
				if (err) msg = "Error: " + err;
				self.postback(msg);
			});
		},
		promptOn = function (next) {
			supressPrompt = true;
			self.promptOn = true;
			if (!next) self.addPrompt();
		},
		promptOff = function () { self.promptOn = false; },
		echoWrite = function (msg) { supressPrompt = true; self.postback(msg); },
		echoOn = function () { self.echoOn = true; },
		echoOff = function () { self.echoOn = false; },
		help = function () {
			supressPrompt = true;
			promptOff();
			self.postback("****** HELP summary ******");
			self.postback("promptOff(); ----------------------- Disable prompt.");
			self.postback("promptOn(); ------------------------ Enable prompt.");
			self.postback("echoOff(); ------------------------- Disable output.");
			self.postback("echoOn(); -------------------------- Enable output.");
			self.postback("echoWrite(text); ------------------- Write to output");
			self.postback("help(); ---------------------------- This summary");
			self.postback("install(fileName, path); ----------- Install app(s) by json file");
			self.postback("install(Object, path); ------------- Install app(s) by object");
			self.postback("uninstall(fileName, path); --------- Uninstall app(s) by json file");
			self.postback("uninstall(Object, path); ----------- Uninstall app(s) by object");
			self.postback("wget(url, path); ------------------- download file");
			self.postback("format(driveName, callback); ------- Wipe drive");
			self.postback("cd(path, callback); ---------------- Change directory");
			self.postback("dir(path, callback); --------------- List directory");
			self.postback("find(path, regex, callback);");
			self.postback("ls(dir, [options], callback);");
			self.postback("exec(path, [args], callback);");
			self.postback("touch(path, [options], callback);");
			self.postback("cat(files, callback);");
			self.postback("rm(path, [options], callback);");
			self.postback("tempDir(callback);");
			self.postback("mkdirp(path, callback);");
			self.postback("rename(oldPath, newPath, callback)");
			self.postback("ftruncate(fd, len, callback)");
			self.postback("truncate(path, len, callback)");
			self.postback("stat(path, callback)");
			self.postback("fstat(fd, callback)");
			self.postback("lstat(path, callback)");
			self.postback("exists(path, callback)");
			self.postback("link(srcpath, dstpath, callback)");
			self.postback("symlink(srcpath, dstpath, [type], callback)");
			self.postback("readlink(path, callback)");
			self.postback("unlink(path, callback)");
			self.postback("mknod(path, mode, callback)");
			self.postback("rmdir(path, callback)");
			self.postback("mkdir(path, [mode], callback)");
			self.postback("readdir(path, callback)");
			self.postback("close(fd, callback)");
			self.postback("open(path, flags, [mode], callback)");
			self.postback("utimes(path, atime, mtime, callback)");
			self.postback("futimes(fd, atime, mtime, callback)");
			self.postback("write(fd, buffer, offset, length, position, callback)");
			self.postback("read(fd, buffer, offset, length, position, callback)");
			self.postback("readFile(filename, [options], callback)");
			self.postback("writeFile(filename, data, [options], callback)");
			self.postback("appendFile(filename, data, [options], callback)");
			self.postback("setxattr(path, name, value, [flag], callback)");
			self.postback("fsetxattr(fd, name, value, [flag], callback)");
			self.postback("getxattr(path, name, callback)");
			self.postback("fgetxattr(fd, name, callback)");
			self.postback("removexattr(path, name, callback)");
			self.postback("fremovexattr(fd, name, callback)");
			self.postback("watch(filename, [options], [listener])");
			promptOn();
		},
		cd = function (path, callback) {
			supressPrompt = true;
			//var p = self.normalize(path);
			self.sh.cd(path, function (er) {
				if (er) var msg = er.message;
				if (callback) {
					if (er) callback(er.message, null);
					else callback(null, true);
				}
				if (er) self.postback(msg);
				else self.postback("changed to '" + self.sh.pwd() + "'");
			});
		},
		dir = function (path, callback) {
			supressPrompt = true;
			var p = self.normalize(path);
			self.sh.fs.readdir(p, function (er, files) {
				if (er) msg = er.message;
				if (callback) {
					if (er) callback(er.message, null);
					else callback(null, files);
				}
				promptOff();
				for (key in files) {
					self.postback(files[key]);
				}
				promptOn();

			});
		},
		find = function (path, regex, callback) {
			supressPrompt = true;
			var p = self.normalize(path);
			self.sh.find(p, { regex: regex }, function (er, found) {
				if (er) var msg = er.message;
				if (callback) {
					if (er) callback(er.message, null);
					else callback(null, found);
				}
				if (er) self.postback(msg);
				else {
					if (found.length == 0) self.postback("Nothing found");
					else {
						promptOff();
						self.postback("found in:");
						for (key in found) {
							self.postback(found[key]);
						}
						promptOn();
					}
				}
			});
		},
		ls = function (path, options, callback) {
			supressPrompt = true;
			var p = self.normalize(path);
			self.sh.ls(p, options, function (er, entries) {
				if (er) var msg = er.message;
				if (callback) {
					if (er) callback(er.message, entries);
				}
				if (er) self.postback(msg);
				else {
					promptOff();
					for (key in entries) {
						self.postback("----------------------");
						self.postback("path: " + entries[key].path);
						self.postback("links: " + entries[key].links);
						self.postback("size: " + entries[key].size);
						self.postback("modified: " +core.util.timeConverter( entries[key].modified));
						self.postback("type: " + entries[key].type);
						if (entries[key].contents) self.postback("content:" + entries[key].contents.length);
					}
					promptOn();
				}
			});
		},
		exec = function (path, args, callback) {
			supressPrompt = true;
			var p = self.normalize(path);
			var msg = p + " executed.";
			self.sh.fs.exec(p, args, function (er, result) {
				if (er) var msg = er.message;
				else var msg = result;
				if (callback) {
					if (er) callback(er.message, null);
					else callback(null, result);
				}
				self.postback(msg);
			});
		},
		touch = function (path, options, callback) {
			supressPrompt = true;
			var p = self.normalize(path);
			self.sh.touch(p, options, function (er) {
				msg = p+ " touched";
				if (er) msg = er.message;
				if (callback) {
					if (er) callback(er.message, entries);
				}
				self.postback(msg);
			});
		},
		cat = function (files, callback) {
			supressPrompt = true;
			self.sh.cat(files, function (er, data) {
				if (er) {
					var msg = er.message;
					self.postback(msg);
				}
				else self.postback(data);
				if (callback) {
					if (er) callback(er.message, data);
				}

			});
		},
		rm = function (path, options, callback) {
			supressPrompt = true;
			var p = self.normalize(path);
			self.sh.rm(p, options, function (er) {
				msg = p+ " removed";
				if (er) msg = er.message;
				if (callback) {
					if (er) callback(er.message, null);
					else callback(null, true);
				}
				self.postback(msg);
			});
		},
		tempdir = function (callback) {
			supressPrompt = true;
			self.sh.tempDir(function (er, tmp) {
				if (er) var msg = er.message;
				else var msg = tmp;
				if (callback) {
					if (er) callback(er.message, null);
					else callback(null, tmp);
				}
				self.postback(msg);
			});
		},
		mkdirp = function (path, callback) {
			supressPrompt = true;
			var p = self.normalize(path);
			self.sh.mkdirp(p, function (er) {
				msg = p + " created";
				if (er) msg = er.message;
				if (callback) {
					if (er) callback(er.message, null);
				}
				self.postback(msg);
			});
		},

		install = function (info, callback) {
			supressPrompt = true;
			core.app.install(info, function (err, _nrInstalled, _nrErrors, _installedObject, onlyInstalled) {
				if (callback) callback(err, result);
				if (err) self.postback(err);
				else self.postback(_nrInstalled + " new apps installed.");
			});
		},

		//uninstall = function (info, callback) {
		//	supressPrompt = true;
		//	BVFS.uninstall(info, function (err, result) {
		//		if (callback) callback(err, result);
		//		if (err) self.postback(err);
		//		else self.postback(result + " apps uninstalled.");
		//	});
		//},

		format = function (driveName, callback) {
			supressPrompt = true;
			var msg = "Drive " + driveName + " formatted";
			BVFS.format(driveName, function (err, result) {
				if (err) {
					msg = err;
					if (callback) callback(err, result);
					self.postback(msg);
				}
				else {
					self.sh.cd("/", function (er) {
						if (callback) callback(err, result);
						self.postback(msg);
					});
				}	
			});
		},
		wget = function (url, path, callback) {
			supressPrompt = true;
			var p = self.normalize(path);
			var splitted = url.split("/");
			var fileName = splitted[splitted.length - 1];
			if (!fileName.startsWith("/")) fileName = "/" + fileName;
			self.sh.wget(url, p, function (err, result) {
				var msg = null;
				if (err) msg = err.statusText + ": Cannot get file.. statuscode: " + err.status;
				else msg = result;
				if (callback) callback(err, result);
				self.postback(msg);
			});
		},
		rename = function (oldPath, newPath, callback) {
			supressPrompt = true;
			var pOld = self.normalize(path);
			var pNew = self.normalize(path);
			self.sh.fs.rename(pOld, pNew, function (er) {
					var msg = pOld + " is renamed to " + pNew;
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					self.postback(msg);
				});
			},
		ftruncate = function (fd, len, callback) {
			supressPrompt = true;
				self.sh.fs.ftruncate(fd, len, function (er) {
					var msg = " truncate success.";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, len);
					}
					self.postback(msg + " length = " + len);
				});
		},
		truncate = function (path, len, callback) {
			supressPrompt = true;
			var p = self.normalize(path);
			self.sh.fs.truncate(p, len, function (er) {
				var msg = p+ " truncated successfull, ";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					if (er) self.postback(msg);
					else self.postback(msg + " length = " + len);
				});
			},
		stat = function (path, callback) {
			supressPrompt = true;
			var p = self.normalize(path);
			self.sh.fs.stat(p, function (er, stats) {
					var msg = "Stats from " +p;
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, stats);
					}
					if (er) self.postback(msg);
					else {
						promptOff()
						self.postback("---------------------------");
						self.postback("node: " + stats.node);
						self.postback("dev: " + stats.dev);
						self.postback("size: " + stats.size);
						self.postback("nlinks: " + stats.nlinks);
						self.postback("atime: " + self.timeConverter(stats.atime));
						self.postback("mtime: " + self.timeConverter(stats.mtime));
						self.postback("ctime: " + self.timeConverter(stats.ctime));
						self.postback("type: " + stats.type);
						promptOn();
					}
				});
			},
		fstat = function (fd, callback) {
			supressPrompt = true;
				self.sh.fs.fstat(fd, function (er, stats) {
					var msg = " fstats";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, stats);
					}
					self.postback(msg);
				});
			},
		lstat = function (path, callback) {
			var p = self.normalize(path);
			supressPrompt = true;
				self.sh.fs.lstat(p, function (er, stats) {
					var msg = " lstats";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, stats);
					}
					self.postback(msg);
				});
			},
		exists = function (path, callback) {
			supressPrompt = true;
			var p = self.normalize(path);
				self.sh.fs.exists(p, function (exists) {
					var msg = p+ " exists.";
					if (callback) callback(null, exists);

					if (!exists) msg = p + " does NOT exitst.";
					self.postback(msg);
				});
			},
		link = function (srcpath, dstpath, callback) {
			supressPrompt = true;
			var pSrc = self.normalize(srcpath);
			var pDst = self.normalize(dstpath);
				self.sh.fs.link(pSrc, pDst, function (er) {
					var msg = pSrc + " linked to " + pDst;
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					self.postback(msg);
				});
			},
		symlink = function (srcpath, dstpath, type, callback) {
			supressPrompt = true;
				self.sh.fs.link(srcpath, dstpath, type, function (er, data) {
					var msg = srcpath + " symlinked to " + dstpath;
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					self.postback(msg);
				});
			},
		readlink = function (path, callback) {
			supressPrompt = true;
				self.sh.fs.readlink(path, function (er, linkContents) {
					var msg = path + " linkcontent";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, linkContents);
					}
					self.postback(msg);
				});
			},
		unlink = function (path, callback) {
			supressPrompt = true;
				self.sh.fs.unlink(path, function (er) {
					var msg = path + "  unlinked";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					self.postback(msg);
				});
			},
		mknod = function (path, mode, callback) {
			supressPrompt = true;
				self.sh.fs.mknod(path, mode, function (er) {
					var msg = path + " lmknod success";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					self.postback(msg);
				});
			},
		rmdir = function (path, callback) {
			supressPrompt = true;
			var p = self.normalize(path);
				self.sh.fs.rmdir(p, function (er) {
					var msg = p + " removed";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					self.postback(msg);
				});
			},
		mkdir = function (path, mode, callback) {
			supressPrompt = true;
				var currentPath = self.sh.pwd();
				if (!path) var path = "";
				self.sh.fs.mkdir(currentPath + path, function (er) {
					var msg = "'" + path + "' is created";
					if (er) msg = path + " " + er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					self.postback(msg);
				});

			},
		readdir = function (path, callback) {
			supressPrompt = true;
			var currentPath = self.sh.pwd();
			if (!path) var path = "";
			self.sh.fs.readdir(currentPath + path, function (er, files) {
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, files);
					}
					console.log(files);
					promptOff();
					for (key in files) {
						self.postback(files[key]);
					}
					promptOn();

				});
			},
		close = function (fd, callback) {
			supressPrompt = true;
				self.sh.fs.close(fd, function (dummy) {
					var msg = " lfd closed";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					self.postback(msg);
				});
			},
		open = function (path, flags, mode, callback) {
			supressPrompt = true;
				self.sh.fs.open(path, flags, mode, function (er, fd) {
					var msg = path + " opened";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, fd);
					}
					self.postback(msg);
				});
			},
		utimes = function (path, atime, mtime, callback) {
			supressPrompt = true;
				self.sh.fs.utimes(path, atime, mtime, function (er) {
					var msg = atime + " changed to " + mtime;
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					self.postback(msg);
				});
			},
		futimes = function (fd, atime, mtime, callback) {
			supressPrompt = true;
				self.sh.fs.futimes(fd, atime, mtime, function (er) {
					var msg = atime + " changed to " + mtime;
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					self.postback(msg);
				});
			},
		write = function (fd, buffer, offset, length, position, callback) {
			supressPrompt = true;
				self.sh.fs.write(fd, buffer, offset, length, position, function (er, nbytes) {
					var msg = nbytes + " written.";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, nbytes);
					}
					self.postback(msg);
				});
			},
		read = function (fd, buffer, offset, length, position, callback) {
			supressPrompt = true;
				self.sh.fs.read(fd, buffer, offset, length, position, function (er, nbytes) {
					var msg = nbytes + " read.";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, nbytes);
					}
					self.postback(msg);
				});
			},
		readFile = function (filename, options, callback) {
			supressPrompt = true;
				self.sh.fs.readFile(self.sh.pwd() + filename, options, function (er, data) {
					var msg = filename + " read.";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, data);
					}
					else self.postback(data);
				});
			},
		writeFile = function (filename, data, options, callback) {
			supressPrompt = true;
				self.sh.fs.writeFile(filename, data, options, function (er) {
					var msg = "written to " + filename;
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					self.postback(msg);
				});
			},
		appendFile = function (filename, data, options, callback) {
			supressPrompt = true;
				self.sh.fs.writeFile(filename, data, options, function (er) {
					var msg = filename + " apended.";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					self.postback(msg);
				});
			},
		setxattr = function (path, name, value, flag, callback) {
			supressPrompt = true;
				self.sh.fs.setxattr(path, name, value, flag, function (er) {
					var msg = " xattribute set";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					self.postback(msg);
				});
			},
		fsetxattr = function (fd, name, value, flag, callback) {
			supressPrompt = true;
				self.sh.fs.fsetxattr(fd, name, value, flag, function (er) {
					var msg = " xattribute set";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					self.postback(msg);
				});
			},
		getxattr = function (path, name, callback) {
			supressPrompt = true;
				self.sh.fs.getxattr(path, name, function (er, value) {
					var msg = name + " = " + value;
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, value);
					}
					self.postback(msg);
				});
			},
		fgetxattr = function (fd, name, callback) {
			supressPrompt = true;
				self.sh.fs.getxattr(fd, name, function (er, value) {
					var msg = name + " = " + value;
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, value);
					}
					self.postback(msg);
				});
			},
		removexattr = function (path, name, callback) {
			supressPrompt = true;
				self.sh.fs.removexattr(path, name, function (er) {
					var msg = name + " removed.";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					self.postback(msg);
				});
			},
		fremovexattr = function (fd, name, callback) {
			supressPrompt = true;
				self.sh.fs.fremovexattr(fd, name, function (er) {
					var msg = name + " removed.";
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null);
						else callback(null, true);
					}
					self.postback(msg);
				});
			},
		watch = function (filename, options, listener) {
			supressPrompt = true;
				self.sh.fs.watch(filename, options, listener, function (event, filename) {
					var msg = "Watching " + filename;
					if (er) msg = er.message;
					if (callback) {
						if (er) callback(er.message, null, null);
						else callback(null, event, filename);
					}
					self.postback(msg);
				});
			}

		try {
			if (tmpFunc) {
				tmpFunc();
				if (supressPrompt == false) {
					self.addPrompt();
					supressPrompt = true;
				}
			}
		}
		catch (e) {
			self.postback(e.message);
			promptOn(true);
		}
	},
	echoText : function (text) {
		var div = $("<div>");
		div.css('color', "#C0C0C0");
		div.text(text);
		this.terminal.append(div);
		this.crop();
	},

	contentLoaded: function (data) {
		this.terminal.height(data.size.innerHeight);
		this.element.append(this.terminal);
		this.addPrompt();
	},

	_create: function () {
		this.terminal = $('<div>');
		this.sh = new BVFS.fs.Shell();
		this.element.css("overflow", "hidden");
		this.terminal.empty();
		this.terminal.css("font-size", this.options.fontSize);
		this.terminal.css("border-radius", 5);
		this.terminal.css("color", "yellow");
		this.terminal.css("padding", "10Px");
		this.terminal.css("display",this.options.display);
		this.terminal.css("overflow-y", "auto");
		this.terminal.css("overflow-x", "break-word");
		this.terminal.css("background-color", "black");
		this.echoText("Browser Virtual File System. v 1.0.0");
		this.echoText("Type: help(); for instructions.");
		return this._super();
	},

	_trigger: function (type, ev, data) {
		if (type == 'open') {}
		if (type == 'close') this._destroy();
		if (type == 'resize') {
			this.terminal.height(data.size.innerHeight);
		}
		if (type == 'focus') {
			if (this.currentPrompt) this.currentPrompt.focus();
		}
		if (type == 'contentLoaded') {
			this.contentLoaded(data);
		}
		return this._super(type, ev, data);
	},

	_destroy: function () {
		//this = null;
		return this._super();
	}
	
	
});




