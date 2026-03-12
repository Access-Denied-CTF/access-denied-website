// scoreboard rendering and data fetching
import { callFunction } from './appwrite.js';
import { initNav } from './nav.js';
import { showToast } from './toast.js';

// format timestamp to readable date
function formatTime(timestamp) {
    if (!timestamp) return '—';
    const d = new Date(timestamp);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hours}:${mins}`;
}

// rank medal class mapping
function rankClass(rank) {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
}

// build stacked avatar html for teams
function buildAvatarsHtml(avatars) {
    if (!avatars || avatars.length === 0) return '';
    if (avatars.length === 1) {
        return `<img src="${avatars[0]}" alt="Avatar" class="sb-avatar">`;
    }
    // stacked group for multiple members
    const imgs = avatars.map((url, i) =>
        `<img src="${url}" alt="Avatar" class="sb-avatar" style="z-index: ${avatars.length - i};">`
    ).join('');
    return `<div class="sb-avatar-stack">${imgs}</div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
    initNav();

    const tableBody = document.getElementById('sbTableBody');
    const myRankSection = document.getElementById('myRankSection');
    const sbLoader = document.getElementById('sbLoader');

    try {
        const result = await callFunction('get-scoreboard', {});

        if (sbLoader) sbLoader.style.display = 'none';

        if (!result.ok) {
            showToast(result.message || 'Failed to load scoreboard.', 'error');
            tableBody.innerHTML = `<div class="sb-empty">Could not load the scoreboard right now.</div>`;
            return;
        }

        // render top 10 rows
        if (result.top10.length === 0) {
            tableBody.innerHTML = `<div class="sb-empty">No one has completed any phase yet. Be the first!</div>`;
        } else {
            tableBody.innerHTML = '';
            result.top10.forEach(entry => {
                const entityTag = entry.entity_type === 'team'
                    ? `<span class="sb-entity-tag team-tag">Team</span>`
                    : `<span class="sb-entity-tag">Solo</span>`;

                const row = document.createElement('div');
                row.className = `sb-row${entry.rank <= 3 ? ` rank-${entry.rank}` : ''}`;
                row.innerHTML = `
                    <span class="sb-rank ${rankClass(entry.rank)}">${entry.rank}</span>
                    ${buildAvatarsHtml(entry.avatars)}
                    <span class="sb-name">${entry.name} ${entityTag}</span>
                    <span class="sb-phase">${entry.max_phase}/4</span>
                    <span class="sb-time">${formatTime(entry.updated_at)}</span>
                `;
                tableBody.appendChild(row);
            });
        }

        // render current user rank
        if (myRankSection) {
            if (result.myRank) {
                const entityLabel = result.myRank.entity_type === 'team' ? '(Team)' : '(Solo)';
                myRankSection.innerHTML = `
                    <span class="my-rank-label">Your Rank</span>
                    <div class="sb-row" style="border: none; padding: 0;">
                        <span class="sb-rank ${rankClass(result.myRank.rank)}">${result.myRank.rank}</span>
                        ${buildAvatarsHtml(result.myRank.avatars)}
                        <span class="sb-name">${result.myRank.name} <span class="sb-entity-tag ${result.myRank.entity_type === 'team' ? 'team-tag' : ''}">${entityLabel}</span></span>
                        <span class="sb-phase">${result.myRank.max_phase}/4</span>
                        <span class="sb-time">${formatTime(result.myRank.updated_at)}</span>
                    </div>
                `;
            } else {
                myRankSection.innerHTML = `
                    <span class="my-rank-label">Your Rank</span>
                    <span class="sb-rank" style="font-size: 1.5rem; text-align: left;">N/A</span>
                    <p class="my-rank-na">You haven't completed any phase yet. Once you complete at least one phase, your rank will appear here.</p>
                `;
            }
        }

    } catch (err) {
        console.error('Scoreboard fetch failed:', err);
        if (sbLoader) sbLoader.style.display = 'none';
        tableBody.innerHTML = `<div class="sb-empty">Failed to load the scoreboard. Try again later.</div>`;
    }
});
