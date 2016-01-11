$.widget("winnies.pluginSuperwidget", {
	options: {},
	vars: {},

	_init: function () {
		var self = this;
		this.htmlTemplateExists(function (path, exists) {
			if (exists) {
				BVFS.fs.readFile(path, 'utf8', function (err, html) {
					if (err) return console.error("Error fetching " + path);
					self.element.append(html);
					self._contentLoaded();
				});
			}
		});
		this._super();
	},

	_create: function () {
		return this._super();
	},

	_setOption: function (key, value) {
		return this._super(key, value);
	},

	_setOptions: function (options) {
		return this._super(options);
	},

	_destroy: function () {
		return this._super();
	},

	htmlTemplateExists: function (callback) {
		var path = BVFS.sh.env.get('PLU') + this.widgetName + '/template.html';
		BVFS.fs.exists(path, function (exists) {
			callback(path, exists);
		});
	},

	_trigger: function (type, ev, data) {
		return this._super(type, ev, data);
	}
});