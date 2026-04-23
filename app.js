/**
 * Secure Social Manager - Application JavaScript
 * Handles page navigation, form interactions, and UI state management
 */

// ========================================
// Toast Notifications
// ========================================
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

// ========================================
// DOM Elements
// ========================================
const pages = {
  login:         document.getElementById('page-login'),
  register:      document.getElementById('page-register'),
  '2fa-setup':   document.getElementById('page-2fa-setup'),
  '2fa-verify':  document.getElementById('page-2fa-verify'),
  app:           document.getElementById('app-layout')
};

const sections = {
  dashboard:    document.getElementById('section-dashboard'),
  'create-post':document.getElementById('section-create-post'),
  analytics:    document.getElementById('section-analytics'),
  settings:     document.getElementById('section-settings'),
  admin:        document.getElementById('section-admin')
};

const pageTitle = document.getElementById('page-title');

// ========================================
// Page Navigation - Auth Pages
// ========================================
function showPage(pageName) {
  Object.values(pages).forEach(page => page.classList.add('hidden'));

  if (pages[pageName]) {
    pages[pageName].classList.remove('hidden');
  }
}

function formatCount(n, useK) {
  if (useK && n >= 1000) {
    const k = n / 1000;
    return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + 'K';
  }
  return Math.round(n).toString();
}

function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  if (isNaN(target)) return;
  const useK = el.dataset.format === 'k' || target >= 1000;
  const duration = 1200;
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
    el.textContent = formatCount(target * e, useK);
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = formatCount(target, useK);
  }
  el.textContent = formatCount(0, useK);
  requestAnimationFrame(step);
}

function runCountersIn(section) {
  if (!section) return;
  section.querySelectorAll('[data-count]').forEach(animateCount);
}

function showSection(sectionName) {
  Object.values(sections).forEach(section => section.classList.add('hidden'));

  const section = sections[sectionName];
  if (section) {
    section.classList.remove('hidden');
    runCountersIn(section);
  }

  // Update active nav item
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === sectionName) {
      item.classList.add('active');
    }
  });

  // Update page title
  const titles = {
    dashboard: 'Dashboard',
    'create-post': 'Create Post',
    analytics: 'Analytics',
    settings: 'Settings'
  };

  pageTitle.textContent = titles[sectionName] || 'Dashboard';
}

// ========================================
// Password Visibility Toggle
// ========================================
document.querySelectorAll('.password-toggle').forEach(btn => {
  const eyeOpen = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const eyeOff  = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.innerHTML = isHidden ? eyeOff : eyeOpen;
  });
});

// ========================================
// Password Strength Meter
// ========================================
document.getElementById('register-password')?.addEventListener('input', (e) => {
  const val = e.target.value;
  const meter = document.getElementById('strength-meter');
  const label = document.getElementById('strength-label');
  const bars = [
    document.getElementById('sb1'),
    document.getElementById('sb2'),
    document.getElementById('sb3'),
    document.getElementById('sb4'),
  ];

  meter.style.display = val ? 'block' : 'none';

  let score = 0;
  if (val.length >= 8)           score++;
  if (/[A-Z]/.test(val))         score++;
  if (/[0-9]/.test(val))         score++;
  if (/[^A-Za-z0-9]/.test(val))  score++;

  const config = [
    null,
    { color: 'var(--color-danger)',  text: 'Weak' },
    { color: 'var(--color-warning)', text: 'Fair' },
    { color: '#3B82F6',              text: 'Good' },
    { color: 'var(--color-success)', text: 'Strong' },
  ];

  bars.forEach((bar, i) => {
    bar.style.background = i < score ? config[score].color : 'var(--color-gray-200)';
  });

  label.textContent = score ? `Password strength: ${config[score].text}` : '';
  label.style.color = score ? config[score].color : 'var(--color-gray-500)';
});

// ========================================
// Auth Navigation Links
// ========================================
document.getElementById('go-to-register')?.addEventListener('click', (e) => {
  e.preventDefault();
  showPage('register');
});

document.getElementById('go-to-login')?.addEventListener('click', (e) => {
  e.preventDefault();
  showPage('login');
});

// ========================================
// Auth Storage (localStorage, SHA-256 hashed passwords)
// ========================================
const USERS_KEY = 'ssm_users';
const SESSION_KEY = 'ssm_session';

// Hardcoded admin email — seeded on first load
const ADMIN_EMAIL    = 'admin@ssm.uz';
const ADMIN_PASSWORD = 'admin123';

function isAdmin(email) { return (email || '').toLowerCase() === ADMIN_EMAIL; }

async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function loadUsers() { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); }
function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

// Session persistence:
//   - sessionStorage → survives reload, dies on tab close
//   - localStorage   → survives tab close too (used when "Remember me" is on)
function setSession(email, remember) {
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  store.setItem(SESSION_KEY, email);
  other.removeItem(SESSION_KEY);
}
function getSession() {
  return sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY) || null;
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}

// Form-level error UI helpers
function shakeForm(formId) {
  const f = document.getElementById(formId);
  if (!f) return;
  f.classList.remove('form-shake');
  void f.offsetWidth;                // restart animation
  f.classList.add('form-shake');
}
function setFieldError(inputId, msg) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.closest('.form-group')?.classList.add('has-error');
  let err = input.closest('.form-group')?.querySelector('.field-error');
  if (!err) {
    err = document.createElement('div');
    err.className = 'field-error';
    input.closest('.form-group')?.appendChild(err);
  }
  err.textContent = msg;
}
function clearFieldErrors(formId) {
  document.querySelectorAll(`#${formId} .form-group.has-error`).forEach(g => {
    g.classList.remove('has-error');
    g.querySelector('.field-error')?.remove();
  });
}

