/* ════════════════════════════════════════════════════════════
   EVERYDAY ADVOCATES — WAITLIST BLOG TEASER
   Loads published posts from the same "blog_posts" Supabase table
   used by the main site (app.js) and shows the latest few as a
   card grid under the waitlist form, with a lightweight modal for
   reading the full post. If there are no published posts, the
   whole section stays hidden so the waitlist page looks untouched.
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const MAX_POSTS = 3;

  const section = document.getElementById('wlBlogSection');
  const grid = document.getElementById('wlBlogGrid');
  const modal = document.getElementById('wlBlogModal');
  const modalBackdrop = document.getElementById('wlBlogModalBackdrop');
  const modalClose = document.getElementById('wlBlogModalClose');
  const modalContent = document.getElementById('wlBlogModalContent');

  if (!section || !grid) return;

  let posts = [];
  let lastFocused = null;

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str === null || str === undefined ? '' : String(str);
    return d.innerHTML;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // Plain-text content → paragraphs, same convention as the main site.
  function renderRichText(text) {
    if (!text) return '';
    return text
      .split(/\n{2,}/)
      .map((para) => `<p>${escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  function renderGrid() {
    grid.innerHTML = posts.map((p) => `
      <article class="wl-blog-card" data-slug="${escapeHtml(p.slug)}" tabindex="0" role="button" aria-label="Read: ${escapeHtml(p.title)}">
        <div class="wl-blog-card-media">
          ${p.cover_image_url
            ? `<img src="${escapeHtml(p.cover_image_url)}" alt="" loading="lazy">`
            : ''}
        </div>
        <div class="wl-blog-card-body">
          <span class="wl-blog-card-date">${formatDate(p.published_at || p.created_at)}</span>
          <h3>${escapeHtml(p.title)}</h3>
          ${p.excerpt ? `<p>${escapeHtml(p.excerpt)}</p>` : ''}
          <span class="wl-blog-read-more">Read more →</span>
        </div>
      </article>
    `).join('');

    grid.querySelectorAll('.wl-blog-card').forEach((card) => {
      card.addEventListener('click', () => openPost(card.dataset.slug));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPost(card.dataset.slug);
        }
      });
    });
  }

  function openPost(slug) {
    const post = posts.find((p) => p.slug === slug);
    if (!post || !modal || !modalContent) return;

    modalContent.innerHTML = `
      ${post.cover_image_url ? `<img src="${escapeHtml(post.cover_image_url)}" alt="">` : ''}
      <span class="eyebrow">${formatDate(post.published_at || post.created_at)}${post.author_name ? ' · ' + escapeHtml(post.author_name) : ''}</span>
      <h1>${escapeHtml(post.title)}</h1>
      <div class="wl-blog-post-body">${renderRichText(post.content)}</div>
    `;

    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (modalClose) modalClose.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
  if (modalClose) modalClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
  });

  async function loadPosts() {
    if (!window.supabaseClient) return;

    const { data, error } = await window.supabaseClient
      .from('blog_posts')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(MAX_POSTS);

    if (error) {
      console.error('Failed to load blog posts for waitlist:', error);
      return;
    }

    posts = data || [];
    if (!posts.length) return; // keep the section hidden — no empty state on the waitlist page

    renderGrid();
    section.hidden = false;
  }

  loadPosts();
})();
