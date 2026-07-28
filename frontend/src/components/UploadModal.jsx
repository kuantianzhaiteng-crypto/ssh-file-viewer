import React, { useState, useRef } from 'react';
import { UploadCloud, X, ArrowRight, Folder } from 'lucide-react';
import { API_BASE } from '../config';

export default function UploadModal({ onClose, sessionId, defaultPath, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [targetPath, setTargetPath] = useState(defaultPath || '/');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('ファイルを選択してください。');
      return;
    }
    if (!targetPath) {
      setError('保存先のパスを指定してください。');
      return;
    }

    setLoading(true);
    setError(null);

    // Combine path and filename if targetPath ends with / or is a directory
    // If it doesn't end with /, we assume it's a directory anyway or they specified full path?
    // Let's assume the user specifies a directory path, and we append the filename.
    let finalPath = targetPath;
    if (!finalPath.endsWith('/')) {
      finalPath += '/';
    }
    finalPath += file.name;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', finalPath);

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: { 'x-session-id': sessionId },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'アップロードに失敗しました。');
      }
      onUploadComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100
    }}>
      <div className="animate-fade-in" style={{
        backgroundColor: 'var(--bg-main)',
        padding: '24px 32px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        width: '400px',
        maxWidth: '90vw',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ padding: '8px', backgroundColor: 'var(--bg-active)', borderRadius: 'var(--radius-md)' }}>
            <UploadCloud size={24} color="var(--accent-blue)" />
          </div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>ファイルアップロード</h2>
        </div>

        {error && (
          <div style={{ marginBottom: '16px', padding: '10px 12px', backgroundColor: 'rgba(235, 87, 87, 0.1)', border: '1px solid rgba(235, 87, 87, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-red)', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>ファイルを選択</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div 
              onClick={() => fileInputRef.current.click()}
              style={{
                border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center',
                cursor: 'pointer', backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-primary)', fontSize: '13px'
              }}
            >
              {file ? (
                <span style={{ color: 'var(--accent-blue)', fontWeight: '500' }}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>クリックしてファイルを選択</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Folder size={14} /> 保存先のパス (ディレクトリ)
            </label>
            <input
              type="text"
              className="input-field"
              value={targetPath}
              onChange={e => setTargetPath(e.target.value)}
              placeholder="/var/www/html"
            />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              指定したディレクトリ内にファイル名で保存されます。
            </div>
          </div>

          <button type="submit" disabled={loading || !file} className="btn btn-primary" style={{ marginTop: '8px', padding: '10px', width: '100%', fontSize: '14px', justifyContent: 'center' }}>
            {loading ? 'アップロード中...' : (
              <>
                <span>アップロード実行</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
