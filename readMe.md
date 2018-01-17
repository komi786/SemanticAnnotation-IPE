Semantic Annotator 
Semantic annotator is a web component that supports annotation of oneM2M resource in Mobius Server Platform. It currently supports smart parking and Bus Information System .

#######################################################
Run commmand: node annotator
#######################################################
Ip Configuration :
-> open the configFil and specify corresponding Mobius Server and MQTT broker IP address.
-> semantic Descriptor resource name can be changed in "smd" variable.
#######################################################
Features:
-> Smart Parking and Bus Information Data annotation
Example:
http://localhost:3000/annotateResource/{csebase}/{target_resourceName}
 Anti-Features
 -It doesn't provide annotation of non subscribed resources
#######################################################
SmartParking
For Single Resource Annotation
1. For Subscription and annotation of iotParking and all level sub children resources
parkingSpot,offStreetParking and onStreetParking
http://host:ip/annotateResource/{csebase}/{parkingEntity}

Bus Information System
2.  For Subscription and annotation of bus information system and all level sub children resources
busLine,busEstimation and busStop http://host:ip/annotateResource/{csebase}/{BusSystemEntity}

---Resource will be subscribed in MQTT and <subscribeToresource> is created (if deosnot exit already)
---on recieving notification regarding new content Instance value, annotation will be added and update automatically.

#######################################################


