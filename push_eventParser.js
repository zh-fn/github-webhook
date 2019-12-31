var fs = require("fs")

/*
	{
		"repo":{
			"branch1" : "depolyPath1",
			"branch2" : "depolyPath2"
		},
		...
	}
*/
var config = JSON.parse(fs.readFileSync('./config.json'));

function parsePushEvent(eventId, requestContent, response, eventEmitter){
	requestContent = JSON.parse(requestContent);
	console.log(`start process push event [${eventId}]...`)

	var repositoryName = requestContent['repository']['name']
	var repositoryOwner = requestContent['repository']['owner']['name']
	var ref = requestContent['ref']
	var branch = ref.split('/')[2];
	var puherName = requestContent['pusher']['name']
	var puherEmail = requestContent['pusher']['email']
	var sshUrl = requestContent['repository']['ssh_url']

	console.log(`repository name : ${repositoryName}`);
	console.log(`repository owner : ${repositoryOwner}`);
	console.log(`ref : ${ref}`);
	console.log(`branch : ${branch}`);
	console.log(`pusher name : ${puherName}`);
	console.log(`pusher email : ${puherEmail}`);

	var repoConfig = config[repositoryName];
	if(repoConfig == null || repoConfig == undefined){
		throw new Error(`config for repository [${repositoryName}] not defined`);
	}
	var deployPath = repoConfig[branch];
	if(deployPath == null || deployPath == undefined){
		throw new Error(`deployPath for repository [${repositoryName}] branch [${branch}] not defined`);
	}

	var repoInfo = {
		repositoryName : repositoryName,
		repositoryOwner : repositoryOwner,
		ref : ref,
		branch : branch,
		puherName : puherName,
		puherEmail : puherEmail,
		sshUrl : sshUrl,
		deployPath : deployPath
	}

	eventEmitter.emit('trigger_event_process', repoInfo, response, eventEmitter);
}

module.exports.parsePushEvent=parsePushEvent;