$.widget("plugins.dynamictabs", $.winnies.pluginSuperwidget,  {  // extend jquery tabs
	doLog: true,
	version: "1.0.0",
	tabCollection: {},
	headerHolder : null,

	create_newtab: function (tabData) {
		var guid = core.util.guid();
		tabData.guid = guid
		tabData.open = false;

		this.tabCollection[guid] = tabData;
		return (guid);
	},

	open_tab: function (guid) {
		if (!this.tabCollection[guid]) return;			// not created
		if (this.tabCollection[guid].open  == true ) {	// allready open
			this.select_tab(guid);						// select this tab
			return;	
		}
		this.tabCollection[guid].open = true;
		var tabData = this.tabCollection[guid];
		this.create_header(tabData);
		this.create_tab(tabData);
		this.element.tabs("refresh");
		this.element.tabs("option", "active", -1);
	},

	refresh: function () {
		this.element.tabs("refresh");
	},

	get_selected: function () {
		var index = this.element.tabs("option", "active");
		var activeTab = this.element.find("ul > li").eq(index);
		var guid = null;
		if (activeTab.attr("aria-controls")) {
			guid = activeTab.attr("aria-controls").replace("tab-", "");
		}
		return (guid);
	},

	select_tab: function (guid) {
		var index = this.element.find("div").index($('#tab-' + guid));
		if (index < 0) return;
		this.element.tabs("option", "active", index);
		this.element.tabs("refresh");
	},

	close_tab: function (guid) {
		var index = this.element.find("div").index($('#tab-' + guid));
		this.element.find("ul > li").eq(index).remove();
		$("#tab-" + guid).remove();		
		this.tabCollection[guid] = null;
		delete (this.tabCollection[guid]);
		this.element.tabs("refresh");
		this._trigger("tabclosed", null, guid);
	},

	get_tabData: function (guid) {
		return this.tabCollection[guid];
	},

	set_state: function (guid, savedState) { // set asterix *
		this.tabCollection[guid].savedState = savedState;
		var link = this.headerHolder.find("[href='#tab-" + guid + "']");
		if (savedState) link.text(this.tabCollection[guid].title);
		else link.text(this.tabCollection[guid].title +"*");	
	},

	create_header: function (tabData) {
		var tabHeader = $("<li>");
		var link = $("<a>");
		link.attr({ href: "#tab-" + tabData.guid });
		var title = tabData.title;
		if (tabData.savedState === false) title =   tabData.title + "*";
		link.text(tabData.title);
		tabHeader.append(link);
		var closeButton = $("<span class='ui-icon ui-icon-close' role='presentation'>Remove Tab</span>");
		tabHeader.append(closeButton);
		this.headerHolder.append(tabHeader);
	},

	create_tab: function (tabData) {
		var tabDiv = $("<div>");
		tabDiv.attr({ id: "tab-" + tabData.guid });
		tabDiv.addClass("._winnies_appstudio_editor");
		tabDiv.text(tabData.content);
		this.element.append(tabDiv);
	},

	_create: function () {
		var self = this;
		this.headerHolder = $("<ul>");
		this.element.append(this.headerHolder);
		this.element.tabs({
			activate: function (event, ui) {
				self._trigger("activate", null, null);
			}
		});

		this.element.delegate("span.ui-icon-close", "click", function (ev, ui) {
			var guid = $(this).closest("li").attr("aria-controls");
			self._trigger("beforetabclose", ev, guid.replace("tab-", ""));
		});
		this._super();
	},

	_trigger: function (type, ev, data) {
		this._super(type, ev, data);
	},

	_destroy: function () {
		tabCollection = null,
		headerHolder = null,
		this._super();
	},

	logging: function (msg) { if (this.doLog) console.log(this.widgetName + " :: " + msg); }

});