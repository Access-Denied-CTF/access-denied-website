import { account, callFunction } from './appwrite.js';
import { showToast } from './toast.js';
import { initNav } from './nav.js';
import { initTeams } from './teams.js';
import { getSpinnerSvg, setBtnLoading } from './utils.js';


document.addEventListener('DOMContentLoaded', async () => {
    initNav();

    const loader = document.getElementById('pageLoader');
    const content = document.getElementById('accountContent');

    // redirect if not logged in
    let user;
    try {
        user = await account.get();
    } catch {
        window.location.href = 'login.html';
        return;
    }

    // save button state tracking
    let originalHandle = '';
    let originalAvatar = '';
    let currentHandle = '';
    let currentAvatar = '';
    let isRandomRequested = false;

    // populate profile form
    const prefs = user.prefs || {};
    const handleInput = document.getElementById('handleInput');
    const emailInput = document.getElementById('emailInput');
    const avatarPreview = document.getElementById('avatarPreview');

    if (handleInput) {
        originalHandle = prefs.handle || user.name || '';
        currentHandle = originalHandle;
        handleInput.value = currentHandle;
    }
    if (emailInput) {
        emailInput.value = user.email || '';
    }

    if (avatarPreview) {
        originalAvatar = prefs.avatar;
        if (!originalAvatar) {
            const seed = Math.random().toString(36).substring(2, 10);
            originalAvatar = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}`;
        }
        currentAvatar = originalAvatar;
        avatarPreview.src = currentAvatar;
    }

    if (loader) loader.style.display = 'none';
    if (content) content.style.display = '';

    // load teams ui
    await initTeams();

    // save button change detection
    const saveBtn = document.getElementById('saveProfileBtn');

    function checkChanges() {
        if (!saveBtn) return;
        const hasChanges = (currentHandle !== originalHandle) || (currentAvatar !== originalAvatar) || isRandomRequested;

        saveBtn.disabled = !hasChanges;
        if (hasChanges) {
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
        } else {
            saveBtn.style.opacity = '0.5';
            saveBtn.style.cursor = 'not-allowed';
        }
    }

    // track handle input changes
    if (handleInput) {
        handleInput.addEventListener('input', (e) => {
            currentHandle = e.target.value.trim();
            checkChanges();
        });
    }

    // random avatar generation
    const avatarWrapper = document.getElementById('avatarWrapper');
    const randomAvatarBtn = document.getElementById('randomAvatarBtn');

    // avatar loader overlay
    let avatarLoaderOverlay = null;
    if (avatarWrapper) {
        avatarLoaderOverlay = document.createElement('div');
        avatarLoaderOverlay.style.position = 'absolute';
        avatarLoaderOverlay.style.top = '0';
        avatarLoaderOverlay.style.left = '0';
        avatarLoaderOverlay.style.width = '100%';
        avatarLoaderOverlay.style.height = '100%';
        avatarLoaderOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        avatarLoaderOverlay.style.display = 'flex';
        avatarLoaderOverlay.style.alignItems = 'center';
        avatarLoaderOverlay.style.justifyContent = 'center';
        avatarLoaderOverlay.style.opacity = '0';
        avatarLoaderOverlay.style.transition = 'opacity 0.2s ease';
        avatarLoaderOverlay.style.pointerEvents = 'none';

        avatarLoaderOverlay.innerHTML = getSpinnerSvg(36, false);
        avatarWrapper.appendChild(avatarLoaderOverlay);
    }

    function toggleAvatarSpinner(show) {
        if (avatarLoaderOverlay) {
            avatarLoaderOverlay.style.opacity = show ? '1' : '0';
        }
    }

    if (randomAvatarBtn) {
        randomAvatarBtn.addEventListener('click', () => {
            const seed = Math.random().toString(36).substring(2, 10);

            toggleAvatarSpinner(true);

            // brief delay for visual feedback
            setTimeout(() => {
                isRandomRequested = true;
                currentAvatar = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}`;

                // remove spinner after image loads
                avatarPreview.onload = () => {
                    toggleAvatarSpinner(false);
                    checkChanges();
                };
                avatarPreview.src = currentAvatar;

            }, 300);
        });
    }

    // profile form submission
    const profileForm = document.getElementById('profileForm');

    if (profileForm && saveBtn) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentHandle) {
                showToast('Handle cannot be empty.', 'error');
                return;
            }

            const originalText = saveBtn.textContent;
            setBtnLoading(saveBtn, true, originalText, false);

            try {
                toggleAvatarSpinner(true);

                // build payload for backend
                const payload = {
                    handle: currentHandle,
                    isRandomAvatar: isRandomRequested
                };

                if (isRandomRequested) {
                    // send the preview avatar url
                    payload.avatarBase64 = currentAvatar;
                }

                const result = await callFunction('update-profile', payload);

                if (!result.ok) {
                    throw new Error(result.message || 'Failed to update profile.');
                }

                showToast('Profile updated!', 'success');

                // sync state after save
                originalHandle = result.handle;
                originalAvatar = result.avatar;
                currentAvatar = result.avatar;
                isRandomRequested = false;

                if (avatarPreview) {
                    avatarPreview.src = currentAvatar;
                }

                checkChanges();

            } catch (err) {
                showToast(err.message || 'Failed to update profile.', 'error');
                setBtnLoading(saveBtn, false, originalText, false);
                saveBtn.style.cursor = 'pointer';
            } finally {
                toggleAvatarSpinner(false);
                setBtnLoading(saveBtn, false, originalText, false);
            }
        });
    }

    // logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await account.deleteSession('current');
                showToast('Logged out successfully.', 'success');
                setTimeout(() => { window.location.href = 'login.html'; }, 800);
            } catch (err) {
                showToast('Logout failed. Try again.', 'error');
            }
        });
    }
});
