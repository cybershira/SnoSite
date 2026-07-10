// Nav toggle
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

toggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});

// Close nav on link click (mobile)
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    toggle.setAttribute('aria-expanded', false);
  });
});

// Benefit icon spin on hover / click — each SVG spins independently
document.querySelectorAll('.benefit-card').forEach(card => {
  const icons = card.querySelectorAll('.spin-icon');
  function spin() {
    icons.forEach(icon => {
      icon.classList.remove('spinning');
      void icon.offsetWidth;
      icon.classList.add('spinning');
    });
  }
  card.addEventListener('mouseenter', spin);
  card.addEventListener('click', spin);
  icons.forEach(icon => {
    icon.addEventListener('animationend', () => icon.classList.remove('spinning'));
  });
});

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Contact form — show success message
document.querySelector('.contact-form').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;
  form.innerHTML = `
    <div class="form-success">
      <div class="checkmark">✅</div>
      <h3>Message sent!</h3>
      <p>Thank you for reaching out. We will get back to you shortly.</p>
    </div>
  `;
});
