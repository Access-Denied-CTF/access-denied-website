// team management ui for the account page
import { teams, callFunction } from './appwrite.js';
import { showToast } from './toast.js';
import { showConfirm, showPrompt, showInviteModal } from './modal.js';
import { setBtnLoading } from './utils.js';

export let currentTeam = null;

// dom references
const teamLoader = document.getElementById('teamLoader');
const noTeamState = document.getElementById('noTeamState');
const hasTeamState = document.getElementById('hasTeamState');
const createTeamBtn = document.getElementById('createTeamBtn');
const teamNameInput = document.getElementById('teamNameInput');
const saveTeamNameBtn = document.getElementById('saveTeamNameBtn');
const teamCount = document.getElementById('teamCount');
const teamMembersList = document.getElementById('teamMembersList');
const inviteLinkInput = document.getElementById('inviteLinkInput');
const copyInviteBtn = document.getElementById('copyInviteBtn');
const regenInviteBtn = document.getElementById('regenInviteBtn');
const leaveTeamBtn = document.getElementById('leaveTeamBtn');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const soloProgressSection = document.getElementById('soloProgressSection');
const soloProgressFill = document.getElementById('soloProgressFill');
const soloProgressText = document.getElementById('soloProgressText');


function setLoader(state) {
    if (teamLoader) teamLoader.style.display = state ? 'flex' : 'none';
    if (noTeamState && state) noTeamState.style.display = 'none';
    if (hasTeamState && state) hasTeamState.style.display = 'none';
}

export async function initTeams() {
    setLoader(true);
    await fetchAndRenderTeam();
    await checkInviteLink();
    setupEventListeners();
}

