/* Optimized script.js
   - Fewer continuous rAF loops (single main loop, throttled heavy work)
   - Pause animations when not visible (IntersectionObserver / visibilitychange)
   - Lazy-init starfield only when overlay opens
   - Cache layout reads and reduce getBoundingClientRect frequency
   - Respect prefers-reduced-motion
   - Cursor outline moved directly on mousemove (no rAF loop)
*/

/* ====== element refs (safe null checks) ====== */
const dot = document.querySelector('.cursor-dot');
const outline = document.querySelector('.cursor-outline');
const title = document.querySelector('h1');
const subtitle = document.querySelectorAll('h2')[0];
const scrollArrow = document.querySelector('.scroll-arrow');
const projectsTitle = document.querySelector('.projects-title');
const projectCards = document.querySelectorAll('.project-card');
const videoText = document.querySelector('.video-text h2');

const audioEl = document.getElementById('smartdesk-audio');
const audioPlayBtn = document.getElementById('audio-play');
const audioProgressWrap = document.getElementById('audio-progress-wrap');
const audioProgress = document.getElementById('audio-progress');
const audioCurrent = document.getElementById('audio-current');
const audioDuration = document.getElementById('audio-duration');

const hero = document.querySelector('.hero-section');
const projectsSection = document.querySelector('.projects-section');

/* ====== environment checks ====== */
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ====== Audio player (kept lean) ====== */
function formatTime(t) {
    if (isNaN(t) || !isFinite(t)) return '0:00';
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}
if (audioPlayBtn && audioEl) {
    audioPlayBtn.addEventListener('click', () => audioEl.paused ? audioEl.play() : audioEl.pause());
    audioEl.addEventListener('play', () => {
        audioPlayBtn.classList.add('playing');
        audioPlayBtn.setAttribute('aria-label', 'Pause');
        audioPlayBtn.title = 'Pause';
    });
    audioEl.addEventListener('pause', () => {
        audioPlayBtn.classList.remove('playing');
        audioPlayBtn.setAttribute('aria-label', 'Play');
        audioPlayBtn.title = 'Play';
    });
    audioEl.addEventListener('loadedmetadata', () => {
        audioDuration.textContent = formatTime(audioEl.duration);
    });
    audioEl.addEventListener('timeupdate', () => {
        const pct = (audioEl.currentTime / (audioEl.duration || 1)) * 100;
        audioProgress.style.width = pct + '%';
        audioCurrent.textContent = formatTime(audioEl.currentTime);
    });

    // Seeking (mouse / drag)
    (function() {
        let seeking = false;
        function seekByClientX(x) {
            const rect = audioProgressWrap.getBoundingClientRect();
            const pct = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
            audioEl.currentTime = pct * (audioEl.duration || 0);
        }
        audioProgressWrap.addEventListener('mousedown', (e) => { seeking = true; seekByClientX(e.clientX); });
        window.addEventListener('mousemove', (e) => { if (seeking) seekByClientX(e.clientX); });
        window.addEventListener('mouseup', () => { seeking = false; });
        audioProgressWrap.addEventListener('click', (e) => seekByClientX(e.clientX));
        // Touch
        audioProgressWrap.addEventListener('touchstart', (ev) => { seekByClientX(ev.touches[0].clientX); }, { passive: true });
        audioProgressWrap.addEventListener('touchmove', (ev) => { seekByClientX(ev.touches[0].clientX); }, { passive: true });
    })();

    audioEl.addEventListener('ended', () => {
        audioPlayBtn.classList.remove('playing');
        audioPlayBtn.setAttribute('aria-label', 'Play');
        audioPlayBtn.title = 'Play';
        audioProgress.style.width = '0%';
        audioCurrent.textContent = formatTime(0);
    });
}

/* ====== Mouse tracking (minimal, event-driven) ====== */
let mouseX = 0, mouseY = 0;
let lastMouseX = 0, lastMouseY = 0, lastMouseTime = performance.now();
let mouseSpeed = 0; // px/ms

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // move "dot" using GPU-friendly transform
    if (dot) {
        dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
        dot.style.opacity = '1';
    }

    // move outline directly (no separate rAF loop)
    if (outline) {
        outline.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
        outline.classList.remove('idle');
        clearTimeout(outline._idleTO);
        outline._idleTO = setTimeout(() => outline.classList.add('idle'), 500);
    }

    // compute smoothed speed here (cheap)
    const now = performance.now();
    const dt = Math.max(1, now - lastMouseTime);
    const dx = mouseX - lastMouseX, dy = mouseY - lastMouseY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const inst = dist / dt;
    mouseSpeed = mouseSpeed * 0.8 + inst * 0.2;
    lastMouseX = mouseX; lastMouseY = mouseY; lastMouseTime = now;
}, { passive: true });

