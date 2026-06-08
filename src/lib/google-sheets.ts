import { google } from "googleapis";

export async function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"); // Handle escaped newlines

  if (!email || !privateKey) {
    console.error("Missing Google Service Account credentials.");
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: "v4", auth: authClient as any });
}

export async function getEventSettings() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) return null;

  try {
    const sheets = await getGoogleSheetsClient();
    if (!sheets) return null;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Settings!A:B", // Expects Key in A, Value in B
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return null;

    const settings: Record<string, string> = {};
    rows.forEach((row) => {
      if (row[0] && row[1]) {
        settings[row[0]] = row[1];
      }
    });

    return settings;
  } catch (error) {
    console.error("Error fetching settings:", error);
    return null;
  }
}

export async function appendRegistration(data: string[]) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("Missing Google Sheet ID");

  const sheets = await getGoogleSheetsClient();
  if (!sheets) throw new Error("Failed to initialize Google Sheets client");

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Responses!A:E", // Timestamp, Media, Name, Phone, Email
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [data],
    },
  });
}

export async function getCurrentRegistrationCount() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) return 0;

  try {
    const sheets = await getGoogleSheetsClient();
    if (!sheets) return 0;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Responses!A:A", 
    });

    const rows = response.data.values;
    // Subtract 1 for the header row
    return rows && rows.length > 1 ? rows.length - 1 : 0;
  } catch (error) {
    console.error("Error fetching registration count:", error);
    return 0;
  }
}
