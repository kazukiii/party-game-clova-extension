const clova = require('@line/clova-cek-sdk-nodejs');
const express = require('express');

const clovaSkillHandler = clova.Client
    .configureSkill()
    // スキルの起動リクエスト
    .onLaunchRequest(responseHelper => {
        let request = [{
            lang: 'ja',
            type: 'PlainText',
            value: 'ようこそ、どのゲームにしますか？今は王様ゲームができます',
        }]
        responseHelper.setSpeechList(request);
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
                    // 下記でも可
                    /*
                    responseHelper.setSimpleSpeech(
                      clova.SpeechBuilder.createSpeechText(`星座に誤りがあります。他の星座でお試し下さい。`)
                    );
                    */
                    break;
                }

                speech = [{
                    lang: 'ja',
                    type: 'PlainText',
                    value: '王様ゲームですね、何人でやりますか？'
                }]
                responseHelper.setSpeechList(speech)
                responseHelper.setSpeechList(speech, true)

                break;
            
            // ゲームに参加する人数を取得する
            case 'numberOfPeople':
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
            case 'Clova.NoIntent':
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
    applicationId: ''//process.env.APPLICATION_ID
});
app.post('/clova', clovaMiddleware, clovaSkillHandler);

// リクエストの検証を行わない
//app.post('/clova', bodyParser.json(), clovaSkillHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on ${port}`);
});