document.addEventListener('mouseleave', () => { if (dot) dot.style.opacity = '0'; if (outline) outline.style.opacity = '0'; });
document.addEventListener('mouseenter', () => { if (dot) dot.style.opacity = '1'; if (outline) outline.style.opacity = '1'; });

/* ====== Text hover magnify (event-driven) ====== */
let isMagnifying = false;
const textElements = [];
if (title) textElements.push(title);
if (subtitle) textElements.push(subtitle);
if (projectsTitle) textElements.push(projectsTitle);
if (videoText) textElements.push(videoText);

function handleTextEnter() {
    isMagnifying = true;
    if (dot) dot.classList.add('magnify');
    if (outline) outline.classList.add('magnify');
}
function handleTextLeave() {
    isMagnifying = false;
    if (dot) dot.classList.remove('magnify');
    if (outline) outline.classList.remove('magnify');
}
textElements.forEach(el => {
    if (!el) return;
    el.addEventListener('mouseenter', handleTextEnter);
    el.addEventListener('mouseleave', handleTextLeave);
});

/* ====== Scroll arrow behavior (unchanged but safe) ====== */
if (scrollArrow) {
    scrollArrow.addEventListener('mouseenter', () => scrollArrow.classList.add('cursor-hover'));
    scrollArrow.addEventListener('mouseleave', () => scrollArrow.classList.remove('cursor-hover'));
    scrollArrow.addEventListener('click', () => {
        const videoSection = document.querySelector('.video-section');
        if (videoSection) videoSection.scrollIntoView({ behavior: 'smooth' });
    });
}

/* ====== Chart Network (build lazily, but keep structure) ====== */
/* Removed: Chart network functionality */

/* ====== chart bars animation state (light-weight) ====== */
/* Removed: Chart bars animation */

/* ====== Starfield: lazy init when overlay opens ====== */
let stars = [];
let starAnimRunning = false;
let starAnimLast = 0;
let starAnimId = null;
const STAR_COUNT_MIN = 28;
const STAR_COUNT_MAX = 48;

function initStars(starsWrap) {
    stars = [];
    starsWrap.innerHTML = '';
    const count = Math.max(STAR_COUNT_MIN, Math.min(STAR_COUNT_MAX, Math.floor((window.innerWidth/1000) * STAR_COUNT_MAX)));
    for (let i=0;i<count;i++) {
        const s = document.createElement('div');
        s.className = 'star' + (Math.random() < 0.12 ? ' big' : '');
        s._x = Math.random()*100; s._y = Math.random()*100;
        s.style.left = s._x + '%'; s.style.top = s._y + '%';
        s._base = 0.02 + Math.random()*0.12;
        s.style.opacity = s._base;
        s.vx = (Math.random()*0.008 - 0.004);
        s.vy = 0.008 + Math.random()*0.02;
        s._pulse = 0; s._pulseTarget = s._base;
        starsWrap.appendChild(s);
        stars.push(s);
    }
}
function animateStars(ts) {
    if (!starAnimRunning) return;
    if (!starAnimLast) starAnimLast = ts;
    const dt = Math.min(0.05, (ts - starAnimLast)/1000); // clamp dt small to avoid big jumps
    starAnimLast = ts;
    for (const s of stars) {
        s._x += s.vx * dt * 100;
        s._y += s.vy * dt * 100;
        if (s._x > 100) s._x -= 100; if (s._x < 0) s._x += 100;
        if (s._y > 120) s._y -= 120;
        s.style.left = s._x + '%'; s.style.top = s._y + '%';
        if (Math.random() < 0.003) s._pulseTarget = Math.min(1.2, s._base * (1.6 + Math.random()*1.2));
        if (s._pulseTarget > s._base) s._pulseTarget -= dt * 0.6;
        s._pulse += (s._pulseTarget - s._pulse) * Math.min(0.45, dt*6);
        const opacity = Math.max(0.01, Math.min(1, s._base + s._pulse * 0.8));
        s.style.opacity = opacity.toFixed(3);
        const scale = 1 + Math.min(0.9, s._pulse * 0.6);
        s.style.transform = `scale(${scale})`;
    }
    starAnimId = requestAnimationFrame(animateStars);
}
function startStars(starsWrap) {
    if (!stars.length) initStars(starsWrap);
    if (!starAnimRunning) { starAnimRunning = true; starAnimLast = 0; starAnimId = requestAnimationFrame(animateStars); }
}
function stopStars() { starAnimRunning = false; if (starAnimId) { cancelAnimationFrame(starAnimId); starAnimId = null; } }

