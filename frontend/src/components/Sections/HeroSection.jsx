import { useEffect, useRef } from 'react';
import heroBg from '../../assets/Images/hero-bg-01_VK.jpg';
import heroPortrait from '../../assets/Images/hero-VinayJi-01_VK.png';
import heroPortraitMob from '../../assets/Images/hero-VinayJi-01_VK-Mob.png';
import './HeroSection.css';

const STATIC_HERO = {
  mantra:      'ॐ सह नाववतु । सह नौ भुनक्तु । सह वीर्यं करवावहै ।\nतेजस्वि नावधीतमस्तु मा विद्विषावहै ।',
  eyebrow:     'Entrepreneur · Thinker · Educator',
  title_line1: 'The Eternal',
  title_em:    'Classroom',
  title_line3: 'of Life',
  subtitle:    'Weaving Dharma, Indian Knowledge Systems, and the ancient wisdom of Bhārata into the living fabric of modern life.',
  cta1_text:   'Explore Articles',
  cta1_link:   '#articles',
  cta2_text:   'About Vinay',
  cta2_link:   '#about',
};

function HeroSection({ hero }) {
  const h = hero || STATIC_HERO;
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H, cx, t = 0;
    let animId;

    const isMobile = () => W < 700;
    const getR     = () => Math.min(W, H) * (isMobile() ? 0.36 : 0.32);
    const getCY    = () => H * (isMobile() ? 0.52 : 0.50);

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      cx = W / 2;
    }
    resize();
    window.addEventListener('resize', resize);

    // Spine y: p=0 → crown, p=1 → root
    function spineY(p) {
      const r = getR(), cy2 = getCY();
      return (cy2 - r * 1.55) + p * (r * 3.10);
    }

    const CHAKRAS = [
      { p: 0.00, hue: 340, r: 1.30 },
      { p: 0.14, hue: 320, r: 1.00 },
      { p: 0.28, hue:  15, r: 1.00 },
      { p: 0.44, hue:  35, r: 1.10 },
      { p: 0.58, hue:  50, r: 1.00 },
      { p: 0.72, hue:  22, r: 0.95 },
      { p: 0.86, hue:   5, r: 0.90 },
    ];

    const stars = Array.from({ length: 80 }, () => ({
      x:       Math.random(),
      y:       Math.random(),
      size:    0.5 + Math.random() * 1.8,
      phase:   Math.random() * Math.PI * 2,
      twinkle: 0.3 + Math.random() * 0.5,
    }));

    function mkParticle(ci) {
      const ch  = CHAKRAS[ci];
      const ang = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 1.1) * (getR() * 0.013);
      return {
        ci,
        x: cx, y: spineY(ch.p),
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd * 0.7,
        life:    Math.random(),
        maxLife: 0.55 + Math.random() * 0.45,
        size:    0.7  + Math.random() * 2.1,
        hue:     ch.hue + (Math.random() - 0.5) * 55,
        burst:   Math.random() > 0.58,
      };
    }

    const particles = [];
    CHAKRAS.forEach((_, ci) => {
      for (let i = 0; i < 24; i++) particles.push(mkParticle(ci));
    });

    function star4(x, y, r, col, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = col;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a  = (i / 4) * Math.PI * 2 - Math.PI / 4;
        const ir = r * 0.35;
        ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        ctx.lineTo(x + Math.cos(a + Math.PI / 4) * ir, y + Math.sin(a + Math.PI / 4) * ir);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function crescent(x, y, r, rot) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(120,25,25,0.70)'; ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.42, 0, r * 0.78, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(243,179,62,0.96)'; ctx.fill();
      ctx.restore();
    }

    function drawStars() {
      stars.forEach((s) => {
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * s.twinkle + s.phase));
        ctx.save();
        ctx.globalAlpha = tw * 0.30;
        ctx.fillStyle   = 'rgba(139,26,26,0.55)';
        ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.size * tw, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      const ACC = [
        { x: 0.10, y: 0.15 }, { x: 0.88, y: 0.20 },
        { x: 0.06, y: 0.65 }, { x: 0.92, y: 0.70 },
        { x: 0.50, y: 0.08 }, { x: 0.18, y: 0.90 },
        { x: 0.82, y: 0.88 }, { x: 0.28, y: 0.25 }, { x: 0.72, y: 0.25 },
      ];
      ACC.forEach((a, i) => {
        const tw = 0.5 + 0.5 * Math.sin(t * 1.1 + i * 0.7);
        star4(a.x * W, a.y * H, getR() * 0.028 * (0.7 + 0.3 * tw), '#8b2e33', 0.25 + 0.25 * tw);
      });
    }

    function drawFrame() {
      const r   = getR(), cy2 = getCY();
      const oR  = r * 1.72,  iR  = r * 1.55;
      const moonR = r * (isMobile() ? 0.115 : 0.105);

      ctx.save();
      ctx.strokeStyle = 'rgba(139,26,26,0.45)';
      ctx.lineWidth   = isMobile() ? 1.0 : 1.4;
      ctx.beginPath(); ctx.arc(cx, cy2, oR, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(139,26,26,0.22)';
      ctx.lineWidth   = 0.7;
      ctx.beginPath(); ctx.arc(cx, cy2, iR, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();

      // Shiva triangle (upward)
      ctx.save();
      ctx.strokeStyle = 'rgba(139,26,26,0.32)';
      ctx.lineWidth   = isMobile() ? 0.9 : 1.1;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i / 3) * Math.PI * 2;
        const px = cx + Math.cos(a) * iR * 0.88;
        const py = cy2 + Math.sin(a) * iR * 0.88;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
      ctx.restore();

      // Shakti triangle (downward)
      ctx.save();
      ctx.strokeStyle = 'rgba(180,60,20,0.32)';
      ctx.lineWidth   = isMobile() ? 0.9 : 1.1;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = Math.PI / 2 + (i / 3) * Math.PI * 2;
        const px = cx + Math.cos(a) * iR * 0.88;
        const py = cy2 + Math.sin(a) * iR * 0.88;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
      ctx.restore();

      // 4 crescent moons at NSEW
      [{ a: -Math.PI / 2 }, { a: Math.PI / 2 }, { a: 0 }, { a: Math.PI }].forEach((m, mi) => {
        crescent(
          cx  + Math.cos(m.a) * oR * 0.995,
          cy2 + Math.sin(m.a) * oR * 0.995,
          moonR,
          m.a + Math.PI / 2 + (mi % 2 === 0 ? 0 : Math.PI)
        );
      });

      // 8 accent stars on ring
      for (let i = 0; i < 8; i++) {
        const a  = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const tw = 0.5 + 0.5 * Math.sin(t * 1.8 + i * 0.8);
        star4(cx + Math.cos(a) * oR, cy2 + Math.sin(a) * oR, r * 0.033, '#8b2e33', 0.35 + 0.28 * tw);
      }
    }

    function drawFigure() {
      const r  = getR();
      const s  = r * 0.012;
      const fw = r * (isMobile() ? 0.40 : 0.33);

      const headY   = spineY(0.06);
      const neckY   = spineY(0.15);
      const shouldY = spineY(0.25);
      const chestY  = spineY(0.38);
      const waistY  = spineY(0.52);
      const hipY    = spineY(0.64);
      const kneeY   = spineY(0.80);
      const baseY   = spineY(0.92);

      ctx.save();
      ctx.strokeStyle = 'rgba(26,37,67,0.50)';
      ctx.lineWidth   = isMobile() ? 1.0 : 1.3;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';

      ctx.beginPath();
      ctx.ellipse(cx, headY - s * 6, s * 9, s * 11, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - s * 3, headY + s * 4);
      ctx.lineTo(cx - s * 4, neckY);
      ctx.lineTo(cx + s * 4, neckY);
      ctx.lineTo(cx + s * 3, headY + s * 4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - s * 5, neckY);
      ctx.bezierCurveTo(cx - fw * 0.9, shouldY, cx - fw, chestY, cx - fw * 0.7, waistY);
      ctx.bezierCurveTo(cx - fw * 0.5, hipY, cx - fw * 0.35, kneeY, cx - fw * 0.9, baseY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + s * 5, neckY);
      ctx.bezierCurveTo(cx + fw * 0.9, shouldY, cx + fw, chestY, cx + fw * 0.7, waistY);
      ctx.bezierCurveTo(cx + fw * 0.5, hipY, cx + fw * 0.35, kneeY, cx + fw * 0.9, baseY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - fw * 0.9, shouldY + s * 2);
      ctx.bezierCurveTo(cx - fw * 1.15, chestY, cx - fw * 1.1, waistY, cx - fw * 0.82, kneeY - s * 4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + fw * 0.9, shouldY + s * 2);
      ctx.bezierCurveTo(cx + fw * 1.15, chestY, cx + fw * 1.1, waistY, cx + fw * 0.82, kneeY - s * 4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - fw * 0.85, kneeY);
      ctx.bezierCurveTo(cx - fw * 0.5, kneeY + s * 10, cx - fw * 0.2, baseY - s * 4, cx, baseY);
      ctx.bezierCurveTo(cx + fw * 0.2, baseY - s * 4, cx + fw * 0.5, kneeY + s * 10, cx + fw * 0.85, kneeY);
      ctx.stroke();

      ctx.restore();
    }

    function drawSpine() {
      const top = spineY(0), bot = spineY(0.88);
      const g   = ctx.createLinearGradient(cx, bot, cx, top);
      g.addColorStop(0,    'hsla(5,85%,40%,0.60)');
      g.addColorStop(0.25, 'hsla(28,90%,45%,0.55)');
      g.addColorStop(0.45, 'hsla(38,95%,48%,0.55)');
      g.addColorStop(0.65, 'hsla(355,80%,42%,0.55)');
      g.addColorStop(0.82, 'hsla(330,80%,38%,0.58)');
      g.addColorStop(1,    'hsla(345,85%,35%,0.65)');
      ctx.save();
      ctx.strokeStyle = g;
      ctx.lineWidth   = isMobile() ? 1.3 : 1.8;
      ctx.setLineDash([3, 6]);
      ctx.beginPath(); ctx.moveTo(cx, bot); ctx.lineTo(cx, top); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    function drawChakraNodes() {
      const r = getR();
      CHAKRAS.forEach((ch, i) => {
        const y     = spineY(ch.p);
        const base  = r * 0.065 * ch.r;
        const pulse = 1 + 0.18 * Math.sin(t * 1.6 + i * 1.1);
        const nr    = base * pulse;
        const rot   = t * (0.35 + i * 0.06) * (i % 2 ? -1 : 1);

        const g = ctx.createRadialGradient(cx, y, 0, cx, y, nr * 5);
        g.addColorStop(0,   `hsla(${ch.hue},90%,42%,0.30)`);
        g.addColorStop(0.5, `hsla(${ch.hue},90%,38%,0.08)`);
        g.addColorStop(1,   'hsla(0,0%,0%,0)');
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, y, nr * 5, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.restore();

        const pCount = [4, 2, 16, 12, 10, 6, 4][i];
        ctx.save();
        ctx.translate(cx, y); ctx.rotate(rot);
        for (let p = 0; p < pCount; p++) {
          const a = (p / pCount) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * nr * 1.4, Math.sin(a) * nr * 1.4, nr * 0.52, nr * 0.18, a, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${ch.hue},85%,38%,0.50)`;
          ctx.lineWidth   = 0.65;
          ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.shadowColor = `hsla(${ch.hue},90%,30%,0.55)`;
        ctx.shadowBlur  = 12;
        const cd = ctx.createRadialGradient(cx, y, 0, cx, y, nr);
        cd.addColorStop(0, `hsla(${ch.hue},90%,72%,0.95)`);
        cd.addColorStop(1, `hsla(${ch.hue},85%,30%,0.65)`);
        ctx.beginPath(); ctx.arc(cx, y, nr, 0, Math.PI * 2);
        ctx.fillStyle = cd; ctx.fill();
        ctx.restore();
      });
    }

    function tickParticles() {
      const r = getR();
      particles.forEach((p) => {
        p.life += 0.008 + (p.burst ? 0.013 : 0);
        if (p.life >= p.maxLife) {
          const ch  = CHAKRAS[p.ci];
          const ang = Math.random() * Math.PI * 2;
          const spd = (0.3 + Math.random() * 1.1) * (r * 0.013);
          p.life    = 0;
          p.maxLife = 0.55 + Math.random() * 0.45;
          p.x   = cx;  p.y   = spineY(ch.p);
          p.vx  = Math.cos(ang) * spd;
          p.vy  = Math.sin(ang) * spd * 0.7;
          p.size  = 0.7 + Math.random() * 2.1;
          p.hue   = ch.hue + (Math.random() - 0.5) * 55;
          p.burst = Math.random() > 0.58;
        }
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.011;

        const prog  = p.life / p.maxLife;
        const alpha = Math.sin(prog * Math.PI) * (p.burst ? 0.65 : 0.40);
        const sz    = Math.max(0.3, p.size * (1 + prog * (p.burst ? 1.2 : 0.5)));

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = `hsla(${p.hue},90%,30%,0.45)`;
        ctx.shadowBlur  = p.burst ? 7 : 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${p.hue},85%,38%)`;
        ctx.fill();
        ctx.restore();
      });
    }

    function drawCrown() {
      const r = getR(), y = spineY(0);
      for (let i = 0; i < 4; i++) {
        const ph  = (t * 0.45 + i * 0.65) % 1;
        const rad = ph * r * 0.85;
        ctx.save();
        ctx.globalAlpha = (1 - ph) * 0.18;
        ctx.strokeStyle = 'hsl(345,80%,30%)';
        ctx.lineWidth   = 0.9;
        ctx.beginPath(); ctx.arc(cx, y, rad, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      const fs = Math.max(16, Math.min(W * 0.065, 50));
      ctx.save();
      ctx.globalAlpha  = 0.22 + 0.06 * Math.sin(t * 0.55);
      ctx.font         = `${fs}px 'Noto Serif Devanagari', serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = 'hsl(345,75%,28%)';
      ctx.fillText('ॐ', cx, y - fs * 1.3);
      ctx.restore();
    }

    function frame() {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      drawStars();
      drawFrame();
      drawSpine();
      drawFigure();
      drawChakraNodes();
      tickParticles();
      drawCrown();
      animId = requestAnimationFrame(frame);
    }
    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <section className="hero">
      <div
        className="hero-bg"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <canvas ref={canvasRef} className="kundalini-canvas" />

      {/* Left: text content */}
      <div className="hero-content">
        <p className="hero-mantra">
          {(h.mantra || STATIC_HERO.mantra).split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
          ))}
        </p>
        <div className="hero-eyebrow">{h.eyebrow || STATIC_HERO.eyebrow}</div>
        <h1 className="hero-title">
          {h.title_line1 || STATIC_HERO.title_line1}<br />
          <em>{h.title_em || STATIC_HERO.title_em}</em><br />
          {h.title_line3 || STATIC_HERO.title_line3}
        </h1>
        <p className="hero-subtitle">{h.subtitle || STATIC_HERO.subtitle}</p>
        <div className="hero-actions">
          <a href={h.cta1_link || STATIC_HERO.cta1_link} className="btn-primary">{h.cta1_text || STATIC_HERO.cta1_text}</a>
          <a href={h.cta2_link || STATIC_HERO.cta2_link} className="btn-secondary">{h.cta2_text || STATIC_HERO.cta2_text}</a>
        </div>
      </div>

      {/* Right: portrait */}
      <div className="hero-portrait-wrap">
        <img
          src={heroPortrait}
          alt="Vinay Kulkarni"
          className="hero-portrait hero-portrait--desktop"
          loading="eager"
        />
        <img
          src={heroPortraitMob}
          alt="Vinay Kulkarni"
          className="hero-portrait hero-portrait--mobile"
          loading="eager"
        />
      </div>

      <div className="hero-scroll">
        <div className="scroll-line" />
        <span>Scroll</span>
      </div>
    </section>
  );
}

export default HeroSection;
