
// "use strict";

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
admin.firestore().settings({ timestampsInSnapshots: true });


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
    

    // เริ่มการทำงาน intent dogSearch
    if (intent.displayName === 'dogSearch') {
      console.log("params's name is", params.Dogspecies);
         // สร้าง list เปล่า เพื่อใช้ในการแสดง carousel ของสิ่งที่ query มา
        list = [];
        
        // ชื่อใน collection จะต้องมีการเปลี่ยนในภายหลัง ไม่ fix ให้เป็น dog เลย
        
        // query ข้อมูลในชั้น subcollection เพื่อที่จะ list สุนัขทุกตัว ในสายพันธุ์ที่ลูกค้าต้องการ
        var reff = db.collection('dogs').doc(params.Dogspecies);

        reff.getCollections()
            .then(collections => {
                collections.forEach(collection => {

                    // In ForEach loop
                    // retrieve ข้อมูลของสุนัขแต่ละตัว
                    collection.doc("profile").get()
                        .then(doc => {
                            if (!doc.exists) {
                                console.log('ไม่มีสุนัขสักตัวในสายพันธุ์นี้เลย');
                            } else {
                                
                                var dataofPet = doc.data();
                                console.log('ข้อมูลของสุนัขตัวที่pon', collection.id, 'มีดังนี้:', doc.data());
                                console.log('dog type :',dataofPet.dogtype);

                                list.push(
                                  {
                                      thumbnailImageUrl: dataofPet.image,
                                      title: dataofPet.dogtype,
                                      text: dataofPet.info,
                                      actions: [
                                          {
                                              type: "message",
                                              label: "Detail",
                                              text: "Detail"
                                          },
                                          {
                                              type: "message",
                                              label: "Request",
                                              text: "Request"
                                          }
                                      ]

                                  }
                              );
                              console.log('number of array: ',collections.length);
                              console.log('number of list: ',list.length);
                              if(collections.length === list.length){
                                console.log("List out of then:",list);
                                response.send({
                                 "fulfillmentMessages": [
                                     {
                                       "payload": {
                                         "line": {
                                             "type": "template",
                                             "altText": "this is a carousel template",
                                             "template": {
                                               "type": "carousel",
                                               "actions": [],
                                               "columns": list
                                               }
                                             }
                                       }
                                     }
                                 ],
                               });
                               return;
                              }
                            }
                            return;
                        }).catch(err => {
                          console.log('Error1 getting document', err);
                      });
                     
                });
                return;

            })
            .catch(err => {
                console.log('Error2 getting document', err);
            });


        //จบการ query ทั้งหมด

    }
    else if (intent.displayName === 'petType'){
      listofPet = []
      console.log("The params.PetTypes is :",params.Pettype);
      var petreff = db.collection(params.Pettype);
      var showReff = petreff.get().then(snapshot => {
        snapshot.forEach(doc => {
          console.log("In petType:",doc.id, '=>', doc.data());
          listofPet.push(
            {
                thumbnailImageUrl: "https://firebasestorage.googleapis.com/v0/b/petinline-64d57.appspot.com/o/labrador.jpg?alt=media&token=d178eddf-5ded-4619-848c-519bb40362e4",
                title: params.Pettype,
                text: doc.id,
                actions: [
                    {
                        type: "message",
                        label: "Select",
                        text: doc.id
                    }
                ]

            }
           );
           console.log("petreff.length:",petreff.length);
           console.log("listofPet.length:",listofPet.length);
           if(petreff.length === listofPet.length){
            console.log("List out of then:",listofPet);
            response.send({
             "fulfillmentMessages": [
                 {
                   "payload": {
                     "line": {
                         "type": "template",
                         "altText": "this is a carousel template",
                         "template": {
                           "type": "carousel",
                           "actions": [],
                           "columns": list
                           }
                         }
                   }
                 }
             ],
           });
           return;
            }

        });
        return;
      }).catch(err => {
        console.log('Error in petType getting documents', err);
      });
    return;
    }
});







    // จบ function

    // let intentMap = new Map();
    // intentMap.set("dogSearch", specieSearch);
    // agent.handleRequest(intentMap);
