// current test: core.util.crossIndex
$.widget("apps.tester", $.winnies.appDialog, {
	version: "1.0.0",
	doLog: true,
	container: null,
	find: null,
	by: null,
	output: null,
	crossIndex: null,
	cnt: 0,

	_init: function () {
		this._super();
	},

	_create: function () {
		var indexes = {
			'indexes': {
				'id': '',
				'path': '',
				'tester': 0,
			}
		};
		this.crossIndex = new core.util.crossIndex( indexes );

		return this._super();
	},

	contentLoaded: function (data) {
		var self = this;

		this.find = this.fec("find");
		this.by = this.fec("by");
		this.output = this.fec("output");

		this.fec("wipebutton").button().click(function (ev, ui) {
			core.system.wipe();
		});

		this.fec("removebutton").button().click(function (ev, ui) {
			self.crossIndex.remove(self.find.val(), self.by.val(), function (err, result) {
				if (err) console.debug(err);
				else { console.debug("removed")}
			});;
		});

		this.fec("findbutton").button().click(function (ev, ui) {
			self.crossIndex.find(self.find.val(), self.by.val(), function (err, Obj) {
				self.output.empty();
				if (err) self.output.text(err);
				else {
					oldConsole.debug("result in app:");
					oldConsole.debug(Obj);

					$.each(Obj.data, function (key, val) {
						self.output.append(key + " : " + val + "<br/>");
					});
				}
			});
		});

		this.fec("addbutton").button().click(function (ev, ui) {
			self.addToCrossindex()
		});


		this.fec("updatetextbutton").button().click(function (ev, ui) {
			self.crossIndex.update(self.find.val(), self.by.val(), { 'data': { 'text': 'Changed text!' } }, function (err, Obj) {
				if (err) self.output.text(err);
				else {
					console.log("text is updated");
				}
			});
		});

		this.fec("updatenewbutton").button().click(function (ev, ui) {
			self.crossIndex.update(self.find.val(), self.by.val(), {'data':{ 'foo': 'foo add' }}, function (err, Obj) {
				if (err) self.output.text(err);
				else {
					console.log("foo is added");
				}
			});
		});

		this.fec("updateindexbutton").button().click(function (ev, ui) {
			self.crossIndex.update(self.find.val(), self.by.val(),{'indexes': { 'id': 'myid-25', 'tester':50} }, function (err, Obj) {
				if (err) self.output.text(err);
				else {
					console.log("id is updated to: myid-25");
					oldConsole.debug(Obj);
				}
			});
		});

		this.fec("updatewrongindexbutton").button().click(function (ev, ui) {
			self.crossIndex.update(self.find.val(), self.by.val(),{'indexes': { 'wrong': 'myid-25'} }, function (err, Obj) {
				if (err) self.output.text(err);
				else {
					console.log("must be in error");
				}
			});
		});

		this.fec("clearbutton").button().click(function (ev, ui) {
			self.crossIndex.clear();
		});

		this.fec("destroybutton").button().click(function (ev, ui) {
			self.crossIndex.destroy();
		});
	},


// random adding test
	addToCrossindex: function () {
		var Obj = this.crossIndex.baseObject();
		Obj.indexes.id = "myid-" + this.cnt;
		Obj.indexes.path = "myPath-" + this.cnt;
		Obj.indexes.tester = this.cnt;
		Obj.data.text = "some text, not unique- " + this.cnt;
		Obj.data.something = "just something new " + this.cnt;
		this.cnt += 1;
		this.crossIndex.add(Obj);
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
	logging: function (msg) {
		if (this.doLog) console.log(this.widgetName + " :: " + msg);
	},

	fec: function (subClassName) {
		return this.element.find("._winnies_" + this.widgetName + "_" + subClassName);
	},

	_trigger: function (type, ev, data) {
		if (type == 'close') this._destroy();
		if (type == 'contentLoaded') {
			this.contentLoaded(data);
		}
		if (type == 'resize') {
		
		}
		this._super(type, ev, data);
	}

});