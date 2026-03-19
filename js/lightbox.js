/* =============================================
   Lightbox — click any gallery image to enlarge
   ============================================= */
(function () {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';

  const img = document.createElement('img');
  const closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.setAttribute('aria-label', 'Close');

  const caption = document.createElement('div');
  caption.className = 'lightbox-caption';

  overlay.appendChild(closeBtn);
  overlay.appendChild(img);
  overlay.appendChild(caption);
  document.body.appendChild(overlay);

  // Close handlers
  function close() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', function (e) {
    if (e.target === img) return; // don't close when clicking the image itself
    close();
  });

  closeBtn.addEventListener('click', close);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });

  // Attach to all gallery images
  document.querySelectorAll('.gallery-item').forEach(function (item) {
    const itemImg = item.querySelector('img');
    if (!itemImg) return;

    item.addEventListener('click', function (e) {
      e.preventDefault();
      img.src = itemImg.src;
      img.alt = itemImg.alt || '';

      // Get caption text
      const fig = item.querySelector('figcaption');
      caption.textContent = fig ? fig.textContent : (itemImg.alt || '');

      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });
})();