// ========================================
// 2FA pending login state (between password-OK and passphrase-OK)
// ========================================
let pending2FAEmail = null;

// ========================================
// Login Form — verifies against registered users
// ========================================
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors('login-form');

  const email    = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return;

  const users = loadUsers();
  const user  = users[email];

  if (!user) {
    setFieldError('login-email', 'Bu email bilan ro\'yxatdan o\'tilmagan');
    shakeForm('login-form');
    showToast('Avval ro\'yxatdan o\'ting', 'error');
    return;
  }

  const hash = await sha256(password);
  if (hash !== user.passwordHash) {
    setFieldError('login-password', 'Parol noto\'g\'ri');
    shakeForm('login-form');
    showToast('Email yoki parol noto\'g\'ri', 'error');
    return;
  }

  // If user has 2FA set, go to verify page
  if (user.passphraseHash) {
    pending2FAEmail = email;
    document.getElementById('twofa-verify-pass').value = '';
    document.getElementById('twofa-hint-box').classList.add('hidden');
    document.getElementById('twofa-show-hint').style.display = '';
    showPage('2fa-verify');
    setTimeout(() => document.getElementById('twofa-verify-pass').focus(), 100);
    return;
  }

  // No 2FA — go straight to app
  const remember = document.getElementById('remember-me')?.checked;
  setSession(email, !!remember);
  addAndSwitchAccount(user.name, email);
  showPage('app');
  showSection('dashboard');
  showToast(`Xush kelibsiz, ${user.name.split(' ')[0]}!`, 'success');
});

// ========================================
// Register Form — creates account, rejects duplicates
// ========================================
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors('register-form');

  const name     = document.getElementById('register-name').value.trim();
  const email    = document.getElementById('register-email').value.trim().toLowerCase();
  const password = document.getElementById('register-password').value;
  if (!email || !password) return;

  if (password.length < 6) {
    setFieldError('register-password', 'Parol kamida 6 ta belgi bo\'lishi kerak');
    shakeForm('register-form');
    return;
  }

  const users = loadUsers();
  if (users[email]) {
    setFieldError('register-email', 'Bu email allaqachon ro\'yxatdan o\'tgan');
    shakeForm('register-form');
    showToast('Email band — kirish tugmasini bosing', 'error');
    return;
  }

  const displayName   = name || email.split('@')[0];
  const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

  users[email] = {
    name:         formattedName,
    passwordHash: await sha256(password),
    created_at:   Date.now(),
  };
  saveUsers(users);

  // Go to 2FA setup instead of dashboard directly
  pending2FAEmail = email;
  document.getElementById('twofa-pass').value = '';
  document.getElementById('twofa-hint').value = '';
  showPage('2fa-setup');
  showToast('Akkaunt yaratildi — endi 2FA sozlang', 'success');
});

// ========================================
// 2FA Setup Form — save passphrase + hint
// ========================================
document.getElementById('twofa-setup-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors('twofa-setup-form');

  const passphrase = document.getElementById('twofa-pass').value;
  const hint       = document.getElementById('twofa-hint').value.trim();

  if (passphrase.length < 4) {
    setFieldError('twofa-pass', 'Kamida 4 ta belgi');
    shakeForm('twofa-setup-form');
    return;
  }
  if (!hint) {
    setFieldError('twofa-hint', 'Kalit so\'z kerak');
    shakeForm('twofa-setup-form');
    return;
  }
  if (!pending2FAEmail) {
    showPage('login');
    return;
  }

  const users = loadUsers();
  const user  = users[pending2FAEmail];
  if (!user) {
    showPage('login');
    return;
  }

  user.passphraseHash = await sha256(passphrase);
  user.passphraseHint = hint;    // plain text — just a reminder
  saveUsers(users);

  const remember = document.getElementById('remember-me')?.checked;
  setSession(pending2FAEmail, !!remember);
  addAndSwitchAccount(user.name, pending2FAEmail);
  pending2FAEmail = null;
  showPage('app');
  showSection('dashboard');
  showToast('2FA yoqildi — akkaunt himoyalangan 🛡️', 'success');
});

// ========================================
// 2FA Verify Form — check passphrase
// ========================================
document.getElementById('twofa-verify-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFieldErrors('twofa-verify-form');

  if (!pending2FAEmail) {
    showPage('login');
    return;
  }

  const passphrase = document.getElementById('twofa-verify-pass').value;
  const users = loadUsers();
  const user  = users[pending2FAEmail];
  if (!user || !user.passphraseHash) {
    pending2FAEmail = null;
    showPage('login');
    return;
  }

  const hash = await sha256(passphrase);
  if (hash !== user.passphraseHash) {
    setFieldError('twofa-verify-pass', 'Parol noto\'g\'ri — login sahifasiga qaytasiz');
    shakeForm('twofa-verify-form');
    showToast('Qo\'shimcha parol noto\'g\'ri', 'error');
    // Kick back to login after short delay
    setTimeout(() => {
      pending2FAEmail = null;
      document.getElementById('login-form')?.reset();
      showPage('login');
    }, 1400);
    return;
  }

  const remember = document.getElementById('remember-me')?.checked;
  setSession(pending2FAEmail, !!remember);
  addAndSwitchAccount(user.name, pending2FAEmail);
  const name = user.name;
  pending2FAEmail = null;
  showPage('app');
  showSection('dashboard');
  showToast(`Xush kelibsiz, ${name.split(' ')[0]}!`, 'success');
});

// Show hint
document.getElementById('twofa-show-hint')?.addEventListener('click', () => {
  if (!pending2FAEmail) return;
  const users = loadUsers();
  const user  = users[pending2FAEmail];
  if (!user) return;
  document.getElementById('twofa-hint-value').textContent = user.passphraseHint || '(kalit so\'z yo\'q)';
  document.getElementById('twofa-hint-box').classList.remove('hidden');
  document.getElementById('twofa-show-hint').style.display = 'none';
});

