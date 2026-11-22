/*
 * こたえあわせ
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

  // まちがえた時の「おしい！」ヒント
  function nearMissHint(input, word) {
    const a = normalize(input);
    if (!a) return '';
    const oToOu = a.replace(/([オコソトノホモヨロゴゾドボポョォ])ー/g, '$1ウ');
    if (oToOu !== a && word.k.includes(oToOu)) {
      return 'おしい！ o の なまえの 音は「オウ」と かくよ。「オー」は or の 音だよ。';
    }
    const strip = (s) => s.replace(/[ーッ]/g, '');
    const inputLong = a.includes('ー');
    const wordLong = word.k.some((c) => c.includes('ー'));
    if (word.k.some((c) => strip(c) === strip(a))) {
      if (inputLong && !wordLong) return 'おしい！ みじかい 音だから「ー」で のばさないよ。';
      if (!inputLong && wordLong) return 'おしい！ のばす 音「ー」を わすれたかな？';
    }
    if (inputLong && !wordLong && !/[イウ]/.test(word.main.slice(1))) {
      return 'この たんごは みじかい 音だよ。のばさずに よもう。';
    }
    return '';
  }

  P.normalize = normalize;
  P.isCorrect = isCorrect;
  P.nearMissHint = nearMissHint;
})(typeof globalThis !== 'undefined' ? globalThis : window);
