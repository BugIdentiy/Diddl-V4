'use strict';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const imageDialog = document.getElementById('image-dialog');
let previewTrigger = null;
let previousBodyOverflow = '';
const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.08, rootMargin: '0px 0px 40px 0px' }) : null;
const counterFrames = new Map();
function animateCounter(element, target) {
  if (counterFrames.has(element)) cancelAnimationFrame(counterFrames.get(element));
  const start = Number(element.dataset.previous || 0);
  element.dataset.previous = String(target);
  if (reducedMotion.matches || start === target) { element.textContent = target; return; }
  const time = performance.now();
  function tick(now) {
    const fraction = Math.min((now - time) / 650, 1);
    element.textContent = Math.round(start + (target - start) * (1 - Math.pow(1 - fraction, 3)));
    if (fraction < 1) counterFrames.set(element, requestAnimationFrame(tick));
    else counterFrames.delete(element);
  }
  counterFrames.set(element, requestAnimationFrame(tick));
}
function thumbnailUrl(url) {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && /(?:drive|docs)\.google\.com/.test(url)) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
  return url;
}
function updateCollectionOverview(rows, sheet) {
  const stock = rows.filter(row => row.stock > 0).length;
  const percent = rows.length ? Math.round(stock / rows.length * 100) : 0;
  animateCounter(document.getElementById('stat-total'), rows.length);
  animateCounter(document.getElementById('stat-instock'), stock);
  animateCounter(document.getElementById('stat-missing'), rows.length - stock);
  document.getElementById('completion-text').textContent = `${percent} % des références ${sheet} en stock · ${stock} sur ${rows.length}`;
  document.getElementById('completion-fill').style.width = `${percent}%`;
  document.querySelector('.completion-track').setAttribute('aria-valuenow', String(percent));
  if (!document.querySelector('.paper-image img')) {
    const images = rows.filter(row => row.imageUrl).slice(0, 2);
    document.querySelectorAll('.paper-image').forEach((container, index) => {
      if (!images[index]) return;
      const img = document.createElement('img');
      img.src = thumbnailUrl(images[index].imageUrl);
      img.alt = '';
      img.decoding = 'async';
      img.addEventListener('error', () => { img.remove(); container.textContent = '✿'; });
      container.replaceChildren(img);
    });
  }
}
function updateGallerySummary(total, visible, sheet) {
  document.getElementById('current-format').textContent = sheet;
  document.getElementById('gallery-summary').textContent = total === 0 ? 'Aucun résultat' : `${visible} sur ${total} feuille${total > 1 ? 's' : ''}`;
}
function decorateGallery() {
  if (revealObserver) revealObserver.disconnect();
  const cards = [...document.querySelectorAll('.diddle-card')];
  cards.forEach((card, index) => {
    card.style.setProperty('--reveal-delay', `${(index % 6) * 45}ms`);
    if (revealObserver && !reducedMotion.matches) {
      card.classList.add('reveal-pending');
      revealObserver.observe(card);
      card.addEventListener('animationend', () => {
        card.classList.remove('reveal-pending', 'is-visible');
        card.classList.add('revealed');
      }, { once: true });
    }
    const container = card.querySelector('.card-image-container');
    const img = container.querySelector('img');
    if (img) {
      img.loading = index < 6 ? 'eager' : 'lazy';
      img.decoding = 'async';
      // Request Drive thumbnails directly instead of deliberately triggering a failed uc URL first.
      const url = thumbnailUrl(img.getAttribute('src'));
      if (url !== img.getAttribute('src')) {
        img.dataset.fallback = 'true';
        img.src = url;
      }
      const button = document.createElement('button');
      button.className = container.className;
      button.type = 'button';
      button.setAttribute('aria-label', `Agrandir la feuille ${card.querySelector('.card-num').textContent}`);
      button.setAttribute('aria-haspopup', 'dialog');
      button.append(...container.childNodes);
      container.replaceWith(button);
      button.addEventListener('click', () => openImagePreview(card, button));
    }
    const caption = document.createElement('div');
    caption.className = 'card-caption';
    const format = document.createElement('span');
    format.textContent = `FORMAT ${document.getElementById('current-format').textContent}`;
    const heart = document.createElement('span');
    heart.textContent = '♡';
    heart.setAttribute('aria-hidden', 'true');
    caption.append(format, heart);
    card.append(caption);
    card.querySelectorAll('.btn-stock-adj').forEach(button => button.setAttribute('aria-label', `${button.textContent.trim() === '+' ? 'Ajouter' : 'Retirer'} une feuille ${card.querySelector('.card-num').textContent}`));
  });
}
function openImagePreview(card, trigger) {
  const img = card.querySelector('img');
  if (!img || img.style.display === 'none') return;
  previewTrigger = trigger;
  const preview = document.getElementById('preview-img');
  document.querySelector('.preview-error')?.remove();
  preview.hidden = false;
  preview.alt = img.alt;
  preview.src = img.currentSrc || img.src;
  document.getElementById('preview-title').textContent = `Feuille ${card.querySelector('.card-num').textContent} · ${document.getElementById('current-format').textContent}`;
  document.getElementById('preview-stock').textContent = card.querySelector('.stock-badge').textContent;
  if (typeof imageDialog.showModal === 'function') {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    imageDialog.showModal();
  } else window.open(preview.src, '_blank', 'noopener');
}
document.getElementById('preview-close').addEventListener('click', () => imageDialog.close());
imageDialog.addEventListener('click', event => {
  const rect = imageDialog.getBoundingClientRect();
  if (event.target === imageDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) imageDialog.close();
});
imageDialog.addEventListener('close', () => {
  document.body.style.overflow = previousBodyOverflow;
  if (previewTrigger?.isConnected) previewTrigger.focus();
});
document.getElementById('preview-img').addEventListener('error', event => {
  event.target.hidden = true;
  if (!document.querySelector('.preview-error')) {
    const message = document.createElement('p');
    message.className = 'preview-error';
    message.textContent = 'Cette image est temporairement indisponible.';
    document.querySelector('.preview-image').append(message);
  }
});
document.querySelectorAll('.filter-btn').forEach(button => button.setAttribute('aria-pressed', String(button.classList.contains('active'))));
