var JSONfn = {
	parse: function (str, date2obj) {
		var iso8061 = date2obj ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/ : false;
		return JSON.parse(str, function (key, value) {
			if (typeof value != 'string') return value;
			if (value.length < 8) return value;
			if (iso8061 && value.match(iso8061)) return new Date(value);
			if (value.substring(0, 8) === 'function') return eval('(' + value + ')');
			if (value.substring(0, 8) === '_PxEgEr_') return eval(value.slice(8));
			return value;
		});
	}
	};

	function progress(progressValue) {
		postMessage({ cmd: 'progress', value: progressValue });
	};
	function result(resultValue) {
		postMessage({ cmd: 'result', value: resultValue });
	};

	onmessage = function (e) {
		var obj = JSONfn.parse(e.data, true);
		switch (obj.cmd) {
			case 'context':
				self.context = obj.context ? obj.context : self;
				break;
			case 'importscript':
				importScripts(obj.script);
				break;
			case 'task':
				try { obj.fn.apply(self.context, obj.args); }
				catch (err) { postMessage({ cmd: 'fail', error: err}) }
				break;
		}
	};