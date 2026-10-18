// Keep off-screen and filtered-out videos from competing with visible previews.
(() => {
  const load = video => {
    if (!video.dataset.src) return;
    video.src = video.dataset.src;
    delete video.dataset.src;
    video.load();
  };
  const play = video => {
    load(video);
    video.play().catch(() => {}); // Autoplay may be disabled by the browser.
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target: video, isIntersecting }) => {
      if (isIntersecting) play(video);
      else video.pause();
    });
  }, { rootMargin: '150px 0px', threshold: 0.01 });
  document.querySelectorAll('video.card-img').forEach(video => observer.observe(video));

  document.querySelectorAll('.card-link').forEach(link => {
    const video = link.querySelector('video.card-img-hover');
    if (!video) return;
    const stop = () => {
      video.pause();
      if (video.readyState) video.currentTime = 0;
    };
    link.addEventListener('mouseenter', () => play(video));
    link.addEventListener('mouseleave', stop);
    link.addEventListener('focusin', () => play(video));
    link.addEventListener('focusout', stop);
    new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) stop();
    }).observe(link);
  });
})();
