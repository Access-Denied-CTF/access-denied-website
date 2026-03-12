// dynamic nav, switches between sign-in and account based on session
import { account } from './appwrite.js';

export async function initNav() {
    // find the last nav link (account/sign-in)
    const navLinks = document.querySelectorAll('.nav-links .nav-btn');
    const accountLink = navLinks[navLinks.length - 1];

    if (!accountLink) return;

    // show spinner while checking auth
    accountLink.innerHTML = `
        <svg class="nav-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.5" stroke-linecap="round">
            <circle cx="12" cy="12" r="10" stroke-dasharray="50" stroke-dashoffset="15">
                <animateTransform attributeName="transform" type="rotate"
                    from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
            </circle>
        </svg>
    `;

    try {
        const user = await account.get();

        // logged in
        accountLink.href = 'account.html';
        accountLink.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
            account
        `;
    } catch {
        // not logged in
        accountLink.href = 'login.html';
        accountLink.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            sign in
        `;
    }
}
