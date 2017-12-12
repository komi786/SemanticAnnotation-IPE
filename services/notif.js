/**
 * Created by Mac on 16/09/2017.
 */

var api=require('./api');
var mqtt=require('./mqtt_pxy');
var dataStructureFile=require('./dataStructure');
var notif=function (message)
{
    if (message['pc']['m2m:sgn'])
    {
        var resourcePath=message['pc']['m2m:sgn']['sur'];
        var resourceName=getNewResourcePath(resourcePath);
        if (message['pc']['m2m:sgn']['nev']['rep']['m2m:cnt'])   //Notif--New container have been created--Subscribe CNT--Make MQTT subscription
        {
            var newcnt = message['pc']['m2m:sgn']['nev']['rep']['m2m:cnt'];
            var fullresourceName = resourceName + '/' + newcnt['rn'];
            var form = {'cnt': fullresourceName};
            var dict={'rn':fullresourceName,'prn':resourceName}
            api.Resourcesubscription(fullresourceName, function (response)
            {
                api.doTopicSubscription(fullresourceName)
            })
        }
        else if(message['pc']['m2m:sgn']['nev']['rep']['m2m:cin'])                //Notif--New contentInstance have been created. parse SMD and Update
        {
            console.log("resourceName=",resourceName)
            var cin=message['pc']['m2m:sgn']['nev']['rep']['m2m:cin'];
            // var splitResource=resourceName.split('/');
            // var ln=splitResource.length;
            // splitResource.splice(4,ln-4,"")
            // var r = splitResource.filter(function(i){ return i != ""; })
            // console.log("resourceName=",r)
            var smdprnresource=resourceName
            console.log("smdparent=",smdprnresource)
            var RN=cin['rn'];
            api.semanticDescription(smdprnresource,function (str)
            {
                var data=JSON.parse(str);
                console.log("strrr",data)
                if (data['m2m:smd'] != undefined)
                {
                    var sd=data['m2m:smd']['dsp'];
                    console.log('m2m:SD is defined= ',data['m2m:smd']);
                    sd= Base64.decode(sd);
                    var rootparent=message['pc']['m2m:sgn']['sur'];
                    var rootparentsplit=rootparent.split('/');
                    var subscriptionresourceName='/'+rootparentsplit[rootparentsplit.length-1]
                    console.log("subscriptionresourceName=",subscriptionresourceName)
                    rootparent=rootparent.replace(subscriptionresourceName,'');
                    var RootParent=rootparent.split('/')[3];
                    console.log("RootParent=",RootParent);
                    var newSD=ParsingSDFILE(cin,RootParent,sd);
                    console.log("New SMD= ",newSD);
                    newSD=Base64.encode(newSD);
                    var form={'rn':smdprnresource,'dspt':newSD};
                    api.UpdateResourceAnnotation(form,function (res)
                        {
                          //   console.log(res);

                        })
                }
                else
                {
                    var rootparent=message['pc']['m2m:sgn']['sur'];
                    var rootparentsplit=rootparent.split('/');
                    var subscriptionresourceName='/'+rootparentsplit[rootparentsplit.length-1]
                    console.log("subscriptionresourceName=",subscriptionresourceName)
                    rootparent=rootparent.replace(subscriptionresourceName,'');
                    var RootParent=rootparent.split('/')[3];
                    var dspt = makeDSPTOnStreetParking(RootParent);
                    var form = {'rn': smdprnresource, 'dspt': Base64.encode(dspt) };
                    api.ResourceAnnotation(form, function (response)
                    {
                          console.log('smd Response=',response)
                          var sd=(JSON.parse(response))['m2m:smd']['dsp'];
                           sd= Base64.decode(sd);
                           var newSD=ParsingSDFILE(cin,RootParent,sd);
                            newSD=Base64.encode(newSD);
                            var form={'rn':smdprnresource,'dspt':newSD};
                            api.UpdateResourceAnnotation(form,function (res)
                            {

                               // console.log(res);
                            })
                    })
                }
            })
        }
        else if(message['pc']['m2m:sgn']['nev']['rep']['m2m:sub'])
        {
            var res=resourceName.split("/").join("+");
            api.doTopicSubscription(res)
            return
        }
        }
}
var getNewResourcePath=function(sur,rn)
{
    var sur1=sur
    var rootparentsplit=sur1.split('/');
    var subscriptionresourceName='/'+rootparentsplit[rootparentsplit.length-1]
    console.log("subscriptionresourceName=",subscriptionresourceName)
    sur1=sur1.replace(subscriptionresourceName,'');
    return sur1;
}
function squash(arr)
{
    var tmp = [];
    for(var i = 0; i < arr.length; i++){
        if(tmp.indexOf(arr[i]) == -1){
            tmp.push(arr[i]);
        }
    }
    return tmp;
}
var makeDSPTOnStreetParking=function(parent)
{
    var fs = require('fs');
    var dspt="";
    if (parent.toLowerCase()==("parkingSpot").toLowerCase())
    {
        var parkingSpotmodel  = fs.readFileSync('./model/smartparking/ParkingSpot.xml', 'utf-8');
        dspt=parkingSpotmodel;
        return dspt;
    }
    else if (parent.toLowerCase()==("onStreetParking").toLowerCase())
    {
        var parkingSpotmodel  = fs.readFileSync('./model/smartparking/OnStreetParking.xml', 'utf-8');
        dspt=parkingSpotmodel;
        return dspt;


    }
    else if (parent.toLowerCase()==("offStreetParking").toLowerCase())
    {
        var parkingSpotmodel  = fs.readFileSync('./model/smartparking/OffStreetParking.xml', 'utf-8');
        dspt=parkingSpotmodel;
        return dspt;

    }
    else if (parent.toLowerCase()==("busstop").toLowerCase())
    {
        var parkingSpotmodel  = fs.readFileSync('./model/busInformationSystem/busStop.xml', 'utf-8');
        dspt=parkingSpotmodel;
        return dspt;

    }
    else if (parent.toLowerCase()==("busline").toLowerCase())
    {
        var parkingSpotmodel  = fs.readFileSync('./model/busInformationSystem/busLine.xml', 'utf-8');
        dspt=parkingSpotmodel;
        return dspt;

    }
    else if (parent.toLowerCase()==("busestimation").toLowerCase())
    {
        var parkingSpotmodel  = fs.readFileSync('./model/busInformationSystem/BusEstimation.xml', 'utf-8');
        dspt=parkingSpotmodel;
        return dspt;

    }
    else
    {
        dspt=""
        return dspt;
    }
}
function ParsingSDFILE(cinObject,rootParent,document) {
    var xmlDoc = document;
    var xmldom = require('xmldom');
    var DOMParser = xmldom.DOMParser;
    var semanticDescriptor = new DOMParser().parseFromString(xmlDoc, "text/xml"); //parsing xml
    var m2mcin = cinObject['con']
    var resourceName = cinObject.rn.toLowerCase(); //getting out rn
    var resourceValue = cinObject.con; //getting out cin
    if (rootParent.toLowerCase() == "parkingspot") {
        if (m2mcin.name != undefined) {
            parseNode(semanticDescriptor.getElementsByTagName("park:hasName")[0], semanticDescriptor, resourceValue['name'])
        }
        if (m2mcin['id'] != undefined) {
            parseNode(semanticDescriptor.getElementsByTagName("park:hasId")[0], semanticDescriptor, resourceValue['id'])
        }
        if (m2mcin.type != undefined) {
            parseNode(semanticDescriptor.getElementsByTagName("park:hasType")[0], semanticDescriptor, resourceValue['type'])

        }
        if (m2mcin.status != undefined) {
            parseNode(semanticDescriptor.getElementsByTagName("park:hasStatusValue")[0], semanticDescriptor, resourceValue['status'])
        }
        if (m2mcin.datemodified != undefined) {
            var isoDateTime = new Date(resourceValue['datemodified'] * 1000);
            parseNode(semanticDescriptor.getElementsByTagName("park:hasDateModified")[0], semanticDescriptor, isoDateTime)
        }

        if (m2mcin.category != undefined) {
            var ln = resourceValue['category'].length;
            clearNodes("park:hasCategory", semanticDescriptor);
            createNode("park:hasCategory", semanticDescriptor, ln, "string", "park:ParkingSpot", true)
            var nodes = semanticDescriptor.getElementsByTagName("park:hasCategory");
            for (var i = 0; i < ln; i++) {
                console.log(resourceValue['category'][i]);
                parseNode(nodes[i], semanticDescriptor, resourceValue['category'][i])
            }
        }
        if (m2mcin.refParkingSite != undefined) {
            var ln = resourceValue['refParkingSite'].length;
            clearNodes("park:hasRefParkingSite", semanticDescriptor);
            createNode("park:hasRefParkingSite", semanticDescriptor, ln, "string", "park:ParkingSpot", true)
            var nodes = semanticDescriptor.getElementsByTagName("park:hasRefParkingSite");
            for (var i = 0; i < ln; i++) {
                parseNode(nodes[i], semanticDescriptor, resourceValue['refParkingSite'][i])
            }
            var ParkingSpot = semanticDescriptor.getElementsByTagName("park:ParkingSpot")[0];
            var newvalue = 'http://www.semanticweb.org/wise-iot/ontologies/2017/1/parkingOntology.owl#' + m2mcin['refParkingSite'][0];
            updatenodeAtrribute(ParkingSpot, semanticDescriptor, "rdf:about", newvalue);

        }
        if (m2mcin.location != undefined) {
            var ln = resourceValue['location']['coordinates'].length;
            clearNodes("park:hasLocation", semanticDescriptor);
            createNode("park:hasLocation", semanticDescriptor, 1, "string", "park:ParkingSpot", false)
            createNode("park:hasLocationType", semanticDescriptor, 1, "string", "park:hasLocation", true)
            parseNode(semanticDescriptor.getElementsByTagName("park:hasLocationType")[0], semanticDescriptor, resourceValue['location']['type'])
            if (typeof resourceValue['location']['coordinates'][0] == "object") {
                for (var i = 0; i < ln; i++) {
                    dictofNodeName = [["park:hasLongitude", "park:hasLatitude"], [true, true]]
                    literaldataTypesNestNodes = ["double", "double"]
                    createNestedNode(dictofNodeName, resourceValue['location']['coordinates'][i], "park:hasCoordinates", "park:hasLocation", semanticDescriptor, literaldataTypesNestNodes);
                }
            }
            else {
                dictofNodeName = [["park:hasLongitude", "park:hasLatitude"], [true, true]]
                literaldataTypesNestNodes = ["double", "double"]
                console.log("Coordinates", resourceValue['location']['coordinates']);
                createNestedNode(dictofNodeName, resourceValue['location']['coordinates'], "park:hasCoordinates", "park:hasLocation", semanticDescriptor, literaldataTypesNestNodes);
            }

        }
        var newsmd = semanticDescriptor
        var XMLSerializer = xmldom.XMLSerializer;
        var newSD = new XMLSerializer().serializeToString(newsmd);
        return newSD

    }
    else if (rootParent.toLowerCase() == "onstreetparking") {
        if (m2mcin.type != undefined) {
            parseNode(semanticDescriptor.getElementsByTagName("park:hasType")[0], semanticDescriptor, resourceValue['type'])
        }
        if (m2mcin['id'] != undefined) {
            parseNode(semanticDescriptor.getElementsByTagName("park:hasId")[0], semanticDescriptor, resourceValue['id'])
        }
        if (m2mcin.name != undefined) {
            parseNode(semanticDescriptor.getElementsByTagName("park:hasName")[0], semanticDescriptor, resourceValue['name'])
        }
        if (m2mcin.datemodified != undefined) {
            console.log("datemodified");
            var isoDateTime = new Date(resourceValue['datemodified'] * 1000);
            parseNode(semanticDescriptor.getElementsByTagName("park:hasDateModified")[0], semanticDescriptor, isoDateTime)
        }
        if (m2mcin['category'] != undefined) {
            console.log("category");
            var ln = resourceValue['category'].length;
            if (ln != semanticDescriptor.getElementsByTagName("park:hasCategory").length) {
                clearNodes("park:hasCategory", semanticDescriptor);
                createNode("park:hasCategory", semanticDescriptor, ln, "string", "park:OnStreetParking", true)
            }
            var nodes = semanticDescriptor.getElementsByTagName("park:hasCategory");
            console.log("category nodes= ", ln);
            for (var i = 0; i < ln; i++) {
                console.log(resourceValue['category'][i])
                parseNode(nodes[i], semanticDescriptor, resourceValue['category'][i])
            }
        }
        if (m2mcin.areBordersMarked != undefined) {
            console.log("areBordersMarked");
            parseNode(semanticDescriptor.getElementsByTagName("park:hasAreBordersMarked")[0], semanticDescriptor, resourceValue['areBordersMarked'])
        }
        if (m2mcin.allowedVehicleType != undefined) {
            console.log("allowedVehicleType");
            parseNode(semanticDescriptor.getElementsByTagName("park:hasAllowedVehicleType")[0], semanticDescriptor, resourceValue['allowedVehicleType'])
        }
        if (m2mcin.requiredPermit != undefined) {
            console.log("requiredPermit");
            var ln = resourceValue['requiredPermit'].length;
            clearNodes("park:hasRequiredPermit", semanticDescriptor);
            createNode("park:hasRequiredPermit", semanticDescriptor, ln, "string", "park:OnStreetParking", true)
            var nodes = semanticDescriptor.getElementsByTagName("park:hasRequiredPermit");
            for (var i = 0; i < nodes.length; i++) {
                parseNode(nodes[i], semanticDescriptor, resourceValue['requiredPermit'][i])
            }
        }
        if (m2mcin.chargeType != undefined) {
            console.log("chargeType");
            var ln = resourceValue['chargeType'].length;
            clearNodes("park:hasChargeType", semanticDescriptor);
            createNode("park:hasChargeType", semanticDescriptor, ln, "string", "park:OnStreetParking", true)
            var nodes = semanticDescriptor.getElementsByTagName("park:hasChargeType");
            for (var i = 0; i < nodes.length; i++) {
                parseNode(nodes[i], semanticDescriptor, resourceValue['chargeType'][i])
            }
        }
        if (m2mcin.occupancyDetectionType != undefined) {
            console.log("occupancyDetectionType");
            parseNode(semanticDescriptor.getElementsByTagName("park:hasOccupancyDetectionType")[0], semanticDescriptor, resourceValue['occupancyDetectionType'])
        }
        if (m2mcin.totalSpotNumber != undefined) {
            console.log("totalSpotNumber");
            parseNode(semanticDescriptor.getElementsByTagName("park:hasTotalSpotNumber")[0], semanticDescriptor, resourceValue['totalSpotNumber'])
        }
        if (m2mcin.refParkingSpot != undefined) {
            console.log("refParkingSpot");
            var ln = resourceValue['refParkingSpot'].length;
            clearNodes("park:hasRefParkingSpot", semanticDescriptor);
            createNode("park:hasRefParkingSpot", semanticDescriptor, ln, "string", "park:onStreetParking", true)
            var nodes = semanticDescriptor.getElementsByTagName("park:hasRefParkingSpot");
            for (var i = 0; i < nodes.length; i++) {
                parseNode(nodes[i], semanticDescriptor, resourceValue['refParkingSpot'][i])
            }
            var offStreetNode = semanticDescriptor.getElementsByTagName("park:OnStreetParking")[0];
            var newvalue = 'http://www.semanticweb.org/wise-iot/ontologies/2017/1/parkingOntology.owl#' + m2mcin['refParkingSpot'][0];
            updatenodeAtrribute(offStreetNode, semanticDescriptor, "rdf:about", newvalue);


        }
        if (m2mcin.availableSpotNumber != undefined) {
            var ln = resourceValue['availableSpotNumber'].length;
            clearNodes("park:hasAvailableSpotNumber", semanticDescriptor);
            var dictofNodeName = [["park:hasValueOfAvailableSpotNumber", "park:hasTimeStampOfAvailableSpotNumber"], [true, true]];
            var literaldataTypesNestNodes = ["string", "string"]
            if (typeof resourceValue['availableSpotNumber'][0] == "object") {
                for (var i = 0; i < ln; i++) {
                    createNestedNode(dictofNodeName, resourceValue['availableSpotNumber'][i], "park:hasAvailableSpotNumber", "park:OnStreetParking", semanticDescriptor, literaldataTypesNestNodes);
                }
            }
            else {
                createNestedNode(dictofNodeName, resourceValue['availableSpotNumber'], "park:hasAvailableSpotNumber", "park:OnStreetParking", semanticDescriptor, literaldataTypesNestNodes);
            }

        }
        if (m2mcin.permitActiveHours != undefined)                         //make rdf/xml class type for permitActiveHours sensor information
        {
            console.log("permitActiveHours")
            var ln = resourceValue['permitActiveHours'].length;
            clearNodes("park:hasPermiteActiveHours", semanticDescriptor);
            var dictofNodeName = [["park:hasValueOfAvailableSpotNumber", "park:hasTimeStampOfAvailableSpotNumber"], [true, true]];
            var literaldataTypesNestNodes = ["string", "string"]
            if (typeof resourceValue['permitActiveHours'][0] == "object") {
                for (var i = 0; i < ln; i++) {
                    var array = dictToArray(resourceValue['permitActiveHours'][i], true);
                    console.log("objToArray=", array)
                    createNestedNode(dictofNodeName, array, "park:hasPermiteActiveHours", "park:OnStreetParking", semanticDescriptor, literaldataTypesNestNodes);
                }
            }
            else {
                createNestedNode(dictofNodeName, resourceValue['permitActiveHours'], "park:hasPermiteActiveHours", "park:OnStreetParking", semanticDescriptor, literaldataTypesNestNodes);
            }

        }
        if (m2mcin.location != undefined) {
            var ln = resourceValue['location']['coordinates'].length;
            clearNodes("park:hasCoordinates", semanticDescriptor);
            parseNode(semanticDescriptor.getElementsByTagName("park:hasLocationType")[0], semanticDescriptor, resourceValue['location']['type'])
            if (typeof resourceValue['location']['coordinates'][0] == "object") {
                for (var i = 0; i < ln; i++) {
                    dictofNodeName = [["park:hasLongitude", "park:hasLatitude"], [true, true]]
                    literaldataTypesNestNodes = ["double", "double"]
                    createNestedNode(dictofNodeName, resourceValue['location']['coordinates'][i], "park:hasCoordinates", "park:hasLocation", semanticDescriptor, literaldataTypesNestNodes);

                }
            }
            else {
                dictofNodeName = [["park:hasLongitude", "park:hasLatitude"], [true, true]]
                literaldataTypesNestNodes = ["double", "double"]
                createNestedNode(dictofNodeName, resourceValue['location']['coordinates'], "park:hasCoordinates", "park:hasLocation", semanticDescriptor, literaldataTypesNestNodes);
            }
        }

        var XMLSerializer = xmldom.XMLSerializer;
        var newSD = new XMLSerializer().serializeToString(semanticDescriptor);
        return newSD
    }
    else if (rootParent.toLowerCase() == "offstreetparking") {
        if (m2mcin.name != undefined) {
            parseNode(semanticDescriptor.getElementsByTagName("park:hasName")[0], semanticDescriptor, resourceValue['name'])
        }
        if (m2mcin.id != undefined) {
            parseNode(semanticDescriptor.getElementsByTagName("park:hasId")[0], semanticDescriptor, resourceValue['id'])
        }
        if (m2mcin.type != undefined) {
            parseNode(semanticDescriptor.getElementsByTagName("park:hasType")[0], semanticDescriptor, resourceValue['type'])

        }
        if (m2mcin.status != undefined) {
            parseNode(semanticDescriptor.getElementsByTagName("park:hasStatusValue")[0], semanticDescriptor, resourceValue['status'])
        }
        if (m2mcin.refParkingSpot != undefined) {
            if (typeof resourceValue["refParkingSpot"] == "object") {
                var ln = resourceValue['refParkingSpot'].length;
                clearNodes("park:hasRefParkingSpot", semanticDescriptor);
                createNode("park:hasRefParkingSpot", semanticDescriptor, ln, "string", "park:OffStreetParking", true)
                var nodes = semanticDescriptor.getElementsByTagName("park:hasRefParkingSpot");
                for (var i = 0; i < nodes.length; i++) {
                    parseNode(nodes[i], semanticDescriptor, resourceValue['refParkingSpot'][i])
                }
                var offStreetNode = semanticDescriptor.getElementsByTagName("park:OffStreetParking")[0];
                var newvalue = 'http://www.semanticweb.org/wise-iot/ontologies/2017/1/parkingOntology.owl#' + m2mcin['refParkingSpot'][0];
                updatenodeAtrribute(offStreetNode, semanticDescriptor, "rdf:about", newvalue);
            }
            else {
                clearNodes("park:hasRefParkingSpot", semanticDescriptor);
                createNode("park:hasRefParkingSpot", semanticDescriptor, 1, "string", "park:OffStreetParking", true)
                var nodes = semanticDescriptor.getElementsByTagName("park:hasRefParkingSpot");
                parseNode(nodes[i], semanticDescriptor, resourceValue['refParkingSpot'])
                var offStreetNode = semanticDescriptor.getElementsByTagName("park:OffStreetParking")[0];
                var newvalue = 'http://www.semanticweb.org/wise-iot/ontologies/2017/1/parkingOntology.owl#' + m2mcin['refParkingSpot'];
                updatenodeAtrribute(offStreetNode, semanticDescriptor, "rdf:about", newvalue);

            }


        }
    if (m2mcin.location != undefined) {
        var ln = resourceValue['location']['coordinates'].length;
        clearNodes("park:hasCoordinates", semanticDescriptor);
        // createNode("park:hasLocation",semanticDescriptor,1,"string","park:OffStreetParking",false)
        // createNode("park:hasLocationType",semanticDescriptor,1,"string","park:hasLocation",true)
        parseNode(semanticDescriptor.getElementsByTagName("park:hasLocationType")[0], semanticDescriptor, resourceValue['location']['type'])
        if (typeof resourceValue['location']['coordinates'][0] == "object") {
            console.log("coordinatesss")
            for (var i = 0; i < ln; i++) {
                dictofNodeName = [["park:hasLongitude", "park:hasLatitude"], [true, true]]
                literaldataTypesNestNodes = ["double", "double"]
                createNestedNode(dictofNodeName, resourceValue['location']['coordinates'][i], "park:hasCoordinates", "park:hasLocation", semanticDescriptor, literaldataTypesNestNodes);

            }
        }
        else {
            dictofNodeName = [["park:hasLongitude", "park:hasLatitude"], [true, true]]
            literaldataTypesNestNodes = ["double", "double"]
            createNestedNode(dictofNodeName, resourceValue['location']['coordinates'], "park:hasCoordinates", "park:hasLocation", semanticDescriptor, literaldataTypesNestNodes);
        }
    }
    if (m2mcin.availableSpotNumber != undefined) {
        var ln = resourceValue['availableSpotNumber'].length;
        clearNodes("park:hasAvailableSpotNumber", semanticDescriptor);
        var dictofNodeName = [["park:hasValueOfAvailableSpotNumber", "park:hasTimeStampOfAvailableSpotNumber"], [true, true]];
        var literaldataTypesNestNodes = ["string", "string"]
        for (var i = 0; i < ln; i++) {
            createNestedNode(dictofNodeName, resourceValue['availableSpotNumber'][i], "park:hasAvailableSpotNumber", "park:OffStreetParking", semanticDescriptor, literaldataTypesNestNodes);
        }
    }
    if (m2mcin.contactPoint != undefined) {
        if (typeof resourceValue["contactPoint"] == "object") {
            var ln = resourceValue['contactPoint'].length;
            clearNodes("park:hasContactPoint", semanticDescriptor);
            var dictofNodeName = [["park:hasTelePhone", "park:hasContactType", "hasContactOption", "hasAreaServed"], [true, true, true, true]];
            var literaldataTypesNestNodes = ["string", "string", "string", "string"]
            for (var i = 0; i < ln; i++) {
                var valuedict = [resourceValue['contactPoint'][i], "customer service", "TollFree", "US"]
                createNestedNode(dictofNodeName, valuedict, "park:hasContactPoint", "park:OffStreetParking", semanticDescriptor, literaldataTypesNestNodes);
            }
        }
        else {
            clearNodes("park:hasContactPoint", semanticDescriptor);
            var dictofNodeName = [["park:hasTelePhone", "park:hasContactType", "hasContactOption", "hasAreaServed"], [true, true, true, true]];
            var literaldataTypesNestNodes = ["string", "string", "string", "string"]
            var valuedict = [resourceValue['contactPoint'], "customer service", "TollFree", "US"]
            createNestedNode(dictofNodeName, valuedict, "park:hasContactPoint", "park:OffStreetParking", semanticDescriptor, literaldataTypesNestNodes);

        }

    }
    if (m2mcin.datemodified != undefined) {
        var isoDateTime = new Date(resourceValue['datemodified'] * 1000);
        parseNode(semanticDescriptor.getElementsByTagName("park:hasDateModified")[0], semanticDescriptor, isoDateTime)
    }
    if (m2mcin.openingHours != undefined) {

        parseNode(semanticDescriptor.getElementsByTagName("park:hasOpeningHours")[0], semanticDescriptor, resourceValue['openingHours'])
    }
    if (m2mcin.category != undefined) {
        var ln = resourceValue['category'].length;
        clearNodes("park:hasCategory", semanticDescriptor);
        createNode("park:hasCategory", semanticDescriptor, ln, "string", "park:OffStreetParking", true)
        var nodes = semanticDescriptor.getElementsByTagName("park:hasCategory");
        for (var i = 0; i < nodes.length; i++) {
            parseNode(nodes[i], semanticDescriptor, resourceValue['category'][i])
        }
    }
    if (m2mcin.refParkingSite != undefined) {
        if (typeof resourceValue["refParkingSpot"] == "object") {
            var ln = resourceValue['refParkingSite'].length;
            clearNodes("park:hasRefParkingSite", semanticDescriptor);
            createNode("park:hasRefParkingSite", semanticDescriptor, ln, "string", "park:OffStreetParking", true)
            var nodes = semanticDescriptor.getElementsByTagName("park:hasRefParkingSite");
            for (var i = 0; i < nodes.length; i++) {
                parseNode(nodes[i], semanticDescriptor, resourceValue['refParkingSite'][i])
            }

        }
        else {
            clearNodes("park:hasRefParkingSite", semanticDescriptor);
            createNode("park:hasRefParkingSite", semanticDescriptor, 1, "string", "park:OffStreetParking", true)
            var nodes = semanticDescriptor.getElementsByTagName("park:hasRefParkingSite");
            parseNode(nodes[i], semanticDescriptor, resourceValue['refParkingSite'])
            var offStreetNode = semanticDescriptor.getElementsByTagName("park:OffStreetParking")[0];
            var newvalue = 'http://www.semanticweb.org/wise-iot/ontologies/2017/1/parkingOntology.owl#' + m2mcin['refParkingSite'];
            updatenodeAtrribute(offStreetNode, semanticDescriptor, "rdf:about", newvalue);
        }
    }
    if (m2mcin.aggregateRating != undefined)
    {
        if (typeof resourceValue['aggregateRating'] != "object") {
            clearNodes("park:hasAggregatedRating", semanticDescriptor);
            var dictofNodeName = [["park:hasBestRating", "park:hasRatingValue", "park:hasRatingCount"], [true, true, true]];
            var literaldataTypesNestNodes = ["string", "string", "string"]
            var dictValue = ["", resourceValue['aggregateRating'], ""]
            createNestedNode(dictofNodeName, dictValue, "park:hasAggregatedRating", "park:OffStreetParking", semanticDescriptor, literaldataTypesNestNodes);

        }
        else {
            var ln = resourceValue['aggregateRating'].length;     //length of Aggregated String
            clearNodes("park:hasAggregatedRating", semanticDescriptor);
            var dictofNodeName = [["park:hasBestRating", "park:hasRatingValue", "park:hasRatingCount"], [true, true, true]];
            var literaldataTypesNestNodes = ["string", "string", "string"]
            for (var i = 0; i < ln; i++) {
                createNestedNode(dictofNodeName, resourceValue['aggregateRating'][i], "park:hasAggregatedRating", "park:OffStreetParking", semanticDescriptor, literaldataTypesNestNodes);
            }
        }
    }
    if (m2mcin.requiredPermit != undefined) {
        console.log("requiredPermit");
        var ln = resourceValue['requiredPermit'].length;
        clearNodes("park:hasRequiredPermit", semanticDescriptor);
        createNode("park:hasRequiredPermit", semanticDescriptor, ln, "string", "park:OffStreetParking", true)
        var nodes = semanticDescriptor.getElementsByTagName("park:hasRequiredPermit");
        for (var i = 0; i < nodes.length; i++) {
            parseNode(nodes[i], semanticDescriptor, resourceValue['requiredPermit'][i])
        }
    }
    var newsmd = semanticDescriptor
    var XMLSerializer = xmldom.XMLSerializer;
    var newSD = new XMLSerializer().serializeToString(newsmd);
    return newSD
}
    else if(rootParent.toLowerCase()=="busstop")
    {
        if (m2mcin.name != undefined || m2mcin['name'] != "NA") {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasName")[0], semanticDescriptor, resourceValue['name'])
        }
        if (m2mcin['id'] != undefined) {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasId")[0], semanticDescriptor, resourceValue['id'])
        }
        if (m2mcin['refBuses'] != undefined || m2mcin['refBuses'] != "NA")
        {
            console.log("refBuses");
            var ln=resourceValue['refBuses'].length;
            clearNodes("smartBus:hasRefBuses",semanticDescriptor);
            createNode("smartBus:hasRefBuses",semanticDescriptor,ln,"string","smartBus:busStop",true)
            var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasRefBuses");
            for(var i=0;i< nodes.length;i++)
            {
                parseNode(nodes[i],semanticDescriptor,resourceValue['refBuses'][i])
            }
        }
        if (m2mcin['shortId'] != undefined || m2mcin['shortId'] != "NA") {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasShortId")[0], semanticDescriptor, resourceValue['shortID'])
        }
        if (m2mcin['busStopCount'] != undefined || m2mcin['busStopCount'] != "NA")
        {
            console.log("busStopCount");
            var ln=resourceValue['busStopCount'].length;
            clearNodes("smartBus:hasBusStopCount",semanticDescriptor);
            createNode("smartBus:hasBusStopCount",semanticDescriptor,ln,"string","smartBus:busStop",true)
            var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasBusStopCount");
            for(var i=0;i< nodes.length;i++)
            {
                parseNode(nodes[i],semanticDescriptor,resourceValue['busStopCount'][i])
            }
        }
        if (m2mcin['location'] != undefined || m2mcin['location'] != "NA") {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasLatitude")[0], semanticDescriptor, resourceValue['location'][0])
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasLongitude")[0], semanticDescriptor, resourceValue['location'][1])
        }
        if (m2mcin['address'] != undefined || m2mcin['address'] != "NA")
        {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasStreetAddress")[0], semanticDescriptor, resourceValue['address']['postalAddress']['streetAddress'])
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasAddressLocality")[0], semanticDescriptor, resourceValue['address']['postalAddress']['addressLocality'])
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasAddressRegion")[0], semanticDescriptor, resourceValue['address']['postalAddress']['addressRegion'])
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasPostalCode")[0], semanticDescriptor, resourceValue['address']['postalAddress']['postalCode'])

        }
            if (m2mcin['direction'] != undefined || m2mcin['direction'] != "NA")
            {
                parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasDirection")[0], semanticDescriptor, resourceValue['direction'])
            }
            if (m2mcin['refBusLines'] != undefined || m2mcin['refBusLines'] != "NA")
            {
                console.log("refBusLines");
                var ln=resourceValue['refBusLines'].length;
                clearNodes("smartBus:hasRefBusLines",semanticDescriptor);
                createNode("smartBus:hasRefBusLines",semanticDescriptor,ln,"string","smartBus:busStop",true)
                var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasRefBusLines");
                for(var i=0;i< nodes.length;i++)
                {
                    parseNode(nodes[i],semanticDescriptor,resourceValue['refBusLines'][i])
                }
            }
            if (m2mcin.datemodified != undefined || m2mcin['datemodified'] != "NA") {
                var isoDateTime = new Date(resourceValue['datemodified'] * 1000);
                parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasDateModified")[0], semanticDescriptor, isoDateTime)
            }
        var newsmd = semanticDescriptor
        var XMLSerializer = xmldom.XMLSerializer;
        var newSD = new XMLSerializer().serializeToString(newsmd);
        return newSD
    }
    else if(rootParent.toLowerCase()=="busline")
    {
        if (m2mcin['id'] != undefined || m2mcin['id'] != "NA")
        {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasId")[0], semanticDescriptor, resourceValue['id'])
        }
        if (m2mcin['refBusStops'] != undefined || m2mcin['refBusStops'] != "NA")
        {
            console.log("refBusStops");
            var ln=resourceValue['refBusStops'].length;
            clearNodes("smartBus:hasRefBusStops",semanticDescriptor);
            createNode("smartBus:hasRefBusStops",semanticDescriptor,ln,"string","smartBus:busLine",true)
            var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasRefBusStops");
            for(var i=0;i< nodes.length;i++)
            {
                parseNode(nodes[i],semanticDescriptor,resourceValue['refBusStops'][i])
            }
        }
        if (m2mcin['localId'] != undefined || m2mcin['localId'] != "NA")
        {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasLocalId")[0], semanticDescriptor, resourceValue['localId'])
        }
        if (m2mcin['shortId'] != undefined|| m2mcin['shortId'] != "NA") {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasShortId")[0], semanticDescriptor, resourceValue['shortId'])
        }
        if (m2mcin['name'] != undefined|| m2mcin['name'] != "NA")
        {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasName")[0], semanticDescriptor, resourceValue['name'])
        }
        if (m2mcin['refStartBusStop'] != undefined || m2mcin['refStartBusStop'] != "NA")
        {
            console.log("refStartBusStop");
            var ln=resourceValue['refStartBusStop'].length;
            clearNodes("smartBus:hasRefStartBusStop",semanticDescriptor);
            createNode("smartBus:hasRefStartBusStop",semanticDescriptor,ln,"string","smartBus:busLine",true)
            var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasRefStartBusStop");
            for(var i=0;i< nodes.length;i++)
            {
                parseNode(nodes[i],semanticDescriptor,resourceValue['refStartBusStop'][i])
            }
        }
        if (m2mcin['refEndBusStop'] != undefined || m2mcin['refEndBusStop'] != "NA")
        {
            console.log("refEndBusStop");
            var ln=resourceValue['refEndBusStop'].length;
            clearNodes("smartBus:hasRefEndBusStop",semanticDescriptor);
            createNode("smartBus:hasRefEndBusStop",semanticDescriptor,ln,"string","smartBus:busLine",true)
            var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasRefEndBusStop");
            for(var i=0;i< nodes.length;i++)
            {
                parseNode(nodes[i],semanticDescriptor,resourceValue['refEndBusStop'][i])
            }
        }
        if (m2mcin['startTime'] != undefined || m2mcin['startTime'] != "NA")
        {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasStartTime")[0], semanticDescriptor, resourceValue['startTime'])
        }
        if (m2mcin['endTime'] != undefined || m2mcin['endTime'] != "NA")
        {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasEndTime")[0], semanticDescriptor, resourceValue['endTime'])
        }
        if (m2mcin['intervalNorm'] != undefined || m2mcin['intervalNorm'] != "NA")
        {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasIntervalNorm")[0], semanticDescriptor, resourceValue['intervalNorm'])
        }
        if (m2mcin['intervalHoli'] != undefined || m2mcin['intervalHoli'] != "NA")
        {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasIntervalHoli")[0], semanticDescriptor, resourceValue['intervalHoli'])
        }
        if (m2mcin['intervalPeak'] != undefined || m2mcin['intervalPeak'] != "NA")
        {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasIntervalPeak")[0], semanticDescriptor, resourceValue['intervalPeak'])
        }

        if(m2mcin.datemodified != undefined || m2mcin['datemodified'] != "NA")
        {
            var isoDateTime = new Date(resourceValue['datemodified'] * 1000);
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasDateModified")[0], semanticDescriptor, isoDateTime)
        }
        var newsmd = semanticDescriptor
        var XMLSerializer = xmldom.XMLSerializer;
        var newSD = new XMLSerializer().serializeToString(newsmd);
        return newSD
    }
    else if(rootParent.toLowerCase()=="busestimation")
    {

        if (m2mcin['name'] != undefined || m2mcin['name'] != "NA")
        {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasName")[0], semanticDescriptor, resourceValue['name'])
        }
        if (m2mcin['id'] != undefined || m2mcin['id'] != "NA")
        {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasId")[0], semanticDescriptor, resourceValue['id'])
        }
        if (m2mcin['refBusStops'] != undefined || m2mcin['refBusStops'] != "NA")
        {
            console.log("refBusStops");
            var ln=resourceValue['refBusStops'].length;
            clearNodes("smartBus:hasRefBusStops",semanticDescriptor);
            createNode("smartBus:hasRefBusStops",semanticDescriptor,ln,"string","smartBus:busEstimation",true)
            var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasRefBusStops");
            for(var i=0;i< nodes.length;i++)
            {
                parseNode(nodes[i],semanticDescriptor,resourceValue['refBusStops'][i])
            }
        }
        if (m2mcin['refBusLine'] != undefined || m2mcin['refBusLine'] != "NA")
        {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasRefBusLine")[0], semanticDescriptor, resourceValue['refBusLine'])
        }
        if (m2mcin['remainingDistances'] != undefined || m2mcin['remainingDistances'] != "NA")
        {
            console.log("remainingDistances");
            var ln=resourceValue['remainingDistances'].length;
            clearNodes("smartBus:hasRemainingDistances",semanticDescriptor);
            createNode("smartBus:hasRemainingDistances",semanticDescriptor,ln,"string","smartBus:busEstimation",true)
            var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasRemainingDistances");
            for(var i=0;i< nodes.length;i++)
            {
                parseNode(nodes[i],semanticDescriptor,resourceValue['remainingDistances'][i])
            }
        }

        if (m2mcin['remainingTimes'] != undefined || m2mcin['remainingTimes'] != "NA")
        {
            console.log("remainingTimes");
            var ln=resourceValue['remainingTimes'].length;
            clearNodes("smartBus:hasRemainingTimes",semanticDescriptor);
            createNode("smartBus:hasRemainingTimes",semanticDescriptor,ln,"string","smartBus:busEstimation",true)
            var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasRemainingTimes");
            for(var i=0;i< nodes.length;i++)
            {
                parseNode(nodes[i],semanticDescriptor,resourceValue['remainingTimes'][i])
            }
        }
        if (m2mcin['destinationBusLines'] != undefined || m2mcin['destinationBusLines'] != "NA")
        {
            console.log("destinationBusLines");
            var ln=resourceValue['destinationBusLines'].length;
            clearNodes("smartBus:hasDestinationBusLines",semanticDescriptor);
            createNode("smartBus:hasDestinationBusLines",semanticDescriptor,ln,"string","smartBus:busEstimation",true)
            var nodes=semanticDescriptor.getElementsByTagName("smartBus:hasDestinationBusLines");
            for(var i=0;i< nodes.length;i++)
            {
                parseNode(nodes[i],semanticDescriptor,resourceValue['destinationBusLines'][i])
            }
        }
        if (m2mcin['shortId'] != undefined || m2mcin['shortId'] != "NA")
        {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasShortId")[0], semanticDescriptor, resourceValue['shortId'])
        }
        if (m2mcin['remainingStations'] != undefined || m2mcin['remainingStations'] != "NA") {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasRemainingStations")[0], semanticDescriptor, resourceValue['remainingStations'])
        }
        if (m2mcin['companyName'] != undefined || m2mcin['companyName'] != "NA") {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasCompanyName")[0], semanticDescriptor, resourceValue['companyName'])
        }
        if (m2mcin['location'] != undefined || m2mcin['location'] != "NA" )
        {
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasLatitude")[0], semanticDescriptor, resourceValue['location'][0])
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasLongitude")[0], semanticDescriptor, resourceValue['location'][1])
        }
        if (m2mcin['datemodified'] != undefined || m2mcin['datemodified'] != "NA")
        {
            var isoDateTime = new Date(resourceValue['datemodified'] * 1000);
            parseNode(semanticDescriptor.getElementsByTagName("smartBus:hasDateModified")[0], semanticDescriptor, isoDateTime)
        }
        var newsmd = semanticDescriptor
        var XMLSerializer = xmldom.XMLSerializer;
        var newSD = new XMLSerializer().serializeToString(newsmd);
        return newSD
    }
    else
    {
        return xmlDoc;
    }

}
var dictToArray=function (obj,keyflag) {
    var arr=[];
    for (var key in obj)
    {
        if (obj.hasOwnProperty(key)) {
            if (keyflag==true)
            {
                arr.push(key);
            }
            arr.push(obj[key]);
        }
    }
    return arr;

}
var parseNode=function(stem,xmlDoc,resourceValue)
{
    var  node=stem;
    if (node)
    {
       // console.log('childNodes--- '+node.childNodes.length+'value' +resourceValue);
        var textNode = node.childNodes[0];
        if (!textNode)
        {
            // console.log("creating textNode for ",resourceValue)
            textNode = xmlDoc.createTextNode("");
            node.appendChild(textNode);
        }
        textNode.nodeValue = resourceValue;
        textNode.data = resourceValue.toString();
    }
    else
    {
        console.log(' node  does not exist for value--'+resourceValue);
    }

}
var createNode=function(name,xmldocument,count,dataTypeofAttribute,parentNode,flag) {
    // createNode("park:hasChargeType",semanticDescriptor,ln,"string","park:OnStreetParking",true)
    var structure = dataStructureFile.rdfTypeScheme;
    for (var i = 0; i < count; i++)
    {
        var node = xmldocument.getElementsByTagName(parentNode)[0];
        if (node)
        {
            var element = xmldocument.createElement(name)
            if (element && flag == true)
            {
                var textNode = xmldocument.createTextNode("");
                element.appendChild(textNode);
                var att = xmldocument.createAttribute(structure.type);
                att.value = structure.values[dataTypeofAttribute];        // Set the value of the class attribute
                element.setAttributeNode(att)
            }
            xmldocument.getElementsByTagName(parentNode)[0].appendChild(element);
        }
    }
}
var  createNestedNode =function(dictofNodeName,valueDict,parentNode,rootNode,xmldoc,literaldataType,flag)
{
    var structure=dataStructureFile.rdfTypeScheme;
    var node=xmldoc.getElementsByTagName(rootNode)[0];
    var  parentelement = xmldoc.createElement(parentNode)
    if(parentelement)
    {
        for(var i=0;i<dictofNodeName[0].length;i++)
        {
            var item=dictofNodeName[0][i];
            var flag=dictofNodeName[1][i];
            var  element = xmldoc.createElement(item.toString())
            if (element!=undefined && flag==true)
            {
                var  textNode = xmldoc.createTextNode("");
                element.appendChild(textNode);
                var att = xmldoc.createAttribute(structure.type);       // Create a "class" attribute
                att.value = structure.values[literaldataType[i]];              // Set the value of the class attribute
                element.setAttributeNode(att)
                parentelement.appendChild(element);
                parseNode(element,xmldoc,valueDict[i])
            }
        }
        xmldoc.getElementsByTagName(rootNode)[0].appendChild(parentelement);
    }
}
var clearNodes=function (name,xmlDoc)
{
    var ln=xmlDoc.getElementsByTagName(name).length;
    var node=xmlDoc.getElementsByTagName(name);
    for(var i=0;i<ln;i++)
        {
            var root=node[i];
            if (root)
            {
                root.parentNode.removeChild(root);
            }
        }
}
var removeWhitespace=function(xml)
{
    var loopIndex;
    for (loopIndex = 0; loopIndex < xml.childNodes.length; loopIndex++)
    {
        var currentNode = xml.childNodes[loopIndex];

        if (currentNode.nodeType == 1)
        {
            removeWhitespace(currentNode);
        }

        if (!(/\S/.test(currentNode.nodeValue)) && (currentNode.nodeType == 3))
        {
            xml.removeChild(xml.childNodes[loopIndex--]);
        }
    }

}
var updatenodeAtrribute=function (stem,xmlDoc,attribute,newValue)
{
    var  node=stem;
    //var att=node.getAttribute(attribute)
    if (node)
    {
        var textNode = node.childNodes[0];
        node.removeAttribute(attribute);
        var att = xmlDoc.createAttribute(attribute);       // Create a "class" attribute
        att.value = newValue                           // Set the value of the class attribute
        node.setAttributeNode(att)
        var att=node.getAttribute(attribute)
        console.log("Attribute Value=",att)
        // if (!textNode)
        // {
        //     textNode = xmlDoc.createTextNode("");
        //     node.appendChild(textNode);
        //
        // }
        return node;
    }
}
var Base64 = {


    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function(input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }
        return output;
    },


    decode: function(input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }
        output = Base64._utf8_decode(output);
        return output;

    },

    _utf8_encode: function(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

    _utf8_decode: function(utftext) {
        var string = "";
        var i = 0;
        var c =0;
        var c1 = 0;
        var c2=0;
        var c3=0;

        while (i < utftext.length) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

}

var splitResourceArray=function (array) {

    var newArray=[];
    var j=0;
    for(var item in array)
    {
        if (item.split('/').length<=3)
        {
            newArray[j++]=item;
        }
    }
    return newArray
}
var mobiusMqttsubscribe=function (temp)
{

    api.checkResourcesubscription(temp, function (aes)
    {
        var AESattributes = JSON.parse(aes);
        if (AESattributes['m2m:dbg'] == "resource does not exist")
        {
            api.Resourcesubscription(temp, function (sub)
            {
                console.log("subscription=",sub);
                mqtt.subscibeTopic('/'+temp);
            })
        }
        else
        {
            mqtt.subscibeTopic('/'+temp);
        }
    })

}
module.exports.mobiusMqttsubscription=mobiusMqttsubscribe
module.exports.splitArray=splitResourceArray
module.exports.notificationHandling=notif

