import React, { useState, useEffect } from 'react';
import { Terminal, Key, Lock, User, Globe, ArrowRight, Clock, Trash2, ShieldCheck } from 'lucide-react';

export default function ConnectModal({ onConnect, loading, error }) {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [authType, setAuthType] = useState('password'); // 'password' or 'key'
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [saveCredentials, setSaveCredentials] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('ssh_viewer_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveToHistory = () => {
    const newEntry = { 
      host, 
      port, 
      username, 
      authType, 
      privateKey: authType === 'key' ? privateKey : undefined,
      password: saveCredentials && authType === 'password' ? password : undefined,
      passphrase: saveCredentials && authType === 'key' ? passphrase : undefined
    };
    const filtered = history.filter(h => !(h.host === host && h.username === username));
    const updated = [newEntry, ...filtered].slice(0, 5);
    setHistory(updated);
    localStorage.setItem('ssh_viewer_history', JSON.stringify(updated));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveToHistory();
    onConnect({
      host,
      port,
      username,
      password: authType === 'password' ? password : undefined,
      privateKey: authType === 'key' ? privateKey : undefined,
      passphrase: authType === 'key' && passphrase ? passphrase : undefined
    });
  };

  const selectHistory = (h, e) => {
    if (e) e.stopPropagation();
    setHost(h.host);
    setPort(h.port || '22');
    setUsername(h.username);
    setAuthType(h.authType || 'password');
    if (h.privateKey) setPrivateKey(h.privateKey);
    if (h.password) setPassword(h.password);
    if (h.passphrase) setPassphrase(h.passphrase);

    // 鍵認証（パスフレーズ不要）またはパスワード等が記憶済みの場合はワンクリックで即座に接続する
    const canAutoConnect = (h.authType === 'key' && h.privateKey && !h.passphrase) || h.password || h.passphrase;
    if (canAutoConnect) {
      onConnect({
        host: h.host,
        port: h.port || '22',
        username: h.username,
        password: h.authType === 'password' ? h.password : undefined,
        privateKey: h.authType === 'key' ? h.privateKey : undefined,
        passphrase: h.authType === 'key' ? h.passphrase : undefined
      });
    } else {
      // 記憶されていない場合はパスワード入力欄へ自動フォーカス
      setTimeout(() => {
        const passInput = document.querySelector('input[type="password"]');
        if (passInput) passInput.focus();
      }, 50);
    }
  };

  const deleteHistory = (e, index) => {
    e.stopPropagation();
    const updated = history.filter((_, i) => i !== index);
    setHistory(updated);
    localStorage.setItem('ssh_viewer_history', JSON.stringify(updated));
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="animate-fade-in" style={{
        backgroundColor: 'var(--bg-card)', width: '100%', maxWidth: '480px',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)', padding: '32px',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '6px',
            backgroundColor: 'var(--bg-sidebar)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)'
          }}>
            <Terminal size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>リモートサーバーに接続</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Read-Onlyモードで安全にディレクトリと閲覧を行います</p>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', backgroundColor: 'rgba(235, 87, 87, 0.1)',
            border: '1px solid rgba(235, 87, 87, 0.3)', borderRadius: 'var(--radius-sm)',
            color: 'var(--accent-red)', fontSize: '13px', marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 3 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>ホスト名 / IPアドレス</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 10px', backgroundColor: 'var(--bg-main)' }}>
                <Globe size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                <input required type="text" placeholder="example.com" value={host} onChange={e => setHost(e.target.value)}
                  style={{ border: 'none', background: 'transparent', width: '100%', padding: '8px 0', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>ポート</label>
              <input required type="number" placeholder="22" value={port} onChange={e => setPort(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>ユーザー名</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 10px', backgroundColor: 'var(--bg-main)' }}>
              <User size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
              <input required type="text" placeholder="root" value={username} onChange={e => setUsername(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', padding: '8px 0', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>認証方法</label>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input type="radio" name="auth" checked={authType === 'password'} onChange={() => setAuthType('password')} /> パスワード
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input type="radio" name="auth" checked={authType === 'key'} onChange={() => setAuthType('key')} /> 秘密鍵 (SSH Key)
                </label>
              </div>
            </div>

            {authType === 'password' ? (
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 10px', backgroundColor: 'var(--bg-main)' }}>
                <Lock size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                <input required type="password" placeholder="••••••••••••" value={password} onChange={e => setPassword(e.target.value)}
                  style={{ border: 'none', background: 'transparent', width: '100%', padding: '8px 0', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 10px', backgroundColor: 'var(--bg-main)' }}>
                  <Key size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                  <input required type="text" placeholder="/home/user/.ssh/id_rsa または 鍵文字列" value={privateKey} onChange={e => setPrivateKey(e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', padding: '8px 0', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0 10px', backgroundColor: 'var(--bg-main)' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                  <input type="password" placeholder="パスフレーズ (任意)" value={passphrase} onChange={e => setPassphrase(e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '100%', padding: '8px 0', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={saveCredentials} onChange={e => setSaveCredentials(e.target.checked)} />
              <span>次回からパスワード（または鍵情報）も記憶してワンクリック接続する</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} color="var(--accent-blue)" />
              <span>編集無効（Read-Only）のため、サーバー上のファイルが変更・削除されることはありません。</span>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '8px', padding: '10px', width: '100%', fontSize: '14px', justifyContent: 'center' }}>
            {loading ? '接続中...' : (
              <>
                <span>サーバーへ接続</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {history.length > 0 && (
          <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} />
              <span>最近の接続</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {history.map((h, i) => {
                const isAuto = (h.authType === 'key' && h.privateKey && !h.passphrase) || h.password || h.passphrase;
                return (
                  <div key={i} onClick={(e) => selectHistory(h, e)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    fontSize: '12px', backgroundColor: 'var(--bg-sidebar)',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.15s ease'
                  }} 
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--accent-blue)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-sidebar)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  className="history-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <Globe size={15} color="var(--accent-blue)" />
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>{h.username}@{h.host}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                          ポート: {h.port || 22} | {h.authType === 'key' ? '🔑 鍵認証' : (h.password ? '⚡ 1クリック接続可' : '🔐 パスワード入力必要')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: '500', 
                        color: isAuto ? '#fff' : 'var(--accent-blue)', 
                        backgroundColor: isAuto ? 'var(--accent-blue)' : 'rgba(35, 131, 226, 0.12)', 
                        padding: '5px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px'
                      }}>
                        <span>{isAuto ? '接続' : '選択'}</span>
                        <ArrowRight size={12} />
                      </span>
                      <button onClick={(e) => deleteHistory(e, i)} title="履歴から削除" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
