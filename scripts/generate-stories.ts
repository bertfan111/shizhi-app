/**
 * 调用 OpenAI 文本模型，为单个生字生成"字形拆解 + 小人物历险"风格的识字小故事。
 *
 * 风格设计（v3，2026-05-23 升级）
 *  - 把目标字拆成它的笔画 / 部件（例如 "从"=两个人，"坐"=两人+土，"明"=日+月，"林"=两棵木）
 *  - 把部件拟人化成"小红人 / 小蓝人 / 小日宝宝 / 一棵小树"等可爱角色
 *  - 用一个有起伏的小情节（探险、爬山、迷路、做客、玩耍……）让角色互动
 *  - 结尾自然揭晓字形："两个人一前一后排着队，这就是「从」"
 *
 * 目标长度：90 - 120 字，适合 6 岁刚上一年级的孩子。
 */
import OpenAI from 'openai';

const MODEL = process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini';

const SYSTEM_PROMPT = `你是一位深受小朋友喜爱的中国小学语文低年级老师，正在为刚上一年级的 6 岁孩子创作极具想象力的"识字小故事"。

【独特风格 —— 必须严格遵守】
这个 App 的所有故事都采用「脑洞大开的字形拆解 + 奇幻历险」的方式：
1. 先在心里把目标字拆成它的笔画 / 部件（千万不要把枯燥的分析过程写出来）。
2. 发挥极大的想象力，把部件拟人化或物化（例如"一团神奇的魔法之火""隐身精灵""能装下西瓜的魔法帽"）。
3. 用一个充满奇幻、魔法、动作感和画面感的情节（如魔法苹果爆炸、大魔王抓捕、天空下起萝卜雨）让这些元素互动。
4. **故事的最后一句必须自然、巧妙地揭晓字形结构**，并且必须把目标字放在最后，例如：
   - "这两种顶级美食合体变出的终极魔法，就是「鲜」。"
   - "一个“人”以极快的速度躲进“门”里瞬间消失，这就是快如闪电的「闪」。"
   - "上面是竹字头，下面是动物的“毛”，合体变出的造物魔法棒，就是「笔」。"

【高质量参考示例】（仔细体会这种充满魔法和童趣的语感）

[明] 太阳和月亮从不见面。傍晚，淘气的月亮偷偷溜出来。小兔子抬头，竟同时看到了太阳和月亮！它们碰面的那一刻，天空突然爆发出耀眼的魔法光辉。当代表太阳的“日”和“月”拥抱，就变出了宇宙间最亮的「明」。

[尖] 森林举行帽子大赛。小狐狸拿出一顶魔法帽：底座特别大能装下西瓜，可越往上越小，最顶上只能停一只小飞虫！小熊好奇地摸了摸帽顶，“哎呀，好扎手！”上面“小”下面“大”，合在一起就是能戳破气球的「尖」。

[秋] 稻田里的“禾”苗正在睡大觉。调皮的秋姑娘偷偷丢下一团神奇的魔法之“火”。这火一点也不烫，反而让禾苗瞬间脱下绿裙子，换上了金光闪闪的晚礼服，还结出了香喷喷的爆米花！这把让庄稼变出金黄美食的神奇小火苗，就是丰收的「秋」。

[尘] 土地爷爷打了个大喷嚏，“呼——”，地上最微小的一粒泥土被施了漂浮魔法。这粒“小”小的泥“土”变成了隐身精灵，直接飞进大灰狼的鼻孔里，让它打了个惊天动地的响嚏，把牙齿都崩飞了！这种能飞上天的隐形微粒，就是「尘」。

【创作规则】
1. 长度：100 - 130 个汉字，5 - 7 个短句。
2. 语言极具画面感：多用动词（"崩飞""顶出""蹦出"）、拟声词（"轰隆""砰"）、奇幻元素（魔法、精灵、超能力）。
3. 绝对禁止说教、枯燥的语文讲解、或者生硬的拼凑。
4. **最后一句必须揭晓字形结构**，且目标字必须加上「」符号。

【输出格式】
- 只输出故事正文一段，不分段、不加标题、不加任何解释。`;

const NEGATIVE_OPENERS_TO_AVOID = [
  '今天',
  '从前',
  '有一天',
  '一天',
  '在一个',
  '很久很久以前',
];

export interface StoryGenOptions {
  apiKey: string;
  baseURL?: string;
  maxRetries?: number;
}

export class StoryGenerator {
  private client: OpenAI;
  constructor(opts: StoryGenOptions) {
    this.client = new OpenAI({
      apiKey: opts.apiKey,
      baseURL: opts.baseURL,
      maxRetries: opts.maxRetries ?? 2,
    });
  }

  async generate(targetChar: string): Promise<string> {
    const avoidOpeners = NEGATIVE_OPENERS_TO_AVOID.join('、');

    const userPrompt = [
      `目标字："${targetChar}"`,
      '',
      '请先在心里默默分析这个字的字形构成（部件 / 笔画 / 声旁形旁），然后选择最自然的拟人化方式，编一段 90-120 字、4-6 句话的小故事。',
      '',
      `请不要用这些开头：${avoidOpeners}。`,
      '故事的最后一句必须自然地揭晓字形结构（例如"两个人一前一后，就是「从」"）。',
      '',
      '现在请直接输出故事正文一段（不分段，不加标题）。',
    ].join('\n');

    const resp = await this.client.chat.completions.create({
      model: MODEL,
      temperature: 0.95,
      top_p: 0.95,
      max_tokens: 360,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });
    const text = resp.choices[0]?.message?.content?.trim() || '';
    return this.sanitize(text, targetChar);
  }

  private sanitize(raw: string, targetChar: string): string {
    let t = raw.trim();
    // 剥掉首尾常见的"引号、书名号、序号"等
    t = t.replace(/^[「『《【\[（(]+/, '').replace(/[」』》】\])）]+$/, '');
    // 如果整段被一对引号包住，去掉
    if (t.length > 2 && /^["""]/.test(t[0]) && /["""]/.test(t[t.length - 1])) {
      t = t.slice(1, -1);
    }
    // 多余空白压成无空白
    t = t.replace(/\s+/g, '');
    // 英文标点 → 中文标点
    t = t
      .replace(/,/g, '，')
      .replace(/!/g, '！')
      .replace(/\?/g, '？')
      .replace(/;/g, '；')
      .replace(/:/g, '：');

    // 兜底：必须包含目标字
    if (!t.includes(targetChar)) {
      t = t + `这就是「${targetChar}」。`;
    }

    // 长度上限保护：截到最近的句末标点
    const chars = Array.from(t);
    if (chars.length > 140) {
      const tail = chars.slice(0, 130).join('');
      const m = tail.match(/^[\s\S]*[。！？]/);
      t = m ? m[0] : tail + '。';
    }

    return t;
  }
}
