import * as fs from 'node:fs';
import * as path from 'node:path';
import { annotateText, getCharPinyin } from './generate-pinyin';
import { getVolumeOf } from './wordlist';

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'assets/data/characters.json');

const MODERN_STORIES: Record<string, string> = {
  天: '2026年，小宇戴着飞行背包在火星上空滑行。突然，一阵电子风暴袭来，小宇差点失去平衡！他稳住身子，在空中张开双臂双腿，像个大大的"大"字。就在这时，一架无人机平平地停在他头顶，帮他挡住了风暴。"大"字顶着一架无人机"一"，合起来就是浩瀚的「天」。',
  地: '月球基地里，小泥人"土"负责种植太空蔬菜。警报忽然响起，氧气舱漏气了！智能机器狗"也"立刻冲过来，用身体堵住漏洞，救了大家。小泥人激动地抱住机器狗。原来，"土"在左边，"也"在右边，好朋友并肩站在一起，就成了坚实的「地」。',
  人: '全息游戏馆里，小暴龙正学踩悬浮滑板。左脚一滑，右脚一飘，眼看就要摔倒！"注意重心！"AI教练喊道。小暴龙深吸一口气，把两根机械腿稳稳分开，一撇一捺踩住滑板，瞬间冲过终点线！两条腿一撇一捺站得稳稳当当，这就是帅气的「人」。',
  你: '在元宇宙广场，小亻探险家迷路了。突然，一个戴着光环的小尔跑过来，伸出手指点点他："终于找到你啦！"小亻也开心地跳起来，指着小尔说："原来你在这！"他们你指我，我指你，笑声传遍了整个空间。小亻在左，小尔在右，合起来就是「你」。',
  我: '太空中，陨石群正朝飞船砸来！小勇士站在操控台前，左手亮出激光护盾，右手举起一把弯弯的能量小戈。"看我的！"他挺起胸膛，用小戈击碎了最大的陨石，保护了大家。手拿着戈，勇敢地说出自己的名字，手和戈合在一起，就是「我」。',
  他: '火星夏令营里，小亻到处找队友。这时，小也从陨石坑后探出脑袋："带我一个吧！"小亻拉起小也，跑向AI导师，开心地指着身边的新朋友说："老师，他就是我的搭档！"小亻在左边，小也在右边，合起来就是用来介绍小伙伴的「他」。',
  一: '时光机出故障了！半空中掉下一根发光的金色能量棒，啪地一声落在地上，平平直直的。小女孩跑过去，捡起这根孤零零的能量棒，惊喜地发现它能变出各种好玩的全息影像。整个世界只有这神奇的一根。一根小棒平平躺着，就是简单的「一」。',
  二: '第一根能量棒正在充电，嗖的一声，天上又掉下一根短一点的蓝光棒，轻轻叠在上面。两根棒棒忽然共鸣，打开了一扇时空门！小女孩跑过来兴奋地数："一、二！有两根啦！"上面一根短，下面一根长，两个好朋友叠在一起，就是神奇的「二」。',
  三: '时空门刚打开，第三根红光棒也滑落下来，嗖地停在最上面。三根棒棒像小小的悬浮光梯，一层一层亮闪闪，带着小女孩飞向了星星。它们互不相撞，排得又平又稳。三根横横的能量棒，就是通向宇宙的「三」。',
  四: '透明的悬浮舱是个方方的小盒子。儿宝宝穿着宇航服蹦进盒子里，嘭地坐在中间。悬浮舱瞬间启动，带着他飞向太空！儿宝宝张开两条小腿，正好指着盒子的四个发光角落，他大喊："一、二、三、四！出发！"一个方盒子里藏着儿宝宝，就是「四」。',
};

interface Character {
  char: string;
  pinyin: string;
  volume: 'upper' | 'lower' | 'unknown';
  story: {
    text: string;
    annotated: { char: string; pinyin: string | null }[];
  };
  image: string;
}

interface Dataset {
  version: string;
  generatedAt: string;
  characters: Character[];
}

function loadDataset(): Dataset {
  if (!fs.existsSync(DATA_PATH)) {
    return { version: '0.1.0-skeleton', generatedAt: new Date().toISOString(), characters: [] };
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function main() {
  const ds = loadDataset();
  const map = new Map(ds.characters.map((c) => [c.char, c]));
  let touched = 0;

  for (const [char, text] of Object.entries(MODERN_STORIES)) {
    const prev = map.get(char);
    const story = { text, annotated: annotateText(text) };
    if (prev) {
      prev.story = story;
    } else {
      map.set(char, {
        char,
        pinyin: getCharPinyin(char),
        volume: getVolumeOf(char),
        story,
        image: '',
      });
    }
    touched++;
    console.log(`  ✏️  ${char} (${Array.from(text).length} 字)`);
  }

  const updated: Dataset = {
    version: '1.2.0-modern',
    generatedAt: new Date().toISOString(),
    characters: Array.from(map.values()),
  };
  fs.writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2), 'utf8');

  console.log(`✅ 已注入 ${touched} 个 2026 现代科幻版故事。`);
}

main();