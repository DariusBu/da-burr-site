// Active nav highlight
document.addEventListener('DOMContentLoaded', () => {
  // Get the current page filename (e.g., "index.html")
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  
  // Select all navigation links
  const navLinks = document.querySelectorAll('nav a');
  
  navLinks.forEach(link => {
      // Remove existing active classes just in case
      link.classList.remove('active');
      link.removeAttribute('aria-current');

      // If the link's href matches the current page, highlight it
      if (link.getAttribute('href') === currentPage) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
      }
  });
});
  
  // Countdown timers
  function updateCountdowns() {
    const now = new Date();
    const appDeadline = new Date('2026-09-01T23:59:59');
    const eventStart  = new Date('2027-02-15T09:00:00');
    const eventEnd    = new Date('2027-03-06T18:00:00');
  
    // Application deadline
    const appBox = document.getElementById('countdown-apply');
    if (appBox) {
      const diff = appDeadline - now;
      if (diff > 0) {
        renderDigits(appBox, diff);
        const s = appBox.querySelector('.countdown-status');
        if (s) s.textContent = 'Applications open — apply now!';
      } else {
        appBox.querySelector('.countdown-digits').innerHTML = '<span style="color:rgba(255,255,255,0.4);font-size:var(--text-sm)">Deadline passed</span>';
        const s = appBox.querySelector('.countdown-status');
        if (s) { const d = Math.floor((now - appDeadline)/86400000); s.textContent = d === 0 ? 'Applications closed today.' : `Applications closed ${d} day${d>1?'s':''} ago.`; s.style.color='#ED2024'; }
      }
    }
  
    // Event countdown
    const eventBox = document.getElementById('countdown-event');
    if (eventBox) {
      const diffStart = eventStart - now;
      const diffEnd   = eventEnd - now;
      const digits    = eventBox.querySelector('.countdown-digits');
      const status    = eventBox.querySelector('.countdown-status');
      if (diffStart > 0) {
        renderDigits(eventBox, diffStart);
        if (status) status.textContent = 'Until GoEMMI 2027 begins';
      } else if (diffEnd > 0) {
        const dayNum = Math.floor((now - eventStart)/86400000) + 1;
        if (digits) digits.innerHTML = `<div class="countdown-unit"><span class="countdown-num" style="color:var(--green-light)">${dayNum}</span><span class="countdown-label">Day of Event</span></div>`;
        if (status) { status.textContent = '🎉 GoEMMI 2027 is happening right now!'; status.style.color='#a2c67b'; }
      } else {
        if (digits) digits.innerHTML = '<span style="color:rgba(255,255,255,0.4);font-size:var(--text-sm)">Event concluded</span>';
        if (status) { const d = Math.floor((now - eventEnd)/86400000); status.textContent = `GoEMMI 2027 ended ${d} day${d!==1?'s':''} ago.`; status.style.color='#ED2024'; }
      }
    }
  }
  
  function renderDigits(box, ms) {
    const days    = Math.floor(ms/86400000);
    const hours   = Math.floor((ms%86400000)/3600000);
    const minutes = Math.floor((ms%3600000)/60000);
    const seconds = Math.floor((ms%60000)/1000);
    const digits  = box.querySelector('.countdown-digits');
    if (!digits) return;
    const pad = n => String(n).padStart(2,'0');
    digits.innerHTML = `
      <div class="countdown-unit"><span class="countdown-num">${pad(days)}</span><span class="countdown-label">Days</span></div>
      <span class="countdown-sep">:</span>
      <div class="countdown-unit"><span class="countdown-num">${pad(hours)}</span><span class="countdown-label">Hours</span></div>
      <span class="countdown-sep">:</span>
      <div class="countdown-unit"><span class="countdown-num">${pad(minutes)}</span><span class="countdown-label">Min</span></div>
      <span class="countdown-sep">:</span>
      <div class="countdown-unit"><span class="countdown-num">${pad(seconds)}</span><span class="countdown-label">Sec</span></div>`;
  }
  
  if (document.getElementById('countdown-apply') || document.getElementById('countdown-event')) {
    updateCountdowns();
    setInterval(updateCountdowns, 1000);
  }

  // schedule-page — Week 1 / Week 2 tab switcher
(function () {
  var tabs   = document.querySelectorAll('.week-tab');
  var panels = document.querySelectorAll('.week-panel');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(function (p) { p.hidden = true; });

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      var target = document.getElementById(tab.getAttribute('aria-controls'));
      if (target) { target.hidden = false; }
    });
  });
})();