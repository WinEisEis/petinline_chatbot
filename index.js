// */ This is the code for the intent "DOGSEARCH" \*

// Latest update on 12 November 

"use strict";

const functions = require("firebase-functions");

// ทำการเชื่อมต่อกับ Firebase และ Cloud functions ในฐานะ Admin
var admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
var db = admin.firestore();

// code นี้ ใช้เพื่อป้องกัน warning จาก firebase 
admin.firestore().settings({ timestampsInSnapshots: true });

// WEBHOOK ACTIVATION
exports.webhook = functions.https.onRequest((request, response) => {

    //print ค่า parameters ที่ request ส่งมา
    console.log("request.body.queryResult.parameters: ", request.body.queryResult.parameters);

    // Initiate variable
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

        // สร้าง list เปล่า เพื่อใช้ในการแสดง carousel ของสิ่งที่ query มา
        var list = [];

        // query ข้อมูลในชั้น subcollection เพื่อที่จะ list สุนัขทุกตัว ในสายพันธุ์ที่ลูกค้าต้องการ
        var dogsRef = db.collection('dogs').doc(params.Dogspecies);

        dogsRef.getCollections()
            .then(collections => {
                collections.forEach(collection => {
                    collection.doc("profile").get()
                        .then(doc => {
                            if (!doc.exists) {
                                console.log('ไม่มีสุนัขสักตัวในสายพันธุ์นี้เลย');
                            } else {
                                var dataofPet = doc.data();
                                console.log('ข้อมูลของสุนัขตัวที่', collection.id, 'มีดังนี้:', doc.data());

                                // ทำการใส่ข้อมูลของสุนัขแต่ละตัวใน db ลงใน list
                                list.push(
                                    {
                                        thumbnailImageUrl: dataofPet.image,
                                        title: dataofPet.dogtype,
                                        text: dataofPet.info,
                                        actions: [
                                            {
                                                type: "message",
                                                label: "Detail",

                                                // จะมีการใส่ข้อมูลทีหลัง
                                                text: "จะให้บอทตอบอะไร เดี๋ยวค่อยว่ากัน"
                                            },
                                            {
                                                type: "message",
                                                label: "Request",
                                                // จะมีการใส่ข้อมูลทีหลัง
                                                text: "อันนี้จะเอายังไงดี"
                                            }
                                        ]
                                    }
                                );

                                console.log("Length:", list.length);
                                console.log("list:", list);

                                console.log(collections.length);
                                if (list.length === collections.length) {
                                    console.log("จำนวนสุนัขทั้งหมดมี =>", list)
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
                                }
                            }
                            return;
                        })
                        .catch(err => {
                            console.log('Error1 getting document', err);
                        });

                });
                return;
            })
            .catch(err => {
                console.log('Error2 getting document', err);
            });
    }
});






