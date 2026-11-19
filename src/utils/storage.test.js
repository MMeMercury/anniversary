import { loadLocalState, writeConfig, writeMemories } from './storage';

const config = {
  firstName: 'Floyd',
  secondName: 'Mio',
  startDate: '2025-04-23T21:36',
  greeting: '今天很好。',
  subtitle: 'Hello, memories.',
  letter: '这封信有两行。\n以后的日子也一起走。',
};

const memory = {
  id: 'first-edited',
  date: '2025-04-23',
  title: '一起散步',
  note: '下了一场雨。',
  image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJ1cAAAAASUVORK5CYII=',
};

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('opens first use with the established start and one editable memory without writing storage', () => {
  const result = loadLocalState();

  expect(result).toMatchObject({
    config: { firstName: 'Floyd', secondName: 'Mio', startDate: '2025-03-15T18:00' },
    memories: [{
      id: 'origin',
      date: '2025-03-15',
      title: '故事的开始',
      note: '从这一天起，我们开始一起记录时间。',
      image: '',
    }],
    notice: '',
  });
  expect(localStorage.length).toBe(0);
});

test('falls back from malformed or invalid-shaped data without overwriting the saved values', () => {
  localStorage.setItem('anniversary-config', '{unfinished');
  localStorage.setItem('anniversary-memories', '{"records":[]}');

  const result = loadLocalState();

  expect(result.config.startDate).toBe('2025-03-15T18:00');
  expect(result.memories).toHaveLength(1);
  expect(result.notice).toMatch(/读取/);
  expect(localStorage.getItem('anniversary-config')).toBe('{unfinished');
  expect(localStorage.getItem('anniversary-memories')).toBe('{"records":[]}');
});

test('fills invalid config fields while keeping recoverable text and the stored value', () => {
  const stored = JSON.stringify({ ...config, firstName: ['Floyd'], startDate: '2025-02-29T12:00' });
  localStorage.setItem('anniversary-config', stored);

  const result = loadLocalState();

  expect(result.config).toEqual({ ...config, startDate: '2025-03-15T18:00' });
  expect(result.notice).toMatch(/读取/);
  expect(localStorage.getItem('anniversary-config')).toBe(stored);
});

test('uses local midnight for a legacy date-only start without rewriting storage', () => {
  const stored = JSON.stringify({ ...config, startDate: '2025-04-23' });
  localStorage.setItem('anniversary-config', stored);

  expect(loadLocalState()).toMatchObject({
    config: { ...config, startDate: '2025-04-23T00:00' },
    notice: '',
  });
  expect(localStorage.getItem('anniversary-config')).toBe(stored);
});

test('preserves valid memory text while removing duplicate IDs, invalid dates, and non-raster images', () => {
  const raw = JSON.stringify([
    memory,
    { ...memory, id: ' first-edited ', title: '同一条记录' },
    { ...memory, id: 'bad-date', date: '2025-04-31' },
    { ...memory, id: 'bad-image', image: 'data:image/svg+xml;base64,PHN2Zy8+' },
    { ...memory, id: 'long-note', note: '雨'.repeat(1200) },
  ]);
  localStorage.setItem('anniversary-memories', raw);

  const result = loadLocalState();

  expect(result.memories).toEqual([
    memory,
    { ...memory, id: 'bad-image', image: '' },
    { ...memory, id: 'long-note', note: '' },
  ]);
  expect(result.notice).toMatch(/读取/);
  expect(localStorage.getItem('anniversary-memories')).toBe(raw);
});

test('returns usable defaults when the browser denies access to local storage', () => {
  jest.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
    throw new DOMException('', 'SecurityError');
  });

  const result = loadLocalState();

  expect(result.config.firstName).toBe('Floyd');
  expect(result.memories).toHaveLength(1);
  expect(result.notice).toMatch(/读取/);
});

test('round-trips settings including multiline text and trims display names', () => {
  expect(writeConfig({ ...config, firstName: '  阿洛  ' })).toEqual({ ok: true, error: '' });
  expect(loadLocalState().config).toEqual({ ...config, firstName: '阿洛' });
});

test('round-trips an image and keeps a deliberately empty timeline empty', () => {
  expect(writeMemories([memory])).toEqual({ ok: true, error: '' });
  expect(loadLocalState().memories).toEqual([memory]);
  expect(writeMemories([])).toEqual({ ok: true, error: '' });
  expect(loadLocalState().memories).toEqual([]);
});

test('rejects a stale timeline write and preserves the other tab’s changes', () => {
  writeMemories([memory]);
  const stale = loadLocalState().memories;
  const newerMemory = { ...memory, id: 'other-tab', title: '另一个窗口的回忆' };
  writeMemories([memory, newerMemory], stale);

  const result = writeMemories([], stale);

  expect(result).toMatchObject({ ok: false, conflict: true, error: expect.stringMatching(/另一个窗口/) });
  expect(loadLocalState().memories).toEqual([memory, newerMemory]);
});

test('rejects an invalid settings write and preserves the previous settings', () => {
  localStorage.setItem('anniversary-config', JSON.stringify(config));

  expect(writeConfig({ ...config, startDate: '2025-04-31T12:00' })).toMatchObject({
    ok: false,
    error: expect.stringMatching(/日期/),
  });
  expect(loadLocalState().config).toEqual(config);
});

test.each([
  'https://example.com/photo.png',
  'data:image/svg+xml;base64,PHN2Zy8+',
  'data:image/png;base64,!not-base64!',
  'data:image/png;base64,' + 'A'.repeat(700000),
])('rejects an unsupported or oversized photo write (%#)', (image) => {
  localStorage.setItem('anniversary-memories', JSON.stringify([memory]));

  expect(writeMemories([{ ...memory, image }])).toMatchObject({
    ok: false,
    error: expect.stringMatching(/图片/),
  });
  expect(loadLocalState().memories).toEqual([memory]);
});

test.each([
  ['QuotaExceededError', /空间/],
  ['SecurityError', /浏览器/],
])('returns an actionable error for %s without changing previous records', (name, error) => {
  localStorage.setItem('anniversary-memories', JSON.stringify([memory]));
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('', name);
  });

  expect(writeMemories([])).toMatchObject({ ok: false, error: expect.stringMatching(error) });
  expect(loadLocalState().memories).toEqual([memory]);
});