// Cancel button
document.getElementById('twofa-cancel')?.addEventListener('click', () => {
  pending2FAEmail = null;
  document.getElementById('login-form')?.reset();
  showPage('login');
});

// Add new account or switch to existing, then update UI
function addAndSwitchAccount(name, email) {
  const initials = name.substring(0, 2).toUpperCase();
  const colors   = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Check if account already exists
  const existing = savedAccounts.find(a => a.email === email);
  if (existing) {
    savedAccounts.forEach(a => a.active = (a.id === existing.id));
  } else {
    const color = colors[savedAccounts.length % colors.length];
    savedAccounts.forEach(a => a.active = false);
    savedAccounts.push({ id: Date.now(), name, email, initials, color, role: 'Pro User', active: true });
  }

  const active = savedAccounts.find(a => a.active);

  // Update topbar
  document.getElementById('topbar-avatar').textContent = active.initials;
  document.getElementById('topbar-avatar').style.background = `linear-gradient(135deg, ${active.color}, ${active.color}cc)`;
  document.getElementById('topbar-name').textContent  = active.name;
  document.getElementById('topbar-role').textContent  = active.role;

  // Update all other avatar/name refs
  document.querySelectorAll('.user-avatar').forEach(el => { el.textContent = active.initials; });
  document.querySelectorAll('.user-info .name').forEach(el => { el.textContent = active.name; });

  const firstName = active.name.split(' ')[0];
  const welcomeEl = document.querySelector('#section-dashboard .welcome-section h1');
  if (welcomeEl) welcomeEl.textContent = `Welcome back, ${firstName}! 👋`;
}

// ========================================
// Sidebar Navigation
// ========================================
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    showSection(page);
    // Close mobile sidebar after navigation
    document.querySelector('.sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
  });
});

// ========================================
// Logout
// ========================================
document.getElementById('logout-btn')?.addEventListener('click', () => {
  clearSession();
  showPage('login');

  // Reset forms
  document.getElementById('login-form')?.reset();
  document.getElementById('register-form')?.reset();
  document.getElementById('create-post-form')?.reset();
});

// ========================================
// Quick Actions (Dashboard)
// ========================================
document.getElementById('quick-create-post')?.addEventListener('click', () => {
  showSection('create-post');
});

document.getElementById('quick-view-analytics')?.addEventListener('click', () => {
  showSection('analytics');
});

// ========================================
// Create Post Page
// ========================================
const platformOptions = document.querySelectorAll('.platform-option');
const postContent = document.getElementById('post-content');
const charCount = document.getElementById('char-count');
const previewText = document.getElementById('preview-text');
const previewPlatform = document.getElementById('preview-platform');
const scheduleSuccess = document.getElementById('schedule-success');

// Platform selector
platformOptions.forEach(option => {
  option.addEventListener('click', () => {
    platformOptions.forEach(opt => opt.classList.remove('active'));
    option.classList.add('active');

    const platform = option.querySelector('input').value;
    if (previewPlatform) previewPlatform.textContent = `${platform.charAt(0).toUpperCase() + platform.slice(1)} • Scheduled`;
  });
});

// Character count and preview
postContent?.addEventListener('input', (e) => {
  const text = e.target.value;
  if (charCount) charCount.textContent = text.length;
  if (previewText) previewText.textContent = text || 'Your post content will appear here...';

  // Color change when approaching limit
  if (text.length > 2000) {
    charCount.style.color = 'var(--color-danger)';
  } else if (text.length > 1800) {
    charCount.style.color = 'var(--color-warning)';
  } else {
    charCount.style.color = 'inherit';
  }
});

// Set default date to today
const postDate = document.getElementById('post-date');
const postTime = document.getElementById('post-time');

if (postDate) {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localDate = new Date(today.getTime() - (offset * 60 * 1000));
  postDate.value = localDate.toISOString().split('T')[0];
}

if (postTime) {
  const now = new Date();
  postTime.value = now.toTimeString().slice(0, 5);
}

// Schedule post form
document.getElementById('create-post-form')?.addEventListener('submit', (e) => {
  e.preventDefault();

  // Increment scheduled posts counter on dashboard
  const statCountEl = document.querySelector('.stat-card .stat-content h3');
  if (statCountEl) {
    const current = parseInt(statCountEl.textContent) || 0;
    statCountEl.textContent = current + 1;
  }

  showToast('Post scheduled successfully! 📅', 'success');

  // Show inline success message
  scheduleSuccess.classList.add('show');

  // Reset form after delay
  setTimeout(() => {
    document.getElementById('create-post-form').reset();
    previewText.textContent = 'Your post content will appear here...';
    charCount.textContent = '0';

    // Reset date and time
    if (postDate) {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localDate = new Date(today.getTime() - (offset * 60 * 1000));
      postDate.value = localDate.toISOString().split('T')[0];
    }
    if (postTime) {
      const now = new Date();
      postTime.value = now.toTimeString().slice(0, 5);
    }
  }, 2000);

  // Hide success after delay
  setTimeout(() => {
    scheduleSuccess.classList.remove('show');
  }, 3000);
});

// Save draft button
document.getElementById('save-draft-btn')?.addEventListener('click', () => {
  showToast('Draft saved successfully!', 'success');
});

// ========================================
// Analytics Page
// ========================================
const dateRangeBtns = document.querySelectorAll('.date-range-btn');

dateRangeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    dateRangeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Simulate data refresh animation
    document.querySelectorAll('.chart-bar').forEach(bar => {
      const currentHeight = bar.style.height;
      bar.style.height = '0%';
      setTimeout(() => {
        bar.style.height = currentHeight;
      }, 100);
    });
  });
});

