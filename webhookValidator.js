const crypto = require('crypto');

function validateWebhook(requestHeader, requestContent, initOptions, response, eventEmitter){
    const signature = requestHeader['x-hub-signature']
    if (!signature) {
        throw new Error('No x-hub-signature found on request');
    }else if(!verify(signature, requestContent, initOptions.secret)){
        throw new Error('signature verification failure');
    }

    const event = requestHeader['x-github-event'];
    if(!event){
        throw new Error('No x-github-event found on request');
    }
    eventEmitter.emit('github_' + event, requestHeader['x-github-delivery'], requestContent, response, eventEmitter);
}

function sign (data, secret) {
    return `sha1=${crypto.createHmac('sha1', secret).update(data).digest('hex')}`
}

function verify (signature, data, secret) {
    var signed = sign(data, secret)
    console.log(signature)
    console.log(signed)
    if (signature.length != signed.length) {
      return false
    }
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(signed));
  }

module.exports.validateWebhook=validateWebhook;
