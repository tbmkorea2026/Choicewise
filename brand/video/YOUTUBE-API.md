# YouTube API: tự upload + hẹn giờ Shorts

Script: `brand/video/yt-upload.js` (Node, không cần cài thêm gì).

> **Lưu ý quan trọng:** khi project chưa qua audit của Google, mọi video tải lên bằng API sẽ bị **khoá ở chế độ riêng tư**, kể cả khi đã hẹn giờ. Vì vậy trong lúc chờ duyệt (bước 6), vẫn hẹn giờ Shorts trong YouTube Studio như hiện nay.

Làm tất cả các bước dưới đây khi **đăng nhập bằng contact@wisechoicekr.com** (tài khoản sở hữu kênh @WiseChoiceKR).

---

## 1. Tạo project Google Cloud
1. Mở https://console.cloud.google.com/ (lần đầu sẽ phải đồng ý điều khoản của Google Cloud. Bước này bro tự bấm).
2. Chọn ô chọn project ở góc trên, rồi bấm **New project**.
3. Đặt tên `WiseChoiceKR Uploader`, phần Organization để "No organization", rồi bấm **Create**. Không cần nhập thẻ thanh toán, vì YouTube API miễn phí trong hạn mức.

## 2. Bật YouTube Data API v3
1. Vào menu **APIs & Services → Library**.
2. Tìm **YouTube Data API v3**, bấm vào rồi bấm **Enable**.

## 3. Màn hình đồng ý OAuth (Google Auth Platform)
1. Vào **APIs & Services → OAuth consent screen**, bấm **Get started**.
2. Điền các mục:
   - App name: `WiseChoiceKR Uploader`
   - User support email: contact@wisechoicekr.com
   - Audience: **External**
   - Contact email: contact@wisechoicekr.com
3. Vào mục **Data access → Add or remove scopes**, tick 2 quyền:
   - `.../auth/youtube.upload`
   - `.../auth/youtube.readonly`
4. Vào mục **Audience → Test users → Add users**, thêm `contact@wisechoicekr.com`.
5. Mục **Branding** (không bắt buộc nhưng nên điền vì giúp audit):
   - Home page: https://wisechoicekr.com
   - Privacy policy: https://wisechoicekr.com/privacy-policy/
   - Terms: https://wisechoicekr.com/terms/

> Khi app đang ở chế độ **Testing**, Google cho đăng nhập hết hạn sau 7 ngày. Sau khi audit xong, vào **Audience → Publish app**. Lúc đăng nhập sẽ hiện "Google hasn't verified this app": bấm **Advanced → Go to WiseChoiceKR Uploader**. App chỉ có bro dùng nên như vậy là ổn.

## 4. Tạo OAuth client và tải file JSON
1. Vào **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type chọn **Desktop app**, đặt tên `yt-upload`, rồi bấm **Create**.
3. Bấm **Download JSON**, đổi tên file thành `client_secret.json` rồi lưu vào:
   `C:\Users\user\Desktop\WiseChoiceKR\choicewise\brand\video\.youtube\client_secret.json`
   (tự tạo thư mục `.youtube` nếu chưa có). Thư mục này đã nằm trong `.gitignore` nên sẽ **không bị đẩy lên GitHub**. **Không gửi file này cho ai**, kể cả dán vào chat.

## 5. Đăng nhập một lần
```
cd C:\Users\user\Desktop\WiseChoiceKR\choicewise\brand\video
node yt-upload.js auth
```
Trình duyệt sẽ mở ra. Chọn tài khoản contact@wisechoicekr.com, chọn kênh **WiseChoiceKR** nếu được hỏi, rồi bấm Allow. Terminal báo `✓ Signed in. Channel: WiseChoiceKR (UCLBDq7uJoigE-d76PZwTlEQ)` là xong.

## 6. Gửi đơn audit (để video không bị khoá riêng tư)
Form: **YouTube API Services – Audit and Quota Extension Form**
https://support.google.com/youtube/contact/yt_api_form

Chọn loại đơn là audit / "I would like to have my API client audited". Gợi ý câu trả lời (form bằng tiếng Anh, cứ copy):

- **Organization / company name:** WiseChoiceKR
- **Website:** https://wisechoicekr.com
- **Contact email:** contact@wisechoicekr.com
- **Google Cloud project number:** (lấy ở trang chủ Cloud console → Project info → *Project number*)
- **API client name:** WiseChoiceKR Uploader
- **Who uses the API client?** Internal tool only. One user (the channel owner). No public users.
- **Which channel does it access?** Only our own channel @WiseChoiceKR (UCLBDq7uJoigE-d76PZwTlEQ).
- **Describe how you use YouTube API Services:**
  > We run an independent product-review website (wisechoicekr.com). We produce short vertical videos (YouTube Shorts) summarising our written reviews. A small command-line script on our own computer uploads each finished video to our own channel with `videos.insert`, sets the title, description, "not made for kids", the altered/synthetic content flag (AI voice) and paid-promotion disclosure (affiliate links), and schedules it with `status.publishAt`. It also reads our own upload list (`channels.list`, `playlistItems.list`, `videos.list`) to see what is already scheduled. It never accesses other users' data, does not display YouTube data to anyone, and does not store data beyond an OAuth refresh token kept locally. About 1–2 uploads per day.
- **API methods used:** videos.insert, channels.list, playlistItems.list, videos.list
- **Do you store YouTube data?** No (only a local OAuth refresh token).
- **Quota:** default quota is enough (không xin thêm quota).
- **Demo / screenshots:** nếu form yêu cầu thì chụp màn hình terminal lúc chạy `node yt-upload.js shorts/<tên>.json --at "..." --dry-run` và lúc chạy `scheduled`.

Google sẽ trả lời qua email contact@wisechoicekr.com. Thời gian chờ không cố định; họ có thể hỏi thêm, khi đó cứ chuyển email cho Claude để soạn câu trả lời.

## 7. Cách dùng hằng ngày (sau khi audit xong)
```
cd C:\Users\user\Desktop\WiseChoiceKR\choicewise\brand\video
node yt-upload.js scheduled                                       # xem các Short đang chờ đăng
node yt-upload.js shorts/<tên>.json --at "2026-10-24 19:00" --dry-run   # xem trước, chưa upload
node yt-upload.js shorts/<tên>.json --at "2026-10-24 19:00"         # upload + hẹn giờ 19:00 KST
```
Script tự lấy title và description trong JSON, tự chọn "không dành cho trẻ em", "có dùng AI" và "có quảng cáo trả tiền" (link affiliate). Nếu API không nhận mục quảng cáo trả tiền, script sẽ báo, và bro tick mục đó trong Studio.

Quota mặc định là 10.000 đơn vị mỗi ngày. Mỗi lần upload tốn khoảng 1.600 đơn vị, nên mỗi ngày upload được khoảng 6 Shorts, quá đủ cho nhu cầu hiện tại.