// ========================================
// Settings Page
// ========================================
const settingsNavItems = document.querySelectorAll('.settings-nav-item');

settingsNavItems.forEach(item => {
  item.addEventListener('click', () => {
    settingsNavItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    // Switch visible panel
    const panel = item.dataset.settings;
    document.querySelectorAll('[data-settings-panel]').forEach(p => p.classList.add('hidden'));
    document.querySelector(`[data-settings-panel="${panel}"]`)?.classList.remove('hidden');

    if (panel === 'account') populateAccountForm();
  });
});

// Populate Account form with the logged-in user's data
function populateAccountForm() {
  const email = getSession();
  if (!email) return;
  const users = loadUsers();
  const user  = users[email];
  if (!user) return;

  const nameEl     = document.getElementById('account-name');
  const emailEl    = document.getElementById('account-email');
  const userEl     = document.getElementById('account-username');
  const birthdayEl = document.getElementById('account-birthday');
  const genderEl   = document.getElementById('account-gender');

  if (nameEl)     nameEl.value     = user.name || '';
  if (emailEl)    emailEl.value    = email;
  if (userEl)     userEl.value     = user.username || '@' + email.split('@')[0];
  if (birthdayEl) birthdayEl.value = user.birthday || '';
  if (genderEl)   genderEl.value   = user.gender || '';
}

// 2FA Toggle
const twoFactorToggle = document.getElementById('2fa-toggle');
twoFactorToggle?.addEventListener('change', (e) => {
  const status = e.target.checked ? 'enabled' : 'disabled';
  showToast(`Two-factor authentication ${status}`, e.target.checked ? 'success' : 'warning');
});

// Change Password button
document.getElementById('change-password-btn')?.addEventListener('click', () => {
  showToast('Password reset link sent to your email', 'info');
});

// Save Account button — persist to localStorage user record
document.getElementById('save-account-btn')?.addEventListener('click', () => {
  const email = getSession();
  if (!email) { showToast('Avval login qiling', 'error'); return; }
  const users = loadUsers();
  const user  = users[email];
  if (!user)  { showToast('Foydalanuvchi topilmadi', 'error'); return; }

  const name     = document.getElementById('account-name').value.trim();
  const username = document.getElementById('account-username').value.trim();
  const birthday = document.getElementById('account-birthday').value;
  const gender   = document.getElementById('account-gender').value;

  if (!name) { showToast('Ism bo\'sh bo\'lmasligi kerak', 'error'); return; }

  user.name     = name;
  user.username = username;
  user.birthday = birthday;
  user.gender   = gender;
  saveUsers(users);

  // Refresh topbar + avatar
  addAndSwitchAccount(user.name, email);
  showToast('Ma\'lumotlar saqlandi ✓', 'success');
});

// ========================================
// Platform Connect — gramir.uz style
// ========================================
const allPlatforms = [
  { id: 'telegram',  name: 'Telegram',  icon: '✈️', iconBg: '#29B6F6',                                                              tagline: 'Kanal va guruhlaringizni ulang',           btnColor: '#29B6F6',                                         btnText: 'Telegram hisobini ulash'  },
  { id: 'instagram', name: 'Instagram', icon: '📷', iconBg: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',       tagline: 'Instagram biznes hisobingizni ulang',      btnColor: 'linear-gradient(135deg,#e6683c,#cc2366)',          btnText: 'Instagram hisobini ulash' },
  { id: 'facebook',  name: 'Facebook',  icon: 'f',  iconBg: '#1877F2',                                                              tagline: 'Facebook sahifangizni ulang',              btnColor: '#1877F2',                                         btnText: 'Facebook hisobini ulash'  },
  { id: 'linkedin',  name: 'LinkedIn',  icon: 'in', iconBg: '#0A66C2',                                                              tagline: 'LinkedIn kompaniya sahifangizni ulang',    btnColor: '#0A66C2',                                         btnText: 'LinkedIn hisobini ulash'  },
  { id: 'youtube',   name: 'YouTube',   icon: '▶',  iconBg: '#FF0000',                                                              tagline: 'YouTube kanalingizni ulang',               btnColor: '#FF0000',                                         btnText: 'YouTube hisobini ulash'   },
  { id: 'twitter',   name: 'X',         icon: '✕',  iconBg: '#111',                                                                  tagline: 'X (Twitter) hisobingizni ulang',           btnColor: '#111',                                            btnText: 'X hisobini ulash'         },
  { id: 'threads',   name: 'Threads',   icon: '@',  iconBg: '#111',                                                                  tagline: 'Threads hisobingizni ulang',               btnColor: '#111',                                            btnText: 'Threads hisobini ulash'   },
];

const oauthSteps = [
  'Tanlangan platforma sahifasiga yo\'naltirilasiz',
  'Hisobingizga kiring (agar kirilmagan bo\'lsa)',
  'Secure Social ilovasiga ruxsat bering',
  'Avtomatik qaytarilasiz',
];

const connectedSet = new Set();
let currentPlatform   = null;
let fromSettings      = false;

// ── Step switch ──────────────────────────────────────────
function showModalStep(step) {
  ['picker','detail','loading','success'].forEach(s =>
    document.getElementById(`modal-step-${s}`)?.classList.add('hidden')
  );
  document.getElementById(`modal-step-${step}`)?.classList.remove('hidden');
}

// ── Render picker grid ────────────────────────────────────
function renderPlatformPicker(filter = '') {
  const grid = document.getElementById('platform-picker-grid');
  if (!grid) return;
  const list = allPlatforms.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));

  grid.innerHTML = list.map(p => `
    <div class="picker-card ${connectedSet.has(p.id) ? 'is-connected' : ''}" data-pid="${p.id}">
      <div class="picker-card-icon" style="background:${p.iconBg};">${p.icon}</div>
      <span class="picker-card-name">${p.name}</span>
      ${connectedSet.has(p.id) ? '<div class="picker-card-dot"></div>' : ''}
    </div>`).join('');

  grid.querySelectorAll('.picker-card').forEach(card =>
    card.addEventListener('click', () => showPlatformDetail(card.dataset.pid))
  );
}

