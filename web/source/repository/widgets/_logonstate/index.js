$.widget("widgets._logonstate" , $.winnies.widgetSuperwidget, {
	    version: "1.0.0",
	    logonButton: null,
	    logstateText: null,

	    options:{},

	    _create: function () {
	    	var self = this;
	    	this.element.addClass("nonselectable");

	    	this.element.find("._winnies_logonstate").height(this.options.dim.height);
	    	this.logonButton = this.element.find("._winnies_logbutton");
	    	this.logstateText = this.element.find("._winnies_logstatetext");

	    	this.logonButton.button({
	    		label: "Log on.."
	    	})
				.click(function ()
				{
					core.system.alertBox("Sorry, not implemented yet :(", false);
				});

	    	var user = BVFS.authentication.user;
	    	if (user.ROL == 0) this.setLoggedOff(user);
	    	else this.setLoggedOn(user);
	  
	        $(BVFS.authentication).on('online', function (event, user)
	        {
	        	self.setLoggedOn(user);
	        });

	        $(BVFS.authentication).on('offline', function (event, user)
	        {
	        	self.setLoggedOff(user);
	        });

	        this.element.appendTo('body');
	        this._super();
	    },

	    setLoggedOn: function (user) {
	    	var displayText = BVFS.authentication.roles[user.ROL] + " : " + user.USN;
	    	this.logstateText.text(displayText);
	    	this.logonButton.button({
	    		label: "Log off"
	    	});
	    },

	    setLoggedOff: function (user) {
	    	var displayText = BVFS.authentication.roles[user.ROL] + " : " + user.USN;
	    	this.logstateText.text(displayText);
	    	this.logonButton.button({
	    		label: "Log on.."
	    	});
	    },
	    _trigger: function (type, ev, data) {
	   
	    	this._super(type, ev, data);
	    }
	});



