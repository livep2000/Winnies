/* Experiment ! Load file in a chunked way and feed that to the video player
 * if the file is large, loading at once will spill up js memory 
 */
// view-source:http://html5-demos.appspot.com/static/media-source.html
// todo: manage readahead
$.widget("apps.player", $.winnies.appDialog, {
	version: "1.0.0",
	doLog: true,
	ms:null,
	maxChunkSize: 1024 * 10,	// bytes
	readAhead: 4,		// nr chunks
	available : false,
	//classPrefix: "_winnies_player_",
	
	_create: function () {
		var self = this;
		this._super();

		//window.MediaSource = window.MediaSource ; //|| window.WebKitMediaSource;
		//if (!window.MediaSource) alert('MediaSource API is not available');

		//this.player = document.getElementById("_winnies_player_video");
		
		//this.fic("playbutton").button().click(function () {
		//	self.ms = new MediaSource();
		//	self.player.src = window.URL.createObjectURL(self.ms);
		//	self.ms.addEventListener('sourceopen', function () {
		//		console.debug("source");
		//		self.play("/winnies/apps/player/examples/small.webm", function (err, readySig) {
		//			if (err) console.error(err);
		//			console.debug(readySig);
		//		});
		//	}, false);
		//});
	},

	play: function (file, callback) {
		var self = this;
		var maxChunkSize = self.maxChunkSize;
		var sourceBuffer = this.ms.addSourceBuffer('video/webm; codecs="vorbis"');

		this.openFd(file, function (err, fd, size) {
			console.debug("Play size " + size);
			getByteChunk(fd, 0, size); // get first chunk from file
		});

		function getByteChunk(fd, chunkNr, size) {
			var readLen = maxChunkSize; // a full buffer
			if ( ((chunkNr +1) * maxChunkSize) > size) {
				var readLen = size - (chunkNr * maxChunkSize); // limit to what is left
			}

			var bufferPart = new BVFS.buffer(readLen);
			var fromPos = (chunkNr * maxChunkSize);
			var toPos = (chunkNr * maxChunkSize) + readLen;

			BVFS.fs.read(fd, bufferPart, 0, size, fromPos, function (err, nbytes) {
				sourceBuffer.appendBuffer(bufferPart);
				chunkNr = chunkNr + 1;

				if (chunkNr == 1) self.player.play();

				if ((chunkNr * maxChunkSize) < size) {
					getByteChunk(fd, chunkNr, size); // next chunk
				}
				else {
					BVFS.fs.close(fd);
					callback(null, "ready");
				}
			});
		};
	},

	openFd: function (path, callback) {
		BVFS.fs.open(path, 'r', function (err, fd) {		// open file descriptor
			if (err) return callback(err, null);
			BVFS.fs.fstat(fd, function (err, stats) {		// also get stats of file
				if (err) return callback(err, null);
				callback(null, fd, stats.size);
			});
		});
	},


	// :) from ui examples
	createToolbar: function() {
		var self = this;
		$("#play").button({
			text: false,
			icons: {
				primary: "ui-icon-play"
			}
		}).click(function () {

			console.debug("CLICK");
			var options;
			if ($(this).text() === "play") {
				
				options = {
					label: "pause",
					icons: {
						primary: "ui-icon-pause"
					}
				};
			} else {
				options = {
					label: "play",
					icons: {
						primary: "ui-icon-play"
					}
				};
			}
			$(this).button("option", options);
		});




		$( "#beginning" ).button({
			text: false,
			icons: {
				primary: "ui-icon-seek-start"
			}
		});
		$( "#rewind" ).button({
			text: false,
			icons: {
				primary: "ui-icon-seek-prev"
			}
		});
		$( "#stop" ).button({
			text: false,
			icons: {
				primary: "ui-icon-stop"
			}
		}).click(function() {
			$( "#play" ).button( "option", {
				label: "play",
				icons: {
					primary: "ui-icon-play"
				}
			});
		});
		$( "#forward" ).button({
			text: false,
			icons: {
				primary: "ui-icon-seek-next"
			}
		});
		$( "#end" ).button({
			text: false,
			icons: {
				primary: "ui-icon-seek-end"
			}
		});
		$( "#shuffle" ).button();
		$( "#repeat" ).buttonset();

	},
	contentLoaded: function (data) {

		this.player = new MediaElementPlayer("#_winnies_player_video", {
			
			//defaultVideoWidth: data.size.innerWidth-10,
			//defaultVideoHeight: data.size.innerHeight-10,
			videoWidth: data.size.innerWidth - 10,
			videoHeight: data.size.innerHeight - 10,
			enableAutosize: true,
			success: function (player, node) {
				$('#' + node.id + '-mode').html('mode: ' + player.pluginType);
			}
		});


		this.resize(data);
	},

	resize: function (data) {
		$("#_winnies_player_video").width(data.size.innerWidth - 10);
		$("#_winnies_player_video").height(data.size.innerHeight - 10);
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
	fic: function (className) {
		return this.element.find("." + this.widgetName +"_"+ className);
	},

	_trigger: function (type, ev, data) {
	
		if (type == 'close') this._destroy();
		if (type == 'resizeStop') {
			this.resize(data);
		}
		if (type == 'contentLoaded') {
			this.contentLoaded(data);
		}
		this._super(type, ev, data);
	},

	logging: function (msg) {
		if (this.doLog) oldConsole.log(this.widgetname + " :: " + msg);
	}

});
