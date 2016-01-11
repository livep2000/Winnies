/* PreInfo: crossindex creates internally 2 + (amount of indexes) entries, all identified by a GUID.
 * This is not the best idea in large data structures, it'l eat your memory.
 * 
 * Q: point to indexes in array's to prevent that ?
 * A: Then it will lack performance beceause of pop/push/slice actions. (so benchmark test both?)
 * 
 * crossIndex : A way to assign multiple (unique) indexes to the same data object
 * That data object can be found by 2 cridentials:
 * 1. The name of the index
 * 2. The value in that index
 * (An extra index is added automatically: 'guid', hence it's used inernally, it can be used)
 * The data object can be altered, extended or keys can be removed by setting it to 'null';
 * 
 * Usage :
 *  ------  1 configure with the index 'id' as string and 'count' as integer.
 *		var indexes = {id: "", count: 0};
 *		var crossindex = new crossIndex(indexes);
 * 
 *  ------  2. Add some data, this is an 2 step operation.
 * first get an empty object with:
 *		var tmpObj = crossindex.baseObject();
 * 
 * Set indexes to something unique
 * 		tmpObj.indexes.id = "myid";
		tmpObj.indexes.count = 0;

 ** Here you can 'steal' the internal guid **
 *		var guid = tmpObj.indexes.guid;

 * populate the data part.
 *		tmpObj.data.myText = "hello world";
 *		tmpObject.data.someObject = {};
 * 
 * then post it back
 *		crossindex.add(tmpObj);
 * 
 *  ------  3. Find the data by id = myid
 *		crossindex.find("myid", "id", function(err, Obj){
 *			console.log(Obj.data);
 *		});
 * 
 *  ------  4. Remove that entry, find it by 'count' (result = null|true)
 *		crossindex.remove(0, 'count', function(err, result){
 *			// if no err is was found and removed
 *		});
 * 
 * ------  5. Update, add or remove data (Or do all @once) 
 *		crossindex.update(0, 'count', {data: {myText: 'Changed text'}} function(err, Obj){
 *			console.log("new text = ", Obj.data.myText);
 *		});
 * -- To add add, just do: {'newval' : 12345}
 * -- To remove, set to null: {myText: null}
 * -- Or any combination : {'newval' : 12345, myText: 'changed text', someObject: null}
 * 
 * 
 * ------  5b. Update an index value the same way
 *		crossindex.update(0, 'count', {indexes: {id: 'MyId25'}} function(err, Obj){
 *			console.log("new text = ", Obj.data.myText);
 *		});
 * 
 * ------  6. Clear indexes and data content
 *		crossindex.clear();
 * -- all content will be removed and can be added again. 
 * -- this is like 'remove' on all items. The object still exists
 * 
 *  ----- 7. Destroy completely
 *		crossindex.destroy();
 * -- You have to configure again with : new crossIndex(indexes);
 */

