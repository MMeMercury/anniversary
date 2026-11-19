import { isValidLocalDate } from './anniversary';

const CONFIG_KEY = 'anniversary-config';
const MEMORIES_KEY = 'anniversary-memories';
const READ_NOTICE = '部分浏览器数据无法读取，已显示可恢复的内容。';

export const STORAGE_LIMITS = Object.freeze({
  firstName: 40,
  secondName: 40,
  greeting: 240,
  subtitle: 240,
  letter: 4000,
  title: 100,
  note: 1000,
  image: 700000,
  memories: 100,
});

export const DEFAULT_CONFIG = Object.freeze({
  firstName: 'Coconut',
  secondName: 'Mio',
  startDate: '2026-11-02T18:00',
  greeting: '每一个平凡的日子，因为有你而闪闪发光。',
  subtitle: 'Some moments become memories. Some memories become forever.',
  letter: '亲爱的你，\n\n谢谢你陪我走过这些平凡的日子。和你在一起，连小小的事情也值得记下来。\n\n以后的日子，我们也慢慢走，一起看。',
});

export const DEFAULT_MEMORIES = Object.freeze([
  Object.freeze({
    id: 'origin',
    date: '2026-11-02',
    title: '故事的开始',
    note: '从这一天起，我们开始一起记录时间。',
    image: '',
  }),
]);

const CONFIG_TEXT_FIELDS = [
  { key: 'firstName', label: '第一个名字', required: true },
  { key: 'secondName', label: '第二个名字', required: true },
  { key: 'greeting', label: '问候语' },
  { key: 'subtitle', label: '副标题' },
  { key: 'letter', label: '信件' },
];

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value, maxLength, required = false) {
  if (typeof value !== 'string') return null;

  const text = required ? value.trim() : value;
  if (text.length > maxLength || (required && !text)) return null;
  return text;
}

function normalizeConfig(value, reading = false) {
  const config = { ...DEFAULT_CONFIG };
  if (!isRecord(value)) return { value: config, error: '请填写有效的站点设置。' };

  let error = '';
  if (isValidLocalDate(value.startDate) && (reading || value.startDate.length === 16)) {
    config.startDate = value.startDate.length === 10 ? `${value.startDate}T00:00` : value.startDate;
  } else {
    error = '请选择有效的开始日期和时间。';
  }

  for (const { key, label, required } of CONFIG_TEXT_FIELDS) {
    if (reading && key === 'letter' && value.letter === undefined) continue;

    const length = STORAGE_LIMITS[key];
    const text = normalizeText(value[key], length, required);
    if (text === null) {
      error ||= required
        ? `请填写${label}，最多 ${length} 个字符。`
        : `请检查${label}，最多 ${length} 个字符。`;
    } else {
      config[key] = text;
    }
  }

  return { value: config, error };
}

function normalizeImage(value) {
  if (value === '') return '';
  if (typeof value !== 'string' || value.length > STORAGE_LIMITS.image) return null;

  const match = /^data:image\/(?:png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  return match && match[1].length % 4 === 0 ? value : null;
}

function normalizeMemory(value) {
  if (!isRecord(value)) return { error: '请检查回忆记录后再保存。' };

  const id = normalizeText(value.id, 120, true);
  if (!id) return { error: '回忆编号无效，请重新添加这条回忆。' };
  if (!isValidLocalDate(value.date) || value.date.length !== 10) {
    return { error: '请选择有效的回忆日期。' };
  }

  const title = normalizeText(value.title, STORAGE_LIMITS.title, true);
  if (!title) return { error: `请填写回忆标题，最多 ${STORAGE_LIMITS.title} 个字符。` };

  const note = normalizeText(value.note === undefined ? '' : value.note, STORAGE_LIMITS.note);
  const image = normalizeImage(value.image === undefined ? '' : value.image);
  let error = '';

  if (note === null) error = `请检查回忆内容，最多 ${STORAGE_LIMITS.note} 个字符。`;
  if (image === null) error ||= '图片格式不受支持或文件过大，请换一张较小的图片。';

  return { value: { id, date: value.date, title, note: note ?? '', image: image ?? '' }, error };
}

function normalizeMemories(value) {
  if (!Array.isArray(value)) return { error: '请检查回忆列表后再保存。' };

  const memories = [];
  const ids = new Set();
  let error = '';

  for (const entry of value) {
    if (memories.length === STORAGE_LIMITS.memories) {
      error ||= `最多可以保存 ${STORAGE_LIMITS.memories} 条回忆。`;
      break;
    }

    const memory = normalizeMemory(entry);
    error ||= memory.error;
    if (!memory.value) continue;
    if (ids.has(memory.value.id)) {
      error ||= '回忆列表中有重复记录，请刷新页面后重试。';
      continue;
    }

    ids.add(memory.value.id);
    memories.push(memory.value);
  }

  return { value: memories.length > 0 || value.length === 0 ? memories : undefined, error };
}

function readStored(key, fallback, normalize) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return { value: fallback };

    const result = normalize(JSON.parse(raw));
    return { value: result.value ?? fallback, error: result.error };
  } catch {
    return { value: fallback, error: READ_NOTICE };
  }
}

export function loadLocalState() {
  const config = readStored(CONFIG_KEY, { ...DEFAULT_CONFIG }, value => normalizeConfig(value, true));
  const memories = readStored(MEMORIES_KEY, DEFAULT_MEMORIES.map(memory => ({ ...memory })), normalizeMemories);

  return {
    config: config.value,
    memories: memories.value,
    notice: config.error || memories.error ? READ_NOTICE : '',
  };
}

function writeStored(key, result) {
  if (result.error) return { ok: false, error: result.error };

  try {
    window.localStorage.setItem(key, JSON.stringify(result.value));
    return { ok: true, error: '' };
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      return { ok: false, error: '浏览器存储空间不足，请尝试较小的图片或清理网站存储空间。' };
    }
    return { ok: false, error: '浏览器无法保存这次修改，请检查网站存储权限后重试。' };
  }
}

export function writeConfig(value) {
  return writeStored(CONFIG_KEY, normalizeConfig(value));
}

export function writeMemories(value, expectedMemories) {
  const result = normalizeMemories(value);
  if (!result.error && expectedMemories !== undefined
    && JSON.stringify(loadLocalState().memories) !== JSON.stringify(expectedMemories)) {
    return {
      ok: false,
      conflict: true,
      error: '回忆已在另一个窗口更新，已保留你的编辑。请检查最新内容后再次保存。',
    };
  }
  return writeStored(MEMORIES_KEY, result);
}
