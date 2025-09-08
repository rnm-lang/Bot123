const { google } = require('googleapis');
const path = require('path');

// Path to your credentials file
const credentials = require(path.join(__dirname, './google-credentials.json'));

const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = '14hdRKvrq_yqUA3zyxvBTtDUil5GDR36A9SABKKbRZYQ';

async function appendToSheet(sheetName, rows) {
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:F`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: rows },
    });
    return response.data;
  } catch (error) {
    console.error(`Error appending to sheet ${sheetName}:`, error);
  }
}

module.exports = { appendToSheet };
