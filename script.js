/* =============================================
   Christine Jung Portfolio — script.js
   ============================================= */

/* ── 1. Nav: frosted glass on scroll ── */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ── 2. Mobile nav toggle ── */
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle?.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', open);
});

// Close mobile nav when any link is clicked
navLinks?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ── 3. Project filter ── */
const filterBtns   = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

/**
 * Show/hide cards and reassign the featured (wide) class
 * to the first visible card of the active filter.
 */
function applyFilter(filter) {
  // Reset featured class on all cards
  projectCards.forEach(card => card.classList.remove('card-featured'));

  let firstVisible = true;

  projectCards.forEach((card, idx) => {
    const match = filter === 'all' || card.dataset.category === filter;

    if (match) {
      card.classList.remove('hidden');
      // Stagger the reveal animation
      setTimeout(() => card.classList.add('visible'), idx * 55);

      // Give the first visible card the wide span
      if (firstVisible) {
        card.classList.add('card-featured');
        firstVisible = false;
      }
    } else {
      card.classList.remove('visible');
      // Small delay so fade-out plays before display:none
      setTimeout(() => card.classList.add('hidden'), 200);
    }
  });
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilter(btn.dataset.filter);
  });
});

/* ── 4. Scroll reveal (IntersectionObserver) ── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.07 });

// Observe project cards (staggered via CSS transition-delay)
projectCards.forEach((card, i) => {
  card.style.transitionDelay = `${i * 55}ms`;
  revealObserver.observe(card);
});

// Observe generic fade-in elements
document.querySelectorAll('.fade-in').forEach((el, i) => {
  el.style.transitionDelay = `${i * 100}ms`;
  revealObserver.observe(el);
});

/* ── 5. Smooth scroll for anchor links ── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-h')) || 64;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ── 6. Resume link placeholder ── */
// Update these href values once you have a hosted resume PDF
const resumeLinks = document.querySelectorAll('#resumeLink, #aboutResumeLink');
resumeLinks.forEach(link => {
  link.setAttribute('href', 'Christine_Jung_Resume.pdf');
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener');
});
