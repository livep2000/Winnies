// winnies bootscript v1.0.0
var doLog = true;
var BVFS = args;
logging("v1.0.0 running");

var env = {
	"WIN": "/winnies/",
	"SYS": "/winnies/system/",
	"APP": "/winnies/apps/",
	"WID": "/winnies/widgets/",
	"TPL": "/winnies/templates/",
	"API": "/winnies/apis/",
	"DIA": "/winnies/dialogs/",
	"THE": "/winnies/themes/",
	"WAL": "/winnies/wallpapers/",
	"PLU": "/winnies/plugins/",
	"HOM": "/home/"
};

BVFS.fs.mkdir(env.WIN, null, function (err) {
	if (err) {
		logging("Winnies directory is present");
		mainDirsReady(null, "Winnies system is present");
	}
	else {
		var len = Object.keys(env).length;
		var cnt =0;
		for (key in env) {
			logging(env[key] + " created");
			BVFS.fs.mkdir(env[key], null, function (err) {
				cnt += 1;
				if (cnt >= len) mainDirsReady(null, "bootscript ready..");
			});
		}
	}
});

function mainDirsReady(err, msg) {
	env.OBU = "/winnies/system/winnies/objectUris/";
	env.TMP = "/tmp/";
	logging("Environment variables are set");
	for (key in env) {
		BVFS.sh.env.set(key, env[key]);
	}
	logging("Running pre installer...");  // /boot/preinstalled.json

	console.log("URL: " + BVFS.host.origin + "/build/repository");
	BVFS.install(BVFS.host.origin + "/build/repository", function (err, nrInstalled, nrErrors, installedObject, onlyInstalled) {
		if (err) console.error(err);
		else logging("New preinstalled.json downloaded...");

		BVFS.fs.unlink(env.TMP + "boot.js", function (err) {
			callback(err, nrInstalled, nrErrors, installedObject, onlyInstalled);
		});
	});
};

function logging(msg) { if (doLog) console.log("Bootscript :: " + msg); };