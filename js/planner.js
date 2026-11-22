/*
 * 毎日の学習内容を決める
 *  - buildDay(state, rng)      : 今日の30問とメッセージを作る
 *  - applyResult(state, result): 結果を履歴に保存し、あしたの内容（ユニット・モード）を決める
 * どちらも state を直接は変更せず、新しいオブジェクトを返す。
 */
(function (root) {
  const P = (root.Phonics = root.Phonics || {});
  const DAILY = 30;
  const PASS = 0.9;
  const EASY_BELOW = 0.7;
  const MAX_MISS = 15; // 前日ミスの上限（新ルールを最低12問は残すため）
  const MIN_NEW = 12;

  function newState() {
    return { version: 1, unit: 0, mode: 'start', sessions: [], wordStats: {}, current: null };
  }

  function shuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 重みつき・重複なしの抽選
  function weightedSample(items, weightOf, n, rng) {
    return items
      .map((it) => ({ it, key: Math.pow(rng() || 1e-9, 1 / Math.max(weightOf(it), 1e-6)) }))
      .sort((x, y) => y.key - x.key)
      .slice(0, n)
      .map((x) => x.it);
  }

  function unitsForToday(state) {
    const { UNITS } = P;
    if (state.unit >= UNITS.length) return [];
    if (state.mode === 'fast' && state.unit + 1 < UNITS.length) return [state.unit, state.unit + 1];
    return [state.unit];
  }

  function pickNewWords(unitIdx, n, state, used, rng) {
    const { UNITS } = P;
    const stats = state.wordStats;
    const easy = state.mode === 'easy';
    const cands = shuffle(
      UNITS[unitIdx].words.filter((w) => !used.has(w.w)),
      rng
    );
    // まだ出していない単語 → 出した回数が少ない単語 → 前に出したのが古い単語 の順。
    // やさしいモードでは レベル1 を さきに。
    cands.sort((a, b) => {
      const sa = stats[a.w] || {};
      const sb = stats[b.w] || {};
      if (easy && a.lv !== b.lv) return a.lv - b.lv;
      if ((sa.seen || 0) !== (sb.seen || 0)) return (sa.seen || 0) - (sb.seen || 0);
      return (sa.last || '').localeCompare(sb.last || '');
    });
    return cands.slice(0, n);
  }

  function buildDay(state, rng = Math.random) {
    const { UNITS, WORDS } = P;
    const last = state.sessions[state.sessions.length - 1];
    const units = unitsForToday(state);
    const graduated = units.length === 0;
    const used = new Set();
    const questions = [];
    const add = (w, kind) => {
      used.add(w.w);
      questions.push({ w: w.w, unit: WORDS[w.w].unit, kind });
    };

    // 1) 前日のミス（必ず入れる）
    const missed = last ? [...new Set(last.missed)].filter((w) => WORDS[w]) : [];
    missed.slice(0, MAX_MISS).forEach((w) => add(WORDS[w], 'miss'));
    const missCount = questions.length;

    // 2) ランダム復習の数（ミスが多い日は少なめ）
    const reviewPool = () => {
      const seen = Object.keys(state.wordStats).filter((w) => WORDS[w] && !used.has(w) && state.wordStats[w].seen > 0);
      const past = seen.filter((w) => WORDS[w].unit < (units[0] ?? Infinity));
      return past.length > 0 ? past : seen;
    };
    let reviewTarget = 0;
    if (graduated) reviewTarget = DAILY - missCount;
    else if (reviewPool().length > 0) reviewTarget = Math.max(3, Math.min(8, 8 - Math.floor(missCount / 3)));

    // 3) 新ルール（のこり全部。最低 MIN_NEW 問）
    let newCount = graduated ? 0 : Math.max(MIN_NEW, DAILY - missCount - reviewTarget);
    newCount = Math.min(newCount, DAILY - missCount);
    if (!graduated) {
      const shares = units.length === 2 ? [Math.ceil(newCount * 0.6), Math.floor(newCount * 0.4)] : [newCount];
      units.forEach((u, i) => pickNewWords(u, shares[i], state, used, rng).forEach((w) => add(w, 'new')));
    }
    const newPicked = questions.length - missCount;

    // 4) のこりを ランダム復習で うめる（ミスの多い単語ほど出やすい）
    const rest = DAILY - questions.length;
    if (rest > 0) {
      let pool = reviewPool();
      const weight = (w) => {
        const s = state.wordStats[w];
        return 1 + 3 * (s.miss || 0) - Math.min(s.streak || 0, 3) * 0.25;
      };
      weightedSample(pool, weight, rest, rng).forEach((w) => add(WORDS[w], 'review'));
    }
    // それでも足りない時（はじめの日など）は今のユニットの単語で うめる
    if (questions.length < DAILY && !graduated) {
      const more = pickNewWords(units[0], DAILY - questions.length, state, used, rng);
      more.forEach((w) => add(w, 'new'));
    }

    const reviewCount = questions.filter((q) => q.kind === 'review').length;
    return {
      units,
      mode: graduated ? 'graduate' : state.mode,
      questions: shuffle(questions, rng),
      counts: { new: questions.length - missCount - reviewCount, miss: missCount, review: reviewCount },
      messages: dayMessages(state, units, last, { miss: missCount, review: reviewCount, newPicked }),
    };
  }

  function pct(s) {
    return Math.round((s.correct / s.total) * 100);
  }

  function dayMessages(state, units, last, counts) {
    const { UNITS } = P;
    const t = (i) => `「${UNITS[i].title}」`;
    const msgs = [];
    if (units.length === 0) {
      msgs.push('すべてのルールを修了しました。お疲れさまでした。');
      msgs.push('今日は苦手な単語を中心に復習します。');
    } else if (!last) {
      msgs.push(`ようこそ。今日は${t(units[0])}から始めます。`);
    } else {
      const p = pct(last);
      switch (state.mode) {
        case 'fast':
          msgs.push('2回続けてほぼ全問正解でした。ペースを上げます。');
          msgs.push(units.length === 2 ? `今日は${t(units[0])}と${t(units[1])}を同時に学習します。` : `今日は${t(units[0])}を学習します。`);
          break;
        case 'normal':
          msgs.push(`前回は${p}％で合格でした。`);
          msgs.push(`今日は新しいルール${t(units[0])}を学習します。`);
          break;
        case 'retry':
          msgs.push(`前回は${p}％でした。合格（90％）まであと少しです。`);
          msgs.push(`今日も${t(units[0])}を、別の単語で練習します。`);
          break;
        case 'easy':
          msgs.push(`前回は${p}％でした。焦らず進めましょう。`);
          msgs.push(`今日は短くやさしい単語を中心に${t(units[0])}を練習します。`);
          break;
        default:
          msgs.push(`今日は${t(units[0])}を学習します。`);
      }
    }
    if (counts.miss > 0) msgs.push(`前回間違えた単語が${counts.miss}問含まれています。`);
    if (counts.review > 0) msgs.push(`これまでに学習した単語の復習が${counts.review}問あります。`);
    return msgs;
  }

  /*
   * result: { date, units, mode, answers: [{ w, kind, answer, correct }] }
   */
  function applyResult(state, result) {
    const { UNITS } = P;
    const total = result.answers.length;
    const correct = result.answers.filter((a) => a.correct).length;
    const acc = total ? correct / total : 0;
    const passed = acc >= PASS;

    const wordStats = { ...state.wordStats };
    for (const a of result.answers) {
      const s = { seen: 0, miss: 0, streak: 0, ...(wordStats[a.w] || {}) };
      s.seen += 1;
      s.last = result.date;
      if (a.correct) s.streak += 1;
      else {
        s.miss += 1;
        s.streak = 0;
      }
      wordStats[a.w] = s;
    }

    const session = {
      date: result.date,
      units: result.units.slice(),
      mode: result.mode,
      total,
      correct,
      accuracy: Math.round(acc * 100),
      missed: [...new Set(result.answers.filter((a) => !a.correct).map((a) => a.w))],
      passed,
    };
    const sessions = [...state.sessions, session];

    let unit = state.unit;
    let mode;
    if (result.units.length === 0) {
      mode = 'graduate';
    } else if (passed) {
      unit = Math.max(...result.units) + 1;
      const prev = state.sessions[state.sessions.length - 1];
      const nearPerfect = (s) => s && s.total - s.correct <= 1;
      mode = nearPerfect(session) && nearPerfect(prev) ? 'fast' : 'normal';
      if (unit >= UNITS.length) mode = 'graduate';
    } else {
      unit = Math.min(...result.units);
      mode = acc < EASY_BELOW ? 'easy' : 'retry';
    }

    return { ...state, unit, mode, sessions, wordStats, current: null };
  }

  // 結果画面用：次回の予定
  function describeNext(state) {
    const { UNITS } = P;
    const units = unitsForToday(state);
    if (units.length === 0) return '次回は苦手な単語を復習します。';
    const t = (i) => `「${UNITS[i].title}」`;
    switch (state.mode) {
      case 'fast':
        return units.length === 2
          ? `次回は${t(units[0])}と${t(units[1])}を同時に学習します。`
          : `次回は${t(units[0])}を学習します。`;
      case 'retry':
        return `次回も${t(units[0])}を、別の単語で練習します。`;
      case 'easy':
        return `次回は${t(units[0])}を、やさしい単語を中心に練習します。`;
      default:
        return `次回は新しいルール${t(units[0])}を学習します。`;
    }
  }

  function dayNumber(state, today) {
    const dates = new Set(state.sessions.map((s) => s.date));
    if (!dates.has(today)) dates.add(today);
    return dates.size;
  }

  Object.assign(P, { DAILY, PASS, newState, buildDay, applyResult, describeNext, dayNumber, unitsForToday });
})(typeof globalThis !== 'undefined' ? globalThis : window);
