import * as fs from 'fs';
import * as path from 'path';
import { StoryGenerator } from './generate-stories';
import { annotateText } from './generate-pinyin';

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'assets/data/characters.json');

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ 错误：缺少 OPENAI_API_KEY 环境变量！');
    console.error('请运行：$env:OPENAI_API_KEY="你的key"; npx ts-node scripts/generate-all-creative.ts');
    process.exit(1);
  }

  if (!fs.existsSync(DATA_PATH)) {
    console.error(`未找到 ${DATA_PATH}`);
    process.exit(1);
  }

  const ds = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const characters = ds.characters;

  const generator = new StoryGenerator({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  });

  const forceAll = process.env.FORCE_ALL === '1';
  let generatedCount = 0;

  console.log(`开始为 ${characters.length} 个字生成奇幻故事...`);

  for (let i = 0; i < characters.length; i++) {
    const charObj = characters[i];
    
    // 如果已经有字数大于 80 的故事，且没有开启 FORCE_ALL，则跳过（跳过那 20 个手写的好故事）
    if (!forceAll && charObj.story && charObj.story.text.length > 80) {
      // 但刚才使用旧代码生成的占位故事也可能大于80，我们需要检查是否是“机械拼凑”的故事。
      // 可以通过特有的句式来排除，比如 "有一天", "遇见几个小伙伴", "开启能量护盾" 等，
      // 但为了省事，如果用户想完全重写，最好加个过滤。
      // 简单起见，如果包含“小伙伴”或“全息”等词（旧模板词），我们就重写。
      const text = charObj.story.text;
      const isTemplate = text.includes('突然警报响起') || text.includes('引力波来袭') || text.includes('四周一片漆黑') || text.includes('遇见几个小伙伴');
      if (!isTemplate) {
        console.log(`[${i + 1}/${characters.length}] 跳过 ${charObj.char} (已有优质故事)`);
        continue;
      }
    }

    console.log(`[${i + 1}/${characters.length}] 正在用 AI 重新生成: ${charObj.char} ...`);
    
    try {
      const newStoryText = await generator.generate(charObj.char);
      charObj.story = {
        text: newStoryText,
        annotated: annotateText(newStoryText)
      };
      generatedCount++;
      
      // 每生成 5 个保存一次
      if (generatedCount % 5 === 0) {
        fs.writeFileSync(DATA_PATH, JSON.stringify(ds, null, 2), 'utf8');
        console.log('>>> 进度已保存');
      }
    } catch (e) {
      console.error(`生成 ${charObj.char} 失败:`, e);
      // 等待2秒再继续
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // 最终保存
  fs.writeFileSync(DATA_PATH, JSON.stringify(ds, null, 2), 'utf8');
  console.log(`✅ 完成！本次成功重新生成了 ${generatedCount} 个字的故事。`);
}

main().catch(console.error);