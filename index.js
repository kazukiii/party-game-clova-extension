const clova = require('@line/clova-cek-sdk-nodejs');
const express = require('express');

const clovaSkillHandler = clova.Client
    .configureSkill()
    // スキルの起動リクエスト
    .onLaunchRequest(responseHelper => {
        let speechList = [];
        speechList.push({
            lang: 'ja',
            type: 'PlainText',
            value: 'ようこそ、パーティーゲームへ'
        });
        speechList.push(clova.SpeechBuilder.createSpeechUrl('https://s3-ap-northeast-1.amazonaws.com/clova-party-game/yeah.mp3'));
        speechList.push({
            lang: 'ja',
            type: 'PlainText',
            value: 'どのゲームにしますか？今は王様ゲームができます',
        })
        responseHelper.setSpeechList(speechList);
    })
    // カスタムインテント or ビルトインインテント
    .onIntentRequest(responseHelper => {
        const intent = responseHelper.getIntentName();
        let speech;
        const slots = responseHelper.getSlots();
        switch (intent) {
            // ゲームの種類を取得
            case 'typeOfGame':
                
                // Slotに登録されていないゲーム名はnullになる
                if (slots.gameType == null) {
                    speech = {
                        lang: 'ja',
                        type: 'PlainText',
                        value: `王様ゲームを開始します、何人でやりますか？`
                    }
                    responseHelper.setSimpleSpeech(speech)
                    responseHelper.setSimpleSpeech(speech, true)
                    break;
                }

                speech = [{
                    lang: 'ja',
                    type: 'PlainText',
                    value: '王様ゲームですね、何人でやりますか？',
                }]
                responseHelper.setSpeechList(speech)
                responseHelper.setSpeechList(speech, true)
                
                break;
            
            // ゲームに参加する人数を取得する
            case 'numberOfPeople':
                // 人数を取得
                if (slots.clovaNumber == null) {
                    speech = {
                        lang: 'ja',
                        type: 'PlainText',
                        value: `認識できませんでした．もう一度人数を教えてください．`
                    }
                    responseHelper.setSimpleSpeech(speech)
                    responseHelper.setSimpleSpeech(speech, true)
                    break;
                }

                // todo:ユーザー名取得する

                // 準備する状態にする
                // sessionを使う
                const sessionObject = { state: 'ready' };
                responseHelper.setSessionAttributes(sessionObject)

                speech = [{
                    lang: 'ja',
                    type: 'PlainText',
                    value: `${slots.clovaNumber}人ですね、このゲームではずっとClovaが王様です！どうしてもできない命令はスキップもできるよ！田中さんが１番、山田さんが２番、佐藤さんが３番です。準備はいいですか？`
                }]
                responseHelper.setSpeechList(speech)
                responseHelper.setSpeechList(speech, true)

                break;

            // ビルトインインテント。ユーザーによるインプットが使い方のリクエストと判別された場合
            case 'Clova.GuideIntent':
                speech = {
                    lang: 'ja',
                    type: 'PlainText',
                    value: 'a'
                }
                responseHelper.setSimpleSpeech(speech)
                responseHelper.setSimpleSpeech(speech, true)
                //});
                break;

            // ビルトインインテント。ユーザーによるインプットが肯定/否定/キャンセルのみであった場合
            case 'Clova.YesIntent':
                if(!responseHelper.getSessionAttributes()){
                    break;   
                }

                const state = responseHelper.getSessionAttributes().state;
                console.log(state)
                if(state == 'ready'){
                    // stateを指令モードに書き換える
                    const sessionObject = { state: 'command' };
                    responseHelper.setSessionAttributes(sessionObject)

                    // TODO:DBから取ってくる
                    speech = {
                        lang: 'ja',
                        type: 'PlainText',
                        value: 'ではいきますよー、１番と２番がLINEを交換する！１０秒以内に実行してください！いーち，にーい，さーん，しーい，ごーお，ろーく，なーな，はーち，きゅーう，じゅーう！実行できましたか？'
                    }

                    responseHelper.setSimpleSpeech(speech)
                    responseHelper.setSimpleSpeech(speech, true)
                    break;

                } else if (state == 'command') {
                    // stateを準備モードに書き換える
                    const sessionObject = { state: 'ready' };
                    responseHelper.setSessionAttributes(sessionObject)

                    // TODO:DBから取ってくる
                    speechList.push(clova.SpeechBuilder.createSpeechUrl('https://s3-ap-northeast-1.amazonaws.com/clova-party-game/yeah.mp3'));
                    speechList.push({
                        lang: 'ja',
                        type: 'PlainText',
                        value: 'いいですね！次の命令にいきますか？'
                    })
                    responseHelper.setSpeechList(speechList);
                    break;

                } else {
                    speech = {
                        lang: 'ja',
                        type: 'PlainText',
                        value: 'はいですね'
                    }
                    responseHelper.setSimpleSpeech(speech)
                    responseHelper.setSimpleSpeech(speech, true)
                }
            case 'Clova.NoIntent':
                if (state === 'skip') {
                  speech = [{
                      lang: 'ja',
                      type: 'PlainText',
                      value: `続けます`
                  }]
                }
            case 'Clova.CancelIntent':
                speech = {
                    lang: 'ja',
                    type: 'PlainText',
                    value: `意図しない入力です。${TEMPLATE_INQUIRY}`
                }
                responseHelper.setSimpleSpeech(speech)
                break;
        }
    })
    // スキルの終了リクエスト
    .onSessionEndedRequest(responseHelper => {
    })
    .handle();

const app = new express();
//TODO
// リクエストの検証を行う場合。環境変数APPLICATION_ID(値はClova Developer Center上で入力したExtension ID)が必須
const clovaMiddleware = clova.Middleware({
    applicationId: process.env.APPLICATION_ID
});
app.post('/clova', clovaMiddleware, clovaSkillHandler);

// リクエストの検証を行わない
//app.post('/clova', bodyParser.json(), clovaSkillHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on ${port}`);
});
