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
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('ssh_viewer_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveToHistory = () => {
    const newEntry = { host, port, username, authType, privateKey: authType === 'key' ? privateKey : undefined };
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

  const selectHistory = (h) => {
    setHost(h.host);
    setPort(h.port || '22');
    setUsername(h.username);
    setAuthType(h.authType || 'password');
    if (h.privateKey) setPrivateKey(h.privateKey);
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            <ShieldCheck size={14} color="var(--accent-blue)" />
            <span>編集無効（Read-Only）のため、サーバー上のファイルが変更・削除されることはありません。</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {history.map((h, i) => (
                <div key={i} onClick={() => selectHistory(h)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  fontSize: '12px', backgroundColor: 'var(--bg-sidebar)',
                  transition: 'background-color 0.15s ease'
                }} className="history-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <Globe size={14} color="var(--text-secondary)" />
                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{h.username}@{h.host}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({h.port || 22})</span>
                  </div>
                  <button onClick={(e) => deleteHistory(e, i)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
