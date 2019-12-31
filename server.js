var http = require('http');
var webhookValidator = require('./webhookValidator.js');
var events = require('events');

var eventEmitter = new events.EventEmitter();
var fs = require("fs")
var child = require('child_process');

function writeResponse(statusCode, message, response){
    response.writeHead(statusCode, { 'content-type': 'application/json' })
    response.end(JSON.stringify(message))
}

var startProcessTime = new Date().toLocaleString();

http.createServer(function (request, response) {
    var requestUrl = request.url;

	console.log(request.headers);

    startProcessTime = new Date().toLocaleString();

    var requstContent = "";
    request.on('data', function(data){
        requstContent += data;
    })

    request.on('end', function(data){
        if(data){
            requstContent += data;      
        }
        requstContent = decodeURIComponent(requstContent);
        console.log('request ==> ' + requstContent);
        eventEmitter.emit("request_received", requestUrl, request.headers, requstContent, response, eventEmitter);
    })
    // response.on('error', (err) => {
    //   console.error(err);
    // });
    // response.writeHead(200, {'Content-Type': 'text/plain'});
    // response.end('Hello World\n');

}).listen(8090);

eventEmitter.on("request_received", processRequest);
eventEmitter.on("github_push", parsePushEvent);
eventEmitter.on("trigger_event_process", processEvent);
eventEmitter.on("record_process_log", recordProcessLog);

function processRequest(url, requestHeader,requstContent, response, eventEmitter){
    if(url == '/notify'){
        webhookValidator.validateWebhook(requestHeader, requstContent, {'secret':'amos'}, response, eventEmitter);
        return;
    }else if(url == '/status'){
         var json = null;

        try{
            json = fs.readFileSync('./status.json').toString();
            json = JSON.parse(json);
        }catch(e){
            console.error(e)
            json = {};
        }
        return writeResponse(200, json, response);;
    }else{
        writeResponse(500, "Bad Request", response);
        return;
    }
}

function parsePushEvent(eventId, requestContent, response, eventEmitter){
        var githubEventParser = null;
        try{
            githubEventParser = require("./push_eventParser.js");
        }catch(e){
            console.error(e);
            throw new Error(`Not found Event Processor for event [push]`);
        }

        githubEventParser.parsePushEvent(eventId, requestContent, response, eventEmitter);
}

function processEvent(repoInfo, response, eventEmitter, notInitRepo){
    var deployPath = repoInfo['deployPath'];
    var cmd = './build.sh ' + deployPath;
    child.exec(cmd, function(err,stdout,stderr) {
        if(err){
            console.error("Failed to execute cmd " + cmd);
            var msg = err;
            console.error(err);
        }
        if(stderr){
            console.error("Executed cmd " + cmd + " has error output :");
            console.error(stderr);
            if(notInitRepo != false && stderr.indexOf('not a git repository') > -1){
                console.log(`DeployPath[${deployPath}] is not a git repository, try init it ...`);

                initRepo(repoInfo, response, eventEmitter);
                return;
            }
            writeResponse(500, `Error: ${stderr}`, response)
            recordProcessLog(repoInfo, 500, `Error: ${stderr}`);
        }
        if(stdout){
            console.log("Executed cmd " + cmd + "has output :");
            console.log(stdout);
            writeResponse(200, stdout, response);
            recordProcessLog(repoInfo, 200, `${stdout}`);
        }
    }); 
}

function initRepo(repoInfo, response, eventEmitter){
    var deployPath = repoInfo['deployPath'];
    var sshUrl = repoInfo['sshUrl'];
    var cmd = `./init_repo.sh ${deployPath} ${sshUrl}`;
    child.exec(cmd, function(err,stdout,stderr) {
        if(err){
            console.error("Failed to execute cmd " + cmd);
            var msg = err;
            console.error(err);
        }
        if(stderr){
            console.error("Executed cmd " + cmd + " has error output :");
            console.error(stderr);
            if(`${stderr}`.indexOf("Cloning into 'webhook'...") > -1){
                eventEmitter.emit('trigger_event_process', repoInfo, response, eventEmitter, false);
            }else{
                writeResponse(500, `Error: ${stderr}`, response);
                recordProcessLog(repoInfo, 500, `Error: ${stderr}`);
            }
        }
        if(stdout){
            console.log("Executed cmd " + cmd + " has output :");
            console.log(stdout);
            // writeResponse(200, stdout, response);

            eventEmitter.emit('trigger_event_process', repoInfo, response, eventEmitter, false);
        }
    }); 
}

function recordProcessLog(repoInfo, statusCode, message){
    var endProcessTime = new Date().toLocaleString();

    var json = null;

    try{
        json = fs.readFileSync('./status.json').toString();
        json = JSON.parse(json);
    }catch(e){
        json = {};
    }

    json[`${repoInfo['repositoryName']}-${repoInfo['branch']}`] = {
            startProcessTime : startProcessTime,
            endProcessTime : endProcessTime,
            repoInfo : repoInfo,
            lastResult: {
                statusCode : statusCode,
                message : message
            }
        }

    fs.writeFile('./status.json', JSON.stringify(json), function (error) {
          if (error) {
            console.error('error writing file [status.json]')
          }else{
            console.error('updated file [status.json]')
          }
    })
}

console.log('Server running at http://127.0.0.1:8090/');