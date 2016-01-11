module.exports = (function () {

	var worker = null;

	var JSONfn = {
		stringify: function (obj) {
			return JSON.stringify(obj, function (key, value) {
				if (value instanceof Function || typeof value == 'function') {
					return value.toString();
				}
				if (value instanceof RegExp) {
					return '_PxEgEr_' + value;
				}
				return value;
			});
		}
	};

	var asynctask = function () {
		var self = this;
		worker = new Worker( BVFS.objectUrls['asynctaskworker.js']  );
		worker.onmessage = function (e) {
			$(self).triggerHandler(e.data.cmd, e.data.value);
		};

		worker.onerror = function (e) {
			console.warn(e);
			$(self).triggerHandler("fail", e);
			worker.terminate();
			worker = null;	
		};

	}; // asynctask2

	asynctask.prototype.context = function (context) {
		var obj = {cmd:'context', context: context };
		worker.postMessage(JSONfn.stringify(obj));
	};

	asynctask.prototype.importScript = function (script) {
		var obj = { cmd: 'importscript', script: script };
		worker.postMessage(JSONfn.stringify(obj));
	};

	asynctask.prototype.task = function (fn, args) {
		obj = {cmd:'task', fn: fn, args: args }
		worker.postMessage(JSONfn.stringify(obj));
	}

	asynctask.prototype.terminate = function () {
		console.debug("terminate");
		if(worker) worker.terminate();
		worker = null;
		$(this).triggerHandler("fail", "Task programatically terminated.");
	}

	return asynctask
})();