// ── Open modal: picker (Step 1) ───────────────────────────
function openModalPicker() {
  fromSettings = false;
  document.getElementById('platform-search').value = '';
  renderPlatformPicker();
  showModalStep('picker');
  document.getElementById('connect-modal').classList.remove('hidden');
}

// ── Open modal: jump to detail from settings ──────────────
function openConnectModal(platformId) {
  fromSettings = true;
  renderPlatformPicker();
  document.getElementById('connect-modal').classList.remove('hidden');
  showPlatformDetail(platformId);
}

// ── Show platform detail (Step 2) ────────────────────────
function showPlatformDetail(platformId) {
  const p = allPlatforms.find(x => x.id === platformId);
  if (!p) return;
  currentPlatform = platformId;

  const iconEl = document.getElementById('detail-icon-el');
  iconEl.textContent   = p.icon;
  iconEl.style.cssText = `background:${p.iconBg}; width:52px; height:52px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.4rem; font-weight:700; color:#fff; flex-shrink:0;`;

  document.getElementById('detail-name-el').textContent    = p.name;
  document.getElementById('detail-tagline-el').textContent = p.tagline;
  document.getElementById('detail-steps-el').innerHTML     = oauthSteps.map((s, i) =>
    `<li><span class="step-num">${i+1}</span>${s}</li>`).join('');

  const btn = document.getElementById('detail-connect-btn');
  btn.style.background = p.btnColor;
  btn.style.display    = '';        // reset (Telegram hides it)
  document.getElementById('detail-connect-text').textContent = p.btnText;

  // Reset optional sub-elements
  const slot = document.getElementById('telegram-widget-slot');
  const warn = document.getElementById('detail-config-warn');
  if (slot) { slot.classList.add('hidden'); slot.innerHTML = ''; }
  if (warn) { warn.classList.add('hidden'); warn.innerHTML = ''; }

  // Telegram mounts the official Login Widget instead of a custom button
  if (p.id === 'telegram') mountTelegramWidget();

  showModalStep('detail');
}

function closeConnectModal() {
  document.getElementById('connect-modal').classList.add('hidden');
  currentPlatform = null;
}

// ── Search ────────────────────────────────────────────────
document.getElementById('platform-search')?.addEventListener('input', e =>
  renderPlatformPicker(e.target.value)
);

// ── Back button ───────────────────────────────────────────
document.getElementById('modal-back')?.addEventListener('click', () =>
  fromSettings ? closeConnectModal() : showModalStep('picker')
);

// ── Close buttons ─────────────────────────────────────────
document.getElementById('modal-close')?.addEventListener('click', closeConnectModal);
document.getElementById('modal-close-2')?.addEventListener('click', closeConnectModal);
document.getElementById('connect-modal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('connect-modal')) closeConnectModal();
});

// ── Settings list: Connect / Disconnect ───────────────────
document.getElementById('platforms-list')?.addEventListener('click', e => {
  const btn = e.target.closest('.platform-action-btn');
  if (!btn) return;
  if (btn.dataset.action === 'connect')    openConnectModal(btn.dataset.platform);
  if (btn.dataset.action === 'disconnect') disconnectPlatform(btn.dataset.platform);
});

// ═══════════════════════════════════════════════════════════
//  REAL OAUTH WIRING
// ═══════════════════════════════════════════════════════════
const CFG = window.OAUTH_CONFIG || {};

// ── localStorage helpers ─────────────────────────────────
const OAUTH_STORE_KEY = 'ssm_oauth';
function saveOAuth(platform, data) {
  const all = JSON.parse(localStorage.getItem(OAUTH_STORE_KEY) || '{}');
  all[platform] = { ...data, connected_at: Date.now() };
  localStorage.setItem(OAUTH_STORE_KEY, JSON.stringify(all));
}
function getOAuth(platform) {
  const all = JSON.parse(localStorage.getItem(OAUTH_STORE_KEY) || '{}');
  return all[platform];
}
function removeOAuth(platform) {
  const all = JSON.parse(localStorage.getItem(OAUTH_STORE_KEY) || '{}');
  delete all[platform];
  localStorage.setItem(OAUTH_STORE_KEY, JSON.stringify(all));
}

// ── Facebook JS SDK loader (lazy, once) ──────────────────
let fbSdkReady = null;
function loadFacebookSDK() {
  if (fbSdkReady) return fbSdkReady;
  if (!CFG.FACEBOOK_APP_ID) {
    return Promise.reject(new Error('FACEBOOK_APP_ID not set in oauth-config.js'));
  }
  fbSdkReady = new Promise((resolve) => {
    window.fbAsyncInit = function () {
      FB.init({
        appId: CFG.FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false,
        version: 'v21.0',
      });
      resolve(window.FB);
    };
    const s = document.createElement('script');
    s.async = true; s.defer = true; s.crossOrigin = 'anonymous';
    s.src = 'https://connect.facebook.net/en_US/sdk.js';
    document.head.appendChild(s);
  });
  return fbSdkReady;
}

