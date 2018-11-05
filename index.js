
"use strict";

const functions = require("firebase-functions");

// เผื่อต้องใช้ในอนาคตเฉยๆ
// const { WebhookClient } = require("dialogflow-fulfillment");
// const { Card, Suggestion } = require("dialogflow-fulfillment");
////

// ทำการเชื่อมต่อกับ Firebase และ Cloud functions
var admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
var db = admin.firestore();

// code นี้ อาจต้องใช้ ถ้ามีการ warning เรื่อง Timestamp snapshot
//db.firestore.settings({ timestampsInSnapshots: true });


// code การทำงานของ function ใน firebase
exports.webhook = functions.https.onRequest((request, response) => {
    //const agent = new WebhookClient({ request, response });

    //print ค่า parameters ที่ request ส่งมา
    console.log("request.body.queryResult.parameters: ", request.body.queryResult.parameters);

    let body = request.body;
    let params = request.body.queryResult.parameters;
    let intent = request.body.queryResult.intent;

    // print original payload เพื่อให้สามารถดู id ของ LINE user นั้นๆได้
    console.log(body.originalDetectIntentRequest.payload);
    // print intent's name, parameter's name
    console.log("This intent is ", intent.displayName);
    console.log("params is", params);
    console.log("params's name is", params.Dogspecies);

    // เริ่มการทำงาน intent dogSearch
    if (intent.displayName === 'dogSearch') {
        var list = []; // สร้าง list เปล่า เพื่อใช้ในการแสดง carousel ของสิ่งที่ query มา
        // ชื่อใน collection จะต้องมีการเปลี่ยนในภายหลัง ไม่ fix ให้เป็น dog เลย
        var dogsRef = db.collection('dogs').doc(params.Dogspecies);

        // get the data of Dogspecies document
        dogsRef.get()
            .then(doc => {
                if (!doc.exists) {
                    console.log('ไม่มีสุนัขพันธุ์นี้อยู่ในระบบครับ');
                } else {
                    console.log('Document data:', doc.data());
                }
            })
            .catch(err => {
                console.log('Error getting document', err);
            });

        // query ข้อมูลในชั้น subcollection เพื่อที่จะ list สุนัขทุกตัว ในสายพันธุ์ที่ลูกค้าต้องการ
        var reff = db.collection('dogs').doc(params.Dogspecies);

        reff.getCollections()
            .then(collections => {
                collections.forEach(collection => {

                    // print ว่าเป็นตัวสุนัขที่เท่าไหร่ ในสายพันธุ์นี้
                    console.log('เจอสุนัข:', collection.id);

                    // retrieve ข้อมูลของสุนัขแต่ละตัว
                    collection.doc("profile").get()
                        .then(doc => {
                            if (!doc.exists) {
                                console.log('ไม่มีสุนัขสักตัวในสายพันธุ์นี้เลย');
                            } else {
                                var data = doc.data;
                                console.log('ข้อมูลของสุนัขตัวที่',collection.id,'มีดังนี้:', doc.data());
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
                            }
                        })
                        .catch(err => {
                            console.log('Error1 getting document', err);
                        });
                        console.log("Length:",list.length);
                        console.log("list:",list);
   
                       

                });
          
            })
            .catch(err => {
                console.log('Error2 getting document', err);
            });

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
                ]
            });
        //จบการ query ทั้งหมด


    }
});







    // จบ function

    // let intentMap = new Map();
    // intentMap.set("dogSearch", specieSearch);
    // agent.handleRequest(intentMap);
