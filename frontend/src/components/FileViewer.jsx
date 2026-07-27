import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  ZoomIn, ZoomOut, RotateCw, Maximize2, FileText, Download, 
  Code, Table as TableIcon, Layers, RefreshCw, AlertCircle 
} from 'lucide-react';
import { API_BASE } from '../config';

export default function FileViewer({ file, sessionId, theme, onDownload }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted' | 'raw' | 'table'

  // 画像ビューア用ステート
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imgBg, setImgBg] = useState('transparent'); // 'transparent' | 'white' | 'black'
  const [imgTimestamp, setImgTimestamp] = useState(Date.now());

  const ext = file ? file.name.split('.').pop().toLowerCase() : '';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext);
  const isMarkdown = ['md', 'markdown'].includes(ext);
  const isJson = ['json'].includes(ext);
  const isCsv = ['csv', 'tsv'].includes(ext);

  const fetchContent = async () => {
    if (!file || isImage) {
      if (isImage) setImgTimestamp(Date.now());
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/read?path=${encodeURIComponent(file.path)}`, {
        headers: { 'x-session-id': sessionId }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      const text = await res.text();
      setContent(text);
      if (isCsv) setViewMode('table');
      else if (isJson || isMarkdown) setViewMode('formatted');
      else setViewMode('raw');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [file, sessionId, isImage]);

  if (!file) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', gap: '12px', padding: '40px'
      }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--bg-sidebar)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={24} />
        </div>
        <p style={{ fontSize: '14px', fontWeight: '500' }}>左側のファイルツリーからファイルを選択してください</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Read-Onlyモードのため、誤ってファイルを変更する心配はありません</p>
      </div>
    );
  }

  const streamUrl = `${API_BASE}/api/stream?path=${encodeURIComponent(file.path)}&sessionId=${sessionId}&t=${imgTimestamp}`;

  // CSVをテーブルとしてパースする簡易ヘルパー
  const parseCsvToTable = (csvText) => {
    if (!csvText) return null;
    const lines = csvText.split(/\r\n|\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return null;
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1, 500).map(line => line.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
    return { headers, rows, truncated: lines.length > 501 };
  };

  // JSONをツリー表示するためのコンポーネント
  const renderJsonTree = (data, name = 'root', depth = 0) => {
    if (depth > 10) return <span>...</span>;
    const isObject = typeof data === 'object' && data !== null;

    if (!isObject) {
      let color = 'var(--text-primary)';
      if (typeof data === 'string') color = '#27ae60';
      if (typeof data === 'number') color = '#2980b9';
      if (typeof data === 'boolean') color = '#8e44ad';
      return <span style={{ color }}>{JSON.stringify(data)}</span>;
    }

    const isArray = Array.isArray(data);
    const entries = Object.entries(data);

    return (
      <div style={{ paddingLeft: depth > 0 ? '16px' : '0', borderLeft: depth > 0 ? '1px dashed var(--border-color)' : 'none' }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{name}: </span>
        <span style={{ color: 'var(--text-muted)' }}>{isArray ? `Array(${entries.length}) [` : 'Object {'}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '4px 0' }}>
          {entries.map(([key, value]) => (
            <div key={key}>
              {renderJsonTree(value, key, depth + 1)}
            </div>
          ))}
        </div>
        <span style={{ color: 'var(--text-muted)' }}>{isArray ? ']' : '}'}</span>
      </div>
    );
  };

  return (
    <main style={{
      flex: 1, height: '100%', display: 'flex', flexDirection: 'column',
      backgroundColor: 'var(--bg-main)', overflow: 'hidden'
    }}>
      {/* ビューアヘッダー・ツールバー */}
      <div style={{
        padding: '10px 24px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'var(--bg-main)', minHeight: '48px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{file.name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isImage && (
            <>
              <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} className="btn" title="縮小"><ZoomOut size={14} /></button>
              <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="btn" title="拡大"><ZoomIn size={14} /></button>
              <button onClick={() => setRotation(r => (r + 90) % 360)} className="btn" title="回転"><RotateCw size={14} /></button>
              <button onClick={() => { setZoom(1); setRotation(0); }} className="btn" title="リセット"><RefreshCw size={14} /></button>
              <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />
              <button onClick={() => setImgBg('transparent')} className="btn" style={{ background: imgBg === 'transparent' ? 'var(--bg-active)' : '' }} title="透過">柄</button>
              <button onClick={() => setImgBg('white')} className="btn" style={{ background: imgBg === 'white' ? '#fff' : '', color: '#000' }} title="白背景">白</button>
              <button onClick={() => setImgBg('black')} className="btn" style={{ background: imgBg === 'black' ? '#000' : '', color: '#fff' }} title="黒背景">黒</button>
            </>
          )}

          {(isMarkdown || isJson) && (
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-sidebar)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => setViewMode('formatted')} 
                style={{
                  padding: '4px 10px', fontSize: '12px', borderRadius: '3px', border: 'none', cursor: 'pointer',
                  backgroundColor: viewMode === 'formatted' ? 'var(--bg-card)' : 'transparent',
                  color: viewMode === 'formatted' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: viewMode === 'formatted' ? 'var(--shadow-sm)' : 'none',
                  fontWeight: viewMode === 'formatted' ? '500' : '400',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <Layers size={13} />
                <span>プレビュー</span>
              </button>
              <button 
                onClick={() => setViewMode('raw')} 
                style={{
                  padding: '4px 10px', fontSize: '12px', borderRadius: '3px', border: 'none', cursor: 'pointer',
                  backgroundColor: viewMode === 'raw' ? 'var(--bg-card)' : 'transparent',
                  color: viewMode === 'raw' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: viewMode === 'raw' ? 'var(--shadow-sm)' : 'none',
                  fontWeight: viewMode === 'raw' ? '500' : '400',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <Code size={13} />
                <span>ソース</span>
              </button>
            </div>
          )}

          {isCsv && (
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-sidebar)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-color)' }}>
              <button 
                onClick={() => setViewMode('table')} 
                style={{
                  padding: '4px 10px', fontSize: '12px', borderRadius: '3px', border: 'none', cursor: 'pointer',
                  backgroundColor: viewMode === 'table' ? 'var(--bg-card)' : 'transparent',
                  color: viewMode === 'table' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <TableIcon size={13} />
                <span>テーブル</span>
              </button>
              <button 
                onClick={() => setViewMode('raw')} 
                style={{
                  padding: '4px 10px', fontSize: '12px', borderRadius: '3px', border: 'none', cursor: 'pointer',
                  backgroundColor: viewMode === 'raw' ? 'var(--bg-card)' : 'transparent',
                  color: viewMode === 'raw' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: viewMode === 'raw' ? 'var(--shadow-sm)' : 'none',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}
              >
                <Code size={13} />
                <span>ソース</span>
              </button>
            </div>
          )}

          <button 
            onClick={fetchContent} 
            disabled={loading} 
            className="btn" 
            style={{ marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="ファイル内容を最新状態に再読み込み"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>更新</span>
          </button>
          <button onClick={() => onDownload(file)} className="btn btn-primary" style={{ marginLeft: '4px' }}>
            <Download size={14} />
            <span>保存</span>
          </button>
        </div>
      </div>

      {/* ビューアコンテンツエリア */}
      <div style={{ flex: 1, overflow: 'auto', padding: isImage ? '0' : '32px 48px' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', gap: '8px' }}>
            <RefreshCw size={18} className="animate-spin" />
            <span>ファイルを読み込み中...</span>
          </div>
        )}

        {error && (
          <div style={{
            padding: '16px', backgroundColor: 'rgba(235, 87, 87, 0.1)',
            border: '1px solid rgba(235, 87, 87, 0.3)', borderRadius: 'var(--radius-md)',
            color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '10px',
            maxWidth: '600px', margin: '20px auto'
          }}>
            <AlertCircle size={20} />
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>読み取りエラー</div>
              <div style={{ fontSize: '13px' }}>{error}</div>
            </div>
          </div>
        )}

        {/* 1. 画像プレビュー */}
        {!loading && !error && isImage && (
          <div style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'auto', padding: '32px',
            backgroundColor: imgBg === 'white' ? '#ffffff' : imgBg === 'black' ? '#000000' : 'transparent',
            backgroundImage: imgBg === 'transparent' ? 'radial-gradient(var(--border-color) 1px, transparent 0)' : 'none',
            backgroundSize: '16px 16px'
          }}>
            <img
              src={streamUrl}
              alt={file.name}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.15s ease',
                maxHeight: zoom <= 1 ? '85%' : 'none',
                maxWidth: zoom <= 1 ? '85%' : 'none',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                borderRadius: '4px'
              }}
            />
          </div>
        )}

        {/* 2. Markdown プレビュー (Notionスタイル) */}
        {!loading && !error && isMarkdown && viewMode === 'formatted' && (
          <div className="markdown-body animate-fade-in" style={{ maxWidth: '780px', margin: '0 auto', paddingBottom: '80px' }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={theme === 'dark' ? oneDark : oneLight}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{ borderRadius: '6px', fontSize: '13px', margin: '1em 0' }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {content || ''}
            </ReactMarkdown>
          </div>
        )}

        {/* 3. JSON データ構造ツリービュー */}
        {!loading && !error && isJson && viewMode === 'formatted' && (
          <div className="animate-fade-in" style={{ maxWidth: '850px', margin: '0 auto', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', lineHeight: 1.6, paddingBottom: '80px' }}>
            <div style={{ marginBottom: '16px', padding: '8px 12px', backgroundColor: 'var(--bg-sidebar)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '12px' }}>
              インタラクティブ・JSONデータ構造ビュー
            </div>
            {(() => {
              try {
                const parsed = JSON.parse(content);
                return renderJsonTree(parsed, 'root');
              } catch (e) {
                return <div style={{ color: 'var(--accent-red)' }}>JSONのパースに失敗しました: {e.message}</div>;
              }
            })()}
          </div>
        )}

        {/* 4. CSV テーブルビュー */}
        {!loading && !error && isCsv && viewMode === 'table' && (
          <div className="animate-fade-in" style={{ width: '100%', overflowX: 'auto', paddingBottom: '80px' }}>
            {(() => {
              const tableData = parseCsvToTable(content);
              if (!tableData) return <div>データがありません</div>;
              return (
                <>
                  {tableData.truncated && (
                    <div style={{ marginBottom: '12px', padding: '8px 12px', backgroundColor: 'rgba(35, 131, 226, 0.1)', color: 'var(--accent-blue)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                      ※ プレビュー速度最適化のため、最初の500行を表示しています。全データはダウンロードして確認してください。
                    </div>
                  )}
                  <table className="notion-table">
                    <thead>
                      <tr>
                        {tableData.headers.map((h, i) => (
                          <th key={i}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              );
            })()}
          </div>
        )}

        {/* 5. ソースコード＆一般テキストビュー (Raw / Syntax Highlighted) */}
        {!loading && !error && (!isImage && (viewMode === 'raw' || (!isMarkdown && !isJson && !isCsv))) && (
          <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '80px' }}>
            <SyntaxHighlighter
              style={theme === 'dark' ? oneDark : oneLight}
              language={ext || 'text'}
              showLineNumbers={true}
              customStyle={{
                backgroundColor: 'transparent',
                fontSize: '13px',
                lineHeight: 1.6,
                padding: '0',
                margin: '0',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              {content || ''}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </main>
  );
}