// ── Telegram Login Widget (injects official script) ─────
function mountTelegramWidget() {
  const slot = document.getElementById('telegram-widget-slot');
  const warn = document.getElementById('detail-config-warn');
  const btn  = document.getElementById('detail-connect-btn');
  if (!slot) return;
  slot.innerHTML = '';

  if (!CFG.TELEGRAM_BOT_USERNAME) {
    slot.classList.add('hidden');
    warn.classList.remove('hidden');
    warn.innerHTML = '⚠️ <code>oauth-config.js</code> da <code>TELEGRAM_BOT_USERNAME</code> to\'ldirilmagan. @BotFather dan bot yaratib, username kiriting.';
    btn.style.display = 'none';
    return;
  }

  warn.classList.add('hidden');
  btn.style.display = 'none';           // widget o'zi tugma ko'rsatadi
  slot.classList.remove('hidden');

  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://telegram.org/js/telegram-widget.js?22';
  s.setAttribute('data-telegram-login', CFG.TELEGRAM_BOT_USERNAME);
  s.setAttribute('data-size',           'large');
  s.setAttribute('data-radius',         '10');
  s.setAttribute('data-onauth',         'onTelegramAuth(user)');
  s.setAttribute('data-request-access', 'write');
  slot.appendChild(s);
}

// ── Telegram auth callback (called from widget iframe) ───
window.handleTelegramAuth = function (user) {
  // Telegram signs the payload with bot token's SHA-256 HMAC.
  // Signature verification MUST be done server-side with the bot token.
  // Client-side we trust the origin (telegram.org iframe) for the demo.
  saveOAuth('telegram', {
    user_id:    user.id,
    username:   user.username,
    first_name: user.first_name,
    last_name:  user.last_name,
    photo_url:  user.photo_url,
    auth_date:  user.auth_date,
    hash:       user.hash,            // server pass this to Bot API for verification
  });
  showSuccessAndClose('Telegram', user.username || user.first_name);
};

// ── Facebook login flow ──────────────────────────────────
async function loginWithFacebook() {
  const FB = await loadFacebookSDK();
  return new Promise((resolve, reject) => {
    FB.login((resp) => {
      if (resp.status !== 'connected') return reject(new Error('Facebook login cancelled'));
      const token = resp.authResponse.accessToken;
      FB.api('/me', { fields: 'id,name,email,picture' }, (me) => {
        FB.api('/me/accounts', { fields: 'id,name,access_token,category' }, (pages) => {
          resolve({
            access_token: token,
            user_id:      me.id,
            name:         me.name,
            email:        me.email,
            avatar:       me.picture?.data?.url,
            pages:        pages.data || [],
          });
        });
      });
    }, { scope: CFG.FACEBOOK_SCOPES, return_scopes: true });
  });
}

// ── Instagram login flow (via Facebook) ──────────────────
async function loginWithInstagram() {
  const FB = await loadFacebookSDK();
  return new Promise((resolve, reject) => {
    FB.login(async (resp) => {
      if (resp.status !== 'connected') return reject(new Error('Instagram login cancelled'));
      const token = resp.authResponse.accessToken;
      FB.api('/me/accounts', { fields: 'id,name,access_token,instagram_business_account{id,username,profile_picture_url}' }, (pages) => {
        const page = (pages.data || []).find(p => p.instagram_business_account);
        if (!page) {
          return reject(new Error('Instagram Business akkaunt topilmadi. Instagram\'ni Facebook Page bilan bog\'lang.'));
        }
        const ig = page.instagram_business_account;
        resolve({
          access_token:    token,
          page_access_token: page.access_token,
          page_id:         page.id,
          page_name:       page.name,
          ig_user_id:      ig.id,
          username:        ig.username,
          avatar:          ig.profile_picture_url,
        });
      });
    }, { scope: CFG.INSTAGRAM_SCOPES, return_scopes: true });
  });
}

// ── Success UI helper ────────────────────────────────────
function showSuccessAndClose(platformName, displayName) {
  document.getElementById('modal-success-title').textContent = `${platformName} ulandi! 🎉`;
  document.getElementById('modal-success-sub').textContent   = displayName ? `@${displayName} ulandi` : 'Hisob muvaffaqiyatli ulandi';
  showModalStep('success');
  setTimeout(() => { connectPlatform(currentPlatform); closeConnectModal(); }, 1400);
}
function showLoading(platformName) {
  document.getElementById('modal-loading-title').textContent = `${platformName} ga ulanmoqda...`;
  document.getElementById('modal-loading-sub').textContent   = 'Iltimos kuting';
  showModalStep('loading');
}
function showError(msg) {
  showModalStep('detail');
  showToast(msg, 'error');
}

// ── Connect button (Step 2) ──────────────────────────────
document.getElementById('detail-connect-btn')?.addEventListener('click', async () => {
  const p = allPlatforms.find(x => x.id === currentPlatform);
  if (!p) return;

  // FACEBOOK
  if (p.id === 'facebook') {
    if (!CFG.FACEBOOK_APP_ID) return showError('FACEBOOK_APP_ID oauth-config.js da to\'ldirilmagan');
    showLoading(p.name);
    try {
      const data = await loginWithFacebook();
      saveOAuth('facebook', data);
      showSuccessAndClose('Facebook', data.name);
    } catch (e) { showError(e.message); }
    return;
  }

  // INSTAGRAM
  if (p.id === 'instagram') {
    if (!CFG.FACEBOOK_APP_ID) return showError('FACEBOOK_APP_ID oauth-config.js da to\'ldirilmagan');
    showLoading(p.name);
    try {
      const data = await loginWithInstagram();
      saveOAuth('instagram', data);
      showSuccessAndClose('Instagram', data.username);
    } catch (e) { showError(e.message); }
    return;
  }

  // OTHERS (linkedin, youtube, twitter, threads) — simulation fallback
  showLoading(p.name);
  setTimeout(() => showSuccessAndClose(p.name), 1500);
});

