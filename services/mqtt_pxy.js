/**
 * Created by Mac on 26/06/2017.
 */

const mqtt=require('mqtt');
var config  = require('../configFile');
var service=require('./notif')
var host='mqtt://'+mqttBroker+'/'+csebase
var options = {
    keepalive: 10,
    clientId: 'SJUMQTT',
    protocolId: 'MQTT',
    protocolVersion: 4,
    clean: true,                  //set to false to receive QoS 1 and 2 messages while offline
    reconnectPeriod: 2000,
    connectTimeout: 30 * 1000,
    will: {                       //in case of any abnormal client close this message will be fired
        topic: 'ErrorMsg',
        payload: 'Connection Closed abnormally..!',
        qos: 0,
        retain: false
    },
    rejectUnauthorized: false,
}
var client = mqtt.connect(host);
var mqttsubRootPath='/oneM2M/req/' + cseid.replace(/^\//,'');
client.on('connect', function ()
{
    console.log('--pxy_mqtt--',mqttBroker);
});
var mqttsub= function (topic)
{
    console.log("Subscribing to mqtt queue ["+mqttsubRootPath+topic+"/json]");
    client.subscribe(mqttsubRootPath+topic+"/json")
}
client.on('message', function (topic, message)
{
    //Parse notification message---Recieved MQTT notification
    var data = JSON.parse(message);
    service.notificationHandling(data)  //Parse Payload
});
module.exports.subscibeTopic=mqttsub;
