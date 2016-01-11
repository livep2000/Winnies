$.widget("widgets._widget_template", $.winnies.widgetSuperwidget, {
	    version: "1.0.0",
	    options:
            {},

	    _create: function () {
	
	    	this.element.addClass("nonselectable");
	    	this.element.find("div._winnies_clock").clock({ "langSet": "nl" });
	    	this.element.appendTo('body');
	    	this._super();
	    },

	    _trigger: function (type, ev, data) {
	    	this._super(type, ev, data);
	    }
	});






