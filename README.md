# 识字小天地 · 一年级 iOS App

一款面向小学一年级（统编版）的识字 App。

- **首页仪表盘**：进度环 + "继续学习 / 今日复习 / 错字本 / 随机抽认" 4 个入口 + 今日任务进度 + 最近学过 6 字
- **底部 Tab**：首页（仪表盘）/ 字库（带状态过滤的网格搜索）/ 我的（学习统计 + 本周柱状图）
- **学习状态**：每个字 4 态 `未学 / 在学 / 已掌握 / 错字`，故事页点"我会了 / 还不会"或做小测验自动写入
- **小测验**：故事页可发起"听音选字 / 看图选字 / 看拼音选字" 3 题测验，结果驱动间隔复习（简化 SM-2）
- **关卡地图**：每 5 字一关，展示已掌握进度，按教材课次顺序解锁
- **故事页**：插图 + 约 100 字的字形拆解故事（6 周岁认知、小角色历险），每个汉字上方有拼音，目标字红色高亮
- **🔊 朗读功能**：故事页有小圆形声音按钮，点击调用离线 TTS，结束自动停止；右下角悬浮按钮可调语速和内置音色
- **数据**：统编版《语文》一年级上 / 下册识字表，上册 **300 字** + 下册 **397 字**，去重合计 **约 697 字**
- **字体**：内置开源 [**霞鹜文楷 轻便版** (LXGW WenKai Lite)](https://github.com/lxgw/LxgwWenKai-Lite)
- **完全离线 ✨**：故事 / 拼音 / 插图 / 字体 / 进度全部本机存储，不调任何在线 API
- **学习进度**：用 AsyncStorage 持久化上次接触的字、状态映射、最近学习队列，下次进入自动定位

> 📌 **重要说明**：`scripts/` 目录下的所有内容（`build-dataset.ts`、`generate-stories.ts`、`generate-images.ts` 等）是**开发者本机 / CI 上的一次性预生成脚本**，**不会**打进最终 App 安装包。最终给别人安装的 App 里只包含 `assets/data/characters.json` + `assets/images/*.png` + `assets/fonts/*.ttf` 这些静态资源。使用者永远不需要输入 OpenAI Key。

## 一、技术栈

- Expo SDK 51 + React Native 0.74 + TypeScript
- expo-router（文件路由）
- expo-font（加载霞鹜文楷字体）
- expo-speech（系统 TTS 朗读，跨平台、离线）
- FlatList 横向分页（左右滑动切字，原生 + Web 通用）
- pinyin-pro（拼音注音 + 搜索时无声调匹配）
- AsyncStorage（学习进度持久化：状态、错字本、最近学过、间隔复习到期时间）
- 简化 SM-2 间隔复习算法（写在 [src/data/learningStore.ts](src/data/learningStore.ts) 中 `applyQuizResult`）
- **离线数据生成**（仅开发者本机 / CI 用，不进 App）：Node.js + OpenAI
  - 文本：`gpt-4o-mini`（写约 100 字的字形故事）
  - 图像：`gpt-image-1`（默认）或 `gpt-image-2`（2026 新一代，质量更高，生成时通过临时环境变量切换）

## 二、目录结构

```
shi-zi-app/
├── app.json / eas.json / package.json / tsconfig.json
├── babel.config.js
├── app/                          # expo-router 路由（打进 App）
│   ├── _layout.tsx               # 加载字体 + 路由配置
│   ├── index.tsx                 # 主界面：横向 FlatList 切字 + 田字格
│   ├── all.tsx                   # 全部生字索引页：分册 + 搜索
│   └── story/[char].tsx          # 故事页
├── src/                          # 应用逻辑（打进 App）
│   ├── types.ts
│   ├── theme.ts                  # 颜色 + 字体名常量
│   ├── components/
│   │   ├── CharacterCard.tsx
│   │   ├── TianZiGrid.tsx        # 田字格（外框实红 + 十字虚红）
│   │   ├── PinyinText.tsx
│   │   └── StoryImage.tsx
│   └── data/
│       ├── loadCharacters.ts
│       ├── imageMap.ts           # ⚠️ 由 build-dataset.ts 自动生成
│       └── progress.ts
├── assets/                       # 静态资源（打进 App）
│   ├── data/characters.json      # ⚠️ 由 build-dataset.ts 自动生成
│   ├── images/<汉字>.png         # ⚠️ 由 build-dataset.ts 自动生成
│   └── fonts/
│       └── LXGWWenKaiLite-Regular.ttf  # 霞鹜文楷 轻便版 (~13 MB)
└── scripts/                      # 开发机一次性预生成脚本（不打进 App）
    ├── wordlist.ts               # 一年级上下册识字表（700 字）
    ├── generate-pinyin.ts
    ├── generate-stories.ts
    ├── generate-images.ts
    └── build-dataset.ts
```

## 三、上手三步

### 1) 安装依赖（Windows 也可以执行）

```bash
cd shi-zi-app
npm install
npm run build:skeleton    # 立刻生成 697 字 + 拼音（不调 OpenAI、不要钱）
```

跑完 `build:skeleton` 后即可 `npm run start` 预览，**主屏 / 全部生字页都已经能看到全部 700 字 + 拼音**，只是故事和插画暂时是空的。

### 2) 本地生成全部故事（不需要 Key）

故事已经支持本地静态生成，不联网、不需要 OpenAI Key：

```powershell
npm run build:stories:local
```

这会为全部 697 个字写入约 90-110 字的字形故事，并保存到 `assets/data/characters.json`。使用者安装 App 后直接读这些内置结果。

### 3) 可选：开发者一次性生成插画（约 30-50 USD）

> 这是**开发者做一次**的事情，不是给使用者做的功能。生成完后把 `assets/images/` 一起打进安装包，**用户端 App 永远不会再去调 OpenAI**。

不要创建 `.env` 文件，也不要把 Key 写进项目。只在当前 PowerShell 窗口临时设置：

```powershell
$env:OPENAI_API_KEY="sk-你的key"
```

关闭这个 PowerShell 窗口后 Key 就不存在了；它不会进入 App，也不会进入仓库。

如果要生成插画，先用 5 个字试跑（推荐第一次这样做）：

```powershell
$env:LIMIT="5"; npm run build:dataset; Remove-Item Env:LIMIT
```

确认效果后跑全量插画（≈700 字）：

```powershell
npm run build:dataset
```

脚本特性：

- 断点续跑：中途 Ctrl+C 也没事，再次运行会自动从未完成的字继续。
- 失败不中断：单字失败会记录在最后的失败列表里，可重新运行补齐。
- 只跑指定字：`$env:ONLY="天,地,人"; npm run build:dataset; Remove-Item Env:ONLY`
- **重写所有故事（保留插画）**：`$env:FORCE_STORIES="1"; npm run build:dataset; Remove-Item Env:FORCE_STORIES`（升级 prompt 后用这个一键重生成所有 ~100 字小故事，省钱不重画图）
- 重写所有插画（保留故事）：`$env:FORCE_IMAGES="1"; npm run build:dataset; Remove-Item Env:FORCE_IMAGES`
- 全部重写：`$env:FORCE_ALL="1"; npm run build:dataset; Remove-Item Env:FORCE_ALL`

### 4) 本机预览（启动后**断网也能用**）

```bash
npm run start
```

- iPhone 安装 [Expo Go](https://apps.apple.com/cn/app/expo-go/id982107779)，扫描二维码即可预览。
- 或在 Mac 上 `npm run ios` 启动 iOS 模拟器。

## 四、打包到 iOS（最终需要 Mac 或 Expo 云）

### 方案 A：无 Mac，用 EAS Build 云端打包

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios --profile preview
```

EAS 会用云端 Mac 打出 ipa，下载后用 [TestFlight](https://developer.apple.com/testflight/) 或 [Apple Configurator](https://apps.apple.com/cn/app/apple-configurator-2/id1037126344) 装到自己手机上测试。

### 方案 B：有 Mac

```bash
npx expo prebuild --platform ios
cd ios && pod install && cd ..
npx expo run:ios --device   # 真机
# 或 open ios/shi-zi-app.xcworkspace   用 Xcode 打开 Archive
```

打出来的 ipa 体积估算：

- 字体：~13 MB（霞鹜文楷 Lite，覆盖 GB 2312 全量汉字）
- 插画：~700 张 × 80–150 KB ≈ 60–100 MB
- 代码 + 数据：~3 MB
- **总计：≈ 80–120 MB**

> 后续如果想压缩字体到 200 KB 内，可用 `pyftsubset` 仅保留 700 个生字 + 拼音字符。详见第六节。

## 五、关于字表准确性

`scripts/wordlist.ts` 里的字表按 **统编版（人教版 · 2024）一年级《语文》识字表** 的课文顺序整理：

- `upperGradeChars`：一年级上册识字表（300 字，识字 1–10 + 课文 1–14 顺序）
- `lowerGradeChars`：一年级下册识字表（397 字，识字 1–8 + 课文 1–21 顺序）

每年九月新教材印发后，如有少量字段调整可直接修改这两个数组，然后重跑 `LIMIT=N npm run build:dataset` 补齐新字即可（已有字会自动跳过）。

## 六、后续路线图

阶段一、二已上线（仪表盘 / 三态 + 错字本 / Tab 导航 / 小测验 + 简化 SM-2 / 关卡地图 / 今日任务 / 本周柱状图）。

阶段三 仍在探索：

- **家长周报导出**：把"我的"页里的本周数据 + 进度环导出为图片或 PDF 分享，备选方案 `react-native-view-shot` + `expo-sharing`。
- **跟读评测**：故事朗读时让孩子跟读，给星标评分。
  - 录音：`expo-av` 或 `expo-audio` 在原生端可用，Web 端走 `MediaRecorder`。
  - 评测：本地比对成本高，可调用第三方语音评测 API（科大讯飞 ISE / 网易有道速读），需要授权 Key；Web 端可用 `Web Speech API` 简化版做关键词比对。
- **角色养成 / 勋章**：累计已掌握字数解锁形象，长期激励。
- **关卡 lesson 标签**：把每个字精确归到教材"识字 X / 课文 Y / 语文园地 Z"，地图按真实单元而非简单 5 字一关。

## 七、常见问题

- **App 启动很慢 / 卡在「字体加载中…」？**  
  第一次启动需要把 ~13 MB 字体加载到内存，正常在中等设备上 < 1 秒。如果想做得更轻量，可用 `fonttools` 把字体子集化到仅 ~700 字 + 拼音字符（≈ 200 KB）：

  ```bash
  pip install fonttools brotli
  # 把全部字 + 拼音字母 + 常见符号写到 chars.txt 一行
  pyftsubset assets/fonts/LXGWWenKaiLite-Regular.ttf \
    --text-file=chars.txt \
    --output-file=assets/fonts/LXGWWenKaiLite-Subset.ttf \
    --flavor=woff2 \
    --layout-features='*'
  ```

  然后把 `_layout.tsx` 里 `useFonts` 引用改成 subset 字体即可。

- **图片显示不出来？**  
  确认 `assets/images/<汉字>.png` 存在，并且 `src/data/imageMap.ts` 已被脚本重写过（构建脚本结束时会自动重写）。

- **想换字体？**  
  把 `.ttf` / `.otf` 字体文件放到 `assets/fonts/`，改 `app/_layout.tsx` 里 `useFonts` 的 require 路径和 key，并同步改 `src/theme.ts` 里的 `FONT_HANZI` 常量。

- **要部分字（比如只识 100 字）？**  
  `LIMIT=100 npm run build:dataset` 一键截断；如果是给特定孩子定制，可直接修改 `scripts/wordlist.ts` 的数组。

## 八、字体授权（重要）

`assets/fonts/LXGWWenKaiLite-Regular.ttf` 来自 [lxgw/LxgwWenKai-Lite](https://github.com/lxgw/LxgwWenKai-Lite)，采用 **SIL Open Font License 1.1**：

- ✅ 免费用于商业 / 非商业用途
- ✅ 可嵌入软件 / App 中分发
- ❌ **不可单独出售字体文件本身**
- 衍生字体名称不可包含「霞鹜」或「LXGW」字样

完整协议见上游仓库或字体文件元数据。
