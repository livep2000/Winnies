
$.widget("apps.calculator", $.winnies.appDialog, {
	version: "1.0.0",
	doLog: true,
	Calculator: {
		runningTotal: '',
		currentVal: '',
		setCurrentVal: false,
		executeAction: '',
		display: '',
		adjustTotals: function (val) {
			if (!this.setCurrentVal) {
				this.runningTotal += val;
			}
			else {
				this.currentVal += val;
			}
		},
		add: function () {
			this.runningTotal = parseInt(this.runningTotal) + parseInt(this.currentVal);
		},
		subtract: function () {
			this.runningTotal = parseInt(this.runningTotal) - parseInt(this.currentVal);
		},
		multiply: function () {
			this.runningTotal = parseInt(this.runningTotal) * parseInt(this.currentVal);
		},
		divide: function () {
			this.runningTotal = parseInt(this.runningTotal) / parseInt(this.currentVal);
		},
		clear: function () {
			this.runningTotal = '';
			this.currentVal = '';
			this.executeAction = '';
			this.setCurrentVal = false;
			this.display = '';
		},
		resetCurrentVal: function () {
			this.currentVal = '';
		},
		calculate: function () {
			this.executeAction = '';
			this.currentVal = '';
			return this.runningTotal;
		},
		getAction: function (val) {
			var method = '';
			switch (val) {
				case '+':
					method = this.add;
					break;
				case '-':
					method = this.subtract;
					break;
				case 'x':
					method = this.multiply;
					break;
				case '/':
					method = this.divide;
					break;
			}

			return method;
		},
		setDisplay: function () {
			return this.display = this.currentVal == '' ? this.runningTotal : this.currentVal;
		}
	},
	_init: function () {
		this._super();
	},
	_create: function () {

		console.debug("CREATE!");
		var self = this;
		this.element.find('div.key').click(function () {
			console.debug("CLICK!");
			var that = $(this),
			action = that.hasClass('action'),
			instant = that.hasClass('instant'),
			val = that.text();
			if (!action) self.Calculator.adjustTotals(val);
			else if (!instant) {
				if (self.Calculator.executeAction != '') self.Calculator.executeAction();
				self.Calculator.executeAction = self.Calculator.getAction(val);
				self.Calculator.setCurrentVal = true;
				self.Calculator.resetCurrentVal();
			}
			else {
				if (self.Calculator.executeAction != '') self.Calculator.executeAction();
				switch (val) {
					case 'cl':
						method = self.Calculator.clear();
						break;
					case '=':
						method = self.Calculator.calculate();
						break;
				}
			}
			self.Calculator.setDisplay();
			self.refreshVal();
		});
		this._super();
	},


	refreshVal: function () {
		$('.calculator input[type=text]').val(this.Calculator.display);
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
		if (type == 'ocontentLoaded') {
			// size and position in data
		}
		this._super(type, ev, data);
	}

});





