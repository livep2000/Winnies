$.widget("apps.settings", $.winnies.appDialog, {
	version: "1.0.0",
	doLog: true,
	tabs: null,
	appTabLayout: null,
	apptypeselector: null,
	wallpaperselector: null,
	buttonset : null,
	themeselector: null,
	repositoryList: null,
	itemList: null,
	classLabel: null,
	containerDiv: null,
	contentReady: function (data) {
		var self = this;
		this.element.css("overflow", "hidden");

		$(core.app).on("installed", function (event, installedObjects) {
			$.each(installedObjects.onlyInstalled, function (cat, Obj) {
				console.debug(cat);
				if (cat == "wallpapers" || cat == "themes") {
					self.update_theme_tab();
				}
			});
			self.update_applications_tab();
		});
		$(core.app).on("uninstalled", function (event, installedObjects) {
			self.update_applications_tab();
		});

		this.buttonset = this.fec("installtype").buttonset();
		this.fec("wipebutton").button().bind("click", function () {
			core.system.wipe();
		});

		$("#_winnies_settings_installed").bind("click", function () {
			self.update_applications_tab();
		});
		$("#_winnies_settings_repository").bind("click", function () {
			self.update_applications_tab();
		});

		this.apptypeselector = this.fec("apptypes").selectmenu({
			select: function (event, ui)  {
				self.update_applications_tab();
			}
		});

		this.tabs = this.fec("tabs").tabs({
			activate: function (event, ui) {
				if (ui.newTab.index() == 3) {
					$("#_winnies_applications").height(self.tabs.height() - 55);
					self.appTabLayout.resizeAll();
				}
			}
		});


		this.classLabel = this.uiDialog.attr('aria-labelledby');
		this.containerDiv = $("#_winnies_settings_applications");
		this.appTabLayout = this.containerDiv.layout({
			initClosed: false,
			applyDefaultStyles: true,
			paneClass: self.classLabel + "-pane"
		});


		this.containerDiv.height(this.tabs.height() - 55)

		this.appTabLayout.options.north.minSize = 45;
		this.appTabLayout.options.north.resizable = false;
		this.appTabLayout.options.north.closable = false;
		this.appTabLayout.resizeAll();
		this.appTabLayout.open("north");



		this.themeselector = this.fec("themes");
		this.themeselector.selectmenu({
			select: function (event, ui) {
				var styleName = $(this).val();
				core.util.setStyle(styleName);
				core.register.setSetting('desktop', 'theme', styleName);
			}
		}).selectmenu("menuWidget").addClass('themarolleroverflow');

		this.wallpaperselector = this.fec("wallpapers");
		this.wallpaperselector.selectmenu({
			select: function (event, ui) {
				var wallpaperName = $(this).val();
				core.util.setBackground( wallpaperName );
				core.register.setSetting('desktop', 'wallpaper', wallpaperName);
			}
		}).selectmenu("menuWidget").addClass('themarolleroverflow');
		
		this.itemList = this.fec("itemlist");
		this.itemList.selectable({
			unselected: function () {
				$(":not(.ui-selected)", this).each(function () {
					$(this).removeClass('ui-state-highlight');
				});
			},

			stop: function(){
				self.fec("details").empty();
				$(".ui-selected", this).each(function () {
					$(this).addClass('ui-state-highlight');
					var appName = $(this).attr("appName");
					var category = $(this).attr("category");
					var listType = self.buttonset.find("[name=installtype]:checked").val();
					if (category && appName) {
						var anAppObject = {};
						if (listType == "repository") anAppObject = self.repositoryList[category][appName];
						else anAppObject = BVFS.installedObject[category][appName];
						self.update_detail_pane(anAppObject, appName, listType);
					}
				});

			}
		}).find("li").hover(
			function () {
  				$(this).addClass('ui-state-hover');
			},
			function () {
  				$(this).removeClass('ui-state-hover');
			});

		this.update_theme_tab();
		this.update_applications_tab();
	},

	update_theme_tab: function() {

		var options = [];
		this.themeselector.empty();
		$.each(BVFS.installedObject.themes, function (key, value) {
			options.push("<option value='" + key+ "'>" + value.title + "</option>");
		});
		this.themeselector.append(options.join("")).selectmenu();
		this.themeselector.val(core.register.getSetting('desktop', 'theme')).selectmenu('refresh');

		var options = [];
		this.wallpaperselector.empty();
		$.each(BVFS.installedObject.wallpapers, function (key, value) {
			options.push("<option value='" + key + "'>" + value.title + "</option>")
		});
		this.wallpaperselector.append(options.join("")).selectmenu();
		this.wallpaperselector.val(core.register.getSetting('desktop', 'wallpaper')).selectmenu('refresh');

	},

	update_applications_tab: function () {
		var self = this;
		this.fec("details").empty();
		this.itemList.empty();
		if (this.buttonset.find("[name=installtype]:checked").val() == "repository") {
			var url = BVFS.host.origin + "/repository/boot/repositorycontent.json";
			BVFS.wread(url, function (err, txt) {
				self.repositoryList = self.filterInstalledOutRepository(JSON.parse(txt).items);
				self.showListInPane(self.repositoryList);
			});
		}
		else this.showListInPane(BVFS.installedObject);
	},

	showListInPane:function(ObjectList) {
		var self = this;
		var filteredList = this.filterAppsBy(ObjectList, this.apptypeselector.val());
		$.each(filteredList, function (category, categoryObject) {
			$.each(categoryObject, function (appName, appObject) {
				var someItem = self.createAppItem(appName, category, appObject);
				self.itemList.append(someItem);
			});
		});
	},

	update_detail_pane: function (appObj, appName, listType) {
		var detailPane = this.fec("details");
		
		var roles = core.register.getSetting("winnies", "roles");
		var labelText = "Uninstall";
		if (listType == "repository") { labelText = "Install"; }
	
		var butt = $("<button>");

		butt.button({
			label: labelText,
			
		}).click( function (ev, ui) {
			if (listType == "repository") {
				core.app.install(appName);
			}
			else {
				core.app.uninstall(appName);
			}
		});

		butt.css("width", "100%");
		detailPane.append(butt);
		detailPane.append("<br/><br/>");

		var item = $('<div>');
		var name = $("<span style='font-weight:bold;' />");
		name.text( "appName: ");
		item.append(name);
		var content = $("<span />");
		content.text(appName);
		item.append(content);
		detailPane.append(item);

		$.each(appObj, function (key, value) {
			if (key !== 'dim' && key !== 'files') {
				var item = $('<div>');
				var name = $("<span style='font-weight:bold;' />");
				name.text(key + ": ");
				item.append(name);

				if (typeof value == 'object') {
					if (key == 'author') {
						$.each(value, function (subKey, subValue) {
							var content = $("<span />");
							content.text(">>>> " + subKey + ": " + subValue);
							item.append($("<br>"));
							item.append(content);
							detailPane.append(item);
						});
					}
				}
				else {
					var content = $("<span />");
					if (key == 'minimumRole') content.text(roles[value]);
					else content.text(value);
					item.append(content);
					detailPane.append(item);
				}
			}
		})
		detailPane.append("<br/>");
	},

	createAppItem: function (appName, category, appObject) {
		var appItem = $("<div>");
		appItem.attr({ "appName": appName, "category": category });
		appItem.addClass("ui-state-default");
		var iconHolder = $("<span>");
		iconHolder.addClass("ui-icon");
		iconHolder.addClass(appObject.icon);
		iconHolder.css('display', 'inline-block');
		var txtHolder = $("<span>");
		txtHolder.css('display', 'inline-block');
		txtHolder.text(appObject.title);
		appItem.append(iconHolder);
		appItem.append(txtHolder);
		return appItem;
	},

	filterInstalledOutRepository: function(repoObjectList) {
		$.each(repoObjectList, function (category, categoryObject) {
			$.each(categoryObject, function (appName, appObject) {
				if (BVFS.installedObject[category]) {
					if (BVFS.installedObject[category][appName]) {
						repoObjectList[category][appName] = null;
						delete (repoObjectList[category][appName]);
					}
				}
			});
		});
		return repoObjectList;
	},

	filterAppsBy: function (appObjectList, filterBy) {
		if (filterBy === "all") return (appObjectList);
		var filteredList = {}
		$.each(appObjectList, function (key, appObject) {
			if (key == filterBy) { filteredList[key] = appObject; }
		});
		return filteredList;
	},

	_init: function () {
		this._super();
	},
	_create: function () {
		this._super();
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
	// fec: short for: find elementByClass
	// use _winnies_appname_subclassName 
	fec: function (subClassName) {
		return this.element.find("._winnies_" + this.widgetName + "_" + subClassName);
	},
	resize: function (data) {
		this.tabs.width(data.size.innerWidth +5);
		this.tabs.height(data.size.innerHeight + 5);
		this.containerDiv.height(this.tabs.height() - 55);
		this.appTabLayout.resizeAll();
	},
	_trigger: function (type, ev, data) {
		if (type == 'close') this._destroy();
		if (type == 'contentLoaded') {
			this.contentReady(data);
			this.resize(data);
		}
		if (type == "resizeStop") {
		
		}
		if (type ==  'resize') {
			this.resize(data);
		}
		this._super(type, ev, data);
	},
});