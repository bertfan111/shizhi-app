# assets/ 资源说明

```
assets/
├── data/
│   └── characters.json     # 由 scripts/build-dataset.ts 生成 / 维护
├── images/
│   └── <汉字>.png          # 由 scripts/build-dataset.ts 通过 OpenAI 生成
└── README.md               # 本文件
```

## 图标 / 启动屏（可选）

如果你想自定义 App 图标和启动屏，把对应文件放到这里：

- `icon.png`：1024×1024 PNG，作为 iOS / Android 应用图标
- `splash.png`：建议 1242×2436 PNG，作为启动屏

然后在 `app.json` 中重新启用引用：

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#FFF8E7"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon.png",
        "backgroundColor": "#FFF8E7"
      }
    }
  }
}
```

不放也没关系——Expo 会用默认图标，开发阶段完全可用。
