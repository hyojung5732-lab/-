/**
 * 계약서 서명 수신기 (Google Apps Script)
 * --------------------------------------------------
 * 고객이 카카오톡 안에서 서명하고 [서명 완료] 를 누르면
 * 이 스크립트가 서명 완료본을 받아서
 *   1) 내 구글 드라이브 폴더에 저장하고
 *   2) 내 이메일로 첨부해서 보내줍니다.
 *
 * 설치 방법은 같은 폴더의 README.md 를 참고하세요.
 */

/* ▼▼▼ 여기 두 줄만 내 정보로 바꾸세요 ▼▼▼ */
const OWNER_EMAIL = "your-email@example.com";   // 계약서를 받을 이메일
const FOLDER_NAME = "계약서 서명본";              // 구글 드라이브에 만들어질 폴더 이름
/* ▲▲▲ 여기까지 ▲▲▲ */


function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const s = data.summary || {};
    const filename = data.filename || "계약서_서명완료.html";
    const blob = Utilities.newBlob(data.html || "", "text/html", filename);

    const file = getFolder_(FOLDER_NAME).createFile(blob);

    MailApp.sendEmail({
      to: OWNER_EMAIL,
      subject: "[계약서 서명 완료] " + (s.client || "고객") + " · " + (s.site || ""),
      htmlBody:
        "<h3>고객이 계약서에 서명했습니다.</h3>" +
        "<table cellpadding='6' style='border-collapse:collapse'>" +
        row_("발주자(갑)", s.client) +
        row_("대표자", s.ceo) +
        row_("연락처", s.tel) +
        row_("사이트명", s.site) +
        row_("계약금액", s.amount ? Number(s.amount).toLocaleString() + "원 (VAT 별도)" : "") +
        row_("계약 체결일", s.signDate) +
        row_("서명 시각", data.signedAt) +
        "</table>" +
        "<p>첨부된 HTML 파일을 열면 서명이 들어간 계약서 전체를 볼 수 있습니다. " +
        "(브라우저에서 인쇄 → 'PDF로 저장' 하면 PDF 보관본이 됩니다.)</p>" +
        "<p>드라이브 사본: <a href='" + file.getUrl() + "'>" + filename + "</a></p>",
      attachments: [blob]
    });

    return json_({ ok: true, file: file.getUrl() });
  } catch (err) {
    // 실패해도 고객 화면이 멈추지 않도록 200 으로 응답하고 내용에 오류를 담습니다.
    MailApp.sendEmail(OWNER_EMAIL, "[계약서 수신 실패]", String(err));
    return json_({ ok: false, error: String(err) });
  }
}

/** 브라우저로 주소를 열어 배포가 살아있는지 확인할 때 사용합니다. */
function doGet() {
  return json_({ ok: true, msg: "contract receiver alive" });
}

function row_(k, v) {
  return "<tr><td style='border:1px solid #ddd'><b>" + k + "</b></td>" +
         "<td style='border:1px solid #ddd'>" + (v || "-") + "</td></tr>";
}

function getFolder_(name) {
  const it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
