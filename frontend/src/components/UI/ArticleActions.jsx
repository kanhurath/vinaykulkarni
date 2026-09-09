import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getLikes, likeArticle, getComments, addComment } from '../../services/articlesApi';
import './ArticleActions.css';

// ── Like Button ───────────────────────────────────────────────────────────────
export function LikeButton({ articleId }) {
  const [liked, setLiked] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('vk_liked_articles') || '[]').map(Number))
        .has(Number(articleId));
    } catch { return false; }
  });
  const [count, setCount] = useState(0);
  const [busy,  setBusy]  = useState(false);

  useEffect(() => {
    getLikes(articleId).then(d => setCount(d.count || 0)).catch(() => {});
  }, [articleId]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next);
    try {
      await likeArticle(articleId);
      const fresh = await getLikes(articleId);
      setCount(fresh.count || 0);
    } catch {
      setLiked(!next); // revert on error
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      className={`art-action-btn like-btn${liked ? ' liked' : ''}`}
      onClick={toggle}
      disabled={busy}
      aria-label={liked ? 'Unlike' : 'Like'}
      title={liked ? 'Unlike' : 'Like this article'}
    >
      <span className="art-action-icon">{liked ? '♥' : '♡'}</span>
      <span className="art-action-label">{count > 0 ? count : ''} {liked ? 'Liked' : 'Like'}</span>
    </button>
  );
}

// ── Share Button (dropdown) ───────────────────────────────────────────────────
export function ShareButton({ title, url }) {
  const [open,   setOpen]   = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  const shareUrl   = url   || window.location.href;
  const shareTitle = title || document.title;
  const encoded    = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onKey   = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onClick);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onClick);
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1800);
    } catch { /* fallback: select text */ }
  };

  const SHARE_OPTIONS = [
    {
      id:    'copy',
      label: copied ? '✓ Copied!' : 'Copy Link',
      icon:  '🔗',
      action: copyLink,
    },
    {
      id:    'twitter',
      label: 'Twitter / X',
      icon:  '𝕏',
      href:  `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
    },
    {
      id:    'linkedin',
      label: 'LinkedIn',
      icon:  'in',
      href:  `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    },
    {
      id:    'facebook',
      label: 'Facebook',
      icon:  'f',
      href:  `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    },
    {
      id:    'whatsapp',
      label: 'WhatsApp',
      icon:  '💬',
      href:  `https://api.whatsapp.com/send?text=${encodedTitle}%20${encoded}`,
    },
  ];

  return (
    <div className="share-wrap" ref={ref}>
      <button
        className={`art-action-btn share-btn${open ? ' active' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Share"
      >
        <span className="art-action-icon">↗</span>
        <span className="art-action-label">Share</span>
        <span className="share-caret">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="share-dropdown" role="menu">
          {SHARE_OPTIONS.map(opt => (
            opt.href ? (
              <a
                key={opt.id}
                className={`share-option share-option--${opt.id}`}
                href={opt.href}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <span className="share-option-icon">{opt.icon}</span>
                <span className="share-option-label">{opt.label}</span>
              </a>
            ) : (
              <button
                key={opt.id}
                className={`share-option share-option--${opt.id}${copied ? ' copied' : ''}`}
                onClick={opt.action}
                role="menuitem"
              >
                <span className="share-option-icon">{opt.icon}</span>
                <span className="share-option-label">{opt.label}</span>
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
}

// ── Comments Modal ────────────────────────────────────────────────────────────
function CommentsModal({ articleId, onClose }) {
  const [comments, setComments]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [name,     setName]       = useState('');
  const [text,     setText]       = useState('');
  const [sending,  setSending]    = useState(false);
  const [sent,     setSent]       = useState(false);
  const [error,    setError]      = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getComments(articleId)
      .then(d => setComments(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [articleId]);

  useEffect(() => {
    load();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [load, onClose]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true); setError('');
    try {
      await addComment(articleId, { author_name: name.trim() || 'Anonymous', content: text.trim() });
      setText(''); setName(''); setSent(true);
      setTimeout(() => setSent(false), 3500);
    } catch (err) {
      setError(err.message || 'Could not submit comment.');
    } finally {
      setSending(false);
    }
  };

  const modal = (
    <div className="comments-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="comments-modal" role="dialog" aria-modal="true" aria-label="Comments">
        <div className="comments-modal-header">
          <h3 className="comments-modal-title">Comments</h3>
          <button className="comments-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="comments-body">
          {/* Existing comments */}
          {loading && <p className="comments-loading">Loading…</p>}
          {!loading && comments.length === 0 && (
            <p className="comments-empty">No comments yet. Be the first!</p>
          )}
          {!loading && comments.map(c => (
            <div key={c.id} className="comment-item">
              {c.image_url && (
                <img src={c.image_url} alt="" className="comment-img" />
              )}
              <div className="comment-meta">
                <span className="comment-author">{c.author_name || 'Anonymous'}</span>
                <span className="comment-date">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  }) : ''}
                </span>
              </div>
              <p className="comment-text">{c.content}</p>
            </div>
          ))}

          {/* Submit form */}
          <form className="comment-form" onSubmit={submit}>
            <h4 className="comment-form-title">Leave a Comment</h4>
            <input
              className="comment-input"
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
            />
            <textarea
              className="comment-input comment-textarea"
              placeholder="Write your comment…"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
              required
            />
            {error && <p className="comment-error">{error}</p>}
            {sent  && <p className="comment-sent">✓ Comment submitted for review. Thank you!</p>}
            <button className="comment-submit" type="submit" disabled={sending || !text.trim()}>
              {sending ? 'Submitting…' : 'Submit Comment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ── Comment Button ────────────────────────────────────────────────────────────
export function CommentButton({ articleId }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="art-action-btn comment-btn"
        onClick={() => setOpen(true)}
        aria-label="Comments"
        title="View and leave comments"
      >
        <span className="art-action-icon">💬</span>
        <span className="art-action-label">Comments</span>
      </button>
      {open && <CommentsModal articleId={articleId} onClose={() => setOpen(false)} />}
    </>
  );
}

// ── Article Actions Bar ───────────────────────────────────────────────────────
export function ArticleActions({ articleId, title, url }) {
  return (
    <div className="article-actions-bar">
      <LikeButton    articleId={articleId} />
      <CommentButton articleId={articleId} />
      <ShareButton   title={title} url={url} />
    </div>
  );
}
