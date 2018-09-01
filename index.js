const clova = require('@line/clova-cek-sdk-nodejs');
const express = require('express');
const bodyParser = require('body-parser');

// session管理
let state;

const clovaSkillHandler = clova.Client
    .configureSkill()
    // スキルの起動リクエスト
    .onLaunchRequest(responseHelper => {
        let request = [{
            lang: 'ja',
            type: 'PlainText',
            value: 'ようこそ、どのゲームにしますか？　今は王様ゲームができます',
        }]
        responseHelper.setSpeechList(request);
    })
    // カスタムインテント or ビルトインインテント
    .onIntentRequest(responseHelper => {
        const intent = responseHelper.getIntentName();
        let speech;
        let slots;
        let state;
        switch (intent) {
            // ユーザーのインプットが星座だと判別された場合。第2引数はreprompt(入力が行われなかった場合の聞き返し)をするか否か。省略可。
            case 'typeOfGame':
                // 星座を取得
                slots = responseHelper.getSlots();
                // Slotに登録されていないゲーム名はnullになる
                if (slots.gameType == null) {
                    speech = {
                        lang: 'ja',
                        type: 'PlainText',
                        value: `ゲーム名に誤りがあります。他のゲーム名でお試し下さい。`
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

            case 'numberOfPeople':
                // 人数を取得
                slots = responseHelper.getSlots();
                // Slotに登録されていないゲーム名はnullになる
                console.log(slots.clovaNumber);
                if (slots.clovaNumber == null) {
                    speech = {
                        lang: 'ja',
                        type: 'PlainText',
                        value: `認識できませんでした．もう一度人数を教えてください．`
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

                // todo:ユーザー名取得する

                // 準備する状態にする
                state = "ready"
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
                if(state == 'ready'){
                    // stateを指令モードに書き換える
                    state = 'command'

                    // TODO:DBから取ってくる
                    speech = {
                        lang: 'ja',
                        type: 'PlainText',
                        value: 'ではいきますよー、１番と２番がLINEを交換する！１０秒以内に実行してください！１，２，３，４，５，６，７，８，９，１０！実行できましたか？'
                    }

                    responseHelper.setSimpleSpeech(speech)
                    responseHelper.setSimpleSpeech(speech, true)
                    break;

                }else if(state == 'command'){
                    // stateを準備モードに書き換える
                    state = 'ready'

                    // TODO:DBから取ってくる
                    speech = {
                        lang: 'ja',
                        type: 'PlainText',
                        value: 'いいですね！次の命令にいきますか？'
                    }

                    responseHelper.setSimpleSpeech(speech)
                    responseHelper.setSimpleSpeech(speech, true)
                    break;

                }else{
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
    applicationId:
});
app.post('/clova', clovaMiddleware, clovaSkillHandler);

// リクエストの検証を行わない
//app.post('/clova', bodyParser.json(), clovaSkillHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on ${port}`);
});
