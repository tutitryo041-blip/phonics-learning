/*
 * 学習履歴の保存（ブラウザの localStorage）と、JSON の書き出し・読み込み
 */
(function (root) {
  const P = (root.Phonics = root.Phonics || {});
  const KEY = 'phonics-katakana-v1';

  function load() {
    try {
      const raw = root.localStorage && root.localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.version === 1) return s;
      }
    } catch (e) {
      console.warn('load failed', e);
    }
    return P.newState();
  }

  function save(state) {
    try {
      root.localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('save failed', e);
      return false;
    }
  }

  function exportJSON(state) {
    return JSON.stringify(state, null, 2);
  }

  function importJSON(text) {
    const s = JSON.parse(text);
    if (!s || s.version !== 1 || !Array.isArray(s.sessions) || typeof s.unit !== 'number') {
      throw new Error('ファイルの形式が正しくありません');
    }
    return s;
  }

  function today() {
    const d = new Date();
    const z = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  }

  Object.assign(P, { loadState: load, saveState: save, exportJSON, importJSON, today });
})(typeof globalThis !== 'undefined' ? globalThis : window);
