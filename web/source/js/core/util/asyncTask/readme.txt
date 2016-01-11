asyncTask

With thanks to: 'vkhread'

 * @author: Vadim Kiryukhin ( vkiryukhin @ gmail.com )
 * Copyright (c) 2013 Vadim Kiryukhin 
 * https://github.com/vkiryukhin/vkthread

 And the jsonfn plugin

 *  https://github.com/vkiryukhin/jsonfn 

 Inspired by the java asyncTask

 dependecy : jquery
 By : Imre Biacsics

 How to:

 // ------------------------------------------- Create new Object
 var asyncTask = new asyncTask();

 // ------------------------------------------- Optional: add a context
 asyncTask.context( new window.myContext() );

 // ------------------------------------------- Optional: add scripts to import (as array)
asyncTask.importScript('filer.js');
asyncTask.importScript('async.js');

 // ------------------------------------------- Create a function to run
function createBackup(a, b) {
	progress("result of my function: " + (a * b));
	progress(1);
	progress("hallo wereld");
	result("end");
	}

// -------------------------------------------- Run the function as asyncTask
self.asyncTask.task(createBackup, [5, 10]);

* The underlaying Webworker will be terminated in case of any error, or can be triggered by:
self.asyncTask.terminate();

* Call 'progress(value);' as often as you want, it triggers the progress event.
* Calling 'result(null | value);' will trigger 'result' and terminate te worker.

// -------------------------------------------- Listen to events

$(asyncTask).on('progress', function (ev, result) {
	console.debug("PROGRESS");
	console.debug(result);
});

$(asyncTask).on('fail', function (ev, result) { // task will be terminated
	console.debug("FAILED");
	console.debug(result);
});

$(asyncTask).on('result', function (ev, result) { // task will be terminated
	console.debug("RESULT");
	console.debug(result);
});


// -------------------------------------------- Complete example ---------------------------- //

var myTask = new asyncTask();
myTask.importScript('async.js');

function run100(input) {
	async.each(input, function(item, ittcallback){		
		progress(item);
		ittcallback();
	}, function(error){
		result("ready.");
	});
};

var input = new Array(100);
myTask.task(run100(, [input]);


$(myTask).on('progress', function (ev, progress) {
	console.debug("PROGRESS: " + progress);
	console.debug(result);
});

$(myTask).on('fail', function (ev, error) { // task will be terminated
	console.debug("FAILED:");
	console.debug(error);
});

$(myTask).on('result', function (ev, result) { // task will be terminated
	console.debug("RESULT: " + result);
});
