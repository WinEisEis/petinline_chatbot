
"use strict";

const functions = require("firebase-functions");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Card, Suggestion } = require("dialogflow-fulfillment");

var admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
var db = admin.firestore();



exports.webhook = functions.https.onRequest((request, response) => {
    //const agent = new WebhookClient({ request, response });

    //print ค่า parameters ที่ request ส่งมา
    console.log("request.body.queryResult.parameters: ", request.body.queryResult.parameters);


    let body = request.body;
    let params = request.body.queryResult.parameters;
    let intent = request.body.queryResult.intent;

    // print original payload สามารถดู id ของ LINE user นั้นๆได้
    console.log(body.originalDetectIntentRequest.payload);
    // print intent's name
    console.log("This intent is ", intent.displayName);
    console.log("params is", params);
    console.log("params's name is", params.Dogspecies);
    
    // เริ่มการทำงาน intent dogSearch
    if (intent.displayName === 'dogSearch') {
        var list = [];
        var dogsRef = db.collection('dogs').doc(params.Dogspecies);
        console.log("inside the loop");
        //get all dogs
        dogsRef.get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    // ตัวแปร data ก็คือข้อมูลใน doc นั้นๆทั้งหมด
                    var data = doc.data();
                    console.log("It is: ", data.dogtype);

                    //ทำ list สำหรับ carousel 
                    list.push(
                        {
                            "thumbnailImageUrl": data.image,
                            "title": data.dogtype,
                            "text": data.info,
                            "actions": [
                                {
                                    "type": "message",
                                    "label": "Detail",
                                    "text": "Detail"
                                },
                                {
                                    "type": "message",
                                    "label": "Request",
                                    "text": "Request"
                                }
                            ]

                        }
                    );

                });

                //จบ loop 'for each'
                console.log(list.length);
                console.log(list);
                response.send({
                    "fulfillmentMessages": [
                        {
                            "payload": {
                                "line": {
                                    "type": "template",
                                    "altText": "dogSearch",
                                    "template": {
                                        "type": "carousel",
                                        "columns": list
                                    }
                                }
                            }
                        }
                    ],
                });
            })
            .catch(err => {
                console.log('Error getting documents', err);
            });
    }



    // จบ function

    // let intentMap = new Map();
    // intentMap.set("dogSearch", specieSearch);
    // agent.handleRequest(intentMap);
});
