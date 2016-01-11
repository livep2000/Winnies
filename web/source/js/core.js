/*
 * Core constructor
 * 
 * The core is modulair constructed. 
 * Depending modules can be defined in it self, but:
 * the convention is to do it in here, wich helps te keep the structure clear.
 * 
 * So far:
 * 
 * BVFS								Browser Virtual File System
 * BVFS.authentication				Authentication provider for (pre) logon
 * 
 * core								Should not hold functionality
 * 
 * core.util						Global utilities
 * core.util.asyncTask				Sort of backgroundworker
 * core.util.extendedArrayBuffer	Fill buffers serialzed
 * core.util.lzString				LZMA based compression
 * 
 * core.register					Key / pair based register.
 * 
 * core.system						Winnies system functions
 * core.system.dialogs				Like fileOpen, fileSave etc.
 * 
 * core.sound						A soundmanager, with sample based speech engine (for kiosk)
 * 
 * core.app							Application extending functions
 * (core.template)					Emtpy template showing how to start a new module
 * 
 */
require("./vendor");					// vendor widgets (jquery, jstree etc)
require('./winnies.appDialog.js');		// a superwidget to derive apps from
require('./winnies.superwidget.js');	// a superwidget to derive desktop widgets from
require('./winnies.dialogs.js');		// a superwidget to derive dialogs from 
require('./winnies.superPlugin.js');	// a superwidget to derive 'normal' plugins from 


$(function () {
	
	window.core = require('./core/index.js');

	var register = require('./core/register');
	core.imports(register, "register");

	var util = require('./core/util');
	core.imports(util, "util");

	var extendedArrayBuffer = require('./core/util/extendedArrayBuffer');
	core.util.imports(extendedArrayBuffer, 'extendedArrayBuffer');

	var asyncTask = require('./core/util/asyncTask');
	core.util.imports(asyncTask, "asyncTask");

	var lzString = require('./core/util/lzString');
	core.util.imports(lzString, "lzString");
	
	var crossIndex = require('./core/util/crossIndex');
	core.util.imports(crossIndex, "crossIndex");

	var system = require('./core/system');
	core.imports(system, "system");

	var dialogs = require('./core/system/dialogs');
	core.system.imports(dialogs, 'dialogs');

	var sound = require('./core/sound');
	core.imports(sound, "sound");

	var app = require('./core/app');
	core.imports(app, "app");

	//core.system.init();
	core.sound.init();
	core.register.init();

	var coreLog = function (msg) { if (infodiv) { infodiv.prepend(msg + "<br/>") } };
});


