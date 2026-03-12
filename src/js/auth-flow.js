// handles auth page logic (magic link, google oauth)
import { account, callFunction } from './appwrite.js';
import { showToast } from './toast.js';
import { initNav } from './nav.js';
import { setBtnLoading } from './utils.js';

const ALLOWED_DOMAINS = (import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS || '@stemassiut.moe.edu.eg').split(',');

// fullscreen loader overlay for oauth redirects
function showFullscreenLoader() {
    let overlay = document.getElementById('oauthLoader');
    if (overlay) { overlay.style.display = 'flex'; return; }

    overlay = document.createElement('div');
    overlay.id = 'oauthLoader';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:var(--bg, #f8f8f8);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1.5rem;';
    overlay.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#da3533" stroke-width="2.5" stroke-linecap="round">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.7s" repeatCount="indefinite"/>
            </path>
        </svg>
        <p style="font-family:'Outfit',sans-serif;font-weight:700;color:#4c0900;font-size:1.1rem;">Verifying your account...</p>
    `;
    document.body.appendChild(overlay);
}

function hideFullscreenLoader() {
    const overlay = document.getElementById('oauthLoader');
    if (overlay) overlay.remove();
}

// run nav on every page
document.addEventListener('DOMContentLoaded', () => {
    initNav();
    detectPage();
});

// detect current page and wire up handlers
function detectPage() {
    const params = new URLSearchParams(window.location.search);

    // handle oauth callback
    if (params.get('oauth') === 'google' || params.get('error') === 'oauth') {
        handleOAuthCallback();
        return;
    }

    // handle magic link callback
    if (params.get('token') && params.get('email')) {
        handleMagicLinkCallback();
        return;
    }

    const path = window.location.pathname;

    if (path.includes('signup')) initSignup();
    else if (path.includes('login')) initLogin();
}

// --- login (magic link) ---
function initLogin() {
    const form = document.getElementById('loginForm');
    const googleBtn = document.querySelector('.google-btn');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('emailInput')?.value?.trim();

        if (!email) {
            showToast('Please enter your email.', 'error');
            return;
        }

        // client-side domain check
        const normalizedEmail = email.toLowerCase();
        if (!ALLOWED_DOMAINS.some(domain => normalizedEmail.endsWith(domain))) {
            showToast('Only allowed email domains can participate.', 'error');
            emailInput.classList.add('error');
            return;
        }
        const btn = document.getElementById('loginBtn');
        setBtnLoading(btn, true, 'Send Magic Link');

        try {
            const result = await callFunction('send-magic-link', { email, type: 'login' });

            if (result.ok) {
                // show verification card
                document.getElementById('loginCard').style.display = 'none';
                const checkCard = document.getElementById('checkEmailCard');
                checkCard.style.display = '';
                document.getElementById('checkEmailText').innerHTML =
                    `We sent a magic link to <strong>${email}</strong>. Click it to log in.`;
            } else if (result.needsSignup) {
                showToast('No account found. Redirecting to sign up...', 'error');
                setTimeout(() => { window.location.href = 'signup.html'; }, 1500);
            } else {
                showToast(result.message, 'error');
                setBtnLoading(btn, false, 'Send Magic Link');
            }
        } catch (err) {
            showToast('Failed to send magic link. Try again.', 'error');
            setBtnLoading(btn, false, 'Send Magic Link');
        }
    });

    if (googleBtn) {
        googleBtn.addEventListener('click', () => handleGoogleAuth());
    }
}

// --- signup (magic link + handle) ---
function initSignup() {
    const form = document.getElementById('signupForm');
    const googleBtn = document.querySelector('.google-btn');
    if (!form) return;

    // pre-fill email if passed from index page
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    const emailInput = document.getElementById('emailInput');

    if (emailParam && emailInput) {
        emailInput.value = emailParam;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const handle = document.getElementById('handleInput')?.value?.trim();
        const email = document.getElementById('emailInput')?.value?.trim();

        if (!handle || !email) {
            showToast('Please fill in all fields.', 'error');
            return;
        }

        // client-side domain check
        const normalizedEmail = email.toLowerCase();
        if (!ALLOWED_DOMAINS.some(domain => normalizedEmail.endsWith(domain))) {
            showToast('Only allowed email domains can register.', 'error');
            return;
        }

        const btn = document.getElementById('signupBtn');
        setBtnLoading(btn, true, 'Send Magic Link');

        try {
            const result = await callFunction('send-magic-link', { email, handle, type: 'signup' });

            if (result.ok) {
                // show verification card
                document.getElementById('signupCard').style.display = 'none';
                const checkCard = document.getElementById('checkEmailCard');
                checkCard.style.display = '';
                document.getElementById('checkEmailText').innerHTML =
                    `We sent a magic link to <strong>${email}</strong>. Click it to complete your registration.`;
            } else if (result.alreadyExists) {
                showToast('Account already exists. Redirecting to login...', 'error');
                setTimeout(() => { window.location.href = 'login.html'; }, 1500);
            } else {
                showToast(result.message, 'error');
                setBtnLoading(btn, false, 'Send Magic Link');
            }
        } catch (err) {
            showToast('Failed to send magic link. Try again.', 'error');
            setBtnLoading(btn, false, 'Send Magic Link');
        }
    });

    if (googleBtn) {
        googleBtn.addEventListener('click', () => handleGoogleAuth());
    }
}

// --- magic link callback ---
// validates token from email link and creates session
async function handleMagicLinkCallback() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');

    // clean url so token isnt exposed in address bar
    window.history.replaceState({}, '', window.location.pathname);
    showFullscreenLoader();

    try {
        const result = await callFunction('verify-magic-link', { token, email });

        if (result.ok) {
            // create session from server token
            await account.createSession(result.userId, result.secret);

            showToast(result.message, 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 1000);
        } else {
            hideFullscreenLoader();
            showToast(result.message, 'error');
        }
    } catch (err) {
        hideFullscreenLoader();
        showToast('Magic link verification failed. Please try again.', 'error');
    }
}

// --- google oauth ---
async function handleGoogleAuth() {
    try {
        // clear stale sessions
        try { await account.deleteSession('current'); } catch { }

        // token-based flow to handle workspace accounts where cookies fail
        const currentPage = window.location.href.split('?')[0];
        account.createOAuth2Token(
            'google',
            `${currentPage}?oauth=google`,
            `${currentPage}?error=oauth`
        );
    } catch (err) {
        showToast('Google sign-in failed.', 'error');
    }
}

// handle google oauth callback (token-based flow)
export async function handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('error') === 'oauth') {
        showToast('Google sign-in was cancelled or failed.', 'error');
        window.history.replaceState({}, '', window.location.pathname);
        return;
    }

    if (params.get('oauth') === 'google') {
        const userId = params.get('userId');
        const secret = params.get('secret');

        // clean url
        window.history.replaceState({}, '', window.location.pathname);
        showFullscreenLoader();

        try {
            if (!userId || !secret) {
                throw new Error('Missing OAuth parameters from redirect.');
            }

            // create session from oauth token
            await account.createSession(userId, secret);

            const user = await account.get();

            // domain check
            if (!ALLOWED_DOMAINS.some(domain => user.email.toLowerCase().endsWith(domain))) {
                showToast('Only allowed email domains are permitted.', 'error');
            }

            // server-side validation (sets profile for first-timers, rejects wrong domains)
            const result = await callFunction('validate-google-auth', {});

            if (!result.ok) {
                try { await account.deleteSession('current'); } catch { }
                hideFullscreenLoader();
                showToast(result.message, 'error');
                return;
            }

            // success
            showToast(result.message, 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 1000);

        } catch (err) {
            try { await account.deleteSession('current'); } catch { }
            hideFullscreenLoader();
            showToast('Google sign-in failed. Please try again.', 'error');
        }
    }
}
