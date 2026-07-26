/* ════════════════════════════════════════════════════════════
   EVERYDAY ADVOCATES — WAITLIST PAGE SCRIPT
   Handles: theme toggle, live countdown to launch, and the
   waitlist email form (saved to Supabase "waitlist_signups").
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Theme ── */
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const THEME_KEY = 'ea-theme';

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) themeToggle.setAttribute('aria-pressed', theme === 'dark');
  }
  // Default theme is dark. Only override if the visitor has
  // explicitly chosen a theme before (via the toggle).
  const savedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(savedTheme || 'dark');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  /* ── Countdown to launch: October 2, 2026, 00:00 local time ── */
  const LAUNCH_DATE = new Date('2026-10-02T00:00:00');

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now = new Date();
    let diff = LAUNCH_DATE.getTime() - now.getTime();

    if (diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minsEl.textContent = '00';
      secsEl.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    const mins = Math.floor(diff / (1000 * 60));
    diff -= mins * (1000 * 60);
    const secs = Math.floor(diff / 1000);

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minsEl.textContent = pad(mins);
    secsEl.textContent = pad(secs);
  }

  tick();
  setInterval(tick, 1000);

  /* ── Waitlist form → Supabase ── */
  const form = document.getElementById('waitlistForm');
  const submitBtn = document.getElementById('wlSubmitBtn');
  const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
  const btnLoading = submitBtn ? submitBtn.querySelector('.btn-loading') : null;
  const messageEl = document.getElementById('wlMessage');
  const emailInput = document.getElementById('wlEmail');

  function showMessage(text, type) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.className = 'wl-message visible ' + type;
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      if (!email || !form.checkValidity()) {
        form.reportValidity();
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnLoading) btnLoading.style.display = 'inline';

      try {
        if (!window.supabaseClient) throw new Error('Supabase not configured');

        const { error } = await window.supabaseClient
          .from('waitlist_signups')
          .insert([{ email }]);

        // Treat a duplicate email as a friendly success, not an error
        if (error && error.code !== '23505') throw error;

        form.reset();
        showMessage('You\u2019re on the list! We\u2019ll email you the moment we launch.', 'success');
      } catch (err) {
        console.error('Waitlist signup failed:', err);
        showMessage('Something went wrong — please try again in a moment.', 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
      }
    });
  }
})();