// shared utility functions

// spinner svg for loading states
export function getSpinnerSvg(size = 22, isDark = false) {
    const color = isDark ? '#4c0900' : 'white';
    return `<svg class="btn-spinner" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.7s" repeatCount="indefinite"/></path></svg>`;
}

// toggle loading state on a button
export function setBtnLoading(btn, isLoading, originalText, isDark = false) {
    if (!btn) return;

    if (isLoading) {
        btn.disabled = true;
        btn.dataset.originalText = originalText || btn.textContent;
        // replace content with spinner
        btn.innerHTML = getSpinnerSvg(22, isDark);
    } else {
        btn.disabled = false;
        if (btn.dataset.originalText || originalText) {
            btn.textContent = btn.dataset.originalText || originalText;
        }

        // clean up leftover spinner
        const spinner = btn.querySelector('.btn-spinner');
        if (spinner) spinner.remove();
    }
}