// check for invite token in url and show join modal
async function checkInviteLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteParam = urlParams.get('invite');

    if (!inviteParam) return;

    // expected format: teamId_inviteToken
    const parts = inviteParam.split('_');
    if (parts.length !== 2) return;

    const inviteTeamId = parts[0];

    // user already in a team
    if (currentTeam) {
        if (currentTeam.$id === inviteTeamId) {
            showToast('You are already in this team!', 'info');
        } else {
            showToast('You are already in another team. Leave it first to join a new one.', 'error');
        }
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    // show invite modal
    showInviteModal(
        // join handler
        async (modal) => {
            modal.setLoading(true);
            try {
                const res = await callFunction('teams-join', {
                    teamId: parts[0],
                    inviteToken: parts[1]
                });

                if (res.ok) {
                    showToast('Joined team successfully!', 'success');
                    modal.close();
                    window.history.replaceState({}, document.title, window.location.pathname);
                    setLoader(true);
                    await fetchAndRenderTeam();
                } else {
                    modal.close();
                    window.history.replaceState({}, document.title, window.location.pathname);
                    showToast(res.message || 'Failed to join team.', 'error');
                }
            } catch (err) {
                modal.close();
                window.history.replaceState({}, document.title, window.location.pathname);
                showToast(err.message, 'error');
            }
        },
        // decline handler
        () => {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    );
}

// fetch team data and render appropriate state
async function fetchAndRenderTeam() {
    try {
        const userTeams = await teams.list();

        if (userTeams.total > 0) {
            currentTeam = userTeams.teams[0];

            // fetch real member data
            try {
                const memberData = await callFunction('get-team-members', {
                    teamId: currentTeam.$id
                });

                if (memberData.ok) {
                    renderHasTeamState(currentTeam, memberData.members, memberData.progress);
                } else {
                    // fallback to basic team data
                    renderHasTeamStateFallback(currentTeam);
                }
            } catch (err) {
                console.error('get-team-members failed, using fallback:', err);
                renderHasTeamStateFallback(currentTeam);
            }
        } else {
            currentTeam = null;
            renderNoTeamState();
        }
    } catch (err) {
        console.error("Error fetching team data:", err);
        showToast('Failed to load team data.', 'error');
        renderNoTeamState();
    }
}

async function renderNoTeamState() {
    setLoader(false);
    noTeamState.style.display = 'flex';
    hasTeamState.style.display = 'none';

    // fetch solo progress when not in a team
    try {
        const result = await callFunction('check-progress', {});
        if (result.ok && soloProgressSection) {
            soloProgressSection.style.display = '';
            updateSoloProgressBar(result.max_phase);
        }
    } catch (err) {
        console.error('Could not fetch solo progress:', err);
    }
}

// update solo progress bar
function updateSoloProgressBar(phase) {
    if (!soloProgressFill || !soloProgressText) return;

    const totalPhases = 4;
    const percentage = Math.min((phase / totalPhases) * 100, 100);
    soloProgressFill.style.width = `${percentage}%`;

    if (phase === 0) {
        soloProgressText.textContent = 'No phases completed yet';
    } else if (phase >= totalPhases) {
        soloProgressText.textContent = 'All phases completed!';
    } else {
        soloProgressText.textContent = `Phase ${phase} of ${totalPhases} completed`;
    }
}

// render team state with full member data
function renderHasTeamState(team, members, progress) {
    setLoader(false);
    noTeamState.style.display = 'none';
    hasTeamState.style.display = 'flex';

    teamNameInput.value = team.name;
    teamCount.textContent = `${members.length} / 3`;

    // set invite link
    const inviteDomain = window.location.origin + window.location.pathname;
    const token = team.prefs?.inviteToken || '';
    inviteLinkInput.value = `${inviteDomain}?invite=${team.$id}_${token}`;

    // update progress bar
    const phase = progress?.max_phase || 0;
    updateProgressBar(phase);

    // render members list
    teamMembersList.innerHTML = '';
    members.forEach(member => {
        const avatar = member.avatar || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${member.userId}`;
        const badge = member.isOwner ? `<span class="team-badge">Creator</span>` : '';

        const row = document.createElement('div');
        row.className = 'team-member-row';
        row.innerHTML = `
            <img src="${avatar}" alt="Avatar" class="team-member-avatar">
            <div class="team-member-info">
                <span class="team-member-name">${member.name || 'Unknown Hacker'} ${badge}</span>
                <span class="team-member-email">${member.email || 'Hidden'}</span>
            </div>
        `;
        teamMembersList.appendChild(row);
    });

    saveTeamNameBtn.disabled = true;
}

// fallback render when member data unavailable
function renderHasTeamStateFallback(team) {
    setLoader(false);
    noTeamState.style.display = 'none';
    hasTeamState.style.display = 'flex';

    teamNameInput.value = team.name;
    const prefs = team.prefs || {};

    // invite link
    const inviteDomain = window.location.origin + window.location.pathname;
    const token = prefs.inviteToken || '';
    inviteLinkInput.value = `${inviteDomain}?invite=${team.$id}_${token}`;

    updateProgressBar(0);
    teamMembersList.innerHTML = '<p style="opacity: 0.6; font-size: 0.9rem;">Loading members...</p>';
    teamCount.textContent = '? / 3';

    saveTeamNameBtn.disabled = true;
}

// update progress bar (4 phases)
function updateProgressBar(phase) {
    if (!progressFill || !progressText) return;

    const totalPhases = 4;
    const percentage = Math.min((phase / totalPhases) * 100, 100);
    progressFill.style.width = `${percentage}%`;

    if (phase === 0) {
        progressText.textContent = 'No phases completed yet';
    } else if (phase >= totalPhases) {
        progressText.textContent = 'All phases completed!';
    } else {
        progressText.textContent = `Phase ${phase} of ${totalPhases} completed`;
    }
}

function setupEventListeners() {

    // create team
    if (createTeamBtn) {
        createTeamBtn.addEventListener('click', async () => {
            const desiredName = await showPrompt(
                'Name Your Squad',
                'Pick a cool name for your hacker team (max 32 chars)',
                'e.g. Shadow Raccoons',
                'Anonymous Hackers'
            );

            // cancelled
            if (desiredName === null) return;

            const originalText = createTeamBtn.textContent;
            setBtnLoading(createTeamBtn, true, originalText, false);

            try {
                const res = await callFunction('teams-create', { name: desiredName || 'Anonymous Hackers' });
                if (res.ok) {
                    showToast('Team Created!', 'success');
                    await fetchAndRenderTeam();
                } else {
                    showToast(res.message || 'Failed to create team.', 'error');
                }
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                setBtnLoading(createTeamBtn, false, originalText, false);
            }
        });
    }

    // track name input changes
    if (teamNameInput) {
        teamNameInput.addEventListener('input', () => {
            if (currentTeam && teamNameInput.value.trim() !== currentTeam.name) {
                saveTeamNameBtn.disabled = false;
            } else {
                saveTeamNameBtn.disabled = true;
            }
        });
    }

    // save team name
    if (saveTeamNameBtn) {
        saveTeamNameBtn.addEventListener('click', async () => {
            if (!currentTeam) return;
            const newName = teamNameInput.value.trim();
            if (!newName) {
                showToast("Team name cannot be empty.", "error");
                return;
            }

            const originalText = saveTeamNameBtn.textContent;
            setBtnLoading(saveTeamNameBtn, true, originalText, false);

            try {
                const res = await callFunction('teams-update', {
                    teamId: currentTeam.$id,
                    action: 'update_name',
                    teamName: newName
                });

                if (res.ok) {
                    showToast('Team name updated!', 'success');
                    currentTeam.name = newName;
                    saveTeamNameBtn.disabled = true;
                } else {
                    showToast(res.message || 'Failed to update name.', 'error');
                    saveTeamNameBtn.disabled = false;
                }
            } catch (err) {
                showToast(err.message, 'error');
                saveTeamNameBtn.disabled = false;
            } finally {
                saveTeamNameBtn.textContent = originalText;
            }
        });
    }

    // copy invite link
    if (copyInviteBtn) {
        copyInviteBtn.addEventListener('click', () => {
            if (!inviteLinkInput.value) return;
            navigator.clipboard.writeText(inviteLinkInput.value)
                .then(() => showToast('Link copied to clipboard!', 'success'))
                .catch(() => showToast('Failed to copy link.', 'error'));
        });
    }

    // regenerate invite link
    if (regenInviteBtn) {
        regenInviteBtn.addEventListener('click', async () => {
            if (!currentTeam) return;

            const confirmed = await showConfirm(
                'Regenerate Link?',
                'The old invite link will stop working instantly. Anyone who has it wont be able to join anymore.',
                'Regenerate',
                'Keep It'
            );

            if (!confirmed) return;

            regenInviteBtn.disabled = true;

            try {
                const res = await callFunction('teams-update', {
                    teamId: currentTeam.$id,
                    action: 'regenerate_link'
                });

                if (res.ok) {
                    showToast('Invite link regenerated!', 'success');
                    const inviteDomain = window.location.origin + window.location.pathname;
                    inviteLinkInput.value = `${inviteDomain}?invite=${currentTeam.$id}_${res.inviteToken}`;
                } else {
                    showToast(res.message || 'Failed to regenerate link.', 'error');
                }
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                regenInviteBtn.disabled = false;
            }
        });
    }

    // leave team
    if (leaveTeamBtn) {
        leaveTeamBtn.addEventListener('click', async () => {
            if (!currentTeam) return;

            const confirmed = await showConfirm(
                'Leave Team?',
                'Are you sure you want to leave? If you are the last member, the team will be deleted FOREVER.',
                'Leave',
                'Stay'
            );

            if (!confirmed) return;

            const originalText = leaveTeamBtn.textContent;
            setBtnLoading(leaveTeamBtn, true, originalText, false);

            try {
                const res = await callFunction('teams-leave', {
                    teamId: currentTeam.$id
                });

                if (res.ok) {
                    showToast('Left the team.', 'success');
                    currentTeam = null;
                    await fetchAndRenderTeam();
                } else {
                    showToast(res.message || 'Failed to leave team.', 'error');
                }
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                setBtnLoading(leaveTeamBtn, false, originalText, false);
            }
        });
    }
}
