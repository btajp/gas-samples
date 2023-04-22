const createNotionPage = async () => {
  const notionToken = PropertiesService.getScriptProperties().getProperty("NOTION_TOKEN");
  const databaseId = PropertiesService.getScriptProperties().getProperty("NOTION_DATABASE_ID");
  const notionVersion = PropertiesService.getScriptProperties().getProperty("NOTION_VERSION");
  const now = new Date();
  const timezoneOffset = 9 * 60 * 60 * 1000; // 9 hours in milliseconds
  const jstDate = new Date(now.getTime() + timezoneOffset);
  const jstISOString = jstDate.toISOString();
  const imageUrl = "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1065&q=80";

  const newPage = {
    "parent": {
      "database_id": databaseId
    },
    "cover": {
      "external": {
        "url": imageUrl
      }
    },
    "properties": {
      "Title": {
        "title": [
          {
            "text": {
              "content": "New Page"
            }
          }
        ]
      },
      "Date": {
        "date": {
          "start": jstISOString,
          "time_zone": "Asia/Tokyo"
        }
      },
      "SlackTs": {
        "rich_text": [
          {
            "text": {
              "content": "123456789.987654"
            }
          }
        ]
      },
      "oDescription": {
        "rich_text": [
          {
            "text": {
              "content": "This is a description"
            }
          }
        ]
      },
      "URL": {
        "url": "https://example.com"
      },
      "SlackUserID": {
        "rich_text": [
          {
            "text": {
              "content": "U12345678"
            }
          }
        ]
      }
    }
  };




  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    "method": "post",
    "headers": {
      "Authorization": "Bearer " + notionToken,
      "Content-Type": "application/json",
      "Notion-Version": notionVersion
    },
    "payload": JSON.stringify(newPage)
  };

  const response = UrlFetchApp.fetch("https://api.notion.com/v1/pages", options);
  const jsonResponse = JSON.parse(response.getContentText());

  Logger.log(jsonResponse);
}
