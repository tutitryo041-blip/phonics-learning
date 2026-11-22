/*
 * カリキュラム（ルールと単語）
 *
 * 単語の行は「英単語  正解のカタカナ(/で複数)  レベル(1=やさしい 2=すこしむずかしい 3=むずかしい)」。
 *
 * 正解候補のルール：
 *  - 同じ英語の音を表す、自然なカタカナの書き方のちがいだけを正解にする。
 *  - 「ッ」を書いた候補には、「ッ」をはぶいた形も自動で正解に加える（キャット → キャト）。
 *  - 「エイ」（a の名前の音）には「エー」も自動で正解に加える（ケイク → ケーク）。
 *  - 長い o（o_e・oa・ow）は「オウ」だけ。「オー」は or の音（fork フォーク）にとっておく。
 *  - 短い母音の単語には「ー」をつけない。長い母音の単語は「ー」や「イ」「ウ」でのばす。
 *    → ship(シップ) と sheep(シープ)、hop(ホップ) と hope(ホウプ) はちがう答えになる。
 */
(function (root) {
  const P = (root.Phonics = root.Phonics || {});

  const E_COL = 'エケセテネヘメレゲゼデベペェ';

  function expand(cands) {
    const out = new Set();
    for (const c of cands) {
      out.add(c);
      if (c.includes('ッ')) out.add(c.replace(/ッ/g, ''));
    }
    for (const c of [...out]) {
      let s = '';
      for (let i = 0; i < c.length; i++) {
        if (c[i] === 'イ' && i > 0 && E_COL.includes(c[i - 1])) s += 'ー';
        else s += c[i];
      }
      if (s !== c) out.add(s);
    }
    return [...out];
  }

  function parseWords(text) {
    return text
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [w, k, lv] = line.split(/\s+/);
        const base = k.split('/');
        return { w, k: expand(base), main: base[0], lv: Number(lv || 1) };
      });
  }

  const UNITS = [
    {
      id: 'short-a',
      title: 'みじかい a（ア）',
      explain: [
        'a は、くちを おおきく あけて、みじかく「ア」と いうよ。',
        'c・k・g の あとでは「キャ」「ギャ」に なるよ。cat は「キャット」。',
        'のばさないで、みじかく よもうね。',
      ],
      hint: 'a は みじかい「ア」。c や g の あとは「キャ」「ギャ」だよ。',
      focus: 'a',
      words: `
cat キャット 1
can キャン 1
cap キャップ 1
cab キャブ 2
gap ギャップ 2
gas ギャス 2
bat バット 1
hat ハット 1
mat マット 1
rat ラット 1
sat サット 1
pat パット 1
fat ファット 1
man マン 1
fan ファン 1
pan パン 1
ran ラン 1
tan タン 2
map マップ 1
nap ナップ 1
tap タップ 1
lap ラップ 1
bag バッグ 1
tag タッグ 1
rag ラッグ 2
wag ワッグ 2
dad ダッド 1
bad バッド 1
sad サッド 1
mad マッド 1
pad パッド 1
had ハッド 1
ham ハム 1
jam ジャム 2
ram ラム 2
yam ヤム 2
van ヴァン/バン 2
`,
    },
    {
      id: 'short-i',
      title: 'みじかい i（イ）',
      explain: [
        'i は、みじかく「イ」と いうよ。',
        'のばして「イー」に しないでね。pig は「ピッグ」。',
      ],
      hint: 'i は みじかい「イ」。のばさないよ。',
      focus: 'i',
      words: `
pig ピッグ 1
big ビッグ 1
dig ディッグ 1
wig ウィッグ 2
fig フィッグ 2
jig ジッグ 2
pin ピン 1
pit ピット 1
sit シット/スィット 1
hit ヒット 1
bit ビット 1
fit フィット 1
kit キット 1
lit リット 2
tip ティップ 1
hip ヒップ 1
lip リップ 1
dip ディップ 1
zip ジップ/ズィップ 2
fin フィン 1
win ウィン 1
tin ティン 2
bin ビン 1
kid キッド 1
lid リッド 1
hid ヒッド 2
did ディッド 1
him ヒム 1
rim リム 2
dim ディム 2
his ヒズ 1
gig ギッグ 2
`,
    },
    {
      id: 'short-o',
      title: 'みじかい o（オ）',
      explain: [
        'o は、くちを まるくして、みじかく「オ」と いうよ。',
        'dog は「ドッグ」、hot は「ホット」。',
      ],
      hint: 'o は みじかい「オ」。のばさないよ。',
      focus: 'o',
      words: `
dog ドッグ 1
log ロッグ 1
fog フォッグ 2
hog ホッグ 2
jog ジョッグ 2
hot ホット 1
pot ポット 1
dot ドット 1
not ノット 1
lot ロット 1
got ゴット 1
cot コット 2
top トップ 1
hop ホップ 1
mop モップ 1
pop ポップ 1
cop コップ 1
job ジョブ 1
rob ロブ 1
mob モブ 2
sob ソブ 2
cob コブ 2
nod ノッド 1
rod ロッド 1
pod ポッド 2
cod コッド 2
doll ドル 2
on オン 1
`,
    },
    {
      id: 'short-u',
      title: 'みじかい u（ア）',
      explain: [
        'u は、くちを あまり あけずに、のどの おくから みじかく「ア」と いうよ。',
        'cup は「カップ」、sun は「サン」。',
        'c や g の あとでも「カ」「ガ」だよ（a の「キャ」とは ちがうね）。',
      ],
      hint: 'u は みじかい「ア」。c・g の あとは「カ」「ガ」だよ。',
      focus: 'u',
      words: `
cup カップ 1
cut カット 1
bus バス 1
sun サン 1
fun ファン 1
run ラン 1
bun バン 1
gun ガン 1
nut ナット 1
hut ハット 1
but バット 1
rug ラッグ 1
bug バッグ 1
hug ハッグ 1
mug マッグ 1
jug ジャッグ 2
dug ダッグ 2
tug タッグ 2
pup パップ 2
mud マッド 1
bud バッド 2
tub タブ 1
cub カブ 1
rub ラブ 1
sub サブ 2
hum ハム 2
gum ガム 1
sum サム 2
yum ヤム 2
up アップ 1
dull ダル 2
fuzz ファズ 2
`,
    },
    {
      id: 'short-e',
      title: 'みじかい e（エ）',
      explain: [
        'e は、みじかく「エ」と いうよ。',
        'bed は「ベッド」、pen は「ペン」。',
      ],
      hint: 'e は みじかい「エ」だよ。',
      focus: 'e',
      words: `
bed ベッド 1
red レッド 1
fed フェッド 2
led レッド 2
wed ウェッド 2
pen ペン 1
hen ヘン 1
ten テン 1
men メン 1
den デン 2
net ネット 1
pet ペット 1
wet ウェット 1
jet ジェット 1
get ゲット 1
let レット 1
met メット 2
set セット 1
bet ベット 2
vet ヴェット/ベット 2
leg レッグ 1
beg ベッグ 2
peg ペッグ 2
keg ケッグ 2
yes イエス/イェス 1
yet イエット/イェット 2
web ウェブ 1
hem ヘム 2
bell ベル 1
tell テル 1
sell セル 1
well ウェル 1
`,
    },
    {
      id: 'x-qu-wh',
      title: 'x・qu・wh と ならぶ もじ',
      explain: [
        'x は「クス」。box は「ボックス」。',
        'qu は「クウ」。quiz は「クイズ」（クウィズ）。',
        'wh は「ウ」。when は「ウェン」。',
        'll・ss・ff・zz の ように おなじ もじが 2つ ならんでも、音は 1つだよ。',
      ],
      hint: 'x は「クス」、qu は「クウ」、wh は「ウ」。おなじ もじ 2つは 1つの音。',
      focus: 'x|qu|wh|ll|ss|ff|zz',
      words: `
box ボックス 1
fox フォックス 1
six シックス/スィックス 1
mix ミックス 1
fix フィックス 1
wax ワックス 2
tax タックス 2
ox オックス 2
fax ファックス 2
quiz クイズ/クウィズ 2
quit クイット/クウィット 2
quill クイル/クウィル 3
when ウェン 1
whip ウィップ 2
whiz ウィズ 2
whim ウィム 3
kiss キス/キッス 1
miss ミス 1
mess メス 1
less レス 2
boss ボス 1
moss モス 2
puff パフ 2
cuff カフ 2
off オフ 1
buzz バズ 2
fizz フィズ 2
hill ヒル 1
fill フィル 1
will ウィル 1
`,
    },
    {
      id: 'sh',
      title: 'sh（シュ）',
      explain: [
        's と h が ならぶと「シュッ」と いう 音に なるよ。',
        'うしろの 音と くっついて「シャ・シ・シュ・シェ・ショ」に なるよ。',
        'ship は「シップ」、fish は「フィッシュ」。',
      ],
      hint: 'sh は「シュ」の音。シャ・シ・シュ・シェ・ショ だよ。',
      focus: 'sh',
      words: `
ship シップ 1
shop ショップ 1
shut シャット 1
shed シェッド 2
shin シン 2
shot ショット 1
shell シェル 1
sham シャム 3
fish フィッシュ 1
dish ディッシュ 1
wish ウィッシュ 1
mash マッシュ 2
cash キャッシュ 1
rash ラッシュ 2
dash ダッシュ 1
gash ギャッシュ 3
lash ラッシュ 3
hush ハッシュ 2
rush ラッシュ 1
gush ガッシュ 2
bash バッシュ 2
posh ポッシュ 3
gosh ゴッシュ 2
mesh メッシュ 2
`,
    },
    {
      id: 'ch',
      title: 'ch・tch（チ）',
      explain: [
        'c と h が ならぶと「チ」の 音に なるよ。',
        'うしろの 音と くっついて「チャ・チ・チュ・チェ・チョ」。',
        'tch も おなじ「ッチ」。catch は「キャッチ」。',
      ],
      hint: 'ch と tch は「チ」の音。tch は「ッチ」だよ。',
      focus: 'tch|ch',
      words: `
chin チン 1
chip チップ 1
chop チョップ 1
chat チャット 1
chum チャム 3
chug チャッグ 2
chap チャップ 2
much マッチ 1
such サッチ 1
rich リッチ 1
catch キャッチ 1
match マッチ 1
patch パッチ 2
hatch ハッチ 2
latch ラッチ 3
batch バッチ 2
pitch ピッチ 1
ditch ディッチ 2
witch ウィッチ 1
hitch ヒッチ 2
fetch フェッチ 2
notch ノッチ 3
hutch ハッチ 3
itch イッチ 1
`,
    },
    {
      id: 'th',
      title: 'th（ス・ズ）',
      explain: [
        't と h が ならぶと、したを はで かるく はさんで 出す 音に なるよ。',
        'いきだけ 出すと「ス」、こえを 出すと「ズ」や「ド」に ちかい 音。',
        'thin は「スィン」、this は「ズィス」（ディス）。',
        's の「シ」や sh の「シ」とは ちがう 音だから、「ス」「ズ」で かこうね。',
      ],
      hint: 'th は したを はさむ音。「ス」か「ズ」で かくよ。',
      focus: 'th',
      words: `
thin スィン 1
thick スィック 2
thud サッド 3
thug サッグ 3
with ウィズ/ウィス 1
bath バス 1
math マス 1
path パス 1
moth モス 2
pith ピス 3
tenth テンス 3
fifth フィフス 3
this ズィス/ディス 1
that ザット/ダット 1
then ゼン/デン 1
them ゼム/デム 1
than ザン/ダン 2
thus ザス/ダス 2
`,
    },
    {
      id: 'ck-ng-nk',
      title: 'ck・ng・nk',
      explain: [
        'ck は「ック」。back は「バック」。',
        'ng は「ング」。king は「キング」。',
        'nk は「ンク」。pink は「ピンク」。',
      ],
      hint: 'ck は「ック」、ng は「ング」、nk は「ンク」だよ。',
      focus: 'ck|ng|nk',
      words: `
back バック 1
pack パック 1
sack サック 2
rack ラック 2
jack ジャック 2
kick キック 1
pick ピック 1
sick シック/スィック 1
lick リック 2
tick ティック 2
rock ロック 1
sock ソック 1
lock ロック 1
dock ドック 2
duck ダック 1
luck ラック 1
tuck タック 2
neck ネック 1
deck デック 2
peck ペック 2
king キング 1
ring リング 1
sing シング/スィング 1
wing ウィング 1
bang バング 2
hang ハング 2
rang ラング 2
song ソング 1
long ロング 1
hung ハング 2
sung サング 2
bank バンク 1
tank タンク 1
pink ピンク 1
sink シンク/スィンク 2
wink ウィンク 2
honk ホンク 2
junk ジャンク 2
bunk バンク 2
think スィンク 3
`,
    },
    {
      id: 'l-blend',
      title: 'l の なかま（bl・cl・fl・gl・pl・sl）',
      explain: [
        'b・c・f・g・p・s の うしろに l が くると、2つの 音を すばやく つなげて よむよ。',
        'bl は「ブル」、cl は「クル」、fl は「フル」…。',
        'black は「ブラック」、clap は「クラップ」。',
      ],
      hint: '2つの 音を つなげて「ブラ」「クラ」「フラ」の ように よもう。',
      focus: '^[bcfgps]l',
      words: `
black ブラック 1
block ブロック 1
blob ブロブ 2
bled ブレッド 2
bless ブレス 2
clap クラップ 1
clip クリップ 1
clock クロック 1
club クラブ 1
clam クラム 2
clan クラン 2
cliff クリフ 2
flag フラッグ 1
flat フラット 1
flip フリップ 1
flop フロップ 2
flick フリック 2
floss フロス 2
glad グラッド 1
glob グロブ 3
glum グラム 3
plan プラン 1
plug プラッグ 2
plum プラム 2
plot プロット 2
plus プラス 1
slam スラム 2
slap スラップ 2
slip スリップ 1
sled スレッド 2
slot スロット 2
slug スラッグ 2
`,
    },
    {
      id: 'r-blend',
      title: 'r の なかま（br・cr・dr・fr・gr・pr・tr）',
      explain: [
        'b・c・d・f・g・p・t の うしろに r が くると、2つの 音を つなげて よむよ。',
        'br は「ブル」、cr は「クル」、dr は「ドル」、tr は「トル」…。',
        'drum は「ドラム」、trip は「トリップ」。',
      ],
      hint: '2つの 音を つなげて「ブラ」「クラ」「ドラ」「トラ」の ように よもう。',
      focus: '^[bcdfgpt]r',
      words: `
brick ブリック 1
brag ブラッグ 2
brim ブリム 3
brush ブラッシュ 2
crab クラブ 1
crib クリブ 2
crop クロップ 2
cross クロス 1
crush クラッシュ 2
drum ドラム 1
drip ドリップ 1
drop ドロップ 1
drag ドラッグ 2
dress ドレス 1
frog フロッグ 1
from フロム 1
fret フレット 3
fresh フレッシュ 2
grab グラブ 1
grin グリン 2
grip グリップ 2
grub グラブ 3
grass グラス 1
press プレス 1
prop プロップ 2
prick プリック 3
trap トラップ 1
trip トリップ 1
trot トロット 2
truck トラック 1
track トラック 1
trim トリム 2
`,
    },
    {
      id: 's-blend',
      title: 's の なかま（sk・sm・sn・sp・st・sw）',
      explain: [
        's の うしろに k・m・n・p・t・w が くると、「ス」と つぎの 音を つなげて よむよ。',
        'stop は「ストップ」、swim は「スウィム」。',
        'sc も「スク」。scan は「スキャン」。',
      ],
      hint: '「ス」と つぎの 音を つなげて よもう。',
      focus: '^s[cklmnptw]',
      words: `
skip スキップ 1
skin スキン 1
skid スキッド 2
skull スカル 2
scan スキャン 2
scab スキャブ 3
scum スカム 3
scuff スカフ 3
smell スメル 1
smug スマッグ 2
smack スマック 2
snap スナップ 1
snip スニップ 2
snack スナック 1
snug スナッグ 2
spin スピン 1
spot スポット 1
spill スピル 2
spit スピット 2
spell スペル 1
stop ストップ 1
step ステップ 1
stem ステム 2
stick スティック 1
stack スタック 2
stuck スタック 2
stab スタブ 2
still スティル 2
stiff スティフ 2
swim スウィム/スイム 1
swam スワム 2
swing スウィング/スイング 1
swell スウェル 2
`,
    },
    {
      id: 'end-blend',
      title: 'おわりの 2つの 音（nd・st・mp など）',
      explain: [
        'たんごの おわりに 子音が 2つ ならぶと、どちらも ちゃんと よむよ。',
        'nd は「ンド」、nt は「ント」、st は「スト」、mp は「ンプ」。',
        'sk は「スク」、ft は「フト」、lt は「ルト」、lp は「ルプ」、lk は「ルク」。',
        'hand は「ハンド」、jump は「ジャンプ」。',
      ],
      hint: 'おわりの 2つの 音を、どちらも わすれずに よもう。',
      focus: '(nd|nt|st|mp|sk|ft|lt|lp|lk)$',
      words: `
hand ハンド 1
sand サンド 1
band バンド 1
land ランド 1
pond ポンド 2
bend ベンド 2
send センド 1
end エンド 1
wind ウィンド 2
tent テント 1
went ウェント 1
hunt ハント 2
mint ミント 1
ant アント 1
fast ファスト 1
last ラスト 1
best ベスト 1
nest ネスト 1
rest レスト 1
list リスト 1
must マスト 2
dust ダスト 2
lamp ランプ 1
camp キャンプ 1
jump ジャンプ 1
bump バンプ 2
lump ランプ 2
desk デスク 1
mask マスク 1
task タスク 2
gift ギフト 1
left レフト 1
soft ソフト 1
raft ラフト 2
belt ベルト 1
melt メルト 2
help ヘルプ 1
milk ミルク 1
silk シルク/スィルク 2
stamp スタンプ 3
stand スタンド 3
frost フロスト 3
blend ブレンド 3
crust クラスト 3
plant プラント 3
`,
    },
    {
      id: 'magic-e-a',
      title: 'まほうの e（a_e ＝ エイ）',
      explain: [
        'たんごの さいごの e は「まほうの e」。e は よまないよ。',
        'でも まえの a を、a の なまえの 音「エイ」に かえるよ。',
        'cap（キャップ）→ cape（ケイプ）、can（キャン）→ cane（ケイン）。',
        'カタカナでは「エイ」か「エー」と かいてね。',
      ],
      hint: 'さいごに e が あると、a は「エイ（エー）」。e は よまないよ。',
      focus: 'a(?=[^aeiou]e$)|e$',
      words: `
cake ケイク 1
make メイク 1
take テイク 1
lake レイク 1
bake ベイク 2
cape ケイプ 2
tape テイプ 1
gate ゲイト 1
late レイト 1
date デイト 1
hate ヘイト 2
mate メイト 2
name ネイム 1
game ゲイム 1
same セイム 1
tame テイム 2
came ケイム 1
made メイド 1
fade フェイド 2
wade ウェイド 2
cane ケイン 2
lane レイン 2
mane メイン 2
pane ペイン 2
cave ケイヴ/ケイブ 2
wave ウェイヴ/ウェイブ 1
gave ゲイヴ/ゲイブ 1
save セイヴ/セイブ 1
safe セイフ 1
case ケイス 2
plane プレイン 2
snake スネイク 2
grape グレイプ 2
shake シェイク 2
plate プレイト 2
skate スケイト 2
flame フレイム 3
shade シェイド 3
trade トレイド 3
`,
    },
    {
      id: 'magic-e-i',
      title: 'まほうの e（i_e ＝ アイ）',
      explain: [
        'さいごの まほうの e は、まえの i を、i の なまえの 音「アイ」に かえるよ。',
        'pin（ピン）→ pine（パイン）、kit（キット）→ kite（カイト）。',
        'e は よまないよ。',
      ],
      hint: 'さいごに e が あると、i は「アイ」。e は よまないよ。',
      focus: 'i(?=[^aeiou]e$)|e$',
      words: `
bike バイク 1
like ライク 1
hike ハイク 2
kite カイト 1
bite バイト 1
site サイト 2
time タイム 1
lime ライム 2
dime ダイム 2
pine パイン 2
fine ファイン 1
line ライン 1
mine マイン 1
nine ナイン 1
wine ワイン 2
dine ダイン 2
ride ライド 1
hide ハイド 1
side サイド 1
wide ワイド 2
tide タイド 2
ripe ライプ 2
wipe ワイプ 2
pipe パイプ 1
five ファイヴ/ファイブ 1
hive ハイヴ/ハイブ 2
dive ダイヴ/ダイブ 2
smile スマイル 2
slide スライド 2
white ワイト/ホワイト 2
shine シャイン 2
spine スパイン 3
stripe ストライプ 3
prize プライズ 3
size サイズ 2
file ファイル 2
mile マイル 2
tile タイル 2
`,
    },
    {
      id: 'magic-e-ou',
      title: 'まほうの e（o_e ＝ オウ、u_e ＝ ユー）',
      explain: [
        'まほうの e は、o を「オウ」に、u を「ユー」（ときどき「ウー」）に かえるよ。',
        'hop（ホップ）→ hope（ホウプ）、cut（カット）→ cute（キュート）。',
        'o は「オウ」と かこうね。（「オー」は あとで ならう or の 音に とっておくよ）',
      ],
      hint: 'さいごに e が あると、o は「オウ」、u は「ユー（ウー）」。',
      focus: '[ou](?=[^aeiou]e$)|e$',
      words: `
hope ホウプ 1
rope ロウプ 1
note ノウト 1
vote ヴォウト/ボウト 2
home ホウム 1
dome ドウム 2
bone ボウン 1
cone コウン 2
tone トウン 2
hole ホウル 1
pole ポウル 2
mole モウル 2
nose ノウズ 1
rose ロウズ 1
hose ホウズ 2
joke ジョウク 1
poke ポウク 2
woke ウォウク 2
code コウド 2
rode ロウド 2
robe ロウブ 2
stone ストウン 2
smoke スモウク 2
globe グロウブ 3
cute キュート 1
mute ミュート 2
cube キューブ 1
tube テューブ/チューブ/トゥーブ 2
fuse フューズ 2
mule ミュール 2
June ジューン 1
rule ルール 1
tune テューン/チューン/トゥーン 2
dune デューン/ドゥーン 2
flute フルート 2
prune プルーン 3
duke デューク/ドゥーク 3
fume フューム 3
`,
    },
    {
      id: 'ee-ea',
      title: 'ee・ea（イー）',
      explain: [
        'e が 2つ ならぶ ee と、ea は「イー」と のばすよ。',
        'ship（シップ）と sheep（シープ）は ちがう 音！',
        'sit（シット）と seat（シート）も ちがうね。のばす「ー」を わすれずに。',
      ],
      hint: 'ee と ea は のばして「イー」だよ。',
      focus: 'ee|ea',
      words: `
see シー/スィー 1
bee ビー 1
tree ツリー/トゥリー/トリー 1
feet フィート 1
meet ミート 1
seed シード/スィード 2
need ニード 1
feed フィード 2
weed ウィード 2
deep ディープ 1
keep キープ 1
jeep ジープ 2
peep ピープ 2
sheep シープ 1
sleep スリープ 1
green グリーン 1
queen クイーン/クウィーン 2
teeth ティース 2
week ウィーク 1
cheek チーク 2
free フリー 1
seem シーム/スィーム 2
eat イート 1
meat ミート 1
seat シート/スィート 1
heat ヒート 1
beat ビート 2
neat ニート 2
read リード 1
bead ビード 2
team ティーム 1
beam ビーム 2
dream ドリーム 2
cream クリーム 2
sea シー/スィー 1
tea ティー 1
pea ピー 2
leaf リーフ 2
peach ピーチ 2
teach ティーチ 2
beach ビーチ 1
clean クリーン 2
bean ビーン 2
mean ミーン 2
`,
    },
    {
      id: 'ai-ay',
      title: 'ai・ay（エイ）',
      explain: [
        'ai と ay は、a の なまえの 音「エイ」に なるよ。',
        'rain は「レイン」、play は「プレイ」。',
        '「エー」と かいても いいよ。',
      ],
      hint: 'ai と ay は「エイ（エー）」だよ。',
      focus: 'ai|ay',
      words: `
rain レイン 1
pain ペイン 1
main メイン 2
gain ゲイン 2
train トレイン 1
brain ブレイン 2
chain チェイン 2
wait ウェイト 1
bait ベイト 2
mail メイル 1
tail テイル 1
nail ネイル 1
sail セイル 2
pail ペイル 2
rail レイル 2
snail スネイル 2
paint ペイント 2
faint フェイント 3
aid エイド 2
maid メイド 2
paid ペイド 2
day デイ 1
may メイ 1
say セイ 1
pay ペイ 1
way ウェイ 1
ray レイ 2
hay ヘイ 2
bay ベイ 2
lay レイ 2
play プレイ 1
clay クレイ 2
tray トレイ 2
gray グレイ 2
stay ステイ 1
spray スプレイ 3
`,
    },
    {
      id: 'oa-ow',
      title: 'oa・ow（オウ）',
      explain: [
        'oa と ow は、o の なまえの 音「オウ」に なるよ。',
        'boat は「ボウト」、snow は「スノウ」。',
        'cot（コット）と coat（コウト）は ちがう 音だね。',
        '（ow には もう 1つ「アウ」の 音も あるけど、それは あとで ならうよ）',
      ],
      hint: 'oa と ow は「オウ」と かくよ。',
      focus: 'oa|ow',
      words: `
boat ボウト 1
coat コウト 1
goat ゴウト 1
road ロウド 1
load ロウド 2
toad トウド 2
soap ソウプ 1
oak オウク 2
soak ソウク 2
coal コウル 2
goal ゴウル 1
foam フォウム 2
loaf ロウフ 2
coach コウチ 2
roast ロウスト 3
toast トウスト 2
float フロウト 2
cloak クロウク 3
groan グロウン 3
moan モウン 2
snow スノウ 1
slow スロウ 1
grow グロウ 1
glow グロウ 2
show ショウ 1
blow ブロウ 2
flow フロウ 2
crow クロウ 2
low ロウ 1
row ロウ 2
tow トウ 2
own オウン 2
bowl ボウル 1
`,
    },
    {
      id: 'ar-or',
      title: 'ar（アー）・or（オー）',
      explain: [
        'a や o の うしろに r が くると、音が かわるよ。',
        'ar は「アー」。car は「カー」、star は「スター」。',
        'or は「オー」。fork は「フォーク」、corn は「コーン」。',
      ],
      hint: 'ar は「アー」、or は「オー」と のばすよ。',
      focus: 'ar|or',
      words: `
car カー 1
bar バー 1
jar ジャー 2
star スター 1
far ファー 1
tar ター 2
card カード 1
hard ハード 1
yard ヤード 2
park パーク 1
dark ダーク 1
bark バーク 2
mark マーク 1
shark シャーク 2
art アート 1
cart カート 2
part パート 1
start スタート 2
farm ファーム 1
harm ハーム 2
arm アーム 1
barn バーン 2
yarn ヤーン 2
scarf スカーフ 3
march マーチ 2
for フォー 1
fork フォーク 1
pork ポーク 2
cork コーク 2
corn コーン 1
horn ホーン 1
born ボーン 2
torn トーン 2
worn ウォーン 3
sort ソート 2
fort フォート 2
port ポート 2
short ショート 1
storm ストーム 2
north ノース 2
horse ホース 1
lord ロード 3
cord コード 2
form フォーム 2
porch ポーチ 3
torch トーチ 2
`,
    },
    {
      id: 'er-ir-ur',
      title: 'er・ir・ur（アー）',
      explain: [
        'er・ir・ur は、どれも おなじ「アー」の 音。',
        'くちを あまり あけずに、うなる ように いうよ。',
        'her は「ハー」、bird は「バード」、turn は「ターン」。',
      ],
      hint: 'er・ir・ur は どれも「アー」だよ。',
      focus: 'er|ir|ur',
      words: `
her ハー 1
fern ファーン 2
term ターム 2
herd ハード 2
perk パーク 3
jerk ジャーク 3
verb ヴァーブ/バーブ 2
stern スターン 3
bird バード 1
girl ガール 1
sir サー 2
fir ファー 2
firm ファーム 2
first ファースト 1
shirt シャート 2
skirt スカート 2
dirt ダート 1
third サード 2
stir スター 2
birth バース 2
fur ファー 1
burn バーン 1
turn ターン 1
hurt ハート 1
curl カール 1
curb カーブ 2
surf サーフ 2
church チャーチ 2
burst バースト 3
nurse ナース 1
purse パース 2
turf ターフ 3
hurl ハール 3
spur スパー 3
`,
    },
    {
      id: 'oo',
      title: 'oo（ウー・ウ）',
      explain: [
        'oo には 2つの 音が あるよ。',
        'ながい「ウー」：moon は「ムーン」、food は「フード」。',
        'みじかい「ウ」：book は「ブック」、look は「ルック」。',
        'k や d の まえでは みじかい「ウ」に なる ことが おおいよ。',
      ],
      hint: 'oo は ながい「ウー」か、みじかい「ウ」。book・look・good は みじかいよ。',
      focus: 'oo',
      words: `
moon ムーン 1
soon スーン 1
noon ヌーン 2
spoon スプーン 1
food フード 1
mood ムード 2
cool クール 1
pool プール 1
tool トゥール/ツール 2
fool フール 2
zoo ズー 1
boot ブート 2
root ルート 2
hoop フープ 2
loop ループ 2
roof ルーフ 2
room ルーム 1
broom ブルーム 2
tooth トゥース/ツース 2
goose グース 2
moose ムース 3
book ブック 1
look ルック 1
cook クック 1
hook フック 2
took トゥック 2
good グッド 1
wood ウッド 1
hood フッド 2
foot フット 1
shook シュック 3
brook ブルック 3
crook クルック 3
`,
    },
    {
      id: 'ou-ow',
      title: 'ou・ow（アウ）',
      explain: [
        'ou と ow は「アウ」と いう 音にも なるよ。',
        'out は「アウト」、cow は「カウ」。',
        'snow（スノウ）の ow とは ちがう 音だから、たんごごとに おぼえようね。',
      ],
      hint: 'ou と ow は「アウ」だよ。',
      focus: 'ou|ow',
      words: `
out アウト 1
shout シャウト 2
loud ラウド 1
cloud クラウド 1
proud プラウド 2
house ハウス 1
mouse マウス 1
mouth マウス 2
south サウス 2
round ラウンド 1
sound サウンド 1
found ファウンド 2
pound パウンド 2
count カウント 2
cow カウ 1
how ハウ 1
now ナウ 1
wow ワウ 1
town タウン 1
down ダウン 1
gown ガウン 2
brown ブラウン 1
crown クラウン 2
owl アウル 2
howl ハウル 2
growl グラウル 3
`,
    },
    {
      id: 'oi-oy',
      title: 'oi・oy（オイ）',
      explain: [
        'oi と oy は「オイ」と いう 音に なるよ。',
        'coin は「コイン」、boy は「ボイ」。',
      ],
      hint: 'oi と oy は「オイ」だよ。',
      focus: 'oi|oy',
      words: `
oil オイル 1
boil ボイル 1
coil コイル 2
soil ソイル 2
foil フォイル 2
coin コイン 1
join ジョイン 1
point ポイント 1
joint ジョイント 2
moist モイスト 3
spoil スポイル 3
boy ボイ 1
toy トイ 1
joy ジョイ 1
soy ソイ 2
`,
    },
  ];

  UNITS.forEach((u, i) => {
    u.index = i;
    u.words = parseWords(u.words);
  });

  const WORDS = {};
  for (const u of UNITS) for (const w of u.words) WORDS[w.w] = { ...w, unit: u.index };

  P.UNITS = UNITS;
  P.WORDS = WORDS;
  P.expandCandidates = expand;
})(typeof globalThis !== 'undefined' ? globalThis : window);
