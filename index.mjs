import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';

const devAccount = JSON.parse(fs.readFileSync(path.resolve('./metro-app-dev-f4ab1-firebase-adminsdk-dth49-e6392ae8ff.json'), 'utf-8'));
// import prodAccount from './metroproduction-9bbad-e7233435678d.json' assert { type: "json" };


const senryoUat = JSON.parse(fs.readFileSync(path.resolve('./senryo-revamp-uat-firebase-adminsdk-eldxm-965282d484.json'), 'utf-8'));
// const senryoUat = require('./senryo-revamp-uat-firebase-adminsdk-eldxm-965282d484.json')

initializeApp({
  credential: cert(senryoUat),
});

const pnTokens = [
  // ios
  // 'fKNfcfwwTkROt4enLHZs3f:APA91bGnTyIoEc6M3vBe63SnlD9NNCqM-aqP968WvDq-tOw0OT6g3LVXUsjLkRsxtrI-lSa2SBur-kyxzrS6Dnn1_oMTcQztowtPzWq7IRysyJCgTELx8nk',
  // 'fzo7AmJzHkLvsufg2GRKLW:APA91bGzfhXxuz0X5yBKQ8CN3xV1l3Whn68cjY890q3BvnjFLqJVjokltdNcH5M-qyRobR9DgtxSN7s7kbBPVcfoqU-b29ysPU1H3URsKE2NDMgqR4dtqP0',
  // android
  // 'd7CynPd_Qb6t0JmlmkPatM:APA91bFxepVBXtNRmPZY0caTL9yxICy8hd72ppsbNeAdCdyyR51qfECUhHNaFRGgoO-xtkHXUxfhWJCOlmRX_OIhXLMnNOaYlyyTjIkqS2tUrIEvS8WpunE',
  
  // senryo
  // ios
  'd9wZQC7rz0htuGsvbwrYw1:APA91bHVXz4gXc0HDJyh-D-U7hdSWJ9RfLwxwKx7vbZYC3HZ4FLVC4oyQxFUp1BcbH8I2-E9W7Kik5ATLtF0YnoVzT-hxsUuh3utjnNV6jtmGRpQP9M7XeU',
  // android
  'fa6dwPw3Q_GpllyOSc4lAY:APA91bERbfXNy7UIgrkNsOzdNcuFuFWMtFYuPwyET6uxN2d5vIAAFjSzNpGAUSYco65h31x0UHMGcc0hcI42z0PEiFmx1yboCSJYQOCZLWQ5_FnpVWIMis0',
  'cASOTp65TIeCK2Ea7w_sLP:APA91bFls83Y3nxnJhw2d8uPJ3Uehg233_NascYNQsZ-Dcj2rISF7n4nSm1VSavNWOh-XlKfuDSzM3IqXGGDimFXugKGGTXTRNGKw3cjPuUWW5KGw2gKKus',
  // samsung
  'd2VEflNNTfCTSNAV_DQRb0:APA91bFsgloYuU0lDm67tcLV_uEYkrZf6CP2OYxBqbJ33I_9wDoTHOt66N4icn5qv3_K2veQ1GG1ma44OluYBoX-8C3yTHSBPnpoXEjk8wRDaXyEs3lHHoU'
];
const now = new Date()
const title = `Testing ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
const imagePath = 'https://media-mbst-pub-ue1.s3.amazonaws.com/creatr-uploaded-images/2019-09/08495a20-e329-11e9-a793-fa17a931f371'

// const msg = {
//   notification:{
//     title: `${title} noti`,
//     body: 'Fighting',
//     imageUrl: imagePath
//   },
//   data: {
//     title,
//     body: 'Fighting',
//     sound: 'default',
//     icon: 'ic_launcher',
//     show_in_foreground: 'true',
//
//     smallPicture: imagePath,
//     bigPicture: imagePath,
//
//     // open_action: JSON.stringify({
//     //   type: 'AUDIO',
//     //   param: 'LiveChannel_389',
//     //   openWithApp:true
//     // }),
//     open_action: JSON.stringify({
//       type: 'URL',
//       param: 'https://google.com',
//       openWithApp:false
//     }),
//     navigate:"abc"
//   },
//   android:{
//     priority:'high',
//   },
//   apns: {
//     headers:{
//       'apns-priority': '5'
//     },
//     payload: {
//       aps: {
//         contentAvailable: 1,
//         mutableContent: 1,
//       },
//       notifee_options: {
//         image: imagePath,
//       },
//     },
//   },
//   // tokens: pnTokens,
//   // topic: 'ios'
// }
const msg = {
  notification:{
    title: `${title} noti`,
    body: 'Fighting',
  },
  data: {
    // "contentTc":"升級至千両會籍即可解鎖全年獨家禮遇",
    // "titleEn":"百両會籍升級提示","contentEn":"升級至千両會籍即可解鎖全年獨家禮遇",
    // "members":["1800794186"],
    // "templateMasterGUID":"d37250f1-65f4-45a5-b3c7-4ad3e3cab1b1",
    // "titleTc":"百両會籍升級提示","imageUrlTc":"",
    // "imageUrlEn":"","type":"PERSONAL","push":"ALL",
    "navigate":"INBOX_PERSONAL_MESSAGE",
    "navigateId":"32f5c4fd-b247-4434-89e5-65f68dfef054",
  },
  android:{
    priority:'high',
  },
  apns: {
    headers:{
      'apns-priority': '10'
    },
    payload: {
      aps: {
        contentAvailable: 1,
        mutableContent: 1,
      },
    },
  },
  // tokens: pnTokens,
  // topic: 'ios'
}

// getMessaging().subscribeToTopic(pnTokens, 'android')

// send to topic
// getMessaging().send({
//   topic:'android',
//   ...msg
// })

// console.log("sending", getMessaging().app)
  // send by batch
//
console.log('send multicast')
const sendPn = async () => {
  try {
    const response = await getMessaging().sendEachForMulticast({
      tokens: pnTokens,
      ...msg
    })
    console.log(response)
    console.log("error:", response[1]?.error);
    console.log(title + ` (${response.successCount}/${response.responses.length})`)
  } catch (error) {
    console.log('Error sending message:', error);
  } finally {
    process.exit()
  }
}

sendPn()


