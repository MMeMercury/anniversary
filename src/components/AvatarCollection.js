import { useState } from 'react';
import { FiDownload, FiEdit2, FiHeart, FiPlus, FiTrash2 } from 'react-icons/fi';
import Modal from './Modal';
import PhotoField from './PhotoField';
import { AVATAR_LIMITS, loadAvatars, writeAvatars } from '../utils/avatars';
import './AvatarCollection.scss';

const newId = () => window.crypto?.randomUUID?.() || `avatars-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const filenamePart = value => value.replace(/[<>:"/\\|?*]/g, '').replace(/\p{Cc}/gu, '').trim().slice(0, 60) || '头像';
const downloadName = (title, name, position, image) => `${filenamePart(title)}-${filenamePart(name)}-${position}.${image.startsWith('data:image/png;') ? 'png' : image.startsWith('data:image/webp;') ? 'webp' : 'jpg'}`;

function AvatarForm({ avatar, firstName, secondName, onSave, onClose }) {
  const [draft, setDraft] = useState(avatar || { id: newId(), title: '我们的情侣头像', firstImage: '', secondImage: '' });
  const [processing, setProcessing] = useState({ firstImage: false, secondImage: false });
  const [error, setError] = useState('');
  const busy = processing.firstImage || processing.secondImage;
  const ready = draft.title.trim() && draft.firstImage && draft.secondImage && !busy;
  const update = (key, value) => setDraft(current => ({ ...current, [key]: value }));
  return <form onSubmit={event => {
    event.preventDefault();
    if (ready) setError(onSave({ ...draft, title: draft.title.trim() }) || '');
  }}>
    <label className="field"><span>收藏名称</span><input required maxLength={AVATAR_LIMITS.title} value={draft.title} placeholder="给这一对头像起个名字" onChange={event => update('title', event.target.value)} /></label>
    <div className="avatar-upload-grid">
      {[['firstImage', firstName], ['secondImage', secondName]].map(([key, name]) => <div className="avatar-upload-slot" key={key}>
        <h3>{name} 的头像</h3>
        <PhotoField className="avatar-photo-field" label={`${name} 的头像`} value={draft[key]} onChange={value => update(key, value)} onBusyChange={value => setProcessing(current => ({ ...current, [key]: value }))} square maxDimension={640} maxDataLength={AVATAR_LIMITS.image} />
      </div>)}
    </div>
    <p className="form-note">选好两张图片后即可加入收藏。下载的是预览中的正方形头像。</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>取消</button><button className="primary-button" type="submit" disabled={!ready}>{busy ? '正在处理头像…' : avatar ? '保存修改' : '加入收藏'}</button></div>
  </form>;
}

export default function AvatarCollection({ firstName, secondName, onNotice }) {
  const [initial] = useState(loadAvatars);
  const [avatars, setAvatars] = useState(initial.avatars);
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState('');
  const close = () => { setDialog(null); setError(''); };

  function persist(next) {
    const result = writeAvatars(next, avatars);
    if (!result.ok && result.conflict) setAvatars(loadAvatars().avatars);
    if (result.ok) setAvatars(next);
    return result;
  }
  function saveAvatar(avatar) {
    const next = dialog.avatar ? avatars.map(item => item.id === avatar.id ? avatar : item) : [avatar, ...avatars];
    if (dialog.avatar && !avatars.some(item => item.id === avatar.id)) return '这组头像已在其他页面移除。请关闭窗口后重新添加。';
    const result = persist(next);
    if (!result.ok) return result.error;
    close(); onNotice?.('情侣头像已收藏，随时可以下载。');
  }
  function removeAvatar() {
    const result = persist(avatars.filter(item => item.id !== dialog.avatar.id));
    if (!result.ok) { setError(result.error); return; }
    close(); onNotice?.('已移除这组头像收藏。');
  }

  return <section className="avatar-section" id="avatars" aria-labelledby="avatars-title">
    <div className="avatars-heading"><header className="section-heading"><p className="section-kicker">A LITTLE MATCH, A LOT OF LOVE</p><h2 id="avatars-title">心动的头像，要一对一对收藏</h2><p className="section-description">把喜欢的模样配成一对，留给你，也留给我。</p></header><button className="secondary-button" type="button" onClick={() => setDialog({ type: 'form' })}><FiPlus />添加情侣头像</button></div>
    {initial.notice && <p className="form-error" role="alert">{initial.notice}</p>}
    {avatars.length > 0 ? <><p className="avatar-count">已收藏 {avatars.length} 组情侣头像</p><div className="avatar-grid">{avatars.map(avatar => <article className="avatar-card" key={avatar.id}>
      <div className="avatar-card-heading"><h3>{avatar.title}</h3><button className="icon-button" type="button" aria-label={`移除收藏：${avatar.title}`} onClick={() => setDialog({ type: 'remove', avatar })}><FiTrash2 /></button></div>
      <div className="avatar-pair">
        <div className="avatar-person"><img className="avatar-image" src={avatar.firstImage} alt={`${avatar.title} · ${firstName} 的头像`} loading="lazy" /><span className="avatar-person-name">{firstName}</span><a className="avatar-download secondary-button" href={avatar.firstImage} download={downloadName(avatar.title, firstName, 1, avatar.firstImage)} aria-label={`下载${firstName} 的头像：${avatar.title}`}><FiDownload />下载头像</a></div>
        <span className="avatar-pair-heart" aria-hidden="true">♡</span>
        <div className="avatar-person"><img className="avatar-image" src={avatar.secondImage} alt={`${avatar.title} · ${secondName} 的头像`} loading="lazy" /><span className="avatar-person-name">{secondName}</span><a className="avatar-download secondary-button" href={avatar.secondImage} download={downloadName(avatar.title, secondName, 2, avatar.secondImage)} aria-label={`下载${secondName} 的头像：${avatar.title}`}><FiDownload />下载头像</a></div>
      </div>
      <div className="avatar-card-footer"><span className="avatar-saved"><FiHeart />已收藏</span><button className="text-button" type="button" aria-label={`编辑收藏：${avatar.title}`} onClick={() => setDialog({ type: 'form', avatar })}><FiEdit2 />更换头像</button></div>
    </article>)}</div></> : <div className="avatar-empty"><div className="avatar-empty-pair" aria-hidden="true"><span className="avatar-empty-portrait" /><span className="avatar-pair-heart">♡</span><span className="avatar-empty-portrait" /></div><h3>下一对心动，留在这里</h3><p>点击“添加情侣头像”，上传两张图片，收藏属于你们的一对。</p></div>}
    <p className="form-note">头像只保存在此浏览器，不会自动同步给对方。喜欢的图片记得下载留存；清除浏览器数据会移除收藏。</p>
    {dialog?.type === 'form' && <Modal className="avatar-dialog" title={dialog.avatar ? '编辑情侣头像' : '收藏一对情侣头像'} onClose={close}><AvatarForm avatar={dialog.avatar} firstName={firstName} secondName={secondName} onSave={saveAvatar} onClose={close} /></Modal>}
    {dialog?.type === 'remove' && <Modal className="confirm-dialog" title="移除这组收藏？" onClose={close}><p>“{dialog.avatar.title}”的两张头像将从此浏览器中移除。已下载的图片不受影响。</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={close}>保留收藏</button><button className="primary-button" type="button" onClick={removeAvatar}>确认移除</button></div></Modal>}
  </section>;
}
