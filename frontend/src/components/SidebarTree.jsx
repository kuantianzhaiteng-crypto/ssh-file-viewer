import React, { useState } from 'react';
import { 
  Folder, FolderOpen, FileText, Image as ImageIcon, FileCode, 
  Database, File, ChevronRight, ChevronDown, RefreshCw 
} from 'lucide-react';

export default function SidebarTree({ 
  items, 
  onSelectFile, 
  selectedPath, 
  onFetchSubdir, 
  loadingPath, 
  rootPath, 
  onRefresh 
}) {
  const [expandedDirs, setExpandedDirs] = useState(new Set([rootPath]));
  const [dirContents, setDirContents] = useState({ [rootPath]: items });

  const toggleDir = async (item) => {
    const isExpanded = expandedDirs.has(item.path);
    const newExpanded = new Set(expandedDirs);

    if (isExpanded) {
      newExpanded.delete(item.path);
      setExpandedDirs(newExpanded);
    } else {
      newExpanded.add(item.path);
      setExpandedDirs(newExpanded);
      if (!dirContents[item.path]) {
        const subItems = await onFetchSubdir(item.path);
        setDirContents(prev => ({ ...prev, [item.path]: subItems }));
      }
    }
  };

  const getFileIcon = (fileName, isDir, isExpanded) => {
    if (isDir) {
      return isExpanded ? <FolderOpen size={16} color="#eec052" /> : <Folder size={16} color="#eec052" />;
    }
    const ext = fileName.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
      return <ImageIcon size={16} color="#eb5757" />;
    }
    if (['md', 'markdown', 'txt', 'log'].includes(ext)) {
      return <FileText size={16} color="#2383e2" />;
    }
    if (['json', 'yaml', 'yml', 'csv', 'tsv', 'xml', 'sql'].includes(ext)) {
      return <Database size={16} color="#27ae60" />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'go', 'rs', 'c', 'cpp', 'java'].includes(ext)) {
      return <FileCode size={16} color="#f2994a" />;
    }
    return <File size={16} color="var(--text-muted)" />;
  };

  const renderTree = (currentItems, level = 0) => {
    if (!currentItems) return null;

    return currentItems.map((item) => {
      const isDir = item.type === 'directory';
      const isExpanded = expandedDirs.has(item.path);
      const isSelected = selectedPath === item.path;
      const isLoadingThis = loadingPath === item.path;

      return (
        <div key={item.path} style={{ userSelect: 'none' }}>
          <div
            onClick={() => isDir ? toggleDir(item) : onSelectFile(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 8px 5px',
              paddingLeft: `${level * 16 + 8}px`,
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              backgroundColor: isSelected ? 'var(--bg-active)' : 'transparent',
              color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isSelected ? '500' : '400',
              fontSize: '13px',
              transition: 'all 0.1s ease',
            }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <span style={{ width: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              {isDir ? (
                isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              ) : null}
            </span>

            {getFileIcon(item.name, isDir, isExpanded)}

            <span style={{ 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              flex: 1 
            }}>
              {item.name}
            </span>

            {isLoadingThis && <RefreshCw size={12} className="animate-spin" color="var(--text-muted)" />}
          </div>

          {isDir && isExpanded && dirContents[item.path] && (
            renderTree(dirContents[item.path], level + 1)
          )}
        </div>
      );
    });
  };

  return (
    <aside style={{
      width: '260px',
      minWidth: '220px',
      maxWidth: '360px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}>
        <span>ファイルツリー</span>
        <button 
          onClick={onRefresh} 
          title="ルートを更新" 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {items && items.length > 0 ? (
          renderTree(items, 0)
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
            ディレクトリは空です
          </div>
        )}
      </div>
    </aside>
  );
}
