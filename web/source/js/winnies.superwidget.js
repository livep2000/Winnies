/* custom.widgetdialog
 * 
 * Supper widget for creating desktop widgets.
 */

$.widget("winnies.widgetSuperwidget", {
	options: {
		draggable: true,
		dim: {
			width: 100,
			height: 100,
			left: 100,
			top: 100
		}
	},

	vars: {},

	_init: function () {
		this._super();
	},

	_create: function () {
		var regKey = 'winnies.widgetdimensions.' + this.widgetName;
		if (core.register.exists(regKey)) {
			this.options.dim = core.register.get(regKey);
		}
		var dim = this.options.dim;
		if (this.options.draggable == true) this.makeDraggable();

		this.element.height(dim.height);
		this.element.width(dim.width);

		this.element.css("position", "absolute");
		this.element.css("display", "block");

		this.element.position({
			of: $("body"),
			my: "left top",
			at: "left+"+ dim.left +" top+" + dim.top
		});
		this.element.addClass("ui-dialog-content");
		this.element.addClass("ui-widget-content");
		this.element.addClass("ui-corner-all");
		this._super();
	},

	_setOption: function (key, value) {
		this._super(key, value);
	},

	_setOptions: function (options) {
		this._super(options);
	},

	_destroy: function () {
		this.logging("destroy");
		this._super();
	},

	_trigger: function (type, ev, data) {
		this._super();
		if (type == "dragStart") {
			
		}
		if (type == "dragStop") {
			this.saveDim();
		}
		if (type == "drag") {
			
		}
		if (type == "resizeStop") {
		
		}
		if (type == 'dragStop' || type == 'resizeStop') {
			
		}
	},

	logging: function (msg) {
		if (this.vars.doLog) console.log("winnies.superwidget :: " + msg);
	},

	saveDim: function () {
		core.register.set("winnies.widgetdimensions." + this.widgetName, this.options.dim);
	},
	// with thanks: ui-dialog
	makeDraggable: function () {
		var that = this, options = this.options;
		function filteredUi(ui) {
			return {
				position: ui.position,
				offset: ui.offset,
			};
		}
		this.element.draggable({
			containment : "document",
			start: function (event, ui) {
				that._blockFrames();
				that._trigger("dragStart", event, filteredUi(ui));
			},
			drag: function (event, ui) {
				that._trigger("drag", event, filteredUi(ui));
			},
			stop: function (event, ui) {
				var pos = filteredUi(ui);
				options.dim.left = pos.position.left;
				options.dim.top = pos.position.top;
				that._unblockFrames();
				that._trigger("dragStop", event, pos);
			}
		});
	},

	_blockFrames: function () {
		this.iframeBlocks = this.document.find("iframe").map(function () {
			var iframe = $(this);

			return $("<div>")
				.css({
					position: "absolute",
					width: iframe.outerWidth(),
					height: iframe.outerHeight()
				})
				.appendTo(iframe.parent())
				.offset(iframe.offset())[0];
		});
	},

	_unblockFrames: function () {
		if (this.iframeBlocks) {
			this.iframeBlocks.remove();
			delete this.iframeBlocks;
		}
	}

});