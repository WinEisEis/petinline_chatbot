
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
    else if (intent.displayName === 'accessoryList'){
        listofAccessory = [];
        var count = 0;
        var listcount = 0;
        console.log("The params accessoryList is :",params.Pettypes);
        
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
                                                url: accessoryofPet.image,
                                                size: "full",
                                                aspectRatio: "20:13",
                                                aspectMode: "fit",
                                            },
                                            body: {
                                                type: "box",
                                                layout: "vertical",
                                                spacing: "md",

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
                                                            text: `$${accessoryofPet.price}`,
                                                            flex: 0,
                                                            margin: "sm",
                                                            weight: "bold"
                                                        },
                                                        {
                                                            type: "text",
                                                            text: `${accessoryofPet.weight}g`,
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
                                                    text: accessoryofPet.description,
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
                                                    text: `เลือกสินค้า ${accessoryofPet.id} ( ${params.Accessorytypes} )`
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
                              console.log("listcount  = " ,listcount);
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
        else if (intent.displayName === 'accessoryList - add'){
            listofCart = [];
            var amount = 1;
            var userID = body.originalDetectIntentRequest.payload.data.source.userId;
            var price = 0;
            // console.log("The params is :",params.Productid);
            console.log("The params.Productid is :",params.Productid);
            console.log("The params.Accessorytypes is :",params.Accessorytypes);
            console.log("The user ID is:",userID);

            //get product price
            //ไม่ควร query ในส่วนการหาค่าเงิน
            var getPrice = db.collection('accessory').doc(params.Accessorytypes);
            getPrice.getCollections().then(collections => {
            collections.forEach(collection => {
                // console.log('Found subcollection with id:', collection.id);
                collection.doc("info").get()
                .then(doc => {
                    if (!doc.exists) {
                        console.log('ไม่มี accessory ที่้ต้องการ');
                    } else {
                        // console.log('elelel',params.Productid,doc.data().id);
                        console.log("1.",params.Productid,'2.',doc.data().id)
                        if(doc.data().id === params.Productid){
                            console.log("match");
                            price = doc.data().price;
                            console.log(price);
                            // console.log('match');
                        }
                    }
                    return;
                }).catch(err => {
                    console.log('Error getting document', err);
                });
                return;
                });
                //end of then

            //Add product to user cart
            var usersRef = db.collection('carts').doc(userID);

            usersRef.get()
            .then((docSnapshot) => {
                if (docSnapshot.exists) {
                    console.log("User exist!!");
                    //check the product exist?
                    usersRef.getCollections().then(collections => {
                        collections.forEach(collection => {
                            collection.doc(params.Productid).get()
                                .then(doc => {
                                    if (!doc.exists) {
                                        console.log('No product in cart');
                                        amount = 1;
                                        //add product to cart
                                        usersRef.collection('cart').doc(params.Productid).set({
                                            id: params.Productid,
                                            amount: amount,
                                            price: price,
                                            type: params.Accessorytypes
                                        });
                                    } else {
                                        console.log('Found subcollection with id:', collection.id);
                                        console.log('Item',doc.data());
                                        var updateAmount = doc.data().amount + 1;
                                        //update the amount of product
                                        usersRef.collection('cart').doc(params.Productid).update({
                                            amount: updateAmount
                                        })
                                    }
                                    return;
                                }).catch(err => {
                                    console.log('Error getting document', err);
                                });
                                return;
                        });
                    return;
                    }).catch(err => {
                            console.log('Error getting document', err);
                    });
                    console.log('amount is: ',amount);


                } else {
                //usersRef.set({...})
                console.log("User does not exist");
                db.collection("carts").doc(userID).collection('cart').doc(params.Productid).set({
                    id: params.Productid,
                    amount: amount,
                    price: price,
                    type: params.Accessorytypes
                });
                //add field
                db.collection('carts').doc(userID).set({
                // ...
                    name: "user"
                });
                }
                return;
            }).catch(err => {
                console.log('Error getting document', err);
             });
             //end of then

                return;
            }).catch(err => {
                console.log('Error getting document', err);
            });
            // console.log("The price is:",price);


             response.send({
                "fulfillmentText": `เพิ่มสินค้าลงตะกร้าเรียบร้อย`
              });
            //end
          }
        else if(intent.displayName === 'cart'){
            var list = [];
            var responseSum = '';
            var userID_cart = body.originalDetectIntentRequest.payload.data.source.userId;
            var totalPrice = 1;
            var cartList = [];
            var cartCheck = db.collection('carts').doc(userID_cart).collection('cart');
            cartCheck.get()
              .then(snapshot => {
                if (!snapshot.exists) {
                    response.send({
                        "fulfillmentMessages": [
                            {
                                "text": {
                                  "text": [
                                    `ไม่มีของในตะกร้า`
           
                                  ]
                                }
                              }
                        ],
                      });
                }
                else{
                  snapshot.forEach(doc => {
                  var data = doc.data();
                  console.log(data);
                  list.push({product: doc.id, amount: data.amount, price: data.price});
                  var sumPrice = data.price * data.amount;
                  totalPrice += sumPrice;
                  //need to get information of each product
                //   var findAcc = db.collection('accessory').doc(data.type).getCollections().then(collections => {
                //     collections.forEach(collection => {
                //         // console.log('Found subcollection with id:', collection.id);
                //         collection.doc("info").get()
                //         .then(assdoc => {
                //             if(assdoc.id === ){}
                //         })
                //     })
                //    })
                   //push data to show
                  cartList.push(
                    {
                        type: "bubble",
                        hero: {
                            type: "image",
                            url: "https://www.picz.in.th/images/2018/11/05/3T2umu.jpg",
                            size: "full",
                            aspectRatio: "20:13",
                            aspectMode: "fit",
                            action: {
                            type: "uri",
                            label: "Line",
                            uri: "https://linecorp.com/"
                            }
                        },
                        body: {
                            type: "box",
                            layout: "vertical",
                            contents: [
                            {
                                type: "text",
                                text: `${doc.id}`,
                                size: "xl",
                                weight: "bold"
                            },
                            {
                                type: "box",
                                layout: "vertical",
                                spacing: "sm",
                                margin: "lg",
                                contents: [
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                    {
                                        type: "text",
                                        text: "Detail",
                                        flex: 1,
                                        size: "sm",
                                        color: "#AAAAAA"
                                    },
                                    {
                                        type: "text",
                                        text: "Canine Cuisine Grilled Steak & Eggs Flavor in Meaty Juices is formulated to meet",
                                        flex: 5,
                                        size: "sm",
                                        color: "#666666",
                                        wrap: true
                                    }
                                    ]
                                },
                                {
                                    type: "box",
                                    layout: "baseline",
                                    spacing: "sm",
                                    contents: [
                                    {
                                        type: "text",
                                        text: "Size",
                                        flex: 1,
                                        size: "sm",
                                        color: "#AAAAAA"
                                    },
                                    {
                                        type: "text",
                                        text: "Large ($3.35)",
                                        flex: 5,
                                        size: "sm",
                                        color: "#666666",
                                        wrap: true
                                    },
                                    {
                                        type: "icon",
                                        url: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/restaurant_large_32.png"
                                    }
                                    ]
                                }
                                ]
                            }
                            ]
                        },
                        footer: {
                            type: "box",
                            layout: "vertical",
                            flex: 0,
                            spacing: "sm",
                            contents: [
                            {
                                type: "button",
                                action: {
                                type: "message",
                                label: "Add 1 more",
                                text: "Add 1 more"
                                },
                                color: "#1096C1",
                                height: "sm",
                                style: "primary"
                            },
                            {
                                type: "button",
                                action: {
                                type: "message",
                                label: "Cancel Order",
                                text: "Cancel Order"
                                },
                                height: "sm",
                                style: "link"
                            }
                            ]
                        }

                    }
                    );
                });
            }
                console.log(list);
                console.log(list.length);
                for (var i = 0; i<list.length; i++) {
                  responseSum += `${list[i].product} ${list[i].amount} ลูก`
                  if (i !== list.length-1) {
                    responseSum += "\n";
                  }
                }
                console.log(responseSum);
                response.send({
                    "fulfillmentMessages": [
                        {
                            "text": {
                              "text": [
                                `${responseSum}\nราคารวม: ${totalPrice}`
       
                              ]
                            }
                          },
                        {
                          "payload": {
                            "line": {
                               "type": "flex",
                               "altText": "Flex Message",
                               "contents": {
                               "type": "carousel",
                               "contents": cartList
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







    // จบ function

    // let intentMap = new Map();
    // intentMap.set("dogSearch", specieSearch);
    // agent.handleRequest(intentMap);
    // {
    //     "line": {
    //       "type": "flex",
    //       "altText": "Flex Message",
    //       "contents": {
    //         "type": "carousel",
    //         "contents": [
    //             {
    //                 "type": "bubble",
    //                 "hero": {
    //                   "type": "image",
    //                   "url": "https://www.picz.in.th/images/2018/11/05/3T2umu.jpg",
    //                   "size": "full",
    //                   "aspectRatio": "20:13",
    //                   "aspectMode": "fit",
    //                   "action": {
    //                     "type": "uri",
    //                     "label": "Line",
    //                     "uri": "https://linecorp.com/"
    //                   }
    //                 },
    //                 "body": {
    //                   "type": "box",
    //                   "layout": "vertical",
    //                   "contents": [
    //                     {
    //                       "type": "text",
    //                       "text": "Cesar Sunrise Food",
    //                       "size": "xl",
    //                       "weight": "bold"
    //                     },
    //                     {
    //                       "type": "box",
    //                       "layout": "vertical",
    //                       "spacing": "sm",
    //                       "margin": "lg",
    //                       "contents": [
    //                         {
    //                           "type": "box",
    //                           "layout": "baseline",
    //                           "spacing": "sm",
    //                           "contents": [
    //                             {
    //                               "type": "text",
    //                               "text": "Detail",
    //                               "flex": 1,
    //                               "size": "sm",
    //                               "color": "#AAAAAA"
    //                             },
    //                             {
    //                               "type": "text",
    //                               "text": "Canine Cuisine Grilled Steak & Eggs Flavor in Meaty Juices is formulated to meet",
    //                               "flex": 5,
    //                               "size": "sm",
    //                               "color": "#666666",
    //                               "wrap": true
    //                             }
    //                           ]
    //                         },
    //                         {
    //                           "type": "box",
    //                           "layout": "baseline",
    //                           "spacing": "sm",
    //                           "contents": [
    //                             {
    //                               "type": "text",
    //                               "text": "Size",
    //                               "flex": 1,
    //                               "size": "sm",
    //                               "color": "#AAAAAA"
    //                             },
    //                             {
    //                               "type": "text",
    //                               "text": "Large ($3.35)",
    //                               "flex": 5,
    //                               "size": "sm",
    //                               "color": "#666666",
    //                               "wrap": true
    //                             },
    //                             {
    //                               "type": "icon",
    //                               "url": "https://scdn.line-apps.com/n/channel_devcenter/img/fx/restaurant_large_32.png"
    //                             }
    //                           ]
    //                         }
    //                       ]
    //                     }
    //                   ]
    //                 },
    //                 "footer": {
    //                   "type": "box",
    //                   "layout": "vertical",
    //                   "flex": 0,
    //                   "spacing": "sm",
    //                   "contents": [
    //                     {
    //                       "type": "button",
    //                       "action": {
    //                         "type": "message",
    //                         "label": "Add 1 more",
    //                         "text": "Add 1 more"
    //                       },
    //                       "color": "#1096C1",
    //                       "height": "sm",
    //                       "style": "primary"
    //                     },
    //                     {
    //                       "type": "button",
    //                       "action": {
    //                         "type": "message",
    //                         "label": "Cancel Order",
    //                         "text": "Cancel Order"
    //                       },
    //                       "height": "sm",
    //                       "style": "link"
    //                     }
    //                   ]
    //                 }
    //               }
    //             ]
    //           }
    //         }
    //       }