// ── UI: connect ───────────────────────────────────────────
function connectPlatform(id) {
  connectedSet.add(id);
  const p   = allPlatforms.find(x => x.id === id);
  const row = document.getElementById(`platform-${id}`);
  if (row) {
    row.querySelector('.platform-status-text').textContent = 'Connected';
    row.style.opacity = '1';
    row.querySelector('.platform-badge')?.remove();
    const btn = row.querySelector('.platform-action-btn');
    if (btn) btn.outerHTML = `
      <span class="badge badge-success platform-badge">✓ Connected</span>
      <button class="btn btn-outline platform-action-btn" style="margin-left:auto;"
        data-action="disconnect" data-platform="${id}">Disconnect</button>`;
  }
  updatePlatformCounter(+1);
  showToast(`${p?.name} muvaffaqiyatli ulandi!`, 'success');
}

// ── UI: disconnect ────────────────────────────────────────
function disconnectPlatform(id) {
  connectedSet.delete(id);
  const p   = allPlatforms.find(x => x.id === id);
  const row = document.getElementById(`platform-${id}`);
  if (row) {
    row.querySelector('.platform-status-text').textContent = 'Not connected';
    row.style.opacity = '0.65';
    row.querySelector('.platform-badge')?.remove();
    const btn = row.querySelector('.platform-action-btn');
    if (btn) btn.outerHTML = `
      <button class="btn btn-primary platform-action-btn" style="margin-left:auto;"
        data-action="connect" data-platform="${id}">Connect</button>`;
  }
  updatePlatformCounter(-1);
  showToast(`${p?.name} ulanishi uzildi`, 'warning');
}

function updatePlatformCounter(delta) {
  document.querySelectorAll('.stat-card .stat-content').forEach(card => {
    if (card.querySelector('p')?.textContent === 'Platforms Connected') {
      const h3 = card.querySelector('h3');
      h3.textContent = Math.max(0, parseInt(h3.textContent || 0) + delta);
    }
  });
}

// ========================================
// Mobile Sidebar Toggle
// ========================================
const hamburgerBtn = document.getElementById('hamburger-btn');
const sidebarOverlay = document.getElementById('sidebar-overlay');

hamburgerBtn?.addEventListener('click', () => {
  document.querySelector('.sidebar').classList.toggle('open');
  sidebarOverlay.classList.toggle('active');
});

sidebarOverlay?.addEventListener('click', () => {
  document.querySelector('.sidebar').classList.remove('open');
  sidebarOverlay.classList.remove('active');
});

// ========================================
// Account Switcher
// ========================================
const savedAccounts = [
  { id: 1, name: 'John Doe',       email: 'john@example.com',      initials: 'JD', color: '#6366F1', role: 'Pro User',       active: true  },
  { id: 2, name: 'Marketing Team', email: 'marketing@company.com', initials: 'MT', color: '#10B981', role: 'Team Account',   active: false },
  { id: 3, name: 'Brand Account',  email: 'brand@mystore.com',     initials: 'BA', color: '#F59E0B', role: 'Business',       active: false },
];

function renderAccountList() {
  const list = document.getElementById('account-list');
  if (!list) return;

  list.innerHTML = savedAccounts.map(acc => `
    <div class="account-item ${acc.active ? 'active' : ''}" data-account-id="${acc.id}">
      <div class="account-item-avatar" style="background: ${acc.color};">${acc.initials}</div>
      <div class="account-item-info">
        <div class="account-item-name">${acc.name}</div>
        <div class="account-item-email">${acc.email}</div>
      </div>
      ${acc.active ? '<span class="account-item-check">✓</span>' : ''}
    </div>
  `).join('');

  // Click handler
  list.querySelectorAll('.account-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.dataset.accountId);
      switchAccount(id);
    });
  });
}

function switchAccount(id) {
  const acc = savedAccounts.find(a => a.id === id);
  if (!acc || acc.active) {
    closeAccountDropdown();
    return;
  }

  // Update active state
  savedAccounts.forEach(a => a.active = (a.id === id));

  // Update topbar UI
  document.getElementById('topbar-avatar').textContent  = acc.initials;
  document.getElementById('topbar-avatar').style.background = `linear-gradient(135deg, ${acc.color}, ${acc.color}cc)`;
  document.getElementById('topbar-name').textContent    = acc.name;
  document.getElementById('topbar-role').textContent    = acc.role;

  // Update welcome message
  const firstName = acc.name.split(' ')[0];
  const welcomeEl = document.querySelector('#section-dashboard .welcome-section h1');
  if (welcomeEl) welcomeEl.textContent = `Welcome back, ${firstName}! 👋`;

  renderAccountList();
  closeAccountDropdown();
  showToast(`${acc.name} akkauntiga o'tildi`, 'success');
}

function openAccountDropdown() {
  document.getElementById('account-dropdown').classList.remove('hidden');
  document.getElementById('user-menu-wrapper').classList.add('open');
  renderAccountList();
}

function closeAccountDropdown() {
  document.getElementById('account-dropdown').classList.add('hidden');
  document.getElementById('user-menu-wrapper').classList.remove('open');
}

// Toggle on avatar click
document.getElementById('user-menu-btn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = !document.getElementById('account-dropdown').classList.contains('hidden');
  isOpen ? closeAccountDropdown() : openAccountDropdown();
});

// Close on outside click
document.addEventListener('click', (e) => {
  const wrapper = document.getElementById('user-menu-wrapper');
  if (wrapper && !wrapper.contains(e.target)) closeAccountDropdown();
});

// Add account → go to login
document.getElementById('add-account-btn')?.addEventListener('click', () => {
  closeAccountDropdown();
  showPage('login');
  document.getElementById('login-form')?.reset();
});

// ═══════════════════════════════════════════════════════════
//  ADMIN PANEL
// ═══════════════════════════════════════════════════════════

