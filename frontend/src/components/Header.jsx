import React from 'react';
import { Download, LogOut, Moon, Sun, Terminal, Shield, Eye } from 'lucide-react';

export default function Header({ 
  sessionInfo, 
  selectedFile, 
  onDownload, 
  onDisconnect, 
  theme, 
  onToggleTheme 
}) {
  return (
    <header style={{
      height: '52px',
      backgroundColor: 'var(--bg-main)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>
          <Terminal size={16} color="var(--accent-blue)" />
          <span>{sessionInfo.username}@{sessionInfo.host}</span>
        </div>

        <span style={{ color: 'var(--border-color)' }}>/</span>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          color: 'var(--text-primary)', 
          fontSize: '13px',
          fontWeight: '600',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {selectedFile ? (
            <>
              <Eye size={15} color="var(--text-muted)" />
              <span>{selectedFile.name}</span>
              {selectedFile.size !== undefined && (
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400' }}>
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>ファイルを選択してプレビュー</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '4px 8px', borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-muted)',
          fontSize: '11px', fontWeight: '500', marginRight: '6px'
        }}>
          <Shield size={13} color="#27ae60" />
          <span>Read-Only</span>
        </div>

        {selectedFile && selectedFile.type !== 'directory' && (
          <button 
            onClick={() => onDownload(selectedFile)}
            className="btn btn-primary"
            style={{ padding: '5px 12px' }}
            title="ファイルをダウンロード"
          >
            <Download size={14} />
            <span>ダウンロード</span>
          </button>
        )}

        <button
          onClick={onToggleTheme}
          className="btn"
          style={{ padding: '6px', borderRadius: '50%', width: '32px', height: '32px' }}
          title={theme === 'dark' ? 'ライトモードに変更' : 'ダークモードに変更'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <button
          onClick={onDisconnect}
          className="btn"
          style={{ padding: '5px 10px', color: 'var(--accent-red)' }}
          title="接続を切断"
        >
          <LogOut size={14} />
          <span>切断</span>
        </button>
      </div>
    </header>
  );
}
