var nforce = require('nforce');
var faye = require('faye');
var express = require('express');
var cors = require('cors');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);


let PORT = process.env.PORT || 5000;

app.use(cors());
// app.use('/', express.static(__dirname + '/www'));
// app.get('/mixes', getMixes);
// app.get('/mixes/:mixId', getMixDetails);
// app.post('/approvals/:mixId', approveMix);


let bayeux = new faye.NodeAdapter({mount: '/faye', timeout: 45});
bayeux.attach(server);
bayeux.on('disconnect', function(clientId) {
    console.log('Bayeux server disconnect');
});

server.listen(PORT, () => console.log(`Express server listening on ${ PORT }`));


var org = nforce.createConnection({
    clientId: 'SF Consumer Key',
    clientSecret: 'SF Consumer Secret',
    environment: 'production',
    redirectUri: 'http://localhost:3000/oauth/_callback',
    mode: 'single',
    autorRefresh: true 
});

org.authenticate({username: 'SF username', password: 'SF user pwd'}, err => {
    if (err) {
        console.error("Salesforce authentication error");
        console.error(err);
    } else {
        console.log("Salesforce authentication successful");
        console.log(org.oauth.instance_url);
        console.log(`access toke: ${ org.oauth.access_token }`)
        subscribeToPlatformEvents();
    }
});

// Subscribe to Platform Events
let subscribeToPlatformEvents = () => {
    var client = new faye.Client(org.oauth.instance_url + '/cometd/41.0/');
    client.setHeader('Authorization', 'OAuth ' + org.oauth.access_token);
    client.subscribe('/event/Notification__e', function(message) {
        console.log(message);
        // Send message to all connected Socket.io clients
        //io.of('/').emit('mix_submitted', {
        //    mixId: message.payload.Mix_Id__c,
        //    mixName: message.payload.Mix_Name__c,
        //    account: message.payload.Account__c
        // });
    });
    // client.subscribe('/event/Mix_Unsubmitted__e', function(message) {
    //     // Send message to all connected Socket.io clients
    //     io.of('/').emit('mix_unsubmitted', {
    //         mixId: message.payload.Mix_Id__c,
    //     });
    // });
};