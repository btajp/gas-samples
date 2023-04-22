const notionToken = PropertiesService.getScriptProperties().getProperty("NOTION_TOKEN");
const databaseId = PropertiesService.getScriptProperties().getProperty("NOTION_DATABASE_ID");
const notionVersion = PropertiesService.getScriptProperties().getProperty("NOTION_VERSION");
const ss = SpreadsheetApp.getActiveSpreadsheet();
const sheet = ss.getSheetByName("importNotion");

// Title | URL | coverImageURL | Description | SlackName | iconImageURL | Date | で並んでいることを前提とする
// 1行目はヘッダーなので、2行目から取得する
// 2行目から最終行までを取得し、それぞれ createNotionPage() に渡す
// DateはUTC+0で取得されるので、UTC+9に変換する

function importNotion() {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  const range = sheet.getRange(2, 1, lastRow - 1, lastColumn);
  const values = range.getValues();

  values.forEach((value) => {
    const title = value[0];
    const url = value[1];
    const coverImageUrl = value[2];
    const comment = value[3];
    const displayName = value[4];
    const userIconUrl = value[5];
    const date = value[6];
    const jstISOString = convertDate(date);
    createNotionPage(title, url, coverImageUrl, comment, displayName, userIconUrl, jstISOString);
  });
}

// 2023-04-21T18:19:19.478Z を UTC+9 に変換する
const convertDate = (date: string) => {
  const dateObj = new Date(date);
  const timezoneOffset = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
  const jstDate = new Date(dateObj.getTime() + timezoneOffset);
  const jstISOString = jstDate.toISOString();
  return jstISOString;
};

const createNotionPage = (
  title: string,
  url: string,
  coverImageUrl: string,
  comment: string,
  displayName: string,
  userIconUrl: string,
  date: string,
  
) => {

  const newPage = {
    parent: { database_id: databaseId },
    icon: {
      external: {
        url: userIconUrl,
      },
    },
    cover: {
      external: {
        url: coverImageUrl,
      },
    },
    properties: {
      Title: {
        title: [{ text: { content: title } }],
      },
      Date: {
        date: {
          start: date,
          time_zone: 'Asia/Tokyo',
        },
      },
      SlackName: {
        rich_text: [{ text: { content: displayName } }],
      },
      Description: {
        rich_text: [{ text: { content: comment } }],
      },
      URL: {
        url: url,
      }
    },
  };

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    "method": "post",
    "headers": {
      "Authorization": "Bearer " + notionToken,
      "Content-Type": "application/json",
      "Notion-Version": notionVersion
    },
    "muteHttpExceptions" : true,
    "payload": JSON.stringify(newPage)
  };

  const response = UrlFetchApp.fetch("https://api.notion.com/v1/pages", options);
  const jsonResponse = JSON.parse(response.getContentText());

  Logger.log(jsonResponse);
};
