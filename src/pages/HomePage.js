import { useEffect, useState } from 'react';
import { FaHeart } from 'react-icons/fa';
import { FiCalendar, FiEdit2, FiPause, FiPlay, FiPlus, FiSettings, FiTrash2, FiX } from 'react-icons/fi';
import confetti from 'canvas-confetti';
import Countdown from '../components/Countdown';
import Modal from '../components/Modal';
import PhotoField from '../components/PhotoField';
import TypewriterText from '../components/TypewriterText';
import { getAnniversary, getElapsedParts } from '../utils/anniversary';
import { loadLocalState, STORAGE_LIMITS, writeConfig, writeMemories } from '../utils/storage';
import './HomePage.scss';

const dateText = value => value.slice(0, 10).replace(/-/g, '.');
const dateValue = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const newId = () => window.crypto?.randomUUID?.() || `memory-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function SettingsForm({ config, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...config });
  const [error, setError] = useState('');
  const field = (key, label, options = {}) => <label className={`field${options.full ? ' full-width' : ''}`}><span>{label}</span><input type={options.type || 'text'} value={draft[key]} required={options.required} maxLength={STORAGE_LIMITS[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} /></label>;
  return <form onSubmit={event => { event.preventDefault(); setError(onSave({ ...draft, firstName: draft.firstName.trim(), secondName: draft.secondName.trim() }) || ''); }}>
    <p className="form-note">把这里变成你们的专属空间。修改仅保存在当前浏览器。</p>
    <div className="form-grid">
      {field('firstName', '第一个名字', { required: true })}
      {field('secondName', '第二个名字', { required: true })}
      {field('startDate', '故事开始的时间', { type: 'datetime-local', required: true, full: true })}
      {field('greeting', '首页欢迎语', { full: true })}
      {field('subtitle', '首页副标题', { full: true })}
      <label className="field full-width"><span>写给彼此的信</span><textarea rows="7" maxLength={STORAGE_LIMITS.letter} value={draft.letter} onChange={event => setDraft({ ...draft, letter: event.target.value })} /></label>
    </div>
    <p className="form-note">计时使用当前设备的本地时间；未来日期会自动显示倒计时。</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" type="submit">保存设置</button></div>
  </form>;
}

function MemoryForm({ memory, onSave, onClose }) {
  const [draft, setDraft] = useState(memory || { id: newId(), date: dateValue(new Date()), title: '', note: '', image: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key, value) => setDraft(current => ({ ...current, [key]: value }));
  return <form onSubmit={event => { event.preventDefault(); if (!busy) setError(onSave({ ...draft, title: draft.title.trim() }) || ''); }}>
    <div className="form-grid">
      <label className="field full-width"><span>回忆标题</span><input value={draft.title} required maxLength={STORAGE_LIMITS.title} placeholder="一次旅行，或一个普通的下午" onChange={event => update('title', event.target.value)} /></label>
      <label className="field full-width"><span>回忆日期</span><input type="date" required value={draft.date} onChange={event => update('date', event.target.value)} /></label>
      <label className="field full-width"><span>回忆文字</span><textarea rows="3" maxLength={STORAGE_LIMITS.note} value={draft.note} placeholder="那天发生了什么？" onChange={event => update('note', event.target.value)} /></label>
    </div>
    <PhotoField value={draft.image} onChange={value => update('image', value)} onBusyChange={setBusy} />
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>取消</button><button className="primary-button" type="submit" disabled={busy}>{busy ? '正在处理照片…' : '保存回忆'}</button></div>
  </form>;
}

export default function HomePage() {
  const [initial] = useState(loadLocalState);
  const [config, setConfig] = useState(initial.config);
  const [memories, setMemories] = useState(initial.memories);
  const [notice, setNotice] = useState(initial.notice);
  const [now, setNow] = useState(() => new Date());
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState('');
  const [motionPaused, setMotionPaused] = useState(false);
  const close = () => { setDialog(null); setError(''); };
  useEffect(() => {
    const update = () => setNow(new Date());
    const timer = setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, []);
  useEffect(() => { document.title = `${config.firstName} & ${config.secondName} · 我们的纪念日`; }, [config.firstName, config.secondName]);
  useEffect(() => {
    if (!notice) return undefined;
    const timeout = setTimeout(() => setNotice(''), 7000);
    return () => clearTimeout(timeout);
  }, [notice]);
  const parts = getElapsedParts(config.startDate, now);
  const anniversary = getAnniversary(config.startDate, now);
  const sortedMemories = [...memories].sort((a, b) => b.date.localeCompare(a.date));

  function saveSettings(next) {
    const result = writeConfig(next);
    if (!result.ok) return result.error;
    setConfig(next); close(); setNotice('你们的纪念日已保存。');
  }
  function saveMemory(memory) {
    const next = [memory, ...memories.filter(item => item.id !== memory.id)].sort((a, b) => b.date.localeCompare(a.date));
    const result = writeMemories(next, memories);
    if (!result.ok) {
      if (result.conflict) setMemories(loadLocalState().memories);
      return result.error;
    }
    setMemories(next); close(); setNotice('这一刻，记住了。');
  }
  function deleteMemory() {
    const next = memories.filter(memory => memory.id !== dialog.memory.id);
    const result = writeMemories(next, memories);
    if (!result.ok) {
      if (result.conflict) setMemories(loadLocalState().memories);
      setError(result.error); return;
    }
    setMemories(next); close(); setNotice('回忆已删除。');
  }
  function celebrate() {
    setNotice('把这份喜欢，送给你 ♡');
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!motionPaused && !reduced) confetti({ particleCount: 100, spread: 80, origin: { y: 0.65 }, colors: ['#ed8fba', '#a3baf9', '#fff'], disableForReducedMotion: true, zIndex: 1000 });
  }

  return <main className={`anniversary-site${motionPaused ? ' motion-paused' : ''}`}>
    <div className="ambient ambient-one" aria-hidden="true" /><div className="ambient ambient-two" aria-hidden="true" />
    <div className="floating-hearts" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <span key={index} style={{ '--i': index }}>♡</span>)}</div>
    <nav className="topbar" aria-label="主导航">
      <a className="brand" href="#home"><span className="brand-mark"><FaHeart /></span>我们的纪念日</a>
      <div className="nav-links"><a href="#counter">时光</a><a href="#memories">回忆</a><a href="#letter">写给你</a></div>
      <div className="topbar-actions"><button className="icon-button motion-toggle" type="button" aria-label={motionPaused ? '开启动画' : '暂停动画'} aria-pressed={motionPaused} onClick={() => setMotionPaused(value => !value)}>{motionPaused ? <FiPlay /> : <FiPause />}</button><button className="settings-trigger" type="button" aria-label="编辑纪念日" onClick={() => setDialog({ type: 'settings' })}><FiSettings /><span>编辑纪念日</span></button></div>
    </nav>

    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero-copy"><p className="eyebrow">OUR LITTLE FOREVER</p><p className="hero-intro">世界很大，而你刚好在这里。</p>
        <h1 id="hero-title"><span className="name-first">{config.firstName}</span><b className="hero-heart" aria-label="和">♥</b><span className="name-second">{config.secondName}</span></h1>
        <p className="hero-greeting"><TypewriterText text={config.greeting} paused={motionPaused} /></p><p className="hero-subtitle">{config.subtitle}</p>
        <div className="hero-actions"><a className="primary-button" href="#counter"><FaHeart />看看我们的时光</a><button className="secondary-button" type="button" onClick={celebrate}>送你一颗心</button></div>
        <p className="since-note"><span aria-hidden="true">✦</span> OUR STORY BEGINS · {dateText(config.startDate)}</p>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="orbit orbit-outer" /><div className="orbit orbit-inner" /><div className="heart-shape" /><span className="sparkle sparkle-a">✧</span><span className="sparkle sparkle-b">✦</span><span className="sparkle sparkle-c">♡</span><span className="art-caption">you & me, always.</span></div>
    </section>

    <section className="counter-section" id="counter" aria-labelledby="counter-title">
      <header className="section-heading"><p className="section-kicker">EVERY SECOND WITH YOU</p><h2 id="counter-title">{parts.isFuture ? '距离我们的故事开始' : '我们已经一起走过'}</h2><p className="section-description">{parts.isFuture ? '把期待交给时间，把心动留给相见。' : '时间有了刻度，喜欢没有期限。'}</p></header>
      <div className="counter-shell"><div className="counter-topline"><span><span aria-hidden="true">♥</span> {parts.isFuture ? '等待故事开始' : '每一秒，都算数'}</span><span>{dateText(config.startDate)} {config.startDate.slice(11, 16)}</span></div><Countdown parts={parts} /><p className="counter-footer">{parts.isFuture ? '直到那一刻，我们开始一起数日子。' : '从相遇的那一天，到以后每一个明天。'}</p></div>
      {anniversary && <div className="milestone"><span className="milestone-icon"><FiCalendar /></span><div className="milestone-copy"><span>下一份小小的期待</span><strong>{anniversary.isStart ? '我们的故事即将开始' : anniversary.isToday ? `${anniversary.years} 周年快乐！` : `我们的 ${anniversary.years} 周年纪念日`}</strong><small>{dateText(dateValue(anniversary.date))}</small></div><div className="milestone-days"><strong>{anniversary.isToday ? '♥' : anniversary.daysRemaining}</strong><span>{anniversary.isToday ? '就是今天' : '天后见'}</span></div></div>}
    </section>

    <section className="memories-section" id="memories" aria-labelledby="memories-title">
      <div className="memories-heading"><header className="section-heading"><p className="section-kicker">MOMENTS TO KEEP</p><h2 id="memories-title">把喜欢的瞬间，慢慢收藏</h2><p className="section-description">一张照片，一段小事，都是我们故事里的一页。</p></header><button className="secondary-button" type="button" onClick={() => setDialog({ type: 'memory' })}><FiPlus />添加一段回忆</button></div>
      <div className="memory-grid">{sortedMemories.map(memory => <article className="memory-card" key={memory.id}>
        {memory.image ? <div className="memory-image"><img src={memory.image} alt={memory.title} loading="lazy" /></div> : <div className="memory-placeholder" aria-hidden="true"><span>♡</span><small>A MOMENT OF US</small></div>}
        <div className="memory-body"><time className="memory-date" dateTime={memory.date}>{dateText(memory.date)}</time><h3>{memory.title}</h3><p>{memory.note}</p><div className="memory-card-actions"><button className="text-button" type="button" aria-label={`编辑回忆：${memory.title}`} onClick={() => setDialog({ type: 'memory', memory })}><FiEdit2 />编辑回忆</button><button className="icon-button" type="button" aria-label={`删除回忆：${memory.title}`} onClick={() => setDialog({ type: 'delete', memory })}><FiTrash2 /></button></div></div>
      </article>)}{memories.length === 0 && <div className="empty-state"><span aria-hidden="true">♡</span><h3>故事，等你来写</h3><p>点击“添加一段回忆”，留下第一个值得记住的瞬间。</p></div>}</div>
      <p className="form-note">回忆和照片只保存在此浏览器。清除浏览器数据会移除这些记录。</p>
    </section>

    <section className="letter-section" id="letter" aria-labelledby="letter-title"><div className="letter-card"><div className="letter-copy"><p className="section-kicker">A LITTLE NOTE, JUST FOR YOU</p><h2 id="letter-title">有些话，想慢慢说给你听</h2><p>日子还长，喜欢你的话，也还有很多。</p><p>这里藏了一封信，等你亲手拆开。</p></div><button className="envelope-button" type="button" aria-label="打开这封信" onClick={() => setDialog({ type: 'letter' })}><span className="envelope" aria-hidden="true"><span className="envelope-paper">To you, with love.</span><span className="envelope-flap" /><span className="envelope-seal">♥</span></span><span className="envelope-caption">点击，打开这封信</span></button></div></section>
    <footer className="site-footer"><span className="footer-heart" aria-hidden="true">♥</span><p>{config.firstName} & {config.secondName} · 未完待续</p><small>把平凡的日子，过成值得纪念的日子。</small></footer>

    {notice && <div className="notice" role="status"><span>{notice}</span><button className="icon-button" type="button" aria-label="关闭提示" onClick={() => setNotice('')}><FiX /></button></div>}
    {dialog?.type === 'settings' && <Modal title="编辑我们的纪念日" className="settings-dialog" onClose={close}><SettingsForm config={config} onSave={saveSettings} onClose={close} /></Modal>}
    {dialog?.type === 'memory' && <Modal title={dialog.memory ? '编辑这段回忆' : '记住这一刻'} className="memory-dialog" onClose={close}><MemoryForm memory={dialog.memory} onSave={saveMemory} onClose={close} /></Modal>}
    {dialog?.type === 'delete' && <Modal title="删除这段回忆？" className="confirm-dialog" onClose={close}><p>“{dialog.memory.title}”和对应照片将从此浏览器中删除，此操作无法撤销。</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={close}>保留回忆</button><button className="primary-button" type="button" onClick={deleteMemory}>确认删除</button></div></Modal>}
    {dialog?.type === 'letter' && <Modal title="写给你的信" className="letter-dialog" onClose={close}><div className="letter-content"><p className="letter-addressee">To {config.secondName},</p><div className="letter-paragraphs">{config.letter || '想说的话，可以从“编辑纪念日”慢慢写下。'}</div><p className="letter-signature">With love,<br />{config.firstName}</p></div><div className="dialog-actions"><button className="primary-button" type="button" onClick={celebrate}><FaHeart />我收到啦</button></div></Modal>}
  </main>;
}
