import { test } from 'node:test';
import assert from 'node:assert/strict';

await import('../js/curriculum.js');
await import('../js/judge.js');
await import('../js/planner.js');
const P = globalThis.Phonics;
const W = P.WORDS;

// 決まった順の乱数（テストを毎回同じ結果にする）
function seeded(seed = 1) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}

/* ---------- カリキュラム ---------- */

test('単語はカリキュラム全体で重複しない', () => {
  const seen = new Map();
  for (const u of P.UNITS) for (const w of u.words) {
    assert.ok(!seen.has(w.w), `${w.w} が ${seen.get(w.w)} と ${u.id} に重複`);
    seen.set(w.w, u.id);
  }
});

test('正解候補はカタカナと「ー」だけ', () => {
  for (const w of Object.values(W)) for (const k of w.k) {
    assert.match(k, /^[ァ-ヺー]+$/, `${w.w}: ${k}`);
  }
});

test('各ユニットは繰り返しても別の問題を出せるだけの単語がある', () => {
  for (const u of P.UNITS) assert.ok(u.words.length >= 15, `${u.id}: ${u.words.length}`);
});

test('短い母音の単語は「ー」を正解にしない', () => {
  for (const u of P.UNITS.slice(0, 5)) for (const w of u.words) {
    assert.ok(w.k.every((k) => !k.includes('ー')), `${w.w}: ${w.k}`);
  }
});

const DISTINCT = [
  ['ship', 'sheep'], ['sit', 'seat'], ['fit', 'feet'], ['bit', 'beat'], ['hit', 'heat'],
  ['hop', 'hope'], ['not', 'note'], ['rob', 'robe'], ['cod', 'code'], ['rod', 'rode'],
  ['cut', 'cute'], ['tub', 'tube'], ['cub', 'cube'],
  ['bit', 'bite'], ['kit', 'kite'], ['pin', 'pine'], ['fin', 'fine'], ['hid', 'hide'], ['dim', 'dime'],
  ['cap', 'cape'], ['can', 'cane'], ['hat', 'hate'], ['mad', 'made'], ['tap', 'tape'], ['man', 'mane'],
  ['ran', 'rain'], ['pan', 'pain'], ['mad', 'maid'], ['pad', 'paid'], ['bat', 'bait'],
  ['cot', 'coat'], ['got', 'goat'], ['rod', 'road'],
  ['bone', 'born'], ['code', 'cord'], ['tone', 'torn'],
  ['cat', 'cut'], ['cat', 'cart'], ['shin', 'thin'], ['book', 'boot'], ['cut', 'cart'],
];

test('区別すべき組は、互いの読みが相手の正解にならない', () => {
  for (const [a, b] of DISTINCT) {
    assert.ok(W[a] && W[b], `${a}/${b} がカリキュラムにない`);
    for (const k of W[a].k) assert.ok(!W[b].k.includes(k), `${a} の「${k}」が ${b} でも正解になっている`);
  }
});

/* ---------- こたえあわせ ---------- */

test('ひらがな・半角・空白などは正規化する', () => {
  assert.equal(P.normalize(' きゃっと '), 'キャット');
  assert.equal(P.normalize('ｷｬｯﾄ'), 'キャット');
  assert.equal(P.normalize('しーぷ'), 'シープ');
  assert.equal(P.normalize('シ-プ'), 'シープ');
});

test('自然な表記ゆれは正解', () => {
  assert.ok(P.isCorrect('キャット', W.cat));
  assert.ok(P.isCorrect('キャト', W.cat));
  assert.ok(P.isCorrect('きゃっと', W.cat));
  assert.ok(P.isCorrect('ドグ', W.dog));
  assert.ok(P.isCorrect('ケイク', W.cake));
  assert.ok(P.isCorrect('ケーク', W.cake));
  assert.ok(P.isCorrect('ホウプ', W.hope));
  assert.ok(P.isCorrect('クウィズ', W.quiz));
});

test('発音のちがいは不正解', () => {
  assert.ok(!P.isCorrect('シープ', W.ship));
  assert.ok(!P.isCorrect('シップ', W.sheep));
  assert.ok(!P.isCorrect('ホープ', W.hope), 'オー は or の音');
  assert.ok(!P.isCorrect('ホウプ', W.hop));
  assert.ok(!P.isCorrect('カット', W.cat));
  assert.ok(!P.isCorrect('キュート', W.cut));
  assert.ok(!P.isCorrect('', W.cat));
});

test('おしいヒント', () => {
  assert.match(P.nearMissHint('シープ', W.ship), /のばさない/);
  assert.match(P.nearMissHint('シップ', W.sheep), /のばす/);
  assert.match(P.nearMissHint('ホープ', W.hope), /オウ/);
});

/* ---------- まいにちの内容 ---------- */

