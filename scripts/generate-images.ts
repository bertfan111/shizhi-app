/**
 * 调用 OpenAI 图像模型为故事生成卡通插图，落盘为 PNG。
 *
 * 模型选择：
 *  - 默认使用 GPT-image 2.0（API 模型名默认按 gpt-image-2.0 传入）
 *  - 如果服务端实际开放名是 gpt-image-2，可通过 OPENAI_IMAGE_MODEL 临时覆盖
 *
 * 注意：
 *  - 两代模型都返回 base64，需要解码写文件。
 *  - 风格统一为"温暖、明亮、卡通儿童绘本风、无文字"以保证一致观感。
 */
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.0';
const SIZE = (process.env.OPENAI_IMAGE_SIZE || '1024x1024') as
  | '1024x1024'
  | '1024x1536'
  | '1536x1024'
  | 'auto';

const STYLE_PROMPT = [
  '风格要求：',
  '- 温暖明亮的儿童绘本插画，卡通可爱、配色柔和、线条圆润',
  '- 画面要直接对应故事情节和角色动作，不要泛泛画一个汉字主题',
  '- 角色可以是小人、小动物、小笔画、小自然物，表情友好，动作清楚',
  '- 整洁的留白背景，主体清晰、构图舒服',
  '- 适合 6-7 岁中国小学生欣赏',
  '- 画面中绝对不要出现任何文字、字母、汉字、水印、字幕、签名',
  '- 不要出现暴力、恐怖、负面情绪元素',
].join('\n');

export interface ImageGenOptions {
  apiKey: string;
  baseURL?: string;
  outputDir: string;
}

export class ImageGenerator {
  private client: OpenAI;
  private outputDir: string;

  constructor(opts: ImageGenOptions) {
    this.client = new OpenAI({ apiKey: opts.apiKey, baseURL: opts.baseURL });
    this.outputDir = opts.outputDir;
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  filePathFor(char: string): string {
    return path.join(this.outputDir, `${char}.png`);
  }

  exists(char: string): boolean {
    return fs.existsSync(this.filePathFor(char));
  }

  async generate(char: string, storyText: string): Promise<string> {
    const filePath = this.filePathFor(char);
    if (this.exists(char)) return filePath;

    const prompt = [
      STYLE_PROMPT,
      '',
      `画面主题：基于下面这个识字小故事画一幅插画，让画面与故事场景一致。`,
      `（识字目标："${char}" 字；插画上不要画出这个字本身）`,
      '',
      '故事原文：',
      storyText,
    ].join('\n');

    const resp = await this.client.images.generate({
      model: MODEL,
      prompt,
      size: SIZE,
      n: 1,
    });
    const b64 = resp.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error(`图片生成返回为空: ${char}`);
    }
    fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
    return filePath;
  }
}
