/// <reference path="notion.ts" />
/// <reference types="google-apps-script" />

const SLACK_API_TOKEN =
  PropertiesService.getScriptProperties().getProperty('SLACK_API_TOKEN');
const CHANNEL_ID =
  PropertiesService.getScriptProperties().getProperty('CHANNEL_ID');

function doPost(e: GoogleAppsScript.Events.DoPost) {
  // 届いたリクエストがショートカットからのものか、モーダルからのものかを判定
  if (e.parameter.payload) {
    const payload = JSON.parse(e.parameter.payload);
    // ショートカットからのリクエストの場合
    // モーダルを開く
    if (
      payload.type === 'shortcut' &&
      payload.callback_id === 'output_button_callback'
    ) {
      openSubmissionModal(payload.trigger_id);
      // モーダルからのリクエストの場合
    } else if (payload.type === 'view_submission') {
      // モーダルの入力内容をチャンネルに投稿
      handleSubmit(payload);
    }
  }
  return ContentService.createTextOutput();
}

function doGet(e: GoogleAppsScript.Events.DoGet) {
  return ContentService.createTextOutput('Hello World');
}


// モーダルを開く処理
const openSubmissionModal = (trigger_id: string) => {
  const blocks = createModalBlocks();
  // モーダルを開くためのリクエストを送信
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post' as GoogleAppsScript.URL_Fetch.HttpMethod,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SLACK_API_TOKEN}`,
    },
    payload: JSON.stringify({
      trigger_id: trigger_id,
      view: {
        type: 'modal',
        title: {
          type: 'plain_text',
          text: '投稿フォーム',
        },
        close: {
          type: 'plain_text',
          text: '閉じる',
        },
        submit: {
          type: 'plain_text',
          text: '送信',
        },
        blocks: blocks,
      },
    }),
  };

  try {
    UrlFetchApp.fetch('https://slack.com/api/views.open', options);
  } catch (error) {
    console.error('Error: ', error);
    return ContentService.createTextOutput('Error: ' + error);
  }
};

// モーダルの入力内容を受け取るためのPayloadの型定義
interface Payload {
  view: {
    state: {
      values: {
        title_block: {
          title_textbox: {
            value: string;
          };
        };
        url_block: {
          url_textbox: {
            value: string;
          };
        };
        comment_block: {
          comment_textbox: {
            value: string;
          };
        };
      };
    };
  };
  user: {
    id: string;
  };
}

// ogpを取得する関数
function getOgpImageUrl(url: string): string | null {
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'get',
  };
  const response = UrlFetchApp.fetch(url, options);
  const content = response.getContentText();
  const ogImageMatch = content.match(/<meta property="og:image" content="([^"]*)"/i);

  return ogImageMatch ? ogImageMatch[1] : null;
}



// モーダルの入力内容をチャンネルに投稿する処理
const handleSubmit = (payload: Payload) => {
  const payloadValues = payload.view.state.values;
  const title = payloadValues.title_block.title_textbox.value;
  const url = payloadValues.url_block.url_textbox.value;
  const comment = payloadValues.comment_block.comment_textbox.value;
  const userId = payload.user.id;
  const mention = `<@${userId}>`;
  const userInfo = getUserInfo(payload.user.id);
  const displayName = userInfo.profile.display_name;
  // const userIconUrl = "https://avatars.slack-edge.com/2023-01-17/4677480924272_7fb9b35f5bcf8430f7cf_192.png";
  const userIconUrl = userInfo.profile.image_192;
  const slackTs = sendOutput(title, url, comment, mention);
  const coverImageUrl = getOgpImageUrl(url); // OGP画像のURLを取得

  // ここでcreateNotionPage関数を呼び出し、slackTsを渡す
  createNotionPage(title, url, comment, userId, displayName, userIconUrl, slackTs, coverImageUrl);

  const response = {
    response_action: 'clear',
  };

  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(
    ContentService.MimeType.JSON
  );
};

// モーダルのブロックを作成する処理
const createModalBlocks = () => {
  return [
    {
      type: 'input',
      block_id: 'title_block',
      label: {
        type: 'plain_text',
        text: '記事のタイトル',
        emoji: true,
      },
      element: {
        type: 'plain_text_input',
        action_id: 'title_textbox',
        placeholder: {
          type: 'plain_text',
          text: '記事のタイトルを記載してください',
          emoji: true,
        },
      },
    },
    {
      type: 'input',
      block_id: 'url_block',
      label: {
        type: 'plain_text',
        text: '記事のURL',
        emoji: true,
      },
      element: {
        type: 'plain_text_input',
        action_id: 'url_textbox',
        placeholder: {
          type: 'plain_text',
          text: '記事のURLを記載してください',
          emoji: true,
        },
      },
    },
    {
      type: 'input',
      block_id: 'comment_block',
      label: {
        type: 'plain_text',
        text: '一言コメント',
        emoji: true,
      },
      element: {
        type: 'plain_text_input',
        action_id: 'comment_textbox',
        placeholder: {
          type: 'plain_text',
          text: 'どんな記事かを記載してください',
          emoji: true,
        },
        multiline: true,
      },
    },
  ];
};

// Slackのユーザー情報を取得する関数
const getUserInfo = (userId: string) => {
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'get' as GoogleAppsScript.URL_Fetch.HttpMethod,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${SLACK_API_TOKEN}`,
    },
  };

  const response = UrlFetchApp.fetch(
    `https://slack.com/api/users.info?user=${userId}`,
    options
  );
  const jsonResponse = JSON.parse(response.getContentText());

  if (jsonResponse.ok) {
    return jsonResponse.user;
  } else {
    throw new Error('Error getting user info from Slack');
  }
};

// チャンネルに投稿する処理
const sendOutput = (
  title: string,
  url: string,
  comment: string,
  mention: string
): string => {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '新しいアウトプットが投稿されたよ :tada:',
        emoji: true,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*タイトル:*\n<${url}|${title}>`,
        },
        {
          type: 'mrkdwn',
          text: `*投稿者:*\n${mention}`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*一言コメント*\n\`\`\`${comment}\`\`\``,
      },
    },
  ];

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post' as GoogleAppsScript.URL_Fetch.HttpMethod,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SLACK_API_TOKEN}`,
    },
    payload: JSON.stringify({
      channel: CHANNEL_ID,
      blocks: blocks,
    }),
  };

  const response = UrlFetchApp.fetch(
    'https://slack.com/api/chat.postMessage',
    options
  );
  const jsonResponse = JSON.parse(response.getContentText());

  if (jsonResponse.ok) {
    return jsonResponse.ts;
  } else {
    throw new Error('Error posting message to Slack');
  }
};