function answerAll(state, plan, wrongCount, date) {
  const answers = plan.questions.map((q, i) => ({ w: q.w, kind: q.kind, answer: 'x', correct: i >= wrongCount }));
  return P.applyResult(state, { date, units: plan.units, mode: plan.mode, answers });
}

test('はじめの日は 30問 すべて新しいルール', () => {
  const plan = P.buildDay(P.newState(), seeded());
  assert.equal(plan.questions.length, 30);
  assert.deepEqual(plan.units, [0]);
  assert.ok(plan.questions.every((q) => q.kind === 'new' && q.unit === 0));
  assert.equal(new Set(plan.questions.map((q) => q.w)).size, 30, '同じ日に同じ単語は出さない');
});

test('90％以上で次のユニットへ進む', () => {
  const s0 = P.newState();
  const s1 = answerAll(s0, P.buildDay(s0, seeded()), 3, '2026-11-22'); // 27/30 = 90%
  assert.equal(s1.unit, 1);
  assert.equal(s1.mode, 'normal');
  assert.equal(s1.sessions[0].accuracy, 90);
  assert.equal(s1.sessions[0].missed.length, 3);
  assert.equal(s1.sessions[0].date, '2026-11-22');
});

test('90％未満なら同じユニット。前日ミスが必ず入り、新しい問題は未出題の単語を優先', () => {
  const s0 = P.newState();
  const day1 = P.buildDay(s0, seeded(1));
  const s1 = answerAll(s0, day1, 4, '2026-11-22'); // 26/30 = 86.7%
  assert.equal(s1.unit, 0);
  assert.equal(s1.mode, 'retry');
  const day2 = P.buildDay(s1, seeded(2));
  assert.equal(day2.questions.length, 30);
  for (const w of s1.sessions[0].missed) {
    assert.ok(day2.questions.some((q) => q.w === w && q.kind === 'miss'), `${w} が復習に入っていない`);
  }
  const unseen = P.UNITS[0].words.filter((w) => !s1.wordStats[w.w]).map((w) => w.w);
  const newOnes = day2.questions.filter((q) => q.kind === 'new').map((q) => q.w);
  const expectUnseen = Math.min(unseen.length, newOnes.length);
  assert.equal(newOnes.filter((w) => unseen.includes(w)).length, expectUnseen);
  assert.ok(day2.counts.review >= 3, 'ランダム復習も入る');
});

test('70％未満は やさしい単語中心', () => {
  const s0 = P.newState();
  const s1 = answerAll(s0, P.buildDay(s0, seeded()), 15, 'd1');
  assert.equal(s1.mode, 'easy');
  const day2 = P.buildDay(s1, seeded(5));
  const lv = day2.questions.filter((q) => q.kind === 'new').map((q) => W[q.w].lv);
  assert.ok(lv.length >= 12);
  assert.ok(lv.every((l) => l === 1) || lv.filter((l) => l === 1).length >= P.UNITS[0].words.filter((w) => w.lv === 1).length - 15);
});

test('2回つづけてほぼ満点なら、2つのルールを同時に進める', () => {
  let s = P.newState();
  s = answerAll(s, P.buildDay(s, seeded(1)), 0, 'd1');
  assert.equal(s.mode, 'normal');
  s = answerAll(s, P.buildDay(s, seeded(2)), 1, 'd2');
  assert.equal(s.unit, 2);
  assert.equal(s.mode, 'fast');
  const plan = P.buildDay(s, seeded(3));
  assert.deepEqual(plan.units, [2, 3]);
  assert.ok(plan.questions.some((q) => q.kind === 'new' && q.unit === 3));
  s = answerAll(s, plan, 2, 'd3');
  assert.equal(s.unit, 4, '合格すると2つ分すすむ');
  assert.equal(s.mode, 'normal');
});

test('ユニット2以降はランダム復習が入り、合計はいつも30問', () => {
  let s = P.newState();
  const rng = seeded(9);
  for (let d = 0; d < 40; d++) {
    const plan = P.buildDay(s, rng);
    assert.equal(plan.questions.length, 30, `day ${d}`);
    assert.equal(new Set(plan.questions.map((q) => q.w)).size, 30);
    if (d > 0) assert.ok(plan.counts.review > 0 || plan.counts.miss > 0);
    if (s.unit > 0 && s.unit < P.UNITS.length) assert.ok(plan.counts.new >= 12);
    s = answerAll(s, plan, d % 3 === 0 ? 5 : 2, `d${d}`);
  }
});

test('全ユニット終了後は復習モード', () => {
  const s = { ...P.newState(), unit: P.UNITS.length, mode: 'graduate', wordStats: { cat: { seen: 1, miss: 1 }, dog: { seen: 2, miss: 0 } } };
  const plan = P.buildDay(s, seeded());
  assert.equal(plan.mode, 'graduate');
  assert.ok(plan.questions.every((q) => q.kind === 'review'));
});
