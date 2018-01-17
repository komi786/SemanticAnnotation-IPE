/**
 * Created by Mac on 26/06/2017.
 */

const mqtt=require('mqtt');
var config  = require('../configFile');
var service=require('./notif')
var host='mqtt://'+mqttBroker;
var client = mqtt.connect(host);
var mqttChannel='/oneM2M/req/' + cseid.replace(/^\//,'') + '/' + mqtt_topic + '/json';
client.on('connect', function ()
{
    console.log('--pxy_mqtt--',mqttBroker);
});
var mqttsub= function ()
{
    client.subscribe(mqttChannel);

}
client.on('message', function (topic,message)
{
    //Parse notification message---Recieved MQTT notification
    console.log("notification message",topic);
    console.log("notification message",message);
    var data = JSON.parse(message);
    service.notificationHandling(data)  //Parse Payload
});
module.exports.subscribeTopic=mqttsub;
