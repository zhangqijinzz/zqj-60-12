import type { EmotionType } from '@/types';

export type ContentSafetyStatus = 'safe' | 'sensitive' | 'unavailable';

export interface ContentSafetyResult {
  status: ContentSafetyStatus;
  matchedWords: string[];
  severity: 'low' | 'medium' | 'high';
  message: string;
}

const SENSITIVE_WORDS_BY_EMOTION: Record<EmotionType, { words: string[]; severity: 'low' | 'medium' | 'high' }[]> = {
  warm: [
    {
      words: ['自杀', '割腕', '跳楼', '上吊', '烧炭', '安眠药', '结束生命', '不想活了', '自寻短见'],
      severity: 'high',
    },
    {
      words: ['去死', '该死', '死了算了', '活着没意思', '不如死了'],
      severity: 'high',
    },
    {
      words: ['伤害自己', '自残', '自伤', '割手', '撞墙'],
      severity: 'medium',
    },
    {
      words: ['绝望', '撑不下去', '扛不住了', '没希望了'],
      severity: 'medium',
    },
  ],
  miss: [
    {
      words: ['自杀', '割腕', '跳楼', '上吊', '烧炭', '安眠药', '结束生命', '不想活了', '自寻短见'],
      severity: 'high',
    },
    {
      words: ['去死', '该死', '死了算了', '活着没意思', '不如死了'],
      severity: 'high',
    },
    {
      words: ['痛苦', '煎熬', '生不如死', '度日如年', '生无可恋'],
      severity: 'medium',
    },
    {
      words: ['仇恨', '报复', '毁掉', '杀死', '同归于尽'],
      severity: 'high',
    },
    {
      words: ['难过', '伤心', '哭', '流泪', '心碎'],
      severity: 'low',
    },
  ],
  encourage: [
    {
      words: ['自杀', '割腕', '跳楼', '上吊', '烧炭', '安眠药', '结束生命', '不想活了', '自寻短见'],
      severity: 'high',
    },
    {
      words: ['去死', '该死', '死了算了', '活着没意思', '不如死了'],
      severity: 'high',
    },
    {
      words: ['放弃', '没用', '废物', '一无是处', '失败者'],
      severity: 'medium',
    },
    {
      words: ['没救了', '治不好', '晚期', '等死'],
      severity: 'medium',
    },
  ],
  peaceful: [
    {
      words: ['自杀', '割腕', '跳楼', '上吊', '烧炭', '安眠药', '结束生命', '不想活了', '自寻短见'],
      severity: 'high',
    },
    {
      words: ['去死', '该死', '死了算了', '活着没意思', '不如死了'],
      severity: 'high',
    },
    {
      words: ['暴力', '打架', '伤害', '恐吓', '威胁', '打你', '杀你'],
      severity: 'high',
    },
    {
      words: ['毒品', '吸毒', '摇头丸', '海洛因', '冰毒', 'k粉'],
      severity: 'high',
    },
    {
      words: ['吵架', '骂人', '混蛋', '滚蛋', '垃圾'],
      severity: 'medium',
    },
  ],
};

const GLOBAL_SENSITIVE_WORDS: { words: string[]; severity: 'low' | 'medium' | 'high' }[] = [
  {
    words: ['色情', '淫秽', '色情网站', '黄色视频', '裸聊', '成人', '性服务'],
    severity: 'high',
  },
  {
    words: ['赌博', '赌场', '赌球', '百家乐', '彩票', '下注', '赔率'],
    severity: 'high',
  },
  {
    words: ['诈骗', '骗子', '刷单', '传销', '骗人', '欺诈', '骗钱'],
    severity: 'high',
  },
  {
    words: ['反动', '颠覆', '分裂', '独立'],
    severity: 'high',
  },
  {
    words: ['辱骂', '侮辱', '歧视', '偏见', '蠢货', '白痴', '弱智'],
    severity: 'medium',
  },
];

const SERVICE_UNAVAILABLE_CHANCE = 0.05;

function getAllSensitiveWords(emotion?: EmotionType): { words: string[]; severity: 'low' | 'medium' | 'high' }[] {
  const all = [...GLOBAL_SENSITIVE_WORDS];
  if (emotion && SENSITIVE_WORDS_BY_EMOTION[emotion]) {
    all.push(...SENSITIVE_WORDS_BY_EMOTION[emotion]);
  } else {
    Object.values(SENSITIVE_WORDS_BY_EMOTION).forEach((words) => all.push(...words));
  }
  return all;
}

export function detectSensitiveContent(
  text: string,
  emotion?: EmotionType
): ContentSafetyResult {
  if (Math.random() < SERVICE_UNAVAILABLE_CHANCE) {
    return {
      status: 'unavailable',
      matchedWords: [],
      severity: 'low',
      message: '内容未经审核',
    };
  }

  if (!text || text.trim().length === 0) {
    return {
      status: 'safe',
      matchedWords: [],
      severity: 'low',
      message: '',
    };
  }

  const lowerText = text.toLowerCase();
  const wordGroups = getAllSensitiveWords(emotion);
  const matchedWords: string[] = [];
  let maxSeverity: 'low' | 'medium' | 'high' = 'low';

  for (const group of wordGroups) {
    for (const word of group.words) {
      if (lowerText.includes(word.toLowerCase())) {
        matchedWords.push(word);
        if (group.severity === 'high') {
          maxSeverity = 'high';
        } else if (group.severity === 'medium' && maxSeverity !== 'high') {
          maxSeverity = 'medium';
        }
      }
    }
  }

  if (matchedWords.length > 0) {
    return {
      status: 'sensitive',
      matchedWords: [...new Set(matchedWords)],
      severity: maxSeverity,
      message: '这只瓶子装着难以辨识的回声',
    };
  }

  return {
    status: 'safe',
    matchedWords: [],
    severity: 'low',
    message: '',
  };
}

export function createSensitiveContentError(safetyResult: ContentSafetyResult): Error {
  const error = new Error('CONTENT_SENSITIVE');
  (error as any).safetyResult = safetyResult;
  return error;
}

export function isSensitiveContentError(error: unknown): boolean {
  return error instanceof Error && error.message === 'CONTENT_SENSITIVE';
}

export function getSafetyResultFromError(error: unknown): ContentSafetyResult | null {
  if (isSensitiveContentError(error) && (error as any).safetyResult) {
    return (error as any).safetyResult as ContentSafetyResult;
  }
  return null;
}
