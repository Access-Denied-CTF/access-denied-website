// custom modal system (confirm, prompt, invite dialogs)

import { getSpinnerSvg, setBtnLoading } from './utils.js';

// creates a modal overlay and returns element references
function createModal({ title, message, wide = false }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const card = document.createElement('div');
    card.className = `modal-card${wide ? ' wide' : ''}`;

    const titleEl = document.createElement('h2');
    titleEl.className = 'modal-title';
    titleEl.textContent = title;
    card.appendChild(titleEl);

    if (message) {
        const msgEl = document.createElement('p');
        msgEl.className = 'modal-message';
        msgEl.textContent = message;
        card.appendChild(msgEl);
    }

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // trigger reflow before adding active class for animation
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });

    return { overlay, card };
}

// fade out and remove a modal
function destroyModal(overlay) {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 250);
}

// confirm dialog, resolves true/false
export function showConfirm(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        const { overlay, card } = createModal({ title, message });

        const actions = document.createElement('div');
        actions.className = 'modal-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'auth-btn secondary-btn';
        cancelBtn.textContent = cancelText;
        cancelBtn.type = 'button';

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'auth-btn';
        confirmBtn.textContent = confirmText;
        confirmBtn.type = 'button';

        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);
        card.appendChild(actions);

        cancelBtn.addEventListener('click', () => {
            destroyModal(overlay);
            resolve(false);
        });

        confirmBtn.addEventListener('click', () => {
            destroyModal(overlay);
            resolve(true);
        });

        // overlay click cancels
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                destroyModal(overlay);
                resolve(false);
            }
        });
    });
}

// prompt dialog, resolves input value or null
export function showPrompt(title, message, placeholder = '', defaultValue = '') {
    return new Promise((resolve) => {
        const { overlay, card } = createModal({ title, message });

        const input = document.createElement('input');
        input.className = 'modal-input';
        input.type = 'text';
        input.placeholder = placeholder;
        input.value = defaultValue;
        card.appendChild(input);

        const actions = document.createElement('div');
        actions.className = 'modal-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'auth-btn secondary-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.type = 'button';

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'auth-btn';
        confirmBtn.textContent = 'Confirm';
        confirmBtn.type = 'button';

        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);
        card.appendChild(actions);

        // auto-focus input
        setTimeout(() => input.focus(), 100);

        // enter key submits
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                destroyModal(overlay);
                resolve(input.value.trim());
            }
        });

        cancelBtn.addEventListener('click', () => {
            destroyModal(overlay);
            resolve(null);
        });

        confirmBtn.addEventListener('click', () => {
            destroyModal(overlay);
            resolve(input.value.trim());
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                destroyModal(overlay);
                resolve(null);
            }
        });
    });
}

// invite join modal with confirm/decline callbacks
export function showInviteModal(onConfirm, onDecline) {
    const { overlay, card } = createModal({
        title: 'Join Team?',
        message: "You've been invited to join a hacker squad. Are you ready?",
        wide: true
    });

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const declineBtn = document.createElement('button');
    declineBtn.className = 'auth-btn secondary-btn';
    declineBtn.textContent = 'Nope.';
    declineBtn.type = 'button';

    const joinBtn = document.createElement('button');
    joinBtn.className = 'auth-btn';
    joinBtn.textContent = 'Join Team';
    joinBtn.type = 'button';

    actions.appendChild(declineBtn);
    actions.appendChild(joinBtn);
    card.appendChild(actions);

    // helpers for the callback
    const modal = {
        close: () => destroyModal(overlay),
        setLoading: (loading) => {
            setBtnLoading(joinBtn, loading, "Join Team", false);
        }
    };

    joinBtn.addEventListener('click', () => {
        if (onConfirm) onConfirm(modal);
    });

    declineBtn.addEventListener('click', () => {
        destroyModal(overlay);
        if (onDecline) onDecline();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            destroyModal(overlay);
            if (onDecline) onDecline();
        }
    });

    return modal;
}
