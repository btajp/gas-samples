const SLACK_API_TOKEN = PropertiesService.getScriptProperties().getProperty('SLACK_API_TOKEN');
const CHANNEL_ID = PropertiesService.getScriptProperties().getProperty('CHANNEL_ID');

function doPost(e) {
  if (e.parameter.payload) {
    const payload = JSON.parse(e.parameter.payload);
    const response_url = payload.response_url;

    if (payload.type === 'block_actions') {
      processForm(payload);
      return ContentService.createTextOutput();
    }
  } else {
    const response_url = e.parameter.response_url;
    const blocks = createFormBlocks();

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SLACK_API_TOKEN}`,
      },
      payload: JSON.stringify({
        response_type: 'ephemeral',
        text: "フォームを表示しています...",
        blocks: blocks,
      }),
    };

    try {
      UrlFetchApp.fetch(response_url, options);
    } catch (error) {
      console.error("Error: ", error);
      return ContentService.createTextOutput("Error: " + error);
    }
  }

  return ContentService.createTextOutput();
}


function createFormBlocks() {
  return [
    {
      type: 'section',
      block_id: 'section1234',
      text: {
        type: 'mrkdwn',
        text: 'フォームを入力してください。',
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '送信',
          emoji: true,
        },
        value: 'click_me_1234',
        action_id: 'button1234',
      },
    },
    {
      type: 'input',
      block_id: 'input1234',
      label: {
        type: 'plain_text',
        text: '記事のタイトル',
        emoji: true,
      },
      element: {
        type: 'plain_text_input',
        action_id: 'plain_text_input1234',
        placeholder: {
          type: 'plain_text',
          text: '記事のタイトルを記載してください',
          emoji: true,
        },
      },
    },
    {
      type: 'input',
      block_id: 'input2345',
      label: {
        type: 'plain_text',
        text: '記事のURL',
        emoji: true,
      },
      element: {
        type: 'plain_text_input',
        action_id: 'plain_text_input2345',
        placeholder: {
          type: 'plain_text',
          text: '記事のURLを記載してください',
          emoji: true,
        },
      },
    },
    {
      type: 'input',
      block_id: 'input3456',
      label: {
        type: 'plain_text',
        text: '一言コメント',
        emoji: true,
      },
      element: {
        type: 'plain_text_input',
        action_id: 'plain_text_input3456',
        placeholder: {
          type: 'plain_text',
          text: 'どんな記事かを記載してください',
          emoji: true,
        },
        multiline: true,
      },
    },
  ];
}

function processForm(payload) {
  const values = payload.state.values;
  const title = values.input1234.plain_text_input1234.value;
  const url = values.input2345.plain_text_input2345.value;
  const comment = values.input3456.plain_text_input3456.value;
  const userId = payload.user.id;
  const mention = `<@${userId}>`;

  const blocks = [
    {
      type: "divider"
    },
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "新しいアウトプットが投稿されました！",
        emoji: true
      }
    },
    {
      type: "context",
      elements: [
        {
          type: "plain_text",
          text: `投稿者: ${mention}`,
          emoji: true
        }
      ]
    },
    {
      type: "divider"
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*タイトル*\n${title}`
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*URL*\n${url}`
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*一言コメント*\n\`\`\`${comment}\`\`\``
      }
    }
  ];

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SLACK_API_TOKEN}`,
    },
    payload: JSON.stringify({
      channel: CHANNEL_ID,
      blocks: blocks,
    }),
  };

  UrlFetchApp.fetch('https://slack.com/api/chat.postMessage', options);
}
