import logoUrl from '../../AccessDeniedLogo.png';

export function initFooter() {
    const footerTemplate = `
        <footer class="site-footer">
            <div class="footer-container">
                <div class="footer-logo">
                    <img src="${logoUrl}" alt="Access Denied Logo" class="logo-img-small">
                </div>
                
                <div class="footer-info">
                    <div class="footer-copy">
                        &copy; 2026 Access Denied CTF.
                    </div>
                    <a href="mailto:access@mail.denied.online" class="footer-email">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                        </svg>
                        access@mail.denied.online
                    </a>
                </div>

                <div class="footer-links">
                    <a href="rules.html">Rules</a>
                    <a href="scoreboard.html">Scoreboard</a>
                </div>
            </div>
        </footer>
    `;

    const placeholder = document.getElementById('footer-placeholder');
    if (placeholder) {
        placeholder.innerHTML = footerTemplate;
    } else {
        if (!document.querySelector('.site-footer')) {
            document.body.insertAdjacentHTML('beforeend', footerTemplate);
        }
    }
}
