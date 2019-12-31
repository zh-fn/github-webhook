var child = require('child_process');
/*var spawn = child.spawn;

function runCmd(cmd, args, callback){
	console.log(`start run cmd ${cmd}`)
	var proc = spawn(cmd, ['-m']);
	proc.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
	});

	proc.stderr.on('data', (data) => {
		console.error(`stderr: ${data}`);
	});

	proc.on('close', (code) => {
		console.log(`process [` + cmd +`] exited with code ${code}`);
	});
}
*/
function exec(cmd, callback){
	child.exec(cmd, callback)
}

// module.exports.runCmd=runCmd;
module.exports.exec=exec;


/**
, function(err,stdout,stderr) {
		if(err){
			console.error("Failed to execute cmd " + cmd);
			console.error(err);
			output[err] += err;
		}
		if(stderr){
			console.error("Executed cmd " + cmd + "has error output :");
			console.error(stderr);
			output[stderr] += stderr;
		}
		if(stdout){
			console.error("Executed cmd " + cmd + "has output :");
			console.log(stdout);
			output[stdout] += stdout;
		}
	}