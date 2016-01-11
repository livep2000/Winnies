module.exports = (function () {
	var sound = ({
		doLog: true,
		playBackRate: 1.0,				// pitch
		digitsOffset: 0.07,				// time between digits
		wordSpace: 0.2,					// time between words
		stitchedOffset: 0.0,			// offset between partial words
		sentenceDelay: 0.8,			    // time added betweens last word and first word of new sentence
		numberType: "asDigits",			    // null, asDigits, asDuo, asReal
		indexPosOffset: 0,
		volume: 1.0,					    // gain
		context: null,
		implemented: true,
		cnt: 0,
		inInit: true,								// Blocks all, downloading parsing e.d.
		sentences: [],									// array can hold multiple senteces 
		busy: true,									// I'am speaking, so process, but hold on your breath
		soundindex: null,								// the extracted object with index data about the samples (like: exists, start, length)
		profiles: {},										// Object, holding the predefined profiles
		metaData: {},
		audioSourceBuffers: [],							// Decoded AudioBuffer objects (indexed by Name)
		gainNode: null,
		available: false,
		currentProggress: 0,
		sounds: ["Uit", "Pling plong", "Sirene", "New mail", "Error", "Chimes", "Warning", "Glas", "Ringout", "Notify", "Ding", "New alert", "Bliep", "Laser 1", "Laser 2", ],
		imports: function (apiToImport, name) {
			this[name] = apiToImport;
			console.log("core.sound :: " + name + " imported.");
		},
		// skip for now
		init: function () {
			this.implemented = false;
		},
			init2: function () {
			// indexeddb is not supported in webworkers by firefox and MS
			// worked great on chrome :(
			var self = this;
			window.AudioContext = window.AudioContext || window.webkitAudioContext || window.msAudioContext || window.oAudioContext || window.mozAudioContext;
			self.context = new AudioContext();
			self.gainNode = self.context.createGain();
			self.gainNode.gain.value = self.volume;


			var profileFile = "/winnies/apis/sound/data/profiles.txt";
			var soundfontFile = "/winnies/apis/sound/data/soundfontbank.bin";



			// start of workers function
			function startParsing(rawData, callback) {
				mess("start with " + rawData.length);
				var cnt = 0;
				_fileUnPacker(rawData, function (unpackedObject) { // audioSourceBuffers
					mess("SamplePack splitted. " + unpackedObject.dataBuffer.byteLength + " Bytes");
					var metaData = unpackedObject.index.metaData;
					var waveIndex = unpackedObject.index.files;
					var nrOfWaves = Object.keys(waveIndex).length;
					cnt = 0;
					for (key in waveIndex) {
						var offset = waveIndex[key][0];
						var length = waveIndex[key][1];
						var mimeType = waveIndex[key][2];
						var ext = waveIndex[key][3];
						unpackedObject.dataBuffer.getArrayBuffer(offset, length, function (waveBuffer) {
							var _key = key;
							cnt += 1;
							sourceBuffers[_key] = waveBuffer;
							if (cnt >= nrOfWaves) {
								mess("Ready parsing soundfonts.");
								//self.postMessage({ cmd: "terminate", profiles: profiles, waveIndex: waveIndex, sourceBuffers: sourceBuffers, metaData: metaData });
								self.result({ waveIndex: waveIndex, sourceBuffers: sourceBuffers, metaData: metaData })
							}
						}); // extract part
					}
				});

				var _fileUnPacker = function (inputArrayBuffer, callback) {
					var bufferLength = inputArrayBuffer.byteLength;
					var dataBuffer = new ArrayBuffer(bufferLength);								// init the extendedBuffer
					dataBuffer.setArrayBuffer(inputArrayBuffer, 0, function (bytesWrittem) {					// copy filebuffer into it
						dataBuffer.getUint32(0, 1, function (indexPosition) {									// get the position where the index starts
							dataBuffer.getString(indexPosition, bufferLength - indexPosition, function (indexStr) {	// read string from indexpos to file end
								var dataPart = new ArrayBuffer(indexPosition - 4);						// create new buffer for only the data
								dataBuffer.getUint8(4, indexPosition - 4, function (partArray) {						// retrieve the data part Uint8array
									dataPart.setUint8(partArray, 0, function (bytesWritten) {										// Set in the new buffer
										callback({ index: JSON.parse(indexStr), dataBuffer: dataPart });				// return both datapart & index as Object
									});
								});
							});
						});  // databuffer.getUint32
					}); // dataBuffer.setArrayBuffer
				}; // end function

				function mess(message) {
					message = " worker :: " + message;
					self.progress(message);
				}
			};
			// end of workers function------------------------

			var myTask = new core.util.asyncTask();
			myTask.importScript(BVFS.objectUrls['extendedarraybuffer.js']);
			//myTask.importScript(BVFS.objectUrls['soundworker.js']);
			var arrb = new ArrayBuffer(10);
	
			myTask.task(startParsing, [arrb]);
			//sound.startLoading(profileFile, soundfontFile, function (err, rawData) {
			//	if (err) return console.error(err);
			//	console.warn("got buffer " + rawData.byteLength);
			//	myTask.task(startParsing, [rawData]);
			//});

			//myTask.task(createbuffers, [rawData]);

			$(myTask).on('progress', function (event, progress) {
				sound.logging(progress);
			});

			$(myTask).on('fail', function (event, error) {
				sound.logging("AsyncTask failed: " + error.message);
			});

			$(myTask).on('result', function (event, data) {
				self.logging("Audio buffers loaded");
				self.soundindex = data.waveIndex;
				self.metaData = data.metaData;
				
				var nrOfWaves = Object.keys(self.soundindex).length;
				var cnt = 0;
				for (key in self.soundindex) {
					self._decodeBuffer(key, data.sourceBuffers[key], function (_key, audioBuffer) {
						if (audioBuffer != null) { self.audioSourceBuffers[_key] = audioBuffer; }
						else
						{
							self.soundindex[_key] = null;
							console.error("sound :: failed to decode: " + _key);
						}
						var percentage = Math.round((cnt / nrOfWaves) * 100);
						if (percentage > sound.currentProggress) {
							sound.currentProggress = percentage;
							$(self).triggerHandler('soundprogress', percentage);
						}

						cnt += 1;
						if (cnt >= nrOfWaves) {
							self.logging("Ready parsing sounds.");
							self.onInit = false;
							self.busy = false;
							self._nextSentence();
						} // cnt >= nrOfWaves
					}); // _decodeBuffer
				} // key in index
			});
		},

		startLoading: function (pFile, sFile, callback) {
			var self = this;
			sound.readFile(pFile, "text", function (err, metaData) {
				if (err) { console.error(err); return; }
				sound.logging("Profiles loaded.");
				var sourceBuffers = {};
				self.profiles = JSON.parse(metaData).profiles;
				sound.readFile(sFile, "arraybuffer", function (err, rawData) {
					sound.logging("SamplePack loaded " + rawData.byteLength + " Bytes");
					callback(err, rawData);
				});
			});
		},

		readFile: function (path, returnType, callback) {
			if (returnType == "text") {
				BVFS.fs.readFile(path, 'utf8', function (err, fileData) {
					if (err) console.error(err);
					callback(err, fileData);
				});
			}
			else { // arraybuffer
				BVFS.fs.open(path, 'r', function (err, fd) {
					if (err) console.error(err);
					BVFS.fs.fstat(fd, function (err, stats) { // Determine size of file
						if (err) console.error(err);
						var nbytes = expected = stats.size; // Create a buffer large enough to hold the file's contents
						var buffer = new BVFS.buffer(nbytes);
						var read = 0;
						function readBytes(offset, position, length) {
							length = length || buffer.length - read;
							BVFS.fs.read(fd, buffer, offset, length, position, function (err, nbytes) {
								if (err) console.error(err);
								read += nbytes;// nbytes is now the number of bytes read, between 0 and buffer.length.
								if (read < expected) readBytes(read, null);// See if we still have more bytes to read.
								else {
									callback(err, buffer); // not arraybuffer !! ???
									BVFS.fs.close(fd);
								}
							});
						}
						readBytes(0, 0);
					});
				});
			}
		},

		_decodeBuffer: function (key, arrayBuffer, callback) {
			this.context.decodeAudioData(arrayBuffer, function (audioBuffer)
			{ callback(key, audioBuffer); },
            function ()
            { callback(key, null); });
		},

		_newWordHolder: function () // wrapper for a word
		{
			var tempWordHolder = new Object();							// pre init a word object
			tempWordHolder.startOffset = 0;						// offset
			tempWordHolder.startPosition = 0.0;						// actual postion in secconds
			tempWordHolder.rawByteLength = 0;						// length of buffer in bytes
			tempWordHolder.duration = 0;						// actual duration in secconds
			tempWordHolder.playBackRate = this.playBackRate;// for feature use
			tempWordHolder.gain = this.volume;		// for feature use
			tempWordHolder.word = "";						// string: the word
			tempWordHolder.type = "unknown";				// .....
			return tempWordHolder;
		},

		_newSentenceHolder: function () // wrapper for a sentence
		{
			var sentenceHolder = new Object();					// Object for sentences
			sentenceHolder.wordLength = 0;						// nr. words in sentence
			sentenceHolder.duration = 0.0;						// currentposition + sentencedelay (for timer)
			sentenceHolder.words = [];							// The words
			return (sentenceHolder);
		},

		_nextSentence: function ()												// jank a sentence through the synth
		{
			var self = this;

			if (this.busy == false && this.sentences.length > 0)			// if not busy && something to speak out
			{
				this.busy = true													// now i'am busy
				var sentence = this.sentences.pop();								// pop off array whit sentence
				for (var i = 0; i < sentence.wordLength; i++) {
					var wordItem = sentence.words[i];									// create nodes
					this._startSound(wordItem);
				}
				setTimeout(function ()												// OnEnd in chrome is buggy, use a timer...
				{
					self.busy = false;												// not busy anymore
					self.logging("ready for new sentence");
					self._nextSentence();											// check for new sentence to speak out
				}, parseInt(sentence.duration * 1000));						// convert secconds to Ms
			}
		},

		_startSound: function (wordItem) {
			var playBuffer = this.context.createBufferSource();
			playBuffer.connect(this.gainNode);								// connect nodes
			this.gainNode.connect(this.context.destination);
			this.gainNode.gain.value = wordItem.gain;							// set values
			playBuffer.buffer = this.audioSourceBuffers[wordItem.word];
			playBuffer.playbackRate.value = wordItem.playBackRate;
			this.logging("start " + wordItem.word);
			playBuffer.start(this.context.currentTime + wordItem.startPosition);
		},

		play: function (soundName) {;
			if (!this.implemented) { return; }
			if (!this._ready(soundName)) { return; }
			soundName = this._getCleanSentence(soundName);
			var wordData = this._wordComplete(soundName);
			if (wordData) this._startSound(wordData[0]);
		},
		speak: function (sentence) // the complicated sience of speaking
		{
			var self = this;
			if (!self.implemented) { return; }
			if (!self._ready(sentence)) { return; }
			var cnt = 0, indexItem = null, tempWordHolder = [];		// count found words, holder for found index data, temp array, holding word objects
			var currentPosition = 0.0;								// pointer : in secconds
			var words = self._getCleanSentence(sentence).split(" ");		// shortens the way we write things				
			for (key in words)										// loop through word array
			{
				var internalTempWordArray = [], word = words[key];
				if (internalTempWordArray = self._wordAsNumber(word))									// nummeric sequence, process....
				{
					self.logging(word + " = nummeric ");
				}
				else if (internalTempWordArray = self._wordComplete(word))								// found complete word in index, thats okay! 		
				{
					self.logging(word + " = a whole word");
				}
				else if (internalTempWordArray = self._findWordParts(word)) 							// try to find parts
				{
					self.logging(word + " = stitched word");
				}
				if (internalTempWordArray !== null)														// if something found
				{
					for (var i = 0; i < internalTempWordArray.length; i++)									// push parts in tempwordHolder
					{
						if (cnt === 0) { internalTempWordArray[i].startOffset = 0; }						// first word in sentence hase no offset (start at 0)
						else
						{
							internalTempWordArray[i].startOffset = internalTempWordArray[i].startOffset / this.playBackRate;
						}
						currentPosition += internalTempWordArray[i].startOffset;
						internalTempWordArray[i].duration = self._bytes2Duration(internalTempWordArray[i].rawByteLength, internalTempWordArray[i].playBackRate);
						internalTempWordArray[i].startPosition = currentPosition;
						tempWordHolder.push(internalTempWordArray[i]);
						currentPosition += internalTempWordArray[i].duration;
						cnt += 1;
					}
				}
				else {
					console.error(word + " cannot be spoken", null);
				}											// all failed....		
			} // key in words

			if (tempWordHolder.length > 0) {
				var newSentence = self._newSentenceHolder();
				newSentence.wordLength = tempWordHolder.length;
				newSentence.duration = currentPosition + (self.sentenceDelay / self.playBackRate);
				newSentence.words = tempWordHolder;
				self.sentences.push(newSentence);
				if (self.busy == false) {
					self._nextSentence();
				}
			}
		},	 // speakSentence

		_wordAsNumber: function (word)																		// Speak out numbers
		{
			var self = this;
			if (!isNaN(word) && self.numberType)													// if nummeric word && needs to be spoken
			{
				var tempWords = [];
				if (self.numberType == "asDigits")													// speak as digits
				{
					self.logging(word + " = asDigits");
					for (var i = 0, len = word.length; i < len; i++) {
						var indexItem = self.soundindex[word[i]];
						tempWords[i] = self._newWordHolder();								// new instance
						tempWords[i].word = word[i];												// the word
						tempWords[i].rawByteLength = indexItem[1];											// length in bytes
						tempWords[i].startOffset = self.digitsOffset;										// a digit is allways an single word
						tempWords[i].type = self.numberType;								// later handy to know what happened here
					}
					return (tempWords);
				}
				else if (self.numberType == "asDuo")												// sets 32, 64, 2
				{
					self.logging(word + " = asDuo");					// todo
					return (null);
				}
				else if (self.numberType == "asReal")												// as One-miljion-three-thousend
				{
					self.logging(word + " = asReal");				// todo
					return (null);
				}
				else { return (null); }																	// safety
			} else { return (null); }
		},		// _wordAsNumber

		_wordComplete: function (word)			// find is as whole word
		{
			var self = this;
			var indexItem = null;
			if (!isNaN(word))
			{ return (null); }
			else if (indexItem = this.soundindex[word])											// found !
			{
				var wordHolder = self._newWordHolder();														// Get default word object
				wordHolder.startOffset = this.wordSpace;													// whole word : get the word offset
				wordHolder.word = word;																	// teh word
				wordHolder.type = "wholeWord";															// later handy to know what happened here
				wordHolder.rawByteLength = indexItem[1];													// Length in Bytes
				return ([wordHolder]);																	// return as Array with single element
			}
			else { return (null); }																		// not found, return NULL
		}, //_wordComplete

		_findLongestWord: function (word, startIndex) {
			var longestword = "", totalChars = 0, chars = "", endPos = 0, iItem = {};
			var len = word.length;																			// split up in chars
			var tempWords = [];
			for (var i = startIndex; i < len; i++)																		// loop char by char
			{
				chars += word.charAt(i);
				if (chars.length > 2) {
					if (indexItem = this.soundindex[chars]) // && isNaN(chars) 
					{
						iItem = indexItem;
						totalChars += chars.length;
						endPos = i + 1;
						longestword = chars;
						this.logging("found " + longestword);
					}
				}
			}
			if (endPos == 0) { endPos = i; }
			return ({ "longestword": longestword, "endPos": endPos, "indexItem": iItem });
		}, // _findLongestWord

		_findWordParts: function (word)														// check if it can be build out of parts
		{
			var self = this;
			self.logging("try find " + word);
			var partCnt = 0;
			var tempWords = [];
			var currentPos = 0;
			var len = word.length;
			var complete = true;
			do {
				var longestWordObj = self._findLongestWord(word, currentPos);
				currentPos = longestWordObj.endPos;
				if (longestWordObj.longestword != "") {
					tempWords[partCnt] = self._newWordHolder();						// Get default word object
					if (partCnt === 0) {
						tempWords[partCnt].startOffset = this.wordSpace;						/// first part of stitched word is wordstart, so use +offset
						tempWords[partCnt].type = "stitchedfirst";								// later handy to know what happened here
					}
					else {
						tempWords[partCnt].startOffset = this.stitchedOffset;					// stitched: get the stitched -offset
						tempWords[partCnt].type = "stitched";									// later handy to know what happened here
					}
					tempWords[partCnt].word = longestWordObj.longestword;					// the word
					tempWords[partCnt].rawByteLength = longestWordObj.indexItem[1];								// Length in Bytes
					partCnt += 1;
				}
				else {
					self.logging("not complete");
					complete = false;
				}
			} while (currentPos < len);
			if (tempWords.length <= 0 || complete == false) { return null; }						// not found
			else { return (tempWords); }								// or return this array
		}, // _findWordParts

		_bytes2Duration: function (dataSize, playbackRate) {
			return ((((dataSize / this.metaData.sampleRate) / this.metaData.numChannels) / playbackRate) / this.metaData.bytesPerSample);
		},

		_getCleanSentence: function (sentence) {
			sentence = sentence.replace(/[^\w\s]/gi, ' ');			// strip special chars
			sentence = sentence.replace(/\s+/g, ' ');				// double white
			sentence = sentence.toLowerCase();						// to lowerCase
			sentence = sentence.trim();								// trim off spaces
			return (sentence);
		},

		_ready: function (value) {
			var result = false;
			if (this.onInit == false && value !== "" && this.implemented) { result = true; }
			return result;
		},
		logging: function (message) {
			if (this.doLog) console.log("Sound :: " + message);
		}
	});
	return sound;
})();