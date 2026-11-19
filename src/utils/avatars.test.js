import { loadAvatars, writeAvatars } from './avatars';

const key = 'anniversary-avatars';
const pair = {
  id: 'first-pair',
  title: '晴天',
  firstImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJ1cAAAAASUVORK5CYII=',
  secondImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
};

beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

test('starts empty and persists both images under the avatars key', () => {
  expect(loadAvatars()).toEqual({ avatars: [], notice: '' });
  expect(localStorage.getItem(key)).toBeNull();

  expect(writeAvatars([{ ...pair, title: '  晴天  ' }], [])).toEqual({ ok: true });
  expect(JSON.parse(localStorage.getItem(key))).toEqual([pair]);
  expect(loadAvatars()).toEqual({ avatars: [pair], notice: '' });
});

test.each([
  ['missing', ''],
  ['external', 'https://example.com/avatar.png'],
  ['SVG', 'data:image/svg+xml;base64,PHN2Zy8+'],
  ['malformed', 'data:image/png;base64,broken!!'],
  ['oversized', 'data:image/png;base64,' + 'A'.repeat(250000)],
])('rejects a pair whose second image is %s', (_, secondImage) => {
  localStorage.setItem(key, JSON.stringify([pair]));
  const result = writeAvatars([{ ...pair, secondImage }], [pair]);

  expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/头像/) });
  expect(loadAvatars().avatars).toEqual([pair]);
});

test('recovers valid unique pairs without replacing damaged stored data', () => {
  const raw = JSON.stringify([
    pair,
    { ...pair, id: ' first-pair ', title: '重复记录' },
    { ...pair, id: 'broken-pair', firstImage: false },
  ]);
  localStorage.setItem(key, raw);

  expect(loadAvatars()).toEqual({ avatars: [pair], notice: expect.stringMatching(/读取/) });
  expect(localStorage.getItem(key)).toBe(raw);
});

test('returns an empty collection for malformed JSON without replacing it', () => {
  localStorage.setItem(key, '{unfinished');

  expect(loadAvatars()).toEqual({ avatars: [], notice: expect.stringMatching(/读取/) });
  expect(localStorage.getItem(key)).toBe('{unfinished');
});

test('reports a quota error without replacing the previous pairs', () => {
  localStorage.setItem(key, JSON.stringify([pair]));
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('', 'QuotaExceededError');
  });

  expect(writeAvatars([], [pair])).toMatchObject({ ok: false, error: expect.stringMatching(/空间/) });
  expect(loadAvatars().avatars).toEqual([pair]);
});

test('rejects a stale write and preserves the other tab’s new pair', () => {
  const newer = { ...pair, id: 'other-tab', title: '另一组' };
  localStorage.setItem(key, JSON.stringify([pair]));
  const stale = loadAvatars().avatars;
  expect(writeAvatars([pair, newer], stale)).toEqual({ ok: true });

  expect(writeAvatars([], stale)).toMatchObject({
    ok: false,
    conflict: true,
    error: expect.stringMatching(/另一个窗口/),
  });
  expect(loadAvatars().avatars).toEqual([pair, newer]);
});
