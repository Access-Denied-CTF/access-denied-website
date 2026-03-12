import { account } from './appwrite.js';
import { getSpinnerSvg } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    const footprintsContainer = document.getElementById('footprints');

    const pawSvg = `
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path d="M226.5 92.9c14.3 42.9-.3 86.4-32.6 96.8s-70.1-15.6-84.4-58.5-.3-86.4 32.6-96.8 70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.8-10.2 85.8s-59.7-4.1-78.6-36.5-14.3-70.8 10.2-85.8 59.7 4.1 78.6 36.5zM350.7 48.6c-28.1-17.4-66.2-1.9-85.1 34.7s-11.4 80.4 16.7 97.8 66.2 1.9 85.1-34.7 11.4-80.4-16.7-97.8zM416.7 170c-26.6-14-63.5.7-82.5 32.8s-13 71.5 13.6 85.5 63.5-.7 82.5-32.8 13-71.5-13.6-85.5zM425.2 320c-35.4-8.8-71.6 15-81.8 53-12.7 47.3-65.7 65.6-114.7 39.5-27-14.4-60.8-3-73.4 20.9-10.9 20.6-5.8 45.4 12.5 59.8 44.5 34.6 109.8 43.1 163.7 18.6 70.3-31.9 146.4-48.4 148.4-118.4 1.2-46.1-23.7-65.5-54.7-73.4z"/>
        </svg>
    `;

    // wait for raccoon image to load
    setTimeout(() => {
        let startX = window.innerWidth * 0.4;
        let startY = 300;

        const mascot = document.getElementById('raccoon');
        if (mascot) {
            const rect = mascot.getBoundingClientRect();
            // start footprints from the raccoon's foot position
            startX = rect.right ? (rect.right + window.scrollX + 20) : startX;
            startY = rect.bottom ? (rect.bottom + window.scrollY - 100) : startY;
        }

        if (window.innerWidth < 768) {
            startX = window.innerWidth / 2;
            const heroLeftRect = document.querySelector('.hero-left').getBoundingClientRect();
            startY = heroLeftRect.bottom + window.scrollY + 20;
        }

        const containerHeight = document.body.scrollHeight;
        const footstepYDistance = 70;
        const totalFootprints = Math.floor((containerHeight - startY) / footstepYDistance);
        const maxFootprints = Math.min(totalFootprints, 30);

        for (let i = 0; i < maxFootprints; i++) {
            const footprint = document.createElement('div');
            footprint.className = 'footprint';
            footprint.innerHTML = pawSvg;

            // zigzag pattern for natural walking
            const isRightPos = i % 2 !== 0;
            const xOffset = isRightPos ? 35 : -35;

            // sine drift for realism
            const drift = Math.sin(i * 0.3) * 50;

            const xPos = startX + xOffset + drift;
            const yPos = startY + (i * footstepYDistance);

            footprint.style.left = `${xPos}px`;
            footprint.style.top = `${yPos}px`;

            // rotate paw to face downward
            const baseRotation = isRightPos ? 160 : 200;
            const driftRotation = Math.cos(i * 0.3) * 20;
            const rotation = baseRotation + driftRotation;

            footprint.style.transform = `scale(0.5) rotate(${rotation}deg)`;

            footprintsContainer.appendChild(footprint);

            // reveal footprints on scroll
            const revealPaws = () => {
                const scrollPos = window.scrollY + window.innerHeight;
                if (scrollPos > yPos + 50) {
                    footprint.classList.add('visible');
                    footprint.style.transform = `scale(1) rotate(${rotation}deg)`;
                }
            };

            setTimeout(revealPaws, 300 + (i * 150));
            window.addEventListener('scroll', revealPaws);
        }
    }, 500);
    // horizontal scroll navigation
    const scrollContainer = document.getElementById('phasesScroll');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');

    if (scrollContainer && btnPrev && btnNext) {
        const checkButtons = () => {
            btnPrev.style.display = scrollContainer.scrollLeft <= 10 ? 'none' : 'flex';
            const isAtEnd = scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth - 10;
            btnNext.style.display = isAtEnd ? 'none' : 'flex';
        };

        scrollContainer.addEventListener('scroll', checkButtons);
        window.addEventListener('resize', checkButtons);
        setTimeout(checkButtons, 100); // check on load

        btnNext.addEventListener('click', () => {
            const cardWidth = scrollContainer.querySelector('.phase-card').offsetWidth;
            const style = window.getComputedStyle(scrollContainer);
            const gap = parseInt(style.getPropertyValue('gap')) || 0;
            scrollContainer.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
        });

        btnPrev.addEventListener('click', () => {
            const cardWidth = scrollContainer.querySelector('.phase-card').offsetWidth;
            const style = window.getComputedStyle(scrollContainer);
            const gap = parseInt(style.getPropertyValue('gap')) || 0;
            scrollContainer.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
        });
    }

    // index page auth check
    const homeForm = document.getElementById('homeSignupForm');
    const homeEmail = document.getElementById('homeEmailInput');
    const homeSubmitBtn = document.getElementById('homeSubmitBtn');
    const homeSubmitText = document.getElementById('homeSubmitText');
    const homeSubmitIcon = document.getElementById('homeSubmitIcon');

    if (homeForm && homeEmail && homeSubmitBtn) {
        // show spinner while checking auth
        const originalText = homeSubmitText ? homeSubmitText.textContent : 'start hacking';

        homeSubmitBtn.disabled = true;
        if (homeSubmitText) homeSubmitText.textContent = 'loading...';
        if (homeSubmitIcon) homeSubmitIcon.style.display = 'none';

        // loading spinner
        const spinnerSvg = getSpinnerSvg(20, false);
        homeSubmitBtn.insertAdjacentHTML('afterbegin', spinnerSvg);

        try {
            const user = await account.get();
            // user is logged in
            const spinner = homeSubmitBtn.querySelector('.btn-spinner');
            if (spinner) spinner.remove();

            homeEmail.value = user.email;
            homeEmail.disabled = true;
            homeEmail.style.opacity = '0.7';
            homeEmail.style.cursor = 'not-allowed';

            if (homeSubmitText) {
                homeSubmitText.textContent = "We'll notify you when it starts";
                homeSubmitText.style.fontSize = "0.95rem";
            }
            if (homeSubmitIcon) homeSubmitIcon.style.display = 'inline-block';

            // disable button without greying it out
            homeSubmitBtn.disabled = false;
            homeSubmitBtn.style.pointerEvents = 'none';
            homeSubmitBtn.style.opacity = '0.9';

            homeForm.onsubmit = (e) => {
                e.preventDefault();
            };
        } catch (err) {
            // not logged in, setup signup redirect
            const spinner = homeSubmitBtn.querySelector('.btn-spinner');
            if (spinner) spinner.remove();

            homeSubmitBtn.disabled = false;
            if (homeSubmitText) homeSubmitText.textContent = originalText;
            if (homeSubmitIcon) homeSubmitIcon.style.display = 'inline-block';

            homeForm.onsubmit = (e) => {
                e.preventDefault();
                const email = encodeURIComponent(homeEmail.value.trim());
                window.location.href = `signup.html?email=${email}`;
            };
        }
    }
});
