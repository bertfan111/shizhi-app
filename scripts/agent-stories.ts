import * as fs from 'fs';
import * as path from 'path';
import { annotateText } from './generate-pinyin';

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'assets/data/characters.json');

const newStories: Record<string, string> = {
  "春": "魔法森林里，沉睡的种子正在做梦。突然，温暖的太阳像个巨大的金币挂在天空，三个小精灵手拉着手跳起了唤醒之舞。阳光加上精灵的魔法，大地瞬间铺满鲜花！三个人在太阳底下跳舞，这就是带来生机的「春」。",
  "夏": "大火球在天上烤着，整个森林都快融化了！一只聪明的小猴子找来一片超级大的荷叶，一屁股坐在下面乘凉，还悠闲地啃起冰镇大西瓜。头顶大大的叶子，脚底舒服地伸直，这就是热腾腾的「夏」。",
  "跑": "小飞毛腿穿着一双超级加速鞋。他左脚刚刚踏出，像个起跑的“足”，右脚紧接着像“包”裹着火箭一样喷出火焰。“嗖”的一声，他已经飞过了十条街，连风都追不上他！迈开腿像火箭一样飞驰，这就是「跑」。",
  "跳": "袋鼠妹妹的脚底装了两个隐形大弹簧。她左“足”一用力，右边的身体像被“兆”唤的魔法一样，瞬间弹到了半空中，直接越过了长颈鹿的头顶！两只脚像装了弹簧一样腾空飞起，这就是「跳」。",
  "星": "夜空太黑了，小精灵决定用发光魔法。他拿出一块代表太“阳”的魔法石，放在一棵神奇的“生”命树上。大树瞬间结出千万个发光的小果子，挂在漆黑的夜空里眨眼睛！日的光芒赐予生命，这就是满天闪烁的「星」。",
  "雪": "天上的“雨”宝宝觉得掉下来太无聊了。冬天仙子施了个魔法，雨宝宝们瞬间穿上六角形的冰晶铠甲，手里拿着像扫帚一样的魔法棒，在空中旋转跳舞，把大地变成白茫茫的地毯！带着魔法棒的冰晶雨，这就是洁白的「雪」。",
  "电": "雷神爷爷的脾气可大了！天空中的云层刚撞在一起，他就像一条长着长长尾巴的巨龙，从云端“啪”地一下甩出一条金光闪闪的长鞭，直接把夜空劈成两半！这条充满能量、快如闪电的长鞭，就是「电」。",
  "雷": "轰隆隆！天上原本只下着淅淅沥沥的“雨”。突然，云层上滚落下一颗巨大的发光“田”字形魔法炸弹。炸弹一碰到云朵，瞬间发出震耳欲聋的巨响，把小怪兽都吓得躲进地洞里！带闪电大炸弹的雨，这就是响彻云霄的「雷」。",
  "虹": "雨过天晴，天空出现了一座彩色拱桥。一只像“虫”一样的彩色毛毛虫精灵，顺着一道发光的光柱（工），慢悠悠地爬上天空。它爬过的地方，留下了七彩的光带，简直美极了！像虫一样弯弯跨越天际的七彩光带，就是「虹」。",
  "冰": "小水滴觉得太热了，跑去北极仙子那里求救。仙子用魔法棒轻轻一点，在小水滴旁边加了两点“冫”极寒之气。小水滴瞬间被冻成了透明的砖块，连里面游动的小鱼都被定住了！带着两点极寒魔法的水，这就是硬邦邦的「冰」。"
};

function main() {
  const ds = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  let updatedCount = 0;

  for (const char of Object.keys(newStories)) {
    const text = newStories[char];
    let cObj = ds.characters.find((c: any) => c.char === char);
    if (!cObj) {
      // Add missing characters if not exist
      cObj = {
        char: char,
        pinyin: annotateText(char)[0].pinyin || '',
        volume: 'unknown',
        story: { text: '', annotated: [] },
        image: ''
      };
      ds.characters.push(cObj);
    }

    cObj.story = {
      text: text,
      annotated: annotateText(text)
    };
    updatedCount++;
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(ds, null, 2), 'utf8');
  console.log(`成功由 Agent 直接生成并更新了 ${updatedCount} 个极具想象力的故事！`);
}

main();