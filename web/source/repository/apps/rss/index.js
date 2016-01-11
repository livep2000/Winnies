$.widget("apps.rss", $.winnies.appDialog, {
	version: "1.0.0",
	doLog: true,
	MaxCount: 50,
	ShowDesc: true,
	ShowPubDate: true,
	DescCharacterLimit: 0,
	TitleLinkTarget: "_blank",
	DateFormat: "",
	DateFormatLang: "en",
	refreshTime: 60,
	timer:null,

	_init: function () {
		this._super();
	},
	_create: function () {
		this._super();
	},

	contentReady: function() {
		var self = this;
		//todo: save favorites list && current url in register
		var rssUrls = [
			"http://feeds.livep2000.nl",
			"http://feeds.reuters.com/reuters/scienceNews",
			"http://feeds.reuters.com/reuters/technologyNews",
			"http://feeds.reuters.com/Reuters/worldNews",
			"http://www.drdobbs.com/rss/all"
		];

		this.element.find("._winnies_rss_urls").autocomplete({
			source: rssUrls,
			position: { my: "right top", at: "right bottom" },
			select: function (event, ui) {
				self.refresh(ui.item.value, self.element.find("._winnies_rss_container"), self.refreshTime);
			}
		}).val(rssUrls[4]);
		this.refresh(rssUrls[4], this.element.find("._winnies_rss_container"), this.refreshTime);
	},

	refresh: function (url, container, refreshTime) {
		var self = this;
		clearInterval(this.timer);
		this.getFeed(url, function (err, data) {
			if (err) return console.error(err.statusText);
			self.processFeed(data, container, function (err, result) {
				self.timer = setInterval(function () {
					self.refresh(url, container, refreshTime)
				}, refreshTime * 1000);
			});
		});
	},

	processFeed: function(data, container, callback) {
		var i, s = "", dt, self = this;
		container.empty();
		if (!(data.query.results.rss instanceof Array)) data.query.results.rss = [data.query.results.rss];
		$.each(data.query.results.rss, function (e, itm) {
			s += '<li><div class="itemTitle"><a href="' + itm.channel.item.link + '" target="' + this.TitleLinkTarget + '" >' + itm.channel.item.title + '</a></div>';
			if (self.ShowPubDate) {
				dt = new Date(itm.channel.item.pubDate);
				s += '<div class="itemDate">';
				if ($.trim(this.DateFormat).length > 0) {
					try {
						moment.lang(self.DateFormatLang);
						s += moment(dt).format(self.DateFormat);
					}
					catch (e) { s += dt.toLocaleDateString(); }
				}
				else s += dt.toLocaleDateString();
				s += '</div>';
			}
			if (self.ShowDesc) {
				s += '<div class="itemContent">';
				if (self.DescCharacterLimit > 0 && itm.channel.item.description.length > self.DescCharacterLimit) s += itm.channel.item.description.substring(0, self.DescCharacterLimit) + '...';
				else s += itm.channel.item.description;
				s += '</div>';
			}
		});
		container.append('<ul class="feedEkList">' + s + '</ul>');
		callback(null, true);
	},

	getFeed: function (url, callback) {
		var YQLstr = 'SELECT channel.item FROM feednormalizer WHERE output="rss_2.0" AND url ="' + url + '" LIMIT ' + this.MaxCount;
		$.ajax({url: "https://query.yahooapis.com/v1/public/yql?q=" + encodeURIComponent(YQLstr) + "&format=json&diagnostics=false&callback=?",
			dataType: "json",
		}).	done( function (data) {
			callback(null, data);
		}).fail(function (err) {
			callback(err, null);
		});
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

	_trigger: function (type, ev, data) {
		if (type == 'close') this._destroy();
		if (type == 'open') {
			this.contentReady();
		}
		this._super(type, ev, data);
	},

	logging: function (msg) {
		if (this.doLog) console.log("RSS :: " + msg);
	}

});
