import { fireEvent, render, screen, within } from '@testing-library/react';
import AvatarCollection from './AvatarCollection';

const firstImage = 'data:image/jpeg;base64,YXZhdGFyMQ==';
const secondImage = 'data:image/jpeg;base64,YXZhdGFyMg==';

beforeEach(() => {
  localStorage.clear();
  URL.createObjectURL = jest.fn(() => 'blob:avatar-preview');
  URL.revokeObjectURL = jest.fn();
  jest.spyOn(window, 'Image').mockImplementation(() => {
    const image = { width: 1200, height: 800 };
    Object.defineProperty(image, 'src', { set: () => Promise.resolve().then(() => image.onload()) });
    return image;
  });
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: jest.fn(), drawImage: jest.fn() });
  jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValueOnce(firstImage).mockReturnValue(secondImage);
});

afterEach(() => jest.restoreAllMocks());

async function uploadPair() {
  fireEvent.click(screen.getByRole('button', { name: '添加情侣头像' }));
  const dialog = within(screen.getByRole('dialog'));
  fireEvent.change(dialog.getByLabelText('收藏名称'), { target: { value: '一起去散步' } });
  fireEvent.change(dialog.getByLabelText('选择Coconut 的头像'), { target: { files: [new File(['first'], 'first.png', { type: 'image/png' })] } });
  await dialog.findByAltText('Coconut 的头像预览');
  fireEvent.change(dialog.getByLabelText('选择Mio 的头像'), { target: { files: [new File(['second'], 'second.png', { type: 'image/png' })] } });
  await dialog.findByAltText('Mio 的头像预览');
  return dialog;
}

test('uploads a pair, persists it across reload, and exposes both images for download', async () => {
  const view = render(<AvatarCollection firstName="Coconut" secondName="Mio" />);
  const dialog = await uploadPair();
  fireEvent.click(dialog.getByRole('button', { name: '加入收藏' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: '一起去散步' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '下载Coconut 的头像：一起去散步' })).toHaveAttribute('href', firstImage);
  expect(screen.getByRole('link', { name: '下载Mio 的头像：一起去散步' })).toHaveAttribute('href', secondImage);
  expect(screen.getByRole('link', { name: '下载Mio 的头像：一起去散步' })).toHaveAttribute('download', '一起去散步-Mio-2.jpg');
  view.unmount();
  render(<AvatarCollection firstName="Coconut" secondName="Mio" />);
  expect(screen.getByRole('heading', { name: '一起去散步' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '移除收藏：一起去散步' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '确认移除' }));
  expect(JSON.parse(localStorage.getItem('anniversary-avatars'))).toEqual([]);
});

test('requires both portraits and rejects non-image uploads', () => {
  render(<AvatarCollection firstName="Coconut" secondName="Mio" />);
  fireEvent.click(screen.getByRole('button', { name: '添加情侣头像' }));
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByRole('button', { name: '加入收藏' })).toBeDisabled();
  fireEvent.change(dialog.getByLabelText('选择Coconut 的头像'), { target: { files: [new File(['text'], 'note.txt', { type: 'text/plain' })] } });
  expect(dialog.getByRole('alert')).toHaveTextContent('请选择 JPG、PNG 或 WebP');
  expect(dialog.getByRole('button', { name: '加入收藏' })).toBeDisabled();
});

test('keeps the uploaded pair and draft available when storage is full', async () => {
  render(<AvatarCollection firstName="Coconut" secondName="Mio" />);
  const dialog = await uploadPair();
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError'); });
  fireEvent.click(dialog.getByRole('button', { name: '加入收藏' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(dialog.getByLabelText('收藏名称')).toHaveValue('一起去散步');
  expect(dialog.getByAltText('Coconut 的头像预览')).toHaveAttribute('src', firstImage);
  expect(dialog.getByRole('alert')).toHaveTextContent(/空间|存储|保存/);
  expect(localStorage.getItem('anniversary-avatars')).toBeNull();
});
