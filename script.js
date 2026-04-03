        // --- Game Configuration & Data ---
        const TOTAL_STEPS = 10;
        
        // Match approximate values from typical crash games
        const GAME_DATA = {
            easy: {
                name: 'Easy', risk: 'Low Risk', riskColor: 'text-emerald-400',
                chance: 0.95, // 95% survival per step
                multipliers: [1.03, 1.07, 1.12, 1.17, 1.23, 1.29, 1.36, 1.44, 1.53, 1.62]
            },
            medium: {
                name: 'Medium', risk: 'Medium Risk', riskColor: 'text-yellow-400',
                chance: 0.85, 
                multipliers: [1.15, 1.33, 1.54, 1.78, 2.07, 2.40, 2.78, 3.23, 3.75, 4.36]
            },
            hard: {
                name: 'Hard', risk: 'High Risk', riskColor: 'text-orange-500',
                chance: 0.70, 
                multipliers: [1.39, 1.95, 2.73, 3.82, 5.35, 7.50, 10.50, 14.70, 20.58, 28.81]
            },
            hardcore: {
                name: 'Hardcore', risk: 'Extreme Risk', riskColor: 'text-red-500',
                chance: 0.50, 
                multipliers: [1.96, 3.84, 7.53, 14.76, 28.93, 56.70, 111.13, 217.82, 426.93, 836.78]
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

        // --- DOM Elements ---
        const els = {
            balance: document.getElementById('balance-display'),
            betInput: document.getElementById('bet-input'),
            profitPreview: document.getElementById('profit-preview'),
            lanesContainer: document.getElementById('lanes-container'),
            explosionEffect: document.getElementById('explosion-effect'),
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
                lane.className = `flex-1 h-full lane-dashed-border relative flex justify-center items-center group transition-colors duration-300`;
                lane.id = `lane-${i}`;
                
                // Multiplier Background Badge
                const badge = document.createElement('div');
                badge.className = `w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 border-slate-700/50 flex items-center justify-center bg-slate-800/50 shadow-inner transition-all duration-300`;
                badge.id = `badge-${i}`;
                
                const text = document.createElement('span');
                text.className = `font-mono font-bold text-slate-500 text-sm sm:text-lg transition-colors`;
                text.innerText = `${multis[i]}x`;
                text.id = `text-${i}`;

                // Grates at the bottom
                const grate = document.createElement('div');
                grate.className = 'absolute bottom-0 w-[80%] h-12 border-t-8 border-slate-900 rounded-t-full opacity-30 flex justify-evenly items-end pb-2 overflow-hidden';
                for(let g=0; g<5; g++) {
                    grate.innerHTML += `<div class="w-1.5 h-full bg-slate-900 rounded-t-sm"></div>`;
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
                els.btnPlay.classList.add('hidden');
                els.playingControls.classList.remove('hidden');
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
                els.btnPlay.classList.remove('hidden');
                els.playingControls.classList.add('hidden');
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
            if (state.isPlaying) return;
            
            state.difficulty = level;
            
            // Update UI styling for difficulty tabs
            const btns = document.querySelectorAll('.diff-btn');
            btns.forEach((btn, i) => {
                if (i === index) {
                    btn.classList.remove('text-slate-400');
                    btn.classList.add('text-white');
                } else {
                    btn.classList.add('text-slate-400');
                    btn.classList.remove('text-white');
                }
            });

            // Move slider
            els.diffSlider.style.transform = `translateX(${index * 100}%)`;
            
            // Update Risk Indicator text
            const diffData = GAME_DATA[level];
            els.riskIndicator.className = `${diffData.riskColor}`;
            els.riskIndicator.innerText = diffData.risk;

            renderLanes();
            updateBetPreview();
        }

        function adjustBet(action) {
            if (state.isPlaying) return;
            if (action === 'half') state.bet = Math.max(0.10, state.bet / 2);
            if (action === 'double') state.bet = Math.min(state.balance, state.bet * 2);
            els.betInput.value = state.bet.toFixed(2);
            updateBetPreview();
        }

        function showMessage(msg, type) {
            els.statusMessage.innerText = msg;
            
            if (type === 'win') els.statusMessage.className = 'text-5xl font-black italic tracking-widest drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] text-emerald-400 animate-win';
            else if (type === 'lose') els.statusMessage.className = 'text-5xl font-black italic tracking-widest drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] text-red-500';
            
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
            hideFinishScreen();
            startGame();
        }

        function triggerExplosion(stepIndex) {
            // Full screen fade in of fire
            els.explosionEffect.style.transition = 'none';
            void els.explosionEffect.offsetWidth; // Reflow
            
            // Fade it in quickly
            els.explosionEffect.style.transition = 'opacity 0.2s ease-out';
            els.explosionEffect.style.opacity = '1';
        }

        // --- Visual Logic ---
        function highlightLane(index, status) {
            const badge = document.getElementById(`badge-${index}`);
            const text = document.getElementById(`text-${index}`);
            const lane = document.getElementById(`lane-${index}`);
            
            if(!badge || !text) return;

            badge.className = `w-14 h-14 sm:w-20 sm:h-20 rounded-full border-4 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform`;
            text.className = `font-mono font-bold transition-all duration-500 text-sm sm:text-lg`;
            lane.style.backgroundColor = 'transparent';

            if (status === 'active') {
                badge.classList.add('border-emerald-500', 'bg-emerald-500/20', 'shadow-[0_0_20px_rgba(16,185,129,0.7)]', 'scale-110');
                text.classList.add('text-emerald-400', 'scale-110');
                lane.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
            } else if (status === 'passed') {
                badge.classList.add('border-emerald-700', 'bg-slate-800');
                text.classList.add('text-emerald-600');
            } else if (status === 'died') {
                badge.classList.add('border-red-500', 'bg-red-500/30', 'shadow-[0_0_25px_rgba(239,68,68,0.8)]', 'scale-110');
                text.classList.add('text-red-400');
                lane.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            } else {
                // Idle
                badge.classList.add('border-slate-700/50', 'bg-slate-800/50');
                text.classList.add('text-slate-500');
            }
        }

        function calculateChickenPosition(stepIndex) {
            const startZoneWidth = document.querySelector('.w-16.sm\\:w-24').offsetWidth;
            if (stepIndex === -1) {
                return `${startZoneWidth / 2}px`; // Center of start zone
            }
            
            const lane = document.getElementById(`lane-${stepIndex}`);
            if(!lane) return '0px';
            
            // X position: Start zone width + (lane index * lane width) + (half lane width)
            const laneWidth = lane.offsetWidth;
            return `${startZoneWidth + (stepIndex * laneWidth) + (laneWidth / 2)}px`;
        }

        function setChickenPosition(stepIndex) {
            const position = calculateChickenPosition(stepIndex);
            els.chickenWrapper.style.transform = `translate3d(${position}, 0, 0) translateX(-50%)`;
        }

        function resetChicken() {
            els.chickenWrapper.style.transition = 'none'; // Snap back
            els.chickenSprite.className = 'w-12 h-12 sm:w-16 sm:h-16 drop-shadow-xl inline-block'; // Reset classes
            els.chickenSprite.style.transform = '';
            els.chickenSprite.style.opacity = '1';
            els.chickenSprite.style.filter = 'drop-shadow(0px 10px 5px rgba(0,0,0,0.5))';
            els.chickenImg.src = 'assets/animation/Chicken.svg';
            
            // Hide Explosion
            els.explosionEffect.style.transition = 'none';
            els.explosionEffect.style.opacity = '0';
            
            setChickenPosition(-1);
            
            // Force reflow before restoring transition
            void els.chickenWrapper.offsetWidth; 
            els.chickenWrapper.style.transition = 'transform 0.58s cubic-bezier(0.22, 1, 0.36, 1)';
        }

        // --- Core Game Loop ---

        function startGame() {
            if (state.balance < state.bet || state.bet <= 0) {
                alert("Invalid bet amount or insufficient balance.");
                return;
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
            if (!state.isPlaying || state.isAnimating) return;
            
            const nextStep = state.currentStep + 1;
            if (nextStep >= TOTAL_STEPS) return;

            state.isAnimating = true;
            updateUI(); // Disable buttons

            const survivalChance = GAME_DATA[state.difficulty].chance;
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
                        triggerExplosion(state.currentStep);
                        setTimeout(() => {
                            finishGame(winAmount, { showFinishScreen: true });
                        }, 300);
                    } else {
                        state.isAnimating = false;
                        updateUI();
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
            if (!state.isPlaying || state.isAnimating || state.currentStep < 0) return;
            
            state.isAnimating = true;
            updateUI();

            const winAmount = state.bet * state.currentMultiplier;
            triggerExplosion(state.currentStep);
            showMessage(`+ $${winAmount.toFixed(2)}`, 'win');
            
            // Visual flair
            const currentBadge = document.getElementById(`badge-${state.currentStep}`);
            if(currentBadge) currentBadge.classList.add('animate-win');

            setTimeout(() => {
                finishGame(winAmount);
            }, 1200);
        }

        function finishGame(winAmount, options = {}) {
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

