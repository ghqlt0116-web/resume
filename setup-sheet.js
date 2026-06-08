const { google } = require('googleapis');

async function setup() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  // These will be passed as arguments
  const userEmail = process.argv[2]; 
  const managerEmail = process.argv[3];

  if (!email || !privateKey) {
    console.error("❌ Error: .env.local 파일에 구글 서비스 계정 정보가 없습니다.");
    process.exit(1);
  }

  console.log("🔄 구글 시트 생성을 시작합니다...");

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const drive = google.drive({ version: 'v3', auth: authClient });

  try {
    // 1. Create sheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: 'SK브로드밴드 행사 신청 관리 DB' },
        sheets: [
          { properties: { title: 'Responses' } },
          { properties: { title: 'Settings' } }
        ]
      }
    });

    const sheetId = spreadsheet.data.spreadsheetId;
    console.log('✅ 구글 시트가 생성되었습니다!');
    console.log('🔗 시트 링크: https://docs.google.com/spreadsheets/d/' + sheetId);
    console.log('\n(중요) 이 ID를 .env.local의 GOOGLE_SHEET_ID에 추가하세요:', sheetId);

    // 2. Setup Responses headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Responses!A1:D1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['타임스탬프', '매체', '기자명', '핸드폰 번호']] }
    });

    // 3. Setup Settings
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Settings!A1:B5',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [
        ['EventName', 'SK브로드밴드 2026 하반기 프레스 데이'],
        ['EventIntro', 'SK브로드밴드의 새로운 비전과 혁신을 소개합니다.\n바쁘시겠지만 부디 참석하시어 자리를 빛내주시기 바랍니다.'],
        ['EventSchedule', '일시: 2026년 9월 10일 (목) 14:00 - 16:00\n장소: SK브로드밴드 본사 1층 수펙스홀'],
        ['OpenTimeKST', '2026-01-01 09:00'],
        ['CloseTimeKST', '2026-12-31 18:00']
      ]}
    });
    console.log('✅ 시트 기본 세팅 완료!');

    // 4. Share with emails
    const shareWithEmail = async (emailToShare) => {
      if (!emailToShare) return;
      console.log(`🔄 ${emailToShare} 계정에 편집 권한을 부여하는 중...`);
      await drive.permissions.create({
        fileId: sheetId,
        requestBody: { type: 'user', role: 'writer', emailAddress: emailToShare },
        fields: 'id',
      });
      console.log(`✅ ${emailToShare} 공유 완료!`);
    };

    await shareWithEmail(userEmail);
    await shareWithEmail(managerEmail);

    console.log('\n🎉 모든 자동 세팅이 성공적으로 완료되었습니다!');
    
  } catch (err) {
    console.error("❌ 에러 발생:", err);
  }
}

setup();
