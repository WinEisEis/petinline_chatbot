
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
    //this loop is for the user to search for pet
    else if (intent.displayName === 'petType'){
      listofPet = [];
      console.log("The params.PetTypes is :",params.Pettypes);
      var petreff = db.collection(params.Pettypes);
      var showReff = petreff.get().then(snapshot => {
        snapshot.forEach(doc => {
          console.log("In petType:",doc.id, '=>', doc.data());
          var docQuery = doc.data();
          listofPet.push(
            {
                thumbnailImageUrl: "https://firebasestorage.googleapis.com/v0/b/petinline-64d57.appspot.com/o/labrador.jpg?alt=media&token=d178eddf-5ded-4619-848c-519bb40362e4",
                title: doc.id,
                text: "docQuery.description",
                actions: [
                    {
                        type: "message",
                        label: "Select",
                        text: doc.id
                    }
                ]

            }
           );
          

        });
        console.log("ListofPet is :",listofPet);
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
                          "columns": listofPet
                          }
                        }
                  }
                }
            ],
          });
        return;
      }).catch(err => {
        console.log('Error in petType getting documents', err);
      });
    return;
    }
    else if (intent.displayName === 'accessoryLIist'){
        listofAccessory = [];
        var count = 0;
        var listcount = 0;
        console.log("The params accessoryLIist is :",params.Pettypes);
        
        var accreff = db.collection('accessory').doc(params.Accessorytypes);

        accreff.getCollections()
            .then(collections => {
                collections.forEach(collection => {

                    // In ForEach loop
                    // retrieve ข้อมูลของสุนัขแต่ละตัว
                    collection.doc("info").get()
                        .then(doc => {
                            if (!doc.exists) {
                                console.log('ไม่มี accessory ที่้ต้องการ');
                            } else {
                                
                                var accessoryofPet = doc.data();
                                console.log('ข้อมูลของ accessory: ', collection.id, 'มีดังนี้:', doc.data());
                                console.log('accessory of pet type :',accessoryofPet.type);
                                if(params.Pettypes === accessoryofPet.type){
                                    count ++;
                                    listofAccessory.push(
                                        {
                                                                                      
                                            type: "bubble",
                                            hero: {
                                                type: "image",
                                                url: "https://www.picz.in.th/images/2018/11/05/3TsH61.png",
                                                size: "full",
                                                aspectRatio: "20:13",
                                                aspectMode: "fit",
                                                action: {
                                                type: "uri",
                                                label: "Action",
                                                uri: "https://linecorp.com"
                                                }
                                            },
                                            body: {
                                                type: "box",
                                                layout: "vertical",
                                                spacing: "md",
                                                action: {
                                                type: "uri",
                                                label: "Action",
                                                uri: "https://linecorp.com"
                                                },
                                                contents: [
                                                {
                                                    type: "text",
                                                    text: accessoryofPet.name,
                                                    size: "xl",
                                                    weight: "bold"
                                                },
                                                {
                                                    type: "box",
                                                    layout: "vertical",
                                                    spacing: "sm",
                                                    contents: [
                                                    {
                                                        type: "box",
                                                        layout: "baseline",
                                                        contents: [
                                                        {
                                                            type: "icon",
                                                            url: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/restaurant_regular_32.png"
                                                        },
                                                        {
                                                            type: "text",
                                                            text: "$10.5",
                                                            flex: 0,
                                                            margin: "sm",
                                                            weight: "bold"
                                                        },
                                                        {
                                                            type: "text",
                                                            text: "400kcl",
                                                            size: "sm",
                                                            align: "end",
                                                            color: "#AAAAAA"
                                                        }
                                                        ]
                                                    }
                                                    ]
                                                },
                                                {
                                                    type: "text",
                                                    text: "Sauce, Onions, Pickles, Lettuce & Cheese",
                                                    size: "xxs",
                                                    color: "#AAAAAA",
                                                    wrap: true
                                                }
                                                ]
                                            },
                                            footer: {
                                                type: "box",
                                                layout: "vertical",
                                                contents: [
                                                {
                                                    type: "spacer",
                                                    size: "sm"
                                                },
                                                {
                                                    type: "button",
                                                    action: {
                                                    type: "message",
                                                    label: "Add to Cart",
                                                    text: "Add to Cart"
                                                    },
                                                    color: "#905C44",
                                                    style: "primary"
                                                },
                                                {
                                                    type: "separator",
                                                    margin: "md"
                                                }
                                                ]
                                            }
                                            }

                                        
                                    );
                                }
                                
                              console.log('number of array: ',collections.length);
                              console.log('number of listofAccessory: ',listofAccessory.length);
                              console.log('count is',count);
                              listcount = collections.length - count;
                              if(listcount === listofAccessory.length){
                                listofAccessory.push(
                                    {

                                        type: "bubble",
                                        direction: "rtl",
                                        body: {
                                            type: "box",
                                            layout: "vertical",
                                            spacing: "xs",
                                            contents: [
                                            {
                                                type: "button",
                                                action: {
                                                type: "uri",
                                                label: "See more",
                                                uri: "https://linecorp.com"
                                                },
                                                flex: 1,
                                                gravity: "center"
                                            }
                                            ]
                                        }

                                        

                                    }
                                );
                                console.log("listofAccessory out of then:",listofAccessory);
                                response.send({
                                 "fulfillmentMessages": [
                                     {
                                       "payload": {
                                         "line": {
                                            "type": "flex",
                                            "altText": "Flex Message",
                                            "contents": {
                                            "type": "carousel",
                                            "contents": listofAccessory
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

});







    // จบ function

    // let intentMap = new Map();
    // intentMap.set("dogSearch", specieSearch);
    // agent.handleRequest(intentMap);
