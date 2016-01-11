
var hoverTimer = null;

$.widget("widgets._startmenu", $.winnies.widgetSuperwidget, {
	version	: "1.0.0",                                  
	doLog: true,
	accMenu : null,
	menuHandle : null,
	cattItems: null,
	tempTopOffset: 0,

	_init: function () {
		this._super();
	},

	_create: function () {
		var self = this;
		this.element.addClass('ontop');

		$(core.app).on("installed", function (event, installedObjects) {
			if (installedObjects.onlyInstalled.apps) {
				$.each(installedObjects.onlyInstalled.apps, function (appName, obj) {
					var appItem = BVFS.installedObject.apps[appName];
					self.addMenuItem(appItem, appName, function (er, res) {
						self.logging("Create a startmenu button for: " + appName);
					});
				})	
			}
		});

		$(core.app).on("uninstalled", function (event, uninstalledObjects) {
			if (uninstalledObjects.onlyUninstalled.apps) {
				$.each(uninstalledObjects.onlyUninstalled.apps, function (appName, obj) {
					self.removeMenuItem( appName, function (er, res) {
						self.logging("Removed a startmenu button for: " + appName);
					});
				})
			}
		});

		var menuhandler = this.element.find("._winnies_startmenuhandler");
		menuhandler.addClass('ui-dialog-title');
		menuhandler.mouseenter(this.handlerIn);

		this.cattItems = {};
		this.accMenu = this.element.find("._startmenu_startmenu_accordion");
		this.accMenu.accordion({
			collapsible: true,
			heightStyle: "content"
		});

		this.accMenu.mouseleave(this.handlerOut);
		this.accMenu.mouseenter(this.handlerIn);

		var installedApps = BVFS.installedObject.apps;

		var ROL = BVFS.authentication.user.ROL;

		for (appName in installedApps) {
			var appItem = installedApps[appName];
			if (!appItem.minimumRole) appItem.minimumRole = 0;
			if (appItem.minimumRole <= ROL) {
				this.addMenuItem(appItem, appName);
			}
		}

		this.element.appendTo('body');
		// tessie :
		//this.removeMenuItem('report');
		
		this._super();
	},
		// todo: listen to uninstalled event
		removeMenuItem: function (appName) {
			var installedApps = BVFS.installedObject.apps;
			var appItem = installedApps[appName];
			var catName = appItem.category;
			if (this.cattItems[catName]) {
				if (this.cattItems[catName].buttons[appName]) {
					this.cattItems[catName].buttons[appName].remove();
					this.cattItems[catName].buttons[appName] = null;
					delete (this.cattItems[catName].buttons[appName]);
					if (Object.keys(this.cattItems[catName].buttons).length == 0) { // nothing left, remove cat also
						$("div[name='"+ catName +"']").remove();
						$("h3[name='" + catName + "']").remove();
						this.cattItems[catName] = null;
						delete (this.cattItems[catName]);
					}
					this.accMenu.accordion("refresh");
				}
			} // else  do nothing
		},
	
		// todo: listen to installed event
		addMenuItem: function(appItem, appName) {
			var catName = appItem.category;
			if (!catName ) catName = "Overig";
	
			if (!this.cattItems[catName]) {
				this.cattItems[catName] = {};
				this.cattItems[catName].buttons = {};
				var appButton = this.createButton(appItem, appName);
	
				this.cattItems[catName].buttons[appName] = appButton;
	
				var catId = this.createCategory(catName, appButton);
	
				this.cattItems[catName].catId = catId;
				this.cattItems[catName].headerId = catId;
			}
			else {
				var catId = this.cattItems[catName].catId;
				var catitemContainer = this.element.find("#" + catId);
				var appButton = this.createButton(appItem, appName);
				this.cattItems[catName].buttons[appName] = {};
				this.cattItems[catName].buttons[appName] = appButton;
				var inserted = false;
				var list = catitemContainer.find('button[name]');
	
			
				$.each(list, function (a, b) {
					var name = $(b).attr('name');
					if (inserted == false) {
						if (name.toLowerCase() > appName.toLowerCase()) {
							appButton.insertBefore($(b));
							inserted = true;
						}
					}
				});
		
				if (inserted == false) catitemContainer.append(appButton);
				this.accMenu.accordion("refresh");
			}
		},
	
		handlerIn: function (ev, ui) {
			clearTimeout(hoverTimer);
			$("._startmenu_startmenu_accordion").fadeIn(500);
		},
	
		handlerOut: function (ev, ui) {
			hoverTimer = setTimeout(function () {
				$("._startmenu_startmenu_accordion").fadeOut(1000);
			}, 3000);
		},
	
		createButton: function (app, myAppName) {
			var newButton = $('<button>');
			newButton.width(180);
			newButton.attr('name', myAppName);
			newButton.button({
				icons: {
					primary: app.icon
				},
				label: app.title,
			}).click(function () {
				core.app.launch($(this)[0].name, function (err, result) {
				});
			});
			return (newButton);
		},
	
		createCategory: function (category, content) {
			var catItem = $('');
			var catItemHeader = $('<h3>');
			catItemHeader.text(category);
			catItemHeader.attr("name", category);
			var catitemContainer = $('<div>');
			catitemContainer.append(content);
			var inserted = false;
			var list = this.accMenu.find('h3[name]');
			
				$.each(list, function (a, b) { // insert ordered
					var name = $(b).attr('name'); // the container hase the name, not the header!!
					if (name.toLowerCase() > category.toLowerCase()) {
						if (inserted == false) {
							catitemContainer.insertBefore($(b));
							catItemHeader.insertBefore(catitemContainer);
							inserted = true;
						}
					}
				});
			
			
	
			if (inserted == false) {
				this.accMenu.append(catItemHeader);
				catitemContainer.insertAfter(catItemHeader);
			}
			this.accMenu.accordion("refresh");
			return (catitemContainer.attr('id'));
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
			if (this.doLog) console.log("_startmenu :: " + msg);
		},
		_trigger: function (type, ev, data) {
			if (type == 'close') this._destroy();
			this._super(type, ev, data);
		}


});






