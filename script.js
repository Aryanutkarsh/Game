        // --- Game Configuration & Data ---
        const TOTAL_STEPS = 10;
        
        // Match approximate values from typical crash games
        const GAME_DATA = {
            easy: {
                name: 'Easy', risk: 'Low Risk', riskColor: 'bg-neo-white',
                chance: 0.95, // 95% survival per step
                multipliers: [1.03, 1.07, 1.12, 1.17, 1.23, 1.29, 1.36, 1.44, 1.53, 1.62]
            },
            medium: {
                name: 'Medium', risk: 'Medium Risk', riskColor: 'bg-neo-yellow',
                chance: 0.85, 
                multipliers: [1.15, 1.33, 1.54, 1.78, 2.07, 2.40, 2.78, 3.23, 3.75, 4.36]
            },
            hardcore: {
                name: 'Hardcore', risk: 'Extreme Risk', riskColor: 'bg-neo-red',
                chance: [0.85, 0.80, 0.75, 0.70, 0.65, 0.60, 0.55, 0.50, 0.45, 0.40], 
                multipliers: [1.12, 1.44, 1.95, 2.70, 4.30, 6.80, 12.50, 25.00, 55.00, 140.00]
            }
        };

        // --- State Variables ---
        let state = {
            balance: 1000.00,
            bet: 10.00,
            difficulty: 'easy',
            isPlaying: false,
            currentStep: -1, // -1 is start zone, 0 is first lane
            isAnimating: false,
            currentMultiplier: 0,
            showingFinishScreen: false
        };

        // --- Sounds ---
        const sounds = {
            bgMusic: new Audio('game_music/bg-muisc.mp3'),
            button: new Audio('game_music/button.mp3'),
            money: new Audio('game_music/money.mp3'),
            fire: new Audio('game_music/fire.wav'),
            reward: new Audio('game_music/reward.wav')
        };
        sounds.bgMusic.loop = true;
        sounds.bgMusic.volume = 0.4;

        let moneySoundTimeout = null;
        function playMoneySound() {
            if (moneySoundTimeout) clearTimeout(moneySoundTimeout);
            sounds.money.currentTime = 0;
            sounds.money.play().catch(() => {});
            moneySoundTimeout = setTimeout(() => {
                sounds.money.pause();
                sounds.money.currentTime = 0;
            }, 5000);
        }

        function playButtonClick() {
            sounds.button.currentTime = 0;
            sounds.button.play().catch(() => {});
        }

        // --- DOM Elements ---
        const els = {
            balance: document.getElementById('balance-display'),
            betInput: document.getElementById('bet-input'),
            profitPreview: document.getElementById('profit-preview'),
            lanesContainer: document.getElementById('lanes-container'),
            explosionEffect: document.getElementById('explosion-effect'),
            moneyEffect: document.getElementById('money-effect'),
            chickenWrapper: document.getElementById('chicken-wrapper'),
            chickenSprite: document.getElementById('chicken-sprite'),
            chickenImg: document.getElementById('chicken-img'),
            btnPlay: document.getElementById('btn-play'),
            playingControls: document.getElementById('playing-controls'),
            btnCashout: document.getElementById('btn-cashout'),
            cashoutAmount: document.getElementById('cashout-amount'),
            btnNext: document.getElementById('btn-next'),
            nextMulti: document.getElementById('next-multi-display'),
            riskIndicator: document.getElementById('risk-indicator'),
            diffSlider: document.getElementById('difficulty-slider'),
            statusOverlay: document.getElementById('status-overlay'),
            statusMessage: document.getElementById('status-message'),
            finishOverlay: document.getElementById('finish-overlay'),
            finishEarned: document.getElementById('finish-earned'),
            finishBalance: document.getElementById('finish-balance')
        };

        // --- Initialization ---
        function init() {
            renderLanes();
            updateUI();
            
            // Handle bet input changes
            els.betInput.addEventListener('input', (e) => {
                let val = parseFloat(e.target.value);
                if (isNaN(val) || val < 0) val = 0;
                state.bet = val;
                updateBetPreview();
            });
            els.betInput.addEventListener('blur', () => {
                els.betInput.value = state.bet.toFixed(2);
            });
        }

        // --- UI Rendering & Updates ---
        function renderLanes() {
            els.lanesContainer.innerHTML = '';
            const multis = GAME_DATA[state.difficulty].multipliers;
            
            for (let i = 0; i < TOTAL_STEPS; i++) {
                const lane = document.createElement('div');
                lane.className = `flex-1 h-full border-r-4 border-neo-black relative flex justify-center items-center group transition-colors duration-100 bg-neo-white`;
                lane.id = `lane-${i}`;
                
                // Multiplier Background Badge
                const badge = document.createElement('div');
                badge.className = `w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-neo-black flex items-center justify-center bg-neo-white shadow-neo-sm transition-all duration-100 z-20 relative`;
                badge.id = `badge-${i}`;
                
                const text = document.createElement('span');
                text.className = `font-black text-neo-black text-xs sm:text-sm transition-colors uppercase`;
                text.innerText = `${multis[i]}x`;
                text.id = `text-${i}`;

                // Grates at the bottom (Redesigned as Neo-Brutalist vents)
                const grate = document.createElement('div');
                grate.className = 'absolute bottom-0 w-full h-12 border-t-4 border-neo-black bg-neo-yellow flex justify-evenly items-end pb-1 overflow-hidden z-10';
                for(let g=0; g<3; g++) {
                    grate.innerHTML += `<div class="w-2 sm:w-3 h-full border-l-4 border-r-4 border-neo-black bg-neo-white"></div>`;
                }

                badge.appendChild(text);
                lane.appendChild(badge);
                lane.appendChild(grate);
                els.lanesContainer.appendChild(lane);
            }
        }

        function updateUI() {
            els.balance.innerText = state.balance.toFixed(2);
            els.betInput.disabled = state.isPlaying;
            
            // Toggle controls
            if (state.isPlaying) {
                els.btnPlay.style.display = 'none';
                els.playingControls.style.display = 'flex';
                els.profitPreview.classList.add('opacity-100');
                
                // Update active buttons based on state
                if (state.currentStep >= 0) {
                    const currentWin = state.bet * GAME_DATA[state.difficulty].multipliers[state.currentStep];
                    els.cashoutAmount.innerText = `$${currentWin.toFixed(2)}`;
                    els.profitPreview.innerText = `Win: $${currentWin.toFixed(2)}`;
                } else {
                    els.cashoutAmount.innerText = `$0.00`;
                    els.profitPreview.innerText = `Win: $0.00`;
                    els.btnCashout.disabled = true; // Cannot cashout before first jump
                }

                if (state.currentStep < TOTAL_STEPS - 1) {
                    els.nextMulti.innerText = `${GAME_DATA[state.difficulty].multipliers[state.currentStep + 1]}x`;
                    els.btnNext.disabled = false;
                } else {
                    els.btnNext.disabled = true; // Reached end
                }

                // Disable during animation
                if(state.isAnimating) {
                    els.btnCashout.disabled = true;
                    els.btnNext.disabled = true;
                } else if (state.currentStep >= 0) {
                    els.btnCashout.disabled = false;
                }

            } else {
                els.btnPlay.style.display = 'block';
                els.playingControls.style.display = 'none';
                els.profitPreview.classList.remove('opacity-100');
                
                // Reset lane highlights
                if (!state.showingFinishScreen) {
                    for (let i = 0; i < TOTAL_STEPS; i++) {
                        highlightLane(i, 'idle');
                    }
                }
            }
        }

        function updateBetPreview() {
            if(!state.isPlaying) {
                 const potentialFirstWin = state.bet * GAME_DATA[state.difficulty].multipliers[0];
                 els.profitPreview.innerText = `First Jump: $${potentialFirstWin.toFixed(2)}`;
                 els.profitPreview.classList.add('opacity-100');
            }
        }

        function setDifficulty(level, index) {
            playButtonClick();
            if (state.isPlaying) {
                // Reset the game/cashout automatically if difficulty is toggled during play
                cashOut(); 
                if (state.isPlaying) {
                    finishGame(0);
                }
            }
            
            state.difficulty = level;
            
            // Update UI styling for difficulty tabs
            const btns = document.querySelectorAll('.diff-btn');
            btns.forEach((btn, i) => {
                if (i === index) {
                    btn.classList.add('bg-neo-red', 'text-neo-white', 'shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]');
                    btn.classList.remove('bg-neo-white', 'bg-neo-black', 'text-neo-black');
                } else {
                    btn.classList.remove('bg-neo-red', 'text-neo-white', 'shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]');
                    btn.classList.add('bg-neo-black', 'text-white');
                    if(i===0) btn.classList.replace('bg-neo-black', 'bg-neo-white'); // Easy starts white usually, text handles via index.html default classes 
                    // Let's reset purely to the default html classes by resetting className to a base then re-applying. Actually, let's keep it simple:
                }
            });
            // Pure reset approach:
            btns[0].className = `diff-btn border-4 border-neo-black ${index===0 ? 'bg-neo-red text-white shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]' : 'bg-neo-white text-neo-black'} hover:bg-neo-yellow active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex-1 text-sm font-black uppercase tracking-wider transition-all duration-100 ease-linear`;
            btns[1].className = `diff-btn border-4 border-neo-black ${index===1 ? 'bg-neo-red text-white shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]' : 'bg-neo-black text-white'} hover:bg-neo-orange hover:text-neo-black flex-1 text-sm font-black uppercase tracking-wider transition-all duration-100 ease-linear`;
            btns[2].className = `diff-btn border-4 border-neo-black ${index===2 ? 'bg-neo-red text-white shadow-[inset_4px_4px_0_rgba(0,0,0,0.5)]' : 'bg-neo-black text-white'} hover:bg-[#8B0000] hover:text-neo-white flex-1 text-sm font-black uppercase tracking-wider transition-all duration-100 ease-linear`;
            
            // Move slider - removed since we use raw states now in brutalism
            if(els.diffSlider) els.diffSlider.style.display = 'none'; 
            
            // Update Risk Indicator text
            const diffData = GAME_DATA[level];
            els.riskIndicator.className = `text-neo-black px-2 py-1 font-black shadow-[2px_2px_0_#000] border-2 border-neo-black uppercase tracking-wider text-xs ${diffData.riskColor}`;
            els.riskIndicator.innerText = diffData.risk;

            renderLanes();
            updateBetPreview();
        }

        function adjustBet(action) {
            playButtonClick();
            if (state.isPlaying) return;
            if (action === 'half') state.bet = Math.max(0.10, state.bet / 2);
            if (action === 'double') state.bet = Math.min(state.balance, state.bet * 2);
            els.betInput.value = state.bet.toFixed(2);
            updateBetPreview();
        }

        function showMessage(msg, type) {
            els.statusMessage.innerText = msg;
            
            if (type === 'win') els.statusMessage.className = 'text-7xl font-black uppercase tracking-tighter text-neo-yellow drop-shadow-[4px_4px_0_#FFF] animate-win';
            else if (type === 'lose') els.statusMessage.className = 'text-7xl font-black uppercase tracking-tighter text-neo-red drop-shadow-[4px_4px_0_#FFF]';
            
            els.statusMessage.style.webkitTextStroke = "3px black";
            els.statusMessage.style.textShadow = "6px 6px 0px #000";

            els.statusOverlay.classList.remove('opacity-0');
            setTimeout(() => {
                els.statusOverlay.classList.add('opacity-0');
            }, 2000);
        }

        function showFinishScreen(winAmount) {
            state.showingFinishScreen = true;
            els.finishEarned.innerText = `$${winAmount.toFixed(2)}`;
            els.finishBalance.innerText = `$${state.balance.toFixed(2)}`;
            els.finishOverlay.classList.remove('hidden');
            els.finishOverlay.classList.add('flex');
        }

        function hideFinishScreen() {
            state.showingFinishScreen = false;
            els.finishOverlay.classList.add('hidden');
            els.finishOverlay.classList.remove('flex');
        }

        function playAgainFromFinish() {
            playButtonClick();
            hideFinishScreen();
            startGame();
        }

        let explosionTimeout;
        let moneyTimeout;
        let idleTimer = null;

        function clearIdleTimer() {
            if (idleTimer) {
                clearTimeout(idleTimer);
                idleTimer = null;
            }
        }

        function startIdleTimer() {
            clearIdleTimer();
            if (!state.isPlaying || state.isAnimating) return;
            if (state.currentStep >= TOTAL_STEPS - 1) return;

            idleTimer = setTimeout(() => {
                if (!state.isPlaying || state.isAnimating) return;
                handleIdleDeath();
            }, 3000);
        }

        function handleIdleDeath() {
            state.isAnimating = true;
            updateUI();
            
            highlightLane(state.currentStep, 'died');
            
            // Death Animation
            els.chickenImg.src = 'assets/animation/fried.svg';
            els.chickenSprite.classList.add('animate-squash');
            
            triggerExplosion(state.currentStep);
            showMessage('KEEP MOVING!', 'lose');

            setTimeout(() => {
                finishGame(0);
            }, 1500);
        }

        function triggerExplosion(stepIndex) {
            // Full screen fade in of fire
            els.explosionEffect.style.transition = 'none';
            void els.explosionEffect.offsetWidth; // Reflow
            
            // Fade it in quickly
            els.explosionEffect.style.transition = 'opacity 0.2s ease-out';
            els.explosionEffect.style.opacity = '1';
            
            // Play fire sound
            sounds.fire.currentTime = 0;
            sounds.fire.play().catch(() => {});
            
            // Handle fade out after 6 seconds
            if(explosionTimeout) clearTimeout(explosionTimeout);
            explosionTimeout = setTimeout(() => {
                els.explosionEffect.style.transition = 'opacity 0.5s ease-in';
                els.explosionEffect.style.opacity = '0';
            }, 6000);
        }

        function triggerMoneyFalling() {
            els.moneyEffect.style.transition = 'none';
            void els.moneyEffect.offsetWidth; // Reflow
            
            els.moneyEffect.style.transition = 'opacity 0.2s ease-out';
            els.moneyEffect.style.opacity = '1';
            
            if(moneyTimeout) clearTimeout(moneyTimeout);
            moneyTimeout = setTimeout(() => {
                els.moneyEffect.style.transition = 'opacity 0.5s ease-in';
                els.moneyEffect.style.opacity = '0';
            }, 5000);
        }

        // --- Visual Logic ---
        function highlightLane(index, status) {
            const badge = document.getElementById(`badge-${index}`);
            const text = document.getElementById(`text-${index}`);
            const lane = document.getElementById(`lane-${index}`);
            
            if(!badge || !text) return;

            badge.className = `w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 flex items-center justify-center transition-all duration-100 ease-linear transform z-20 relative`;
            text.className = `font-black uppercase transition-all duration-100 text-xs sm:text-sm`;
            lane.style.backgroundColor = '';

            if (status === 'active') {
                badge.classList.add('border-neo-black', 'bg-neo-yellow', 'shadow-neo-sm', 'scale-110');
                text.classList.add('text-neo-black');
                lane.classList.add('bg-neo-yellow');
                lane.classList.remove('bg-neo-white', 'bg-neo-orange', 'bg-neo-red');
            } else if (status === 'passed') {
                badge.classList.add('border-neo-black', 'bg-neo-orange', 'shadow-[2px_2px_0_#000]');
                text.classList.add('text-neo-white');
                lane.classList.add('bg-neo-cream', 'opacity-90');
                lane.classList.remove('bg-neo-white', 'bg-neo-yellow', 'bg-neo-red');
            } else if (status === 'died') {
                badge.classList.add('border-neo-black', 'bg-neo-red', 'shadow-neo', 'scale-125', 'rotate-6');
                text.classList.add('text-neo-white');
                lane.classList.add('bg-neo-red');
                lane.classList.remove('bg-neo-white', 'bg-neo-yellow', 'bg-neo-cream');
            } else {
                // Idle
                badge.classList.add('border-neo-black', 'bg-neo-white');
                text.classList.add('text-neo-black');
                lane.classList.add('bg-neo-white');
                lane.classList.remove('bg-neo-yellow', 'bg-neo-cream', 'bg-neo-red');
            }
        }

        function calculateChickenPosition(stepIndex) {
            const startZoneInfo = document.getElementById('start-zone');
            const startZoneWidth = startZoneInfo ? startZoneInfo.offsetWidth : 96; // fallback 6rem
            
            if (stepIndex === -1) {
                // Return center of the start zone, moved slightly ahead to sit better in the door
                return `${(startZoneWidth / 2) + 12}px`;
            }
            
            const lane = document.getElementById(`lane-${stepIndex}`);
            if(!lane) return '0px';
            
            // X position: Start zone width + (lane index * lane width) + (half lane width)
            const laneWidth = lane.offsetWidth;
            const targetCenter = startZoneWidth + (stepIndex * laneWidth) + (laneWidth / 2);
            return `${targetCenter}px`;
        }

        function setChickenPosition(stepIndex) {
            const position = calculateChickenPosition(stepIndex);
            els.chickenWrapper.style.transform = `translate3d(${position}, 0, 0) translateX(-50%)`;
        }

        function resetChicken() {
            els.chickenWrapper.style.transition = 'none'; // Snap back
            els.chickenSprite.className = 'w-20 h-20 sm:w-24 sm:h-24 drop-shadow-xl inline-block'; // Reset classes
            els.chickenSprite.style.transform = '';
            els.chickenSprite.style.opacity = '1';
            els.chickenSprite.style.filter = 'drop-shadow(0px 10px 5px rgba(0,0,0,0.5))';
            els.chickenImg.src = 'assets/animation/Chicken.svg';
            
            // Do not hide explosion here immediately to allow 6s play
            
            setChickenPosition(-1);
            
            // Force reflow before restoring transition
            void els.chickenWrapper.offsetWidth; 
            els.chickenWrapper.style.transition = 'transform 0.58s cubic-bezier(0.22, 1, 0.36, 1)';
        }

        // --- Core Game Loop ---

        function startGame() {
            playButtonClick();
            clearIdleTimer();
            if (state.balance < state.bet || state.bet <= 0) {
                alert("Invalid bet amount or insufficient balance.");
                return;
            }

            // Immediately clear explosion on new game
            if(explosionTimeout) {
                clearTimeout(explosionTimeout);
                explosionTimeout = null;
            }
            if(moneyTimeout) {
                clearTimeout(moneyTimeout);
                moneyTimeout = null;
            }
            els.explosionEffect.style.transition = 'none';
            els.explosionEffect.style.opacity = '0';
            els.moneyEffect.style.transition = 'none';
            els.moneyEffect.style.opacity = '0';

            // Start background music on first play
            if (sounds.bgMusic.paused) {
                sounds.bgMusic.play().catch(e => console.log('Audio playback prevented by browser:', e));
            }

            hideFinishScreen();
            resetChicken();

            // Deduct Bet
            state.balance -= state.bet;
            state.isPlaying = true;
            state.currentStep = -1;
            state.currentMultiplier = 0;
            state.showingFinishScreen = false;
            
            resetChicken();
            renderLanes(); // Reset UI
            updateUI();
            
            // Automatically trigger first jump for better UX
            setTimeout(() => takeStep(), 100);
        }

        function takeStep() {
            playButtonClick();
            clearIdleTimer();
            if (!state.isPlaying || state.isAnimating) return;
            
            const nextStep = state.currentStep + 1;
            if (nextStep >= TOTAL_STEPS) return;

            state.isAnimating = true;
            updateUI(); // Disable buttons
            
            // Play reward sound on each jump
            sounds.reward.currentTime = 0;
            sounds.reward.play().catch(() => {});

            const chanceData = GAME_DATA[state.difficulty].chance;
            const survivalChance = Array.isArray(chanceData) ? chanceData[nextStep] : chanceData;
            const roll = Math.random();
            const survives = roll <= survivalChance;

            // Animate jump logic
            els.chickenSprite.classList.add('animate-hop');
            
            // Wait slight delay before moving horizontally to sync with arc
            setTimeout(() => {
                setChickenPosition(nextStep);
            }, 50);

            // Calculate outcome timing
            setTimeout(() => {
                els.chickenSprite.classList.remove('animate-hop');
                
                if (survives) {
                    // --- SUCCESS ---
                    if (state.currentStep >= 0) highlightLane(state.currentStep, 'passed');
                    state.currentStep = nextStep;
                    state.currentMultiplier = GAME_DATA[state.difficulty].multipliers[state.currentStep];
                    highlightLane(state.currentStep, 'active');
                    
                    if (state.currentStep === TOTAL_STEPS - 1) {
                        // Reached the end without getting hurt
                        const winAmount = state.bet * state.currentMultiplier;
                        
                        playMoneySound();
                        
                        triggerMoneyFalling();
                        setTimeout(() => {
                            finishGame(winAmount, { showFinishScreen: true });
                        }, 300);
                    } else {
                        state.isAnimating = false;
                        updateUI();
                        startIdleTimer();
                    }

                } else {
                    // --- DEATH ---
                    state.currentStep = nextStep;
                    highlightLane(state.currentStep, 'died');
                    
                    // Death Animation
                    els.chickenImg.src = 'assets/animation/fried.svg'; // Turn to food
                    els.chickenSprite.classList.add('animate-squash');
                    
                    triggerExplosion(nextStep);
                    showMessage('FRIED!', 'lose');

                    setTimeout(() => {
                        finishGame(0); // 0 profit
                    }, 1500);
                }
            }, 580); // Matches hop animation duration
        }

        function cashOut() {
            playButtonClick();
            clearIdleTimer();
            if (!state.isPlaying || state.isAnimating || state.currentStep < 0) return;
            
            state.isAnimating = true;
            updateUI();

            const winAmount = state.bet * state.currentMultiplier;
            
            // Play reward sound
            playMoneySound();

            triggerMoneyFalling();
            showMessage(`+ $${winAmount.toFixed(2)}`, 'win');
            
            // Visual flair
            const currentBadge = document.getElementById(`badge-${state.currentStep}`);
            if(currentBadge) currentBadge.classList.add('animate-win');

            setTimeout(() => {
                finishGame(winAmount);
            }, 1200);
        }

        function finishGame(winAmount, options = {}) {
            clearIdleTimer();
            state.balance += winAmount;
            state.isPlaying = false;
            state.isAnimating = false;
            
            updateUI();

            if (options.showFinishScreen) {
                showFinishScreen(winAmount);
                return;
            }

            // Reset visually after a short delay
            setTimeout(() => {
                 if(!state.isPlaying) {
                     resetChicken();
                     renderLanes();
                 }
            }, 500);
        }

        // Handle Window Resize to keep chicken positioned correctly
        window.addEventListener('resize', () => {
            if(!state.isAnimating) {
                // Temporarily remove transition for instant snap on resize
                els.chickenWrapper.style.transition = 'none';
                setChickenPosition(state.currentStep);
                
                void els.chickenWrapper.offsetWidth;
                els.chickenWrapper.style.transition = 'transform 0.58s cubic-bezier(0.22, 1, 0.36, 1)';
            }
        });

        // Start
        init();