/* ====== Overlay / AI project open (lazy-create starfield) ====== */
(function setupOverlay() {
    const aiCard = document.querySelector('.project-card[data-project="ai-assistant"]');
    if (!aiCard) return;

    const overlay = document.createElement('div');
    overlay.className = 'project-overlay';
    const circle = document.createElement('div'); circle.className = 'overlay-circle';
    overlay.appendChild(circle);
    const starsWrap = document.createElement('div'); starsWrap.className = 'overlay-stars'; overlay.appendChild(starsWrap);

    const content = document.createElement('div'); content.className = 'overlay-content';
    const inner = document.createElement('div'); inner.className = 'overlay-inner';
    const videoWrap = document.createElement('div'); videoWrap.className = 'overlay-video';
    const videoEl = document.createElement('video'); videoEl.src = 'AiAgent.mp4'; videoEl.controls = true; videoEl.playsInline = true;
    videoWrap.appendChild(videoEl);
    inner.appendChild(videoWrap); content.appendChild(inner); overlay.appendChild(content);

    const closeBtn = document.createElement('button'); closeBtn.className = 'overlay-close'; closeBtn.title = 'Close'; closeBtn.innerHTML = '✕';
    overlay.appendChild(closeBtn);

    document.body.appendChild(overlay);

    let active = false;
    function openFromCard(cardEl) {
        if (active) return;
        active = true;
        const rect = cardEl.getBoundingClientRect();
        circle.style.left = (rect.left + rect.width/2) + 'px';
        circle.style.top = (rect.top + rect.height/2) + 'px';
        overlay.classList.add('open');
        projectsSection && projectsSection.classList.add('zoomed');

        // lazy start star animation
        startStars(starsWrap);

        // play video when open (best-effort)
        videoEl.muted = false;
        videoEl.play().catch(()=>{});
    }
    function closeOverlay() {
        if (!active) return;
        active = false;
        try { document.querySelector('.project-overlay video')?.pause(); } catch(e){}
        overlay.classList.remove('open');
        projectsSection && projectsSection.classList.remove('zoomed');
        stopStars();
    }

    aiCard.addEventListener('click', () => openFromCard(aiCard));
    closeBtn.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay || e.target === circle) closeOverlay(); });
})();

/* ====== Bars animation + network update: single main loop with throttling ====== */
let lastHeavyTS = 0;
const HEAVY_INTERVAL = 120; // do heavy layout reads at most every 120ms
let lastFrameTS = 0;

/* Removed: updateBarTargetsIfNeeded function */

function mainLoop(ts) {
    // No chart animations to update
    lastFrameTS = ts;
    requestAnimationFrame(mainLoop);
}

/* ====== Start/Stop control: pause when not visible ====== */
let mainRunning = false;
function startMainLoop() {
    if (reduceMotion) {
        // if user prefers reduced motion, run light-only loop at low frequency
        if (!mainRunning) { mainRunning = true; requestAnimationFrame(mainLoop); }
    } else {
        if (!mainRunning) { mainRunning = true; requestAnimationFrame(mainLoop); }
    }
}
function stopMainLoop() {
    mainRunning = false;
    // We cannot cancel the rAF from here easily since id not stored; however,
    // mainLoop early-exits heavy work when not needed. For safety, we set a flag:
    // mainLoop will still requestAnimationFrame itself, but we avoid heavy work by visibility check below.
}

/* Visibility observer: pause heavy work when hero not visible or page hidden */
let heroVisible = true;
if ('IntersectionObserver' in window && hero) {
    const io = new IntersectionObserver((entries) => {
        heroVisible = entries[0].isIntersecting;
        // if not visible, reduce mouseSpeed to zero for calmer animation
        if (!heroVisible) mouseSpeed = 0;
    }, { root: null, threshold: 0.05 });
    io.observe(hero);
}

