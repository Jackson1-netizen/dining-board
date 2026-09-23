# 飲食大王

Jackson 嘅墨爾本飲食推薦板。手機 bookmark 用，食肆 bot 貼聊天時都讀同一份 `data.json`。

Repo：<https://github.com/Jackson1-netizen/dining-board>

Pages 網址（`main` 根目錄）：<https://jackson1-netizen.github.io/dining-board/>

Bot 可以直接拎資料：<https://raw.githubusercontent.com/Jackson1-netizen/dining-board/main/data.json>

Pages 要開一次：repo Settings → Pages → Deploy from a branch → `main` → `/ (root)`。有 `.nojekyll`，唔使 Jekyll。

## 點樣加一間新推薦

開 `data.json`，喺 `recommendations` 陣列最後加一個物件。日期用 `YYYY-MM-DD`。唔好改欄位名，頁面同 bot 都靠呢啲 key。

```json
{
  "id": "short-unique-id",
  "date": "2026-09-24",
  "name": "餐廳名",
  "cuisine": "菜式",
  "area": "地區",
  "address": "地址",
  "priceBand": "$$",
  "hook": "卡片上一句。",
  "vibe": "氣氛",
  "partySize": "2–4 人",
  "dishes": ["招牌一", "招牌二"],
  "howToOrder": "堂食、外帶定訂位",
  "whenToGo": "幾時去好",
  "hours": "營業時間。未核實就寫明。",
  "specials": "特價，冇就寫未見",
  "why": "點解推薦",
  "sourceUrl": "https://example.com/source",
  "mapsUrl": "https://www.google.com/maps/search/?api=1&query=餐廳名+地區",
  "images": []
}
```

`priceBand` 用 `$`、`$$`、`$$$` 或 `$$$$`。`hook` 可省略，頁面會改用 `why`。`images` 放圖片 URL，冇相就留空陣列。

推上 `main` 之後，GitHub Pages 會用 repo 根目錄更新。板面用墨爾本日期。當日推薦最多兩張大卡；同日多過兩間，其餘落到「今個星期」。如果今日未有，最近一日（今個星期內）會用大卡頂住，標題寫嗰日。更早過今個星期一嘅，收喺「早前」。

## 本地睇

```bash
python3 -m http.server 8741
```

然後開 <http://127.0.0.1:8741>。要經 HTTP 開，直接撳開 HTML 檔會載入唔到 `data.json`。
