const CONFETTI_COLORS = ["#ff6b4a", "#5fb8ea", "#f5b25c", "#f3f6fb", "#0e1524"];

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return (
    document.documentElement.dataset.reducedMotion === "true" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** A short, synthesized two-note chime — no audio file to ship or fetch. */
export function playCompletionChime() {
  if (prefersReducedMotion() || typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    [523.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.09;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });

    setTimeout(() => ctx.close(), 600);
  } catch {
    // Web Audio can be blocked (autoplay policy, unsupported browser) — celebration is decorative, never worth surfacing an error for.
  }
}

/** Bursts a handful of confetti particles from a screen point, then cleans itself up. */
export function burstConfetti(origin?: { x: number; y: number }) {
  if (prefersReducedMotion() || typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = "position:fixed;inset:0;z-index:80;pointer-events:none;";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const start = origin ?? { x: window.innerWidth / 2, y: window.innerHeight * 0.35 };
  const particles = Array.from({ length: 46 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 5;
    return {
      x: start.x,
      y: start.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 4 + Math.random() * 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.4,
      life: 1,
    };
  });

  let frame: number;
  function tick() {
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    for (const p of particles) {
      p.vy += 0.15; // gravity
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      p.life -= 0.012;
      if (p.life <= 0) continue;
      alive = true;

      ctx!.save();
      ctx!.globalAlpha = Math.max(0, p.life);
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rotation);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx!.restore();
    }

    if (alive) {
      frame = requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  }
  frame = requestAnimationFrame(tick);

  setTimeout(() => {
    cancelAnimationFrame(frame);
    canvas.remove();
  }, 2500);
}

export function celebrate(origin?: { x: number; y: number }) {
  playCompletionChime();
  burstConfetti(origin);
}
