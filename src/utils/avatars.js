const STORAGE_KEY = 'anniversary-avatars';
const READ_NOTICE = '部分情侣头像无法读取，已显示可恢复的收藏。';
const ID_LIMIT = 120;
const RASTER_DATA_URL = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

export const AVATAR_LIMITS = Object.freeze({ title: 80, image: 250000, pairs: 20 });

function isAvatarImage(value) {
  if (typeof value !== 'string' || value.length > AVATAR_LIMITS.image) return false;

  const match = RASTER_DATA_URL.exec(value);
  return Boolean(match && match[1].length % 4 === 0);
}

function normalizePair(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { error: '请检查后重新添加这组情侣头像。' };
  }

  const { firstImage, secondImage } = value;
  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  if (!id || id.length > ID_LIMIT) return { error: '头像编号无效，请重新添加。' };
  if (!title || title.length > AVATAR_LIMITS.title) {
    return { error: `请填写头像名称，最多 ${AVATAR_LIMITS.title} 个字符。` };
  }
  if (!isAvatarImage(firstImage) || !isAvatarImage(secondImage)) {
    return { error: '请选择两张有效的 JPG、PNG 或 WebP 头像。图片过大时，请换一张较小的图片。' };
  }

  return { pair: { id, title, firstImage, secondImage } };
}

function normalizeAvatars(value) {
  const avatars = [];
  if (!Array.isArray(value)) return { avatars, error: '请检查头像收藏后再保存。' };

  const ids = new Set();
  let error = '';
  for (const item of value) {
    if (avatars.length === AVATAR_LIMITS.pairs) {
      error ||= `最多可以收藏 ${AVATAR_LIMITS.pairs} 组情侣头像。`;
      break;
    }

    const result = normalizePair(item);
    if (result.error) {
      error ||= result.error;
      continue;
    }
    if (ids.has(result.pair.id)) {
      error ||= '收藏中有重复的情侣头像，请检查后重试。';
      continue;
    }

    ids.add(result.pair.id);
    avatars.push(result.pair);
  }
  return { avatars, error };
}

function readSavedAvatars(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return { avatars: [], notice: '' };

  try {
    const { avatars, error } = normalizeAvatars(JSON.parse(raw));
    return { avatars, notice: error ? READ_NOTICE : '' };
  } catch {
    return { avatars: [], notice: READ_NOTICE };
  }
}

export function loadAvatars() {
  try {
    return readSavedAvatars(window.localStorage);
  } catch {
    return { avatars: [], notice: READ_NOTICE };
  }
}

export function writeAvatars(next, expectedAvatars) {
  const { avatars, error } = normalizeAvatars(next);
  if (error) return { ok: false, error };

  try {
    const storage = window.localStorage;
    if (expectedAvatars !== undefined) {
      const expected = normalizeAvatars(expectedAvatars);
      const current = readSavedAvatars(storage);
      if (expected.error || JSON.stringify(expected.avatars) !== JSON.stringify(current.avatars)) {
        return {
          ok: false,
          conflict: true,
          error: '头像收藏已在另一个窗口更新，已保留你的编辑。请检查最新内容后再保存。',
        };
      }
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(avatars));
    return { ok: true };
  } catch (storageError) {
    if (storageError.name === 'QuotaExceededError' || storageError.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      return { ok: false, error: '浏览器存储空间不足，请换用较小的头像，或移除不再需要的收藏。' };
    }
    return { ok: false, error: '浏览器无法保存头像，请检查网站存储权限后重试。' };
  }
}
