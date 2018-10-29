const functions = require('firebase-functions');
var admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

var db = admin.firestore();

exports.webhook = functions.https.onRequest((request, response) => {
   console.log("request.body.queryResult.parameters: ", request.body.queryResult.parameters);
   //print ค่า parameters ที่ request ส่งมา
   let body =  request.body;
   let params = request.body.queryResult.parameters;
   let intent = request.body.queryResult.intent;
   console.log(body.originalDetectIntentRequest.payload);
   //print original payload เช่น payload ของ line
   console.log(intent.displayName);
   //print ชื่อ intent
   var now = new Date();
   console.log(now);
   if (intent.displayName === "support.request_service") {
       //intent = support.request_service
       var servicesRef = db.collection('services').doc(params.services);
       //get doc ของ service โดยชื่อของ doc ที่นำไป query ได้ค่าจาก parameter ของ request ที่ได้มาจาก dialogflow
       servicesRef.get()
           .then(doc => {
               data = doc.data(); //อ้างอิงถึง data ของ doc
               console.log(data.name);
               response.send({
                   //ส่งโดยกำหนดค่า fulfillmentMessages ของ response object ให้มี custom payload
                   //เป็น line template buttons
                   "fulfillmentMessages": [
                       {
                         "payload": {
                           "line": {
                             "type": "template",
                             "altText": "Service",
                             "template": {
                               "type": "buttons",
                               "thumbnailImageUrl": data.pic,
                               "imageAspectRatio": "rectangle",
                               "imageSize": "cover",
                               "imageBackgroundColor": "#FFFFFF",
                               "title": data.name,
                               "text": `หากสนใจใช้บริการ สามารถกดปุ่มด้านล่างได้เลยครับ`,
                               "defaultAction": {
                                   "type": "uri",
                                   "label": "View detail",
                                   "uri": data.url
                               },
                               "actions": [
                                 {
                                   "type": "message",
                                   "label": "Request this service",
                                   "text": `ใช่`
                                 },
                                 {
                                   "type": "uri",
                                   "label": "View detail",
                                   "uri": data.url
                                 },
                                 {
                                   "type": "uri",
                                   "label": "Tel",
                                   "uri": "tel:020165000"
                                 }
                               ]
                             }
                           }
                         }
                       }
                   ],
               });
               return;
           })
           .catch(err => {
               console.log('Error getting documents', err);
           });
   }
   else if (intent.displayName === "support.services") {
       //intent = support.services
       var list = [];
       var servicesRef2 = db.collection('services');
       //get all services
       servicesRef2.get()
           .then(snapshot => {
               snapshot.forEach(doc => {
                   var data = doc.data();
                   console.log(data.name);
                   //ทำ list สำหรับ template carousel ของ line
                   list.push(
                       {
                           "thumbnailImageUrl": data.pic,
                           "imageBackgroundColor": "#FFFFFF",
                           "text": data.name,
                           "defaultAction": {
                               "type": "message",
                               "label": "Request",
                               "text": doc.id
                           },
                           "actions": [
                               {
                                   "type": "message",
                                   "label": "View",
                                   "text": doc.id
                               },
                           ]
                       }
                   );
               });
               console.log(list.length);
               console.log(list);
               response.send({
                   "fulfillmentMessages": [
                       {
                         "payload": {
                           "line": {
                               "type": "template",
                               "altText": "Services",
                               "template": {
                                 "type": "carousel",
                                 "columns": list 
                               }
                           }
                         }
                       }
                   ],
               });
               return;
           })
           .catch(err => {
               console.log('Error getting documents', err);
           });
   }
});