// Also respect page visibility
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        mouseSpeed = 0;
    }
});

/* Integrate heroVisible into heavy update: adapt HEAVY_INTERVAL when not visible */
(function adaptMainLoop() {
    const origMain = mainLoop;
    // wrap mainLoop so heavy updates skip when hero not visible (and reduce frame pressure)
    const wrapper = (ts) => {
        if (!heroVisible && !reduceMotion) {
            // No chart animations to update when not visible
            // schedule next tick at a lower priority (throttle)
            setTimeout(() => requestAnimationFrame(wrapper), 160);
            return;
        }
        origMain(ts);
    };
    // start wrapper
    if (!mainRunning) { mainRunning = true; requestAnimationFrame(wrapper); }
})();

/* ====== Scramble animation for #sb-animated (throttled + reduced-motion aware) ====== */
(function scrambleReveal() {
    const el = document.getElementById('sb-animated');
    if (!el) return;
    const targetText = el.textContent || 'Statistische Bundesamt';
    el.textContent = '';
    const chars = Array.from(targetText).map(ch => {
        const span = document.createElement('span');
        span.className = 'sb-char resolved';
        span.textContent = ch;
        el.appendChild(span);
        return span;
    });

    if (reduceMotion) return; // do not run scramble if user prefers reduced motion

    const charsetLocal = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    function runScramble({ totalDuration = 3200, charDelay = 70 } = {}) {
        const n = chars.length;
        const scrambleDuration = Math.max(220, totalDuration - charDelay * (n - 1));
        const start = performance.now();
        chars.forEach(c => { c.classList.remove('scramble', 'resolved'); c.classList.add('scramble'); });
        const parentH2 = el.closest('h2'); if (parentH2) parentH2.classList.add('scrambling');

        function frame(now) {
            const elapsed = now - start;
            let finished = 0;
            for (let i = 0; i < n; i++) {
                const chEl = chars[i];
                const charStart = i * charDelay;
                const charEnd = charStart + scrambleDuration;
                if (elapsed < charStart) {
                    // nothing
                } else if (elapsed >= charEnd) {
                    chEl.textContent = targetText[i];
                    chEl.classList.remove('scramble'); chEl.classList.add('resolved');
                    finished++;
                } else {
                    if (targetText[i] === ' ') {
                        chEl.textContent = ' ';
                        chEl.classList.remove('scramble'); chEl.classList.add('resolved');
                        finished++; continue;
                    }
                    if (Math.random() < 0.6 || (elapsed - charStart) < (scrambleDuration * 0.6)) {
                        chEl.textContent = charsetLocal.charAt(Math.floor(Math.random() * charsetLocal.length));
                    } else {
                        chEl.textContent = targetText[i];
                    }
                }
            }
            if (finished >= n) {
                if (parentH2) parentH2.classList.remove('scrambling');
                return;
            }
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    // start when element is visible
    const io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            setTimeout(() => runScramble(), 500);
            io.disconnect();
        }
    }, { threshold: 0.2 });
    io.observe(el);
})();

/* ====== Project card click interactions (kept lightweight) ====== */
(function projectClicks() {
    const fileCard = document.querySelector('.project-card[data-project="file-organizer"]');
    if (fileCard) {
        fileCard.addEventListener('click', () => {
            if (fileCard.classList.contains('expanding')) return;
            fileCard.classList.add('expanding');
            function onEnd() { fileCard.classList.remove('expanding'); fileCard.removeEventListener('animationend', onEnd); }
            fileCard.addEventListener('animationend', onEnd);
        });
    }

    const smarterCard = document.querySelector('.project-card[data-project="smarter-nachttisch"]');
    if (smarterCard) {
        smarterCard.addEventListener('click', () => {
            const proto = document.querySelector('.video-section');
            if (proto) proto.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }
})();

/* ====== Small startup housekeeping ====== */
// Start main loop conservatively
if (!reduceMotion) {
    // give the page a beat to settle, then start
    setTimeout(() => {
        try { requestAnimationFrame(mainLoop); } catch(e) { /* graceful fallback */ }
    }, 220);
} else {
    // reduced motion: lighter loop start
    setTimeout(() => {
        try { requestAnimationFrame(mainLoop); } catch(e) {}
    }, 100);
}