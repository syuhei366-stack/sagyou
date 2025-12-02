# 室内温度モニター

Home Assistantの温度センサーデータを表示するWebアプリケーション

## 機能

- リアルタイム温度表示
- 快適温度域の視覚化
- 自動更新（60秒ごと）
- レスポンシブデザイン

## Cloudflare Pagesへのデプロイ

### 前提条件

1. Cloudflare Pagesプロジェクトが作成済み（プロジェクト名: `sagyou`）
2. GitHubリポジトリと連携済み

### 環境変数の設定

Cloudflare Pagesの設定で以下の環境変数を設定してください:

- `HA_TOKEN`: Home AssistantのLong-Lived Access Token

### デプロイ設定

- **ビルドコマンド**: (空白)
- **ビルド出力ディレクトリ**: `/`
- **ルートディレクトリ**: `/`

### ローカル開発

ローカルでプロキシサーバーを使用する場合:

```bash
# Node.jsプロキシ
node proxy_server.js

# または Pythonプロキシ
python proxy_server.py
```

その後、ブラウザで `http://localhost:8080` を開きます。

## ファイル構成

```
.
├── index.html              # メインHTML
├── style.css               # スタイルシート
├── script.js               # フロントエンドJavaScript
├── functions/
│   └── api/
│       └── [[route]].js    # Cloudflare Functions (APIプロキシ)
├── proxy_server.js         # ローカル開発用プロキシ (Node.js)
├── proxy_server.py         # ローカル開発用プロキシ (Python)
└── README.md               # このファイル
```

## セキュリティ

- Home AssistantのトークンはCloudflare Functionsの環境変数として保存され、フロントエンドには公開されません
- APIリクエストはCloudflare Functions経由でプロキシされます

## ライセンス

MIT
