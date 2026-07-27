import React, { useState, useEffect } from 'react';
import ConnectModal from './components/ConnectModal';
import SidebarTree from './components/SidebarTree';
import Header from './components/Header';
import FileViewer from './components/FileViewer';
import { API_BASE } from './config';

export default function App() {
  const [theme, setTheme] = useState('light');
  const [sessionInfo, setSessionInfo] = useState(null); // { sessionId, initialPath, host, username }
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);

  const [treeItems, setTreeItems] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingPath, setLoadingPath] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ブラウザのリロード(F5等)時にセッションを自動復元する
  useEffect(() => {
    const savedSession = sessionStorage.getItem('aether_active_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        fetch(`${API_BASE}/api/list?path=${encodeURIComponent(parsed.initialPath)}`, {
          headers: { 'x-session-id': parsed.sessionId }
        })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Session expired');
        })
        .then(data => {
          setSessionInfo(parsed);
          setTreeItems(data.items);
        })
        .catch(() => {
          sessionStorage.removeItem('aether_active_session');
        });
      } catch (e) {
        sessionStorage.removeItem('aether_active_session');
      }
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleConnect = async (credentials) => {
    setConnecting(true);
    setConnectError(null);
    try {
      const res = await fetch(`${API_BASE}/api/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '接続に失敗しました。');
      }
      setSessionInfo(data);
      sessionStorage.setItem('aether_active_session', JSON.stringify(data));
      await fetchDirList(data.initialPath, data.sessionId, true);
    } catch (err) {
      setConnectError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const fetchDirList = async (targetPath, sid = null, isRoot = false) => {
    const activeSid = sid || (sessionInfo ? sessionInfo.sessionId : null);
    if (!activeSid) return [];

    setLoadingPath(targetPath);
    try {
      const res = await fetch(`${API_BASE}/api/list?path=${encodeURIComponent(targetPath)}`, {
        headers: { 'x-session-id': activeSid }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ディレクトリ読み取りエラー');
      }
      if (isRoot) {
        setTreeItems(data.items);
      }
      return data.items;
    } catch (err) {
      console.error('Fetch Dir Error:', err);
      return [];
    } finally {
      setLoadingPath(null);
    }
  };

  const handleSelectFile = (file) => {
    setSelectedFile(file);
  };

  const handleDownload = (file) => {
    if (!sessionInfo || !file) return;
    const url = `${API_BASE}/api/download?path=${encodeURIComponent(file.path)}&sessionId=${sessionInfo.sessionId}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', file.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDisconnect = async () => {
    if (!sessionInfo) return;
    try {
      await fetch(`${API_BASE}/api/disconnect?sessionId=${sessionInfo.sessionId}`, {
        method: 'POST',
        headers: { 'x-session-id': sessionInfo.sessionId }
      });
    } catch (e) {
      console.error(e);
    } finally {
      sessionStorage.removeItem('aether_active_session');
      setSessionInfo(null);
      setSelectedFile(null);
      setTreeItems([]);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      {!sessionInfo && (
        <ConnectModal
          onConnect={handleConnect}
          loading={connecting}
          error={connectError}
        />
      )}

      {sessionInfo && (
        <>
          <Header
            sessionInfo={sessionInfo}
            selectedFile={selectedFile}
            onDownload={handleDownload}
            onDisconnect={handleDisconnect}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <SidebarTree
              items={treeItems}
              onSelectFile={handleSelectFile}
              selectedPath={selectedFile ? selectedFile.path : null}
              onFetchSubdir={(path) => fetchDirList(path)}
              loadingPath={loadingPath}
              rootPath={sessionInfo.initialPath}
              onRefresh={() => fetchDirList(sessionInfo.initialPath, sessionInfo.sessionId, true)}
            />
            <FileViewer
              file={selectedFile}
              sessionId={sessionInfo.sessionId}
              theme={theme}
              onDownload={handleDownload}
            />
          </div>
        </>
      )}
    </div>
  );
}
