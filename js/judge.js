/*
 * 正誤判定
 * 入力を正規化して、単語ごとに登録した正解候補と完全一致するか調べる。
 * 「ー」や「ッ」を一律に無視することはしない（候補は curriculum.js で単語ごとに決めている）。
 */
(function (root) {
  const P = (root.Phonics = root.Phonics || {});

  function normalize(input) {
    let s = String(input || '').normalize('NFKC');
    s = s.replace(/[\s・･、。,.'"]/g, '');
    // ひらがな → カタカナ
    s = s.replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
    // のばし棒のゆれ（-、〜 など）→ ー
    s = s.replace(/[-‐‑–—―─－~〜～]/g, 'ー');
    return s;
  }

  function isCorrect(input, word) {
    const a = normalize(input);
    return a.length > 0 && word.k.includes(a);
  }

  // 不正解時の「惜しい！」ヒント
  function nearMissHint(input, word) {
    const a = normalize(input);
    if (!a) return '';
    const oToOu = a.replace(/([オコソトノホモヨロゴゾドボポョォ])ー/g, '$1ウ');
    if (oToOu !== a && word.k.includes(oToOu)) {
      return '惜しい！ 長い o の音は「オウ」と書きます。「オー」は or の音として区別します。';
    }
    const strip = (s) => s.replace(/[ーッ]/g, '');
    const inputLong = a.includes('ー');
    const wordLong = word.k.some((c) => c.includes('ー'));
    if (word.k.some((c) => strip(c) === strip(a))) {
      if (inputLong && !wordLong) return '惜しい！ 短い音なので「ー」で伸ばしません。';
      if (!inputLong && wordLong) return '惜しい！ 長い音なので「ー」で伸ばします。';
    }
    if (inputLong && !wordLong && !/[イウ]/.test(word.main.slice(1))) {
      return 'この単語の母音は短い音です。伸ばさずに読みます。';
    }
    return '';
  }

  P.normalize = normalize;
  P.isCorrect = isCorrect;
  P.nearMissHint = nearMissHint;
})(typeof globalThis !== 'undefined' ? globalThis : window);
