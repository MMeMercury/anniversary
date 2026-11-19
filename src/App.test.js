import { act, fireEvent, render, screen, within } from '@testing-library/react';
import HomePage from './pages/HomePage';

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 10, 19, 12, 0, 0));
  window.matchMedia = jest.fn().mockImplementation(() => ({
    matches: true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('persists edited settings across reloads and treats greeting as text', () => {
  const page = render(<HomePage />);
  fireEvent.click(screen.getByRole('button', { name: '编辑纪念日' }));
  const dialog = within(screen.getByRole('dialog'));
  fireEvent.change(dialog.getByLabelText('第一个名字'), { target: { value: 'Ada' } });
  fireEvent.change(dialog.getByLabelText('第二个名字'), { target: { value: 'Lin' } });
  fireEvent.change(dialog.getByLabelText('首页欢迎语'), { target: { value: '<b>只是一段文字</b>' } });
  fireEvent.click(dialog.getByRole('button', { name: '保存设置' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ada');
  expect(screen.getByText('<b>只是一段文字</b>')).toBeInTheDocument();
  expect(document.querySelector('.hero-greeting b')).toBeNull();
  page.unmount();
  render(<HomePage />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Lin');
  expect(JSON.parse(localStorage.getItem('anniversary-config')).firstName).toBe('Ada');
});

test('adds, edits, deletes and persists a memory', () => {
  render(<HomePage />);
  fireEvent.click(screen.getByRole('button', { name: '添加一段回忆' }));
  let dialog = within(screen.getByRole('dialog'));
  fireEvent.change(dialog.getByLabelText('回忆标题'), { target: { value: '一起看日落' } });
  fireEvent.change(dialog.getByLabelText('回忆日期'), { target: { value: '2026-11-18' } });
  fireEvent.change(dialog.getByLabelText('回忆文字'), { target: { value: '晚霞很温柔。' } });
  fireEvent.click(dialog.getByRole('button', { name: '保存回忆' }));
  expect(screen.getByRole('heading', { name: '一起看日落' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '编辑回忆：一起看日落' }));
  dialog = within(screen.getByRole('dialog'));
  fireEvent.change(dialog.getByLabelText('回忆标题'), { target: { value: '海边的日落' } });
  fireEvent.click(dialog.getByRole('button', { name: '保存回忆' }));
  expect(JSON.parse(localStorage.getItem('anniversary-memories'))[0].title).toBe('海边的日落');
  fireEvent.click(screen.getByRole('button', { name: '删除回忆：海边的日落' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '确认删除' }));
  expect(screen.queryByRole('heading', { name: '海边的日落' })).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('anniversary-memories')).some(memory => memory.title === '海边的日落')).toBe(false);
});

test('keeps unsaved settings open and explains storage quota errors', () => {
  render(<HomePage />);
  fireEvent.click(screen.getByRole('button', { name: '编辑纪念日' }));
  const dialog = within(screen.getByRole('dialog'));
  fireEvent.change(dialog.getByLabelText('第一个名字'), { target: { value: 'New name' } });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError');
  });
  fireEvent.click(dialog.getByRole('button', { name: '保存设置' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(dialog.getByRole('alert')).toHaveTextContent(/空间|存储|保存/);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Coconut');
});

test('Escape closes the letter and restores focus', () => {
  render(<HomePage />);
  const trigger = screen.getByRole('button', { name: '打开这封信' });
  trigger.focus();
  fireEvent.click(trigger);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test('shows a live nonnegative countdown for a future start', () => {
  localStorage.setItem('anniversary-config', JSON.stringify({ startDate: '2026-11-20T12:00' }));
  render(<HomePage />);
  expect(screen.getByRole('heading', { name: '距离我们的故事开始' })).toBeInTheDocument();
  expect(screen.getByRole('timer', { name: '1天 0小时 0分钟 0秒' })).toBeInTheDocument();
  act(() => { jest.advanceTimersByTime(1000); });
  expect(screen.getByRole('timer', { name: '0天 23小时 59分钟 59秒' })).toBeInTheDocument();
});

test('recovers from malformed storage without overwriting it', () => {
  localStorage.setItem('anniversary-config', 'null');
  localStorage.setItem('anniversary-memories', '{broken');
  render(<HomePage />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Coconut');
  expect(localStorage.getItem('anniversary-memories')).toBe('{broken');
});
