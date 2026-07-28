const express = require('express');
const cors = require('cors');
const Client = require('ssh2-sftp-client');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// インモリーセッションストア（セッションID -> SFTPクライアントインスタンスのマップ）
const sessions = new Map();

// 定期的なセッションクリーンアップ（1時間以上操作のないセッションを切断）
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastAccess > 3600000) {
      console.log(`Cleaning up stale session: ${id}`);
      try { session.sftp.end(); } catch (e) {}
      sessions.delete(id);
    }
  }
}, 600000);

// 1. 接続 API
app.post('/api/connect', async (req, res) => {
  const { host, port = 22, username, password, privateKey, passphrase } = req.body;

  if (!host || !username) {
    return res.status(400).json({ error: 'ホスト名とユーザー名は必須です。' });
  }

  const sftp = new Client();
  const config = {
    host,
    port: parseInt(port, 10),
    username,
    readyTimeout: 10000,
  };

  if (password) {
    config.password = password;
  } else if (privateKey) {
    try {
      // 秘密鍵がパスの場合と文字列の場合の両方に対応
      if (fs.existsSync(privateKey)) {
        config.privateKey = fs.readFileSync(privateKey);
      } else {
        config.privateKey = privateKey;
      }
      if (passphrase) config.passphrase = passphrase;
    } catch (err) {
      return res.status(400).json({ error: `秘密鍵の読み取りに失敗しました: ${err.message}` });
    }
  }

  try {
    await sftp.connect(config);
    const sessionId = crypto.randomUUID();
    
    // ホームディレクトリあるいは初期パスを取得
    let initialPath = '.';
    try {
      initialPath = await sftp.realpath('.');
    } catch (e) {
      initialPath = '/';
    }

    sessions.set(sessionId, {
      sftp,
      config: { host, port, username },
      lastAccess: Date.now(),
      initialPath
    });

    console.log(`Connected to ${username}@${host} (Session: ${sessionId})`);
    res.json({ sessionId, initialPath, host, username });
  } catch (err) {
    console.error('SSH Connect Error:', err);
    res.status(500).json({ error: `接続失敗: ${err.message}` });
  }
});

// セッション認証ミドルウェア
const requireSession = (req, res, next) => {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'セッションが期限切れか無効です。再接続してください。' });
  }
  const session = sessions.get(sessionId);
  session.lastAccess = Date.now();
  req.session = session;
  next();
};

// 2. ディレクトリ一覧取得 API
app.get('/api/list', requireSession, async (req, res) => {
  const targetPath = req.query.path || req.session.initialPath;
  try {
    const list = await req.session.sftp.list(targetPath);
    // ソート: ディレクトリ優先、その後ファイル名順
    list.sort((a, b) => {
      if (a.type === 'd' && b.type !== 'd') return -1;
      if (a.type !== 'd' && b.type === 'd') return 1;
      return a.name.localeCompare(b.name);
    });

    const formattedList = list.map(item => ({
      name: item.name,
      type: item.type === 'd' ? 'directory' : 'file',
      size: item.size,
      modifyTime: item.modifyTime,
      permissions: item.rights ? item.rights.user + item.rights.group + item.rights.other : '',
      path: path.posix.join(targetPath, item.name)
    }));

    res.json({ path: targetPath, items: formattedList });
  } catch (err) {
    console.error(`List Error (${targetPath}):`, err);
    res.status(500).json({ error: `ディレクトリの読み取りに失敗しました: ${err.message}` });
  }
});

// 3. ファイル内容の取得 (テキスト / JSON / Markdown プレビュー用)
app.get('/api/read', requireSession, async (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'ファイルパスが指定されていません。' });

  try {
    const buffer = await req.session.sftp.get(filePath);
    res.send(buffer.toString('utf-8'));
  } catch (err) {
    console.error(`Read Error (${filePath}):`, err);
    res.status(500).json({ error: `ファイルの読み取りに失敗しました: ${err.message}` });
  }
});

// 4. ファイルストリーミング (画像プレビュー & バイナリ用)
app.get('/api/stream', requireSession, async (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'ファイルパスが指定されていません。' });

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/plain; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.csv': 'text/csv; charset=utf-8'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);

  try {
    const stream = req.session.sftp.createReadStream(filePath);
    stream.on('error', (err) => {
      console.error('Stream Error:', err);
      if (!res.headersSent) res.status(500).send('Stream error');
    });
    stream.pipe(res);
  } catch (err) {
    console.error(`Create Stream Error (${filePath}):`, err);
    res.status(500).json({ error: `ストリームの生成に失敗しました: ${err.message}` });
  }
});

// 5. ダウンロード API (ブラウザ保存用)
app.get('/api/download', requireSession, async (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'ファイルパスが指定されていません。' });

  const fileName = path.basename(filePath);
  res.attachment(fileName);

  try {
    const stream = req.session.sftp.createReadStream(filePath);
    stream.on('error', (err) => {
      console.error('Download Stream Error:', err);
      if (!res.headersSent) res.status(500).send('Download stream error');
    });
    stream.pipe(res);
  } catch (err) {
    console.error(`Download Error (${filePath}):`, err);
    res.status(500).json({ error: `ダウンロードに失敗しました: ${err.message}` });
  }
});

// 6. 切断 API
app.post('/api/disconnect', requireSession, async (req, res) => {
  try {
    await req.session.sftp.end();
    sessions.delete(req.query.sessionId || req.headers['x-session-id']);
    res.json({ success: true, message: '切断しました。' });
  } catch (err) {
    res.status(500).json({ error: `切断エラー: ${err.message}` });
  }
});

// 7. アップロード API
app.post('/api/upload', requireSession, upload.single('file'), async (req, res) => {
  const targetPath = req.query.path || req.body.path;
  if (!targetPath) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: '保存先のパスが指定されていません。' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'ファイルがアップロードされていません。' });
  }

  try {
    await req.session.sftp.put(req.file.path, targetPath);
    fs.unlinkSync(req.file.path);
    res.json({ success: true, message: 'アップロード完了しました。' });
  } catch (err) {
    console.error(`Upload Error (${targetPath}):`, err);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: `アップロードに失敗しました: ${err.message}` });
  }
});

// 8. フロントエンドの静的ファイル配信（一体型スタンドアロン動作対応）
const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found.' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Aether SSH Viewer Backend listening on 0.0.0.0:${PORT}`);
});
