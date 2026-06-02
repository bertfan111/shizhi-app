/**
 * 本地静态故事生成器：不联网、不需要 OPENAI_API_KEY。
 *
 * 目标：
 * - 为 allChars 中的每个字生成约 90-120 字的“字形拆解 + 小角色”故事。
 * - 直接写入 assets/data/characters.json，作为 App 内置结果。
 * - 后续如要继续人工润色，可直接修改这里的 SPECIAL_STORIES 或组件提示。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { annotateText, getCharPinyin } from './generate-pinyin';
import { allChars, getVolumeOf } from './wordlist';

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

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'assets/data/characters.json');

const SPECIAL_STORIES: Record<string, string> = {
  天: '小宇戴着VR眼镜，突然被传送到半空中。脚下踩着会飞的滑板，稳稳地托着他。他张开双手像个"大"字，开心地喊："我飞起来啦！"突然一只机器鸟飞过，平平地停在他头顶上。"大"字顶着"一"，就变成了高高的「天」。',
  地: '火星探索车正开着，突然轮胎卡住了！小泥人赶紧跑来帮忙："把这堆软软的黄土垫在下面吧。"小伙伴"小也"也跑来帮忙推车。车子终于开出来了，大家在地上欢呼。脚下踩着的这块"土"旁边靠着"也"，就是稳稳的「地」。',
  人: '小恐龙乐园里，一只小暴龙正学着滑旱冰。左脚一滑，右脚一跟，突然"哎呀"一声快摔倒了！旁边的智能机器人赶紧伸出手扶住他："两腿分开一撇一捺，重心才稳哦！"小暴龙摆好姿势，一撇一捺稳稳站住，这就是「人」。',
  你: '在太空旅行舱里，小亻宇航员正在找搭档。他转角碰到了戴着飞行帽的小尔。"就是你啦！"小亻指着小尔开心地跳起来。小尔也笑着指回去："对，就是你！"他们开心地击掌。小亻在左，小尔在右，合起来就是神奇的「你」。',
  我: '全息游戏里，小勇士遇到了大怪兽！眼看怪兽要扑过来，小勇士左手亮出闪光盾牌，右手紧紧握着能量小戈。"我不怕你！"他勇敢地大喊。怪兽被这气势吓跑了。手拿着戈，挺起胸膛说自己的名字，手和戈合在一起，就是「我」。',
  他: '校园机器人大赛上，小亻正在发愁找不到队友。突然，小也在遥控赛车后面探出脑袋："加我一个好吗？"小亻开心地拉着他跑向老师："老师，他就是我的新队友！"小亻在左边，小也在右边，合起来就是介绍别人的「他」。',
  一: '魔法森林里，小女巫想要一根魔杖。突然，树上掉下一根发光的金色小棒，啪地落在草地上，平平直直的。小女巫惊喜地跑过去，伸出一根手指："哇，只有一根，这是给我的吗？"从那天起，这根平平的小棒就是神奇的「一」。',
  二: '第一根魔法棒刚发光，嗖的一声，天上又掉下第二根短一点的魔法棒，轻轻叠在上面。小精灵跑过来，两眼放光："一，二！有两根啦！"一根长一根短，两个好朋友排得整整齐齐。原来，上面一根、下面一根，就是「二」。',
  三: '两根魔法棒还没捡起来，第三根又滑落下来，嗖地停在最上面。小熊拍着爪子数："一、二、三！"三根棒棒像小小的悬浮楼梯，一层一层亮闪闪。它们互相不挤，排得又平又稳。三根横横的小棒，就是「三」。',
  四: '全息游戏室是个方方的透明小盒子。儿宝宝戴着飞行器蹦进盒子里，嘭地坐在中间。小盒子突然亮了起来，墙上显示出四个角落的积分！大家一起欢呼数数："一、二、三、四！"一个方盒子里藏着儿宝宝，就是「四」。',
  从: '夜间无人机探险开始啦！小红人走在前面，突然无人机灯灭了，草丛里传来呼噜声。小蓝人赶紧跑过来，紧紧跟在后面："别怕，我的手表有手电筒！"两个人一前一后，打着光勇敢向前走，这就是「从」。',
  坐: '两个小宇航员去爬月球环形山。山太陡，他们累得宇航服直响。忽然，前面有一块平平的黄色星际陨土。两人赶紧跑过去，背靠背坐下休息，看着美丽的地球。两个人在土上，就变成了「坐」。',
  明: '小日宝宝白天收集太阳能，小月妹妹夜里释放温柔光。一天，停电了，大家都很怕黑。小日宝宝拉起小月妹妹的手："我们一起发光吧！"整个城市瞬间亮得像白天一样。日和月站在一起，亮亮堂堂，就是「明」。',
  林: '一棵小树被种在火星基地里，觉得好孤单。另一棵小树被无人机运来陪它，叶子沙沙响："我们一起长大吧！"两棵树肩并肩，连机器鸟都来做窝了。两棵木站在一起，就长成了「林」。',
  森: '两棵火星小树刚站好，第三棵小树也乘着飞船来了。三棵树把枝条伸开，形成了一把大大的绿色保护伞。风吹过来，叶子哗啦啦唱歌，大家都在树下乘凉。三棵木挤在一起，就是大大的「森」。',
};

const LEFT_COMPONENTS: Array<[string, string, string]> = [
  ['氵', '三滴纳米水宝宝', '喷出清凉的水花'],
  ['河江海清池洗没活法洞潮湿消治', '智能水滴', '哗啦啦跑到左边'],
  ['亻', '机器人管家', '站在左边帮忙'],
  ['他你们什住低候仔体做作', '小宇航员', '站在左边帮忙'],
  ['扌', '机械手臂', '伸到左边拍拍'],
  ['打把找拉拍提挑操拔抱捧摘扔挂拨擦', '能量小手', '伸到左边拍拍'],
  ['口', '语音助手小嘴巴', '在旁边大声说话'],
  ['吗吧呀呢啦叫听呼喊唱咬吵咕咚吃', '翻译翻译嘴巴', '在旁边大声说话'],
  ['艹', '太阳能小草帽', '轻轻盖在头顶'],
  ['花草莲苹荷萍茶藏蓝芽', '神奇植物帽', '轻轻盖在头顶'],
  ['女', '飞船女领航员', '笑着站在一边'],
  ['妈妹奶女娃姐娘她好姓', '星际女超人', '笑着站在一边'],
  ['木', '电子机械树', '把枝丫伸出来'],
  ['树桥校林森桃杏机桌本杯样棵架', '能量树', '把枝丫伸出来'],
  ['讠', '智能话筒', '在旁边轻轻提示'],
  ['说语词诗请讲让诉许该识', '全息话筒', '在旁边轻轻提示'],
  ['辶', '星际滑行道', '弯弯地绕过来'],
  ['过远近还进送连运这迟追', '超时空轨道', '弯弯地绕过来'],
  ['日', '人造小太阳', '亮亮地站着'],
  ['明星晚昨时晴晶春早', '发光太阳能板', '亮亮地站着'],
  ['月', '月球探测器', '弯弯地靠过来'],
  ['朋服脚腿脸背腰胖', '月光灯', '弯弯地靠过来'],
  ['虫', '电子机械虫', '扭着身子爬来'],
  ['虫蛙蜻蜓蚂蚁蜘蛛蚊', '探雷小虫', '扭着身子爬来'],
  ['鸟', '无人机小鸟', '扑棱棱飞来'],
  ['鸟鸡鸭鸦鹅', '飞行探测器', '扑棱棱飞来'],
  ['雨', '人工降雨云', '滴答滴答落下'],
  ['雨雪霜雷霞', '气象控制云', '滴答滴答落下'],
];

const THEMES: Record<string, { role: string; action: string; place: string }> = {
  山: { role: '全息小山峰', action: '把尖尖的头顶向天空', place: '火星山坡上' },
  水: { role: '纳米小水滴', action: '一路叮咚往前跑', place: '透明管道里' },
  火: { role: '等离子小火苗', action: '跳着暖暖的舞', place: '能量炉旁' },
  口: { role: '智能小嘴巴', action: '张开圆圆的门说话', place: '控制台前' },
  目: { role: '雷达小眼睛', action: '睁得圆圆看世界', place: '飞船窗边' },
  手: { role: '机械小手掌', action: '伸出来帮忙', place: '实验室里' },
  足: { role: '反重力小脚丫', action: '啪嗒啪嗒向前走', place: '星际走廊' },
  日: { role: '发光小太阳', action: '把金光洒下来', place: '天空中' },
  月: { role: '弯弯小月亮', action: '悄悄挂在夜空', place: '太空站外' },
  云: { role: '七彩小白云', action: '慢慢飘过来', place: '城市上空' },
  风: { role: '超跑小风娃', action: '呼呼吹起叶子', place: '风洞实验室' },
  花: { role: '发光小花朵', action: '露出香香的笑脸', place: '太空温室' },
  鸟: { role: '金属小鸟', action: '扑棱棱飞起来', place: '天线塔上' },
};

function pickComponent(char: string): { role: string; action: string } | null {
  for (const [chars, role, action] of LEFT_COMPONENTS) {
    if (chars.includes(char)) return { role, action };
  }
  return null;
}

const SCENES = [
  ['全息小点点', '电子书桌上', '跳进智能田字格里'],
  ['发光小笔画', '透明平板上', '排成防守的阵型'],
  ['探测小星星', '夜空下', '眨着亮亮的眼睛发信号'],
  ['反重力小石子', '星际山路边', '滚到朋友身旁躲起来'],
  ['能量小叶子', '太空校园里', '沙沙地挥手打招呼'],
  ['智能小灯笼', '飞船屋檐下', '照亮回家的暗道'],
  ['无人机小鸟', '月球基地旁', '扇动翅膀投递包裹'],
  ['迷你巡逻车', '火星峡谷里', '加速冲过终点'],
  ['微型修复机器', '星际空间站', '用激光修复裂缝'],
];

function genericStory(char: string, index: number): string {
  const theme = THEMES[char];
  if (theme) {
    return `${theme.role}住在${theme.place}，每天都${theme.action}。一天，突如其来的引力波来袭，差点把它卷走！幸好小伙伴及时丢来牵引绳。它开启能量护盾，摆摆身子说："记住我，我就在这里。"它慢慢站稳不动，就成了「${char}」。`;
  }

  const comp = pickComponent(char);
  if (comp) {
    return `${comp.role}今天起得很早，${comp.action}。突然警报响起，原来是有陨石掉下来了！它遇见一个小伙伴，两人紧紧拉住手，一起开启防护罩。危机解除后，它们靠在一起，摆出一个特别的胜利手势。这个样子被大家记住，就变成了「${char}」。`;
  }

  const [role, place, action] = SCENES[index % SCENES.length];
  return `${role}住在${place}，最喜欢${action}。一天，系统突然停电了，四周一片漆黑！它遇见几个小伙伴，大家你靠我、我靠你，互相点亮排出新样子。小朋友戴着VR眼镜看见了，笑着说："这发光的字真酷！"小伙伴们站稳不动，慢慢变成了「${char}」。`;
}

function normalizeLength(text: string, char: string): string {
  let out = text;
  const fillers = [
    `小朋友跟着智能助手读了一遍，心里一下就记住了酷酷的「${char}」。`,
    `大家围在全息屏幕前看，都说这个字像一幅科幻画。`,
    `它还轻轻闪了闪金光，好像在说："别忘了我呀！"`,
  ];
  let i = 0;
  while (Array.from(out).length < 100 && i < fillers.length) {
    out += fillers[i++];
  }
  return out;
}

function loadExisting(): Map<string, Character> {
  if (!fs.existsSync(DATA_PATH)) return new Map();
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) as Dataset;
  return new Map((raw.characters || []).map((c) => [c.char, c]));
}

function main() {
  const existing = loadExisting();
  const out = new Map<string, Character>();

  allChars.forEach((char, index) => {
    const prev = existing.get(char);
    const text = normalizeLength(SPECIAL_STORIES[char] || genericStory(char, index), char);
    out.set(char, {
      char,
      pinyin: prev?.pinyin || getCharPinyin(char),
      volume: getVolumeOf(char),
      story: {
        text,
        annotated: annotateText(text),
      },
      image: prev?.image || (fs.existsSync(path.join(ROOT, 'assets/images', `${char}.png`)) ? `${char}.png` : ''),
    });
  });

  const payload: Dataset = {
    version: '1.1.0-local-stories',
    generatedAt: new Date().toISOString(),
    characters: Array.from(out.values()),
  };

  fs.writeFileSync(DATA_PATH, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`✅ 已本地生成 ${payload.characters.length} 个静态故事，不需要 API Key。`);
  console.log(`   输出：${path.relative(ROOT, DATA_PATH)}`);
}

main();