module.exports = (function () {

	var crossIndex = function (_baseObj) {
		this.noinit = "ERROR: cannot call function prior to initalisation.";
		this.baseObj = _baseObj;
		this.baseObj.data = {};
		this.baseObj.indexes.guid = {};
		this.items = {};
		this.crossIndexes = {};
		this.indexKeys = Object.keys(this.baseObj.indexes);
		for (var i = 0 ; i < this.indexKeys.length; i++) {
			this.crossIndexes[this.indexKeys[i]] = {};
		}
	};

	crossIndex.prototype.baseObject = function () {
		var self = this;
		var cloned = new Object();
		$.each(this.baseObj, function (key, value) {
			if (key === 'indexes') {
				cloned.indexes = new Object();
				$.each(self.baseObj.indexes, function (key2, value2) {
					cloned.indexes[key2] = value2;
				});
			}
			else cloned[key] = value;
		});
		cloned.indexes.guid = core.util.guid();
		return (cloned);
	};

	crossIndex.prototype.add = function (Obj) {
		var self = this;
		if (!this.crossIndexes) return;
		var thisGuid = Obj.indexes.guid;
		this.items[thisGuid] = {};
		this.items[thisGuid].data = {};
		$.each(Obj.data, function (key, value) {
			self.items[thisGuid].data[key] = value;
		});
		self.items[thisGuid].indexes = Obj.indexes;
		for (var i = 0 ; i < this.indexKeys.length; i++) {
			var key = this.indexKeys[i];
			if (key === 'guid') this.crossIndexes.guid[thisGuid] = thisGuid;
			else this.crossIndexes[key][Obj.indexes[key]] = thisGuid;
		}
	};

	crossIndex.prototype.findGuid = function (findValue, byIndex, callback) {
		if (!this.crossIndexes[byIndex]) return callback("Index '" + byIndex + "' is not found.", null);
		if (this.crossIndexes[byIndex][findValue]) {
			return callback(null, this.crossIndexes[byIndex][findValue]);
		} 
		else return callback("Value '" + findValue + "' in index '" + byIndex + "' is not found.", null);
	};

	// returns an array with objects, where the value is larger then findvalue
	// flags: r : regex, l : larger then s: smaller then : i: case insensitive, a: asc, d: desc, in : inclusieve exact match
	// provide flags like { r: false, l: true, s: false, i: false, a: false, d: false, e: true, in: true}
	// so far only l,s,e and in are implemented !!!!!
	crossIndex.prototype.find = function (findValue, byIndex, callback, providedFlags) {
		if (!this.crossIndexes) return callback(this.noinit, null);
		if (!this.crossIndexes[byIndex]) return callback("Index: '" + byIndex + "' not found.", null);
		if (!providedFlags) var providedFlags = { e: true };

		var defaultFlags = { r: false, l: false, s: false, i: false, a: false, d: false };
		var flags = $.extend({}, defaultFlags, providedFlags);
		if (flags.e) {  // exact search
			findExact(findValue, byIndex, this, function (err, resultObj) {
				callback(err, resultObj);
			});
		}
		else {
			var self = this;
			var target = this.crossIndexes[byIndex];
			var returnArr = [];
			async.each(target, function (entry, ittCallback) {
				var indexObj = self.items[entry];
				if (indexObj) {
					if (flags.l) {
						if (flags.in) { // >= won't work, string are compared alphabetical
							var replaced = indexObj.indexes[byIndex].replace(findValue, "*");
							if (replaced.startsWith("*")) {
								returnArr.push(indexObj);
							}
						}
					}
				}
				ittCallback();
			}, function (err) {
				callback(null, returnArr);
			});
		}

		function findExact(findValue, byIndex, self, callback) {
			self.findGuid(findValue, byIndex, function (err, guid) {
				if (err)  return callback(err, null);
				if (!self.items[guid]) return callback("Internal error: inconsistent crossindex.", null);
				return callback(null, self.items[guid]);
			});
		};

	},



	crossIndex.prototype.remove = function (findValue, byIndex, callback) {
		var self = this;
		if (!this.crossIndexes) return callback(this.noinit, null);
		this.find(findValue, byIndex, function (err, Obj) {
			if (err) {
				if (callback) return callback(err, null);
				else return (false);
			}
			$.each(Obj.indexes, function (key, value) {
				self.crossIndexes[key][value] = null;
				delete (self.crossIndexes[key][value]);
			});
			self.items[key] = null;
			delete (self.items[key]);
			if (callback) return callback(null, true);
			else return (true);
		});
	};

	crossIndex.prototype.update = function (findValue, byIndex, updateObj, callback) {
		var self = this;
		if (!this.crossIndexes) return callback(this.noinit, null);
		this.find(findValue, byIndex, function (err, Obj) {
			if (err) {
				if (callback) return callback(err, null);
				else return (false);
			}
			if (updateObj.indexes) {
				$.each(updateObj.indexes, function (key, val) {
					if (!Obj.indexes[key]) return callback("Index with name: '" + key + "' not found.", null);
					else if (key == 'guid') return callback("'guid' is used internally and therefore readonly.", null);
					else {
						var valueToReplace = Obj.indexes[byIndex];
						self.crossIndexes[key][valueToReplace] = null;
						delete (self.crossIndexes[key][valueToReplace]);
						self.crossIndexes[key][val] = Obj.indexes.guid;
					}
				});
			}
			$.extend(true, Obj, updateObj);
			if (callback) return callback(null, Obj);
			else return (Obj);
		});
	};

	crossIndex.prototype.exist = function (findValue, byIndex) {
		if (!this.crossIndexes) return (false);
		else if (!this.crossIndexes[byIndex]) return (false);
		else if (!this.crossIndexes[byIndex][findValue]) return (false);
		else return (true);
	},

	crossIndex.prototype.clear = function () {
		this.items = {};
		this.indexKeys = Object.keys(this.baseObj.indexes);
		for (var i = 0 ; i < this.indexKeys.length; i++) {
			this.crossIndexes[this.indexKeys[i]] = {};
		}
	};

	crossIndex.prototype.destroy = function () {
		this.baseObj = null;
		this.items = null;
		this.crossIndexes = null;
	};

	return crossIndex
})();