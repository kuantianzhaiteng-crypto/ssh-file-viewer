// 開発サーバー(5173ポート)から開かれた場合: バックエンドの3001ポートを指定
// 一体型アプリ(3001ポート)としてWindows等で開かれた場合: 自動で同一オリジンの相対パス(/api/...)を使用
export const API_BASE = (import.meta.env.PROD || window.location.port === '3001') ? '' : `http://${window.location.hostname}:3001`;
