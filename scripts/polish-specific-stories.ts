import * as fs from 'node:fs';
import * as path from 'node:path';
import { annotateText } from './generate-pinyin';

interface Character {
  char: string;
  story: {
    text: string;
    annotated: { char: string; pinyin: string | null }[];
  };
}

interface Dataset {
  generatedAt: string;
  characters: Character[];
}

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'assets/data/characters.json');
const BACKUP_PATH = path.join(ROOT, 'assets/data/characters.before-specific-polish.json');

const STORIES: Record<string, string> = {
  棋: '山神爷爷送给小狐狸一张木头棋盘。棋盘上有许多小格子，黑石子和白石子一落下，就变成两队小士兵，在格子路上悄悄布阵。小狐狸每走一步，都像在指挥一场聪明的冒险。用木头做成、要动脑排兵布阵的方格游戏，就是“棋”。',
  词: '小书虫捡到一只会分类的魔法口袋。风、花、糖、月亮这些散乱的声音飞来飞去，口袋轻轻一吸，把它们装成一颗颗有意思的小糖豆。小朋友拿出一颗，就能说清一个东西或动作。能把意思装成一小粒语言糖豆的，就是“词”。',
  句: '词语小糖豆在桌上乱滚，谁也听不懂。月亮钩子飞来，把几个糖豆轻轻勾在一起，又让小嘴巴在最后“咔哒”停一下。散乱的词语立刻变成一句完整的话，像小火车开到终点。把词语排好、说完有停顿的，就是“句”。',
  语: '森林里，小鸟说鸟话，小鱼吐泡泡，小熊只会吼，大家谁也听不懂谁。智慧树长出一片发光叶子，把每个声音都翻成大家能懂的心意。小动物们终于能聊天、讲故事、约朋友。能把心里想法说出来、让别人听懂的，就是“语”。',
  说: '小刺猬捡到一颗闪光松果，却不知道怎么告诉朋友。它张开嘴巴，声音变成一只只小纸鹤飞出去：“这里有宝贝！”朋友们跟着纸鹤赶来，大家一起分松果。把心里的事情从嘴里送出去，让别人知道，这就是“说”。',
  诗: '春风吹过河边，柳条像小辫子一样摇呀摇。小鹿觉得太美了，就把看到的花、月亮和小河排成一串会唱歌的短句。短句一念出来，花瓣都跟着节奏跳舞。把美丽景象变成有节奏的话，就是“诗”。',
  请: '小兔想借小熊的彩色蜡笔，可它没有直接抢。它捧着一朵青色小花，轻轻敲门说：“可以借我用一用吗？”小熊一听这么有礼貌，马上把蜡笔递给它。带着尊重和好听语气说出请求，就是“请”。',
  讲: '老树肚子里藏着一个古老故事，可小动物们都不知道。猫头鹰老师站上树桩，把故事一段一段讲出来：谁先出发，谁遇到河，谁最后回家。大家听得眼睛亮晶晶。把事情按顺序说清楚，让别人听明白，就是“讲”。',
  让: '小鹿和小羊同时跑到窄桥前，谁先过都可能掉进河里。小鹿往旁边退了一步，笑着说：“你先走吧。”桥面立刻开出一排小花，小羊安全过桥后也回头道谢。愿意把位置、机会先给别人，就是“让”。',
  识: '夜里，字宝宝们戴着面具跑进书里，小猫一个也认不出。智慧灯一照，每个字都露出自己的模样、声音和意思。小猫指着“山”说山，指着“水”说水，越认越开心。看见一个符号就知道它是谁、是什么意思，就是“识”。',
  子: '一颗小种子躲在土里睡觉，外面下雨打雷它也不怕。春风一吹，它伸出小小的脑袋，慢慢长成嫩芽，像一个被世界抱着长大的小宝宝。所有生命最开始、最小又最有希望的孩子模样，就是“子”。',
};

function main() {
  if (!fs.existsSync(BACKUP_PATH)) {
    fs.copyFileSync(DATA_PATH, BACKUP_PATH);
  }

  const ds = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) as Dataset;
  let updated = 0;
  const missing: string[] = [];

  for (const [char, text] of Object.entries(STORIES)) {
    const item = ds.characters.find((c) => c.char === char);
    if (!item) {
      missing.push(char);
      continue;
    }
    item.story = {
      text,
      annotated: annotateText(text),
    };
    updated++;
  }

  ds.generatedAt = new Date().toISOString();
  fs.writeFileSync(DATA_PATH, JSON.stringify(ds, null, 2), 'utf8');

  console.log(`已精修故事：${updated}`);
  if (missing.length) console.log(`未找到：${missing.join('')}`);
  console.log(`备份文件：${path.relative(ROOT, BACKUP_PATH)}`);
}

main();