// Seed admin account if missing
async function seedAdmin() {
  const users = loadUsers();
  if (!users[ADMIN_EMAIL]) {
    users[ADMIN_EMAIL] = {
      name:           'Admin',
      passwordHash:   await sha256(ADMIN_PASSWORD),
      passphraseHash: await sha256('secureadmin'),
      passphraseHint: 'tizim boshlig\'ining maxsus so\'zi',
      created_at:     Date.now(),
      role:           'admin',
    };
    saveUsers(users);
    console.log(`🛡 Admin seeded: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}  (2FA: secureadmin)`);
  }
}

// Toggle admin nav visibility based on current session
function refreshAdminNav() {
  const active = savedAccounts.find(a => a.active);
  const navAdmin = document.getElementById('nav-admin');
  if (!navAdmin) return;
  if (active && isAdmin(active.email)) navAdmin.classList.remove('hidden');
  else                                 navAdmin.classList.add('hidden');
}

// Storage size helper
function bytesOfLocalStorage() {
  let total = 0;
  for (let k in localStorage) if (localStorage.hasOwnProperty(k)) {
    total += ((localStorage[k] || '').length + k.length) * 2; // utf-16
  }
  return total;
}
function formatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

// Render all admin panel content
function renderAdminPanel() {
  const users = loadUsers();
  const emails = Object.keys(users);
  const oauth  = JSON.parse(localStorage.getItem(OAUTH_STORE_KEY) || '{}');
  const oauthPlatforms = Object.keys(oauth);

  document.getElementById('admin-stat-users').textContent   = emails.length;
  document.getElementById('admin-stat-oauth').textContent   = oauthPlatforms.length;
  document.getElementById('admin-stat-storage').textContent = formatBytes(bytesOfLocalStorage());
  document.getElementById('admin-stat-session').textContent =
    new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

  // Users table
  const tbody = document.getElementById('admin-users-body');
  if (!emails.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="admin-empty">Hali foydalanuvchilar yo\'q</td></tr>';
  } else {
    tbody.innerHTML = emails.map(email => {
      const u = users[email];
      const isAdm = isAdmin(email);
      const date = new Date(u.created_at).toLocaleString('uz-UZ', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
      return `
        <tr>
          <td><span class="admin-email">${email}</span>${isAdm ? '<span class="admin-role-badge">ADMIN</span>' : ''}</td>
          <td>${u.name}</td>
          <td>${date}</td>
          <td>${isAdm ? '<span style="color:#9ca3af;font-size:0.78rem;">— (himoyalangan)</span>' : `<button class="admin-action-btn" data-del-user="${email}">O'chirish</button>`}</td>
        </tr>`;
    }).join('');
  }

  // OAuth chips
  const oauthWrap = document.getElementById('admin-oauth-list');
  if (!oauthPlatforms.length) {
    oauthWrap.innerHTML = '<p class="admin-empty">Hech qanday akkaunt ulanmagan</p>';
  } else {
    oauthWrap.innerHTML = oauthPlatforms.map(pid => {
      const d = oauth[pid];
      const label = d.username || d.name || d.first_name || d.user_id || '—';
      return `
        <div class="admin-oauth-chip">
          <span class="admin-oauth-chip-dot"></span>
          <strong>${pid}</strong>
          <span style="color:#6b7280;">${label}</span>
        </div>`;
    }).join('');
  }
}

// Delete user action
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-del-user]');
  if (!btn) return;
  const email = btn.dataset.delUser;
  if (!confirm(`"${email}" foydalanuvchisini o'chirishni tasdiqlaysizmi?`)) return;
  const users = loadUsers();
  delete users[email];
  saveUsers(users);
  renderAdminPanel();
  showToast(`${email} o'chirildi`, 'success');
});

// Danger zone handlers
document.getElementById('admin-clear-users')?.addEventListener('click', () => {
  if (!confirm('Barcha foydalanuvchilar o\'chiriladi (admin qoladi). Davom etasizmi?')) return;
  const users = loadUsers();
  const adminUser = users[ADMIN_EMAIL];
  saveUsers(adminUser ? { [ADMIN_EMAIL]: adminUser } : {});
  renderAdminPanel();
  showToast('Foydalanuvchilar bazasi tozalandi', 'success');
});
document.getElementById('admin-clear-oauth')?.addEventListener('click', () => {
  if (!confirm('Barcha OAuth ulanishlar o\'chiriladi. Davom etasizmi?')) return;
  localStorage.removeItem(OAUTH_STORE_KEY);
  // Reset UI
  connectedSet.clear();
  renderAdminPanel();
  showToast('OAuth ulanishlar tozalandi', 'success');
});
document.getElementById('admin-clear-all')?.addEventListener('click', () => {
  if (!confirm('LOCALSTORAGE TO\'LIQ TOZALANADI. Sahifa yangilanadi. Davom etasizmi?')) return;
  localStorage.clear();
  location.reload();
});
document.getElementById('admin-refresh')?.addEventListener('click', renderAdminPanel);

// Re-render admin when navigating to it
document.querySelector('[data-page="admin"]')?.addEventListener('click', renderAdminPanel);

// Also refresh admin nav after account switches
const _origAddAndSwitch = addAndSwitchAccount;
window.addAndSwitchAccount = function (...args) {
  _origAddAndSwitch(...args);
  refreshAdminNav();
};

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
  await seedAdmin();
  refreshAdminNav();

  // Auto-login if a session exists and user is still registered
  const sessionEmail = getSession();
  const users = loadUsers();
  if (sessionEmail && users[sessionEmail]) {
    addAndSwitchAccount(users[sessionEmail].name, sessionEmail);
    showPage('app');
    showSection('dashboard');
  } else {
    clearSession();
    showPage('login');
  }

  console.log('🔐 Secure Social Manager initialized');
  console.log(`🛡 Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
});
