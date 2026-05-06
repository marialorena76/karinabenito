// ===== Shared site scripts =====

// Header scroll state
const header = document.querySelector('.site-header');
if (header) {
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Mobile nav
const menuBtn = document.querySelector('.menu-btn');
const mobileNav = document.querySelector('.mobile-nav');
const mobileClose = document.querySelector('.mobile-close');
if (menuBtn && mobileNav) {
  menuBtn.addEventListener('click', () => mobileNav.classList.add('open'));
  mobileClose && mobileClose.addEventListener('click', () => mobileNav.classList.remove('open'));
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('open')));
}

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => io.observe(el));

// Testimonial carousel
const carousel = document.querySelector('[data-carousel]');
if (carousel) {
  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(track.children);
  const prev = carousel.querySelector('.carousel-prev');
  const next = carousel.querySelector('.carousel-next');
  const dotsWrap = carousel.querySelector('.carousel-dots');
  let idx = 0;
  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    d.addEventListener('click', () => go(i));
    dotsWrap.appendChild(d);
  });
  function go(i) {
    idx = (i + slides.length) % slides.length;
    track.style.transform = `translateX(${-idx * 100}%)`;
    dotsWrap.querySelectorAll('.carousel-dot').forEach((d, j) => d.classList.toggle('active', j === idx));
  }
  prev && prev.addEventListener('click', () => go(idx - 1));
  next && next.addEventListener('click', () => go(idx + 1));
  setInterval(() => go(idx + 1), 7000);
}

// FAQ accordion
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-q');
  btn && btn.addEventListener('click', () => {
    const open = item.classList.toggle('open');
    item.querySelector('.faq-a').style.maxHeight = open ? item.querySelector('.faq-a').scrollHeight + 'px' : '0';
  });
});

// Schedule picker (mock availability)
const sp = document.querySelector('[data-day-picker]');
if (sp) {
  const track = sp.querySelector('[data-day-track]');
  const slotGrid = document.querySelector('[data-slot-grid]');
  const slotLabel = document.querySelector('[data-slot-label]');
  const dateInput = document.querySelector('[data-date-input]');
  const timeInput = document.querySelector('[data-time-input]');
  const dows = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const baseSlots = ['09:00','10:30','12:00','14:00','15:30','17:00','18:30'];
  let weekStart = new Date(); weekStart.setHours(0,0,0,0);
  let selectedDay = null;

  function fmt(d) { return `${dows[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`; }
  function isPast(d) { const t = new Date(); t.setHours(0,0,0,0); return d < t; }
  function isClosed(d) { return d.getDay() === 0; } // Sundays closed
  function slotsFor(d) {
    const dow = d.getDay();
    if (dow === 0) return [];
    // Mock: some slots randomly taken based on date
    const seed = d.getDate();
    return baseSlots.map((s, i) => ({ time: s, taken: (seed + i) % 4 === 0 }));
  }
  function renderDays() {
    track.innerHTML = '';
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'day-btn';
      const past = isPast(d), closed = isClosed(d);
      btn.disabled = past || closed;
      btn.innerHTML = `<span class="dow">${dows[d.getDay()]}</span><span class="dnum">${d.getDate()}</span><span class="dmonth">${months[d.getMonth()]}</span>`;
      if (selectedDay && d.toDateString() === selectedDay.toDateString()) btn.classList.add('active');
      btn.addEventListener('click', () => { selectedDay = d; renderDays(); renderSlots(); });
      track.appendChild(btn);
    }
  }
  function renderSlots() {
    slotGrid.innerHTML = '';
    if (!selectedDay) { slotGrid.innerHTML = '<span class="slot-empty">Elegí primero un día disponible.</span>'; slotLabel.textContent = 'Seleccioná un día'; return; }
    slotLabel.textContent = fmt(selectedDay);
    dateInput.value = selectedDay.toISOString().slice(0,10);
    const slots = slotsFor(selectedDay);
    if (!slots.length) { slotGrid.innerHTML = '<span class="slot-empty">No hay horarios disponibles este día.</span>'; return; }
    slots.forEach(s => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'slot-btn'; b.textContent = s.time; b.disabled = s.taken;
      b.addEventListener('click', () => {
        slotGrid.querySelectorAll('.slot-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active'); timeInput.value = s.time;
      });
      slotGrid.appendChild(b);
    });
  }
  sp.querySelector('[data-day-prev]').addEventListener('click', () => {
    const t = new Date(); t.setHours(0,0,0,0);
    const next = new Date(weekStart); next.setDate(weekStart.getDate() - 7);
    if (next >= t || next.getTime() + 6*86400000 >= t.getTime()) { weekStart = next; renderDays(); }
  });
  sp.querySelector('[data-day-next]').addEventListener('click', () => {
    weekStart = new Date(weekStart); weekStart.setDate(weekStart.getDate() + 7); renderDays();
  });
  renderDays();
}

// Mock contact form
const form = document.querySelector('[data-contact-form]');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!data.name || !data.email || !data.message) {
      form.querySelector('.form-status').textContent = 'Por favor completá los campos obligatorios.';
      form.querySelector('.form-status').dataset.kind = 'error';
      return;
    }
    if (!data.date || !data.time) {
      form.querySelector('.form-status').textContent = 'Elegí un día y horario para tu sesión.';
      form.querySelector('.form-status').dataset.kind = 'error';
      return;
    }
    form.querySelector('.form-status').textContent = '✓ Mensaje enviado. Te confirmo el ' + data.date + ' a las ' + data.time + ' en las próximas 24/48 h.';
    form.querySelector('.form-status').dataset.kind = 'ok';
    form.reset();
  });
}

// Subtle parallax on hero portrait
const portrait = document.querySelector('[data-parallax]');
if (portrait) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY * 0.08;
    portrait.style.transform = `translateY(${y}px)`;
  }, { passive: true });
}
