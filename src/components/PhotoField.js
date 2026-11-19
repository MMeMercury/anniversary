import { useEffect, useRef, useState } from 'react';
import { FiImage, FiUpload } from 'react-icons/fi';
import { STORAGE_LIMITS } from '../utils/storage';

export default function PhotoField({ value, onChange, onBusyChange }) {
  const input = useRef(null);
  const request = useRef(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => () => { request.current += 1; }, []);
  async function selectPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('请选择 JPG、PNG 或 WebP 格式的照片。'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('照片超过 10 MB，请选择较小的图片。'); return; }
    const current = ++request.current;
    setBusy(true); onBusyChange(true);
    const url = URL.createObjectURL(file);
    try {
      const photo = await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = url; });
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1400 / Math.max(photo.width, photo.height));
      canvas.width = Math.max(1, Math.round(photo.width * scale));
      canvas.height = Math.max(1, Math.round(photo.height * scale));
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(photo, 0, 0, canvas.width, canvas.height);
      let quality = 0.86;
      let result = canvas.toDataURL('image/jpeg', quality);
      while (result.length > STORAGE_LIMITS.image && quality > 0.36) { quality -= 0.1; result = canvas.toDataURL('image/jpeg', quality); }
      if (result.length > STORAGE_LIMITS.image) throw new Error('large');
      if (current === request.current) onChange(result);
    } catch {
      if (current === request.current) setError('这张照片暂时无法保存，请换一张较小的图片。');
    } finally {
      URL.revokeObjectURL(url);
      if (current === request.current) { setBusy(false); onBusyChange(false); }
    }
  }
  return <div className="photo-field">
    {value ? <img src={value} alt="选中的回忆照片" /> : <div className="photo-placeholder"><FiImage /><span>放进一张喜欢的照片</span></div>}
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} hidden aria-label="选择回忆照片" />
    <div className="photo-actions"><button className="secondary-button" type="button" disabled={busy} onClick={() => input.current.click()}><FiUpload />{busy ? '正在处理照片…' : value ? '更换照片' : '上传照片'}</button>{value && <button className="text-button" type="button" disabled={busy} onClick={() => onChange('')}>移除照片</button>}</div>
    <p className="form-note">支持 JPG、PNG、WebP，最大 10 MB。照片会压缩后保存在此浏览器。</p>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>;
}
