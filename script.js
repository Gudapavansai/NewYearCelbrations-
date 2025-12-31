window.onload = () => {
    // === ELEMENTS ===
    const texts = document.querySelectorAll('.svg-text');
    const replayBtn = document.getElementById('replayBtn');
    const scribblePath = document.getElementById('scribble-path');
    let scribbleLen = 0;
    const colorLayer = document.querySelector('.color-layer');
    const sketchLayer = document.querySelector('.sketch-layer');
    const canvas = document.getElementById('fireworks-canvas');
    const ctx = canvas.getContext('2d');
    const paperTexture = document.querySelector('.paper-texture');
    const textWrapper = document.querySelector('.text-wrapper-outer');
    const app = document.getElementById('app');

    // === CONSTANTS ===
    const LOOP_DELAY = 15000; // Total cycle length before restart
    let loopTimeout;
    let animationId; // Animation frame ID

    // === GSAP SETUP ===
    gsap.registerPlugin(ScrollTrigger, Flip);

    // === 3D MOUSE FOLLOW EFFECT ===
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Smooth mouse follow animation
    function animateMouseFollow() {
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;

        // Apply 3D tilt to paper
        if (paperTexture) {
            const rotateY = currentX * 15; // Max 15 degrees
            const rotateX = -currentY * 15;
            gsap.to(paperTexture, {
                rotationY: rotateY,
                rotationX: rotateX,
                duration: 0.5,
                ease: "power2.out",
                transformPerspective: 1000
            });
        }

        // Apply subtle tilt to text wrapper
        if (textWrapper) {
            const rotateY = currentX * 10;
            const rotateX = -currentY * 10;
            gsap.to(textWrapper, {
                rotationY: rotateY,
                rotationX: rotateX,
                duration: 0.5,
                ease: "power2.out",
                transformPerspective: 1000
            });
        }

        requestAnimationFrame(animateMouseFollow);
    }
    animateMouseFollow();

    // === INITIAL 3D ENTRANCE ANIMATIONS ===
    function initGSAPAnimations() {
        // Paper entrance - 3D flip and scale
        gsap.from(paperTexture, {
            duration: 1.5,
            rotationY: -90,
            scale: 0.5,
            opacity: 0,
            ease: "power3.out",
            delay: 0.3
        });

        // Text wrapper entrance - slide from right with 3D rotation
        gsap.from(textWrapper, {
            duration: 1.2,
            x: 200,
            rotationY: 90,
            opacity: 0,
            ease: "power3.out",
            delay: 0.6
        });

        // Replay button entrance
        gsap.from(replayBtn, {
            duration: 0.8,
            y: 50,
            opacity: 0,
            ease: "back.out(1.7)",
            delay: 1.2
        });

        // Add floating animation to paper
        gsap.to(paperTexture, {
            y: -10,
            duration: 2,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true
        });

        // Add subtle floating to text wrapper
        gsap.to(textWrapper, {
            y: -8,
            duration: 2.5,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            delay: 0.5
        });

        // Add 3D rotation animation to button on hover
        if (replayBtn) {
            replayBtn.addEventListener('mouseenter', () => {
                gsap.to(replayBtn, {
                    scale: 1.1,
                    rotationX: 5,
                    rotationY: 5,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });

            replayBtn.addEventListener('mouseleave', () => {
                gsap.to(replayBtn, {
                    scale: 1,
                    rotationX: 0,
                    rotationY: 0,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
        }
    }

    // Call initial animations
    initGSAPAnimations();

    // === FIREWORKS SYSTEM ===

    let fireworks = [];
    let particles = [];

    function resizeCanvas() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Firework {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height;
            this.targetY = Math.random() * (canvas.height * 0.4); // Top 40%
            this.speed = Math.random() * 3 + 5;
            this.angle = Math.atan2(this.targetY - this.y, 0); // Straight up mostly logic
            const hue = Math.random() * 360;
            this.color = `hsl(${hue}, 100%, 70%)`; // Bright pastel colors
            this.radius = 3;
            // Simple straight up movement with wobble
            this.vx = (Math.random() - 0.5) * 2;
        }

        update() {
            this.y -= this.speed;
            this.x += this.vx;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    class Spark {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.gravity = 0.1;
            this.friction = 0.95;
            this.alpha = 1;
            this.decay = Math.random() * 0.02 + 0.015;
            this.color = color;
        }

        update() {
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.vy += this.gravity;
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.restore();
        }
    }

    function startFireworks() {
        // Main Loop
        function loop() {
            // Keep background visible while allowing trails
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Increased spawn rate for crackers
            if (Math.random() < 0.08) {
                fireworks.push(new Firework());
            }

            // Update Fireworks
            for (let i = fireworks.length - 1; i >= 0; i--) {
                const fw = fireworks[i];
                fw.update();
                fw.draw();

                // Rocket trail glow
                ctx.save();
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.arc(fw.x, fw.y + 10, fw.radius, 0, Math.PI * 2);
                ctx.fillStyle = fw.color;
                ctx.fill();
                ctx.restore();

                if (fw.y <= fw.targetY || fw.speed <= 0) {
                    const sparkCount = Math.floor(Math.random() * 50 + 80);
                    for (let j = 0; j < sparkCount; j++) {
                        particles.push(new Spark(fw.x, fw.y, fw.color));
                    }
                    fireworks.splice(i, 1);
                }
            }

            // Update Sparks
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.update();
                p.draw();

                // Extra sparkle
                if (Math.random() < 0.05) {
                    ctx.save();
                    ctx.globalAlpha = p.alpha;
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                if (p.alpha <= 0) {
                    particles.splice(i, 1);
                }
            }

            animationId = requestAnimationFrame(loop);
        }
        loop();
    }

    function stopFireworks() {
        cancelAnimationFrame(animationId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        fireworks = [];
        particles = [];
    }

    // === DRAWING LOGIC ===
    function generateScribblePath(width, height) {
        // Creates a dense diagonal zigzag path to simulate shading
        // Added more randomness for "natural" hand variance
        let path = `M 0 0`;
        const stepY = 0.8; // ULTRA-FINE STROKES for 4K Detail
        let currentY = 0;

        while (currentY < height * 1.8) {
            // Randomize start and end points more to simulate human imperfection
            const variance = Math.random() * 20 - 10;
            const xLeft = -50 + variance;
            const xRight = width + 50 + variance;

            // Randomize slant slightly per line
            const slant = 50 + (Math.random() * 10 - 5);

            path += ` M ${xLeft} ${currentY} L ${xRight} ${currentY - slant}`;
            currentY += stepY;
        }
        return path;
    }

    // Initialize Path
    if (scribblePath) {
        // SVG dimensions are 1920x1080 (HD/4K)
        const d = generateScribblePath(1920, 1080);
        scribblePath.setAttribute('d', d);
        // Setup for dash offset animation using attributes (more reliable)
        scribbleLen = scribblePath.getTotalLength();
        scribblePath.setAttribute('stroke-dasharray', scribbleLen);
        scribblePath.setAttribute('stroke-dashoffset', scribbleLen);
    }



    // === MAIN ANIMATION SEQUENCE WITH GSAP ===
    function startSequence() {
        console.log("Starting Sequence...");
        clearTimeout(loopTimeout);
        stopFireworks();

        // 1. Reset Everything
        if (scribblePath) {
            scribblePath.style.transition = 'none';
            scribblePath.setAttribute('stroke-dashoffset', scribbleLen);
        }
        if (colorLayer) {
            colorLayer.classList.remove('visible');
            colorLayer.style.transition = 'none';
            void colorLayer.offsetWidth; // paint
            colorLayer.style.transition = 'opacity 3s ease-in-out';
        }
        if (textWrapper) {
            gsap.set(textWrapper, { opacity: 0, scale: 0.8, rotationY: 20 });
        }
        texts.forEach(t => {
            t.style.animation = 'none';
            t.style.opacity = '0';
        });

        // Add 3D shake effect to paper at start
        gsap.to(paperTexture, {
            rotationZ: 2,
            duration: 0.1,
            repeat: 5,
            yoyo: true,
            ease: "power1.inOut",
            onComplete: () => {
                gsap.to(paperTexture, { rotationZ: 0, duration: 0.3 });
            }
        });

        // 2. Start Drawing Image (0s) with 3D effect
        setTimeout(() => {
            if (scribblePath) {
                // Trigger CSS Transition for Mask - 10s DURATION MATCH
                scribblePath.getBoundingClientRect();
                scribblePath.style.transition = 'stroke-dashoffset 10s linear';
                scribblePath.setAttribute('stroke-dashoffset', '0');

                // Add subtle 3D rotation during drawing
                gsap.to(paperTexture, {
                    rotationY: 5,
                    duration: 5,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: 1
                });
            }
        }, 300);

        // 3. Reveal Color (after sketch drawing finishes) with 3D flip
        setTimeout(() => {
            if (colorLayer) colorLayer.classList.add('visible');

            // 3D flip effect when color reveals
            gsap.to(paperTexture, {
                rotationY: 360,
                duration: 1.5,
                ease: "power2.inOut"
            });

            // Fade the sketch layer out gracefully so color replaces it
            if (sketchLayer) {
                sketchLayer.style.transition = 'opacity 1.6s ease-in-out';
                setTimeout(() => { sketchLayer.style.opacity = '0'; }, 150);
            }
        }, 10500);

        // 4. Show Text Wrapper with 3D entrance
        setTimeout(() => {
            if (textWrapper) {
                gsap.to(textWrapper, {
                    opacity: 1,
                    scale: 1,
                    rotationY: 0,
                    duration: 1.2,
                    ease: "back.out(1.7)"
                });

                // Add a 3D bounce effect
                gsap.to(textWrapper, {
                    z: 50,
                    duration: 0.6,
                    ease: "power2.out",
                    yoyo: true,
                    repeat: 1
                });
            }
        }, 12000);

        // 5. Write Text with Enhanced 3D GSAP Animations
        setTimeout(() => {
            // Animate each text line with unique 3D effects
            texts.forEach((text, i) => {
                setTimeout(() => {
                    // Start the stroke drawing animation
                    text.style.animation = 'draw 2.5s ease-in-out forwards';
                    text.style.opacity = '1';

                    // Add dramatic 3D entrance based on line number
                    if (i === 0) {
                        // "Happy" - Flip from top
                        gsap.from(text, {
                            scale: 0,
                            rotationX: -180,
                            rotationY: 90,
                            z: -200,
                            duration: 1.5,
                            ease: "back.out(2.5)",
                            delay: 0.3
                        });

                        // Add continuous subtle rotation
                        gsap.to(text, {
                            rotationY: 5,
                            duration: 2,
                            ease: "sine.inOut",
                            repeat: -1,
                            yoyo: true,
                            delay: 1.8
                        });
                    } else if (i === 1) {
                        // "New Year" - Spiral entrance
                        gsap.from(text, {
                            scale: 0,
                            rotationZ: 360,
                            rotationY: 180,
                            z: -300,
                            duration: 1.8,
                            ease: "power4.out",
                            delay: 0.3
                        });

                        // Add pulsing effect
                        gsap.to(text, {
                            scale: 1.05,
                            duration: 1.5,
                            ease: "sine.inOut",
                            repeat: -1,
                            yoyo: true,
                            delay: 2.1
                        });
                    } else if (i === 2) {
                        // "Ashu" - Dramatic zoom with rotation
                        gsap.from(text, {
                            scale: 0.2,
                            rotationX: 90,
                            rotationZ: -180,
                            z: -400,
                            opacity: 0,
                            duration: 2,
                            ease: "elastic.out(1, 0.5)",
                            delay: 0.3
                        });

                        // Add golden glow pulse
                        gsap.to(text, {
                            filter: "drop-shadow(0 10px 30px rgba(212, 175, 55, 0.9)) drop-shadow(0 0 50px rgba(255, 215, 0, 0.7))",
                            duration: 1,
                            ease: "sine.inOut",
                            repeat: -1,
                            yoyo: true,
                            delay: 2.3
                        });

                        // Add 3D rotation
                        gsap.to(text, {
                            rotationY: -5,
                            rotationX: 5,
                            duration: 3,
                            ease: "sine.inOut",
                            repeat: -1,
                            yoyo: true,
                            delay: 2.3
                        });
                    }
                }, i * 1200); // Increased stagger time for better effect
            });
        }, 12500);

        // 6. Fireworks (start with text) with 3D paper celebration
        setTimeout(() => {
            startFireworks();

            // Celebration shake
            gsap.to(paperTexture, {
                rotationZ: 3,
                duration: 0.15,
                repeat: 10,
                yoyo: true,
                ease: "power1.inOut"
            });

            // Text wrapper celebration
            gsap.to(textWrapper, {
                scale: 1.1,
                duration: 0.3,
                ease: "power2.out",
                yoyo: true,
                repeat: 1
            });
        }, 12500);

        // 7. Schedule Loop (after full cycle)
        loopTimeout = setTimeout(startSequence, 26000);
    }

    // === INIT ===
    startSequence();

    // Controls with 3D effect
    if (replayBtn) {
        replayBtn.addEventListener('click', () => {
            // 3D button press effect
            gsap.to(replayBtn, {
                scale: 0.9,
                rotationX: 10,
                duration: 0.1,
                ease: "power2.in",
                onComplete: () => {
                    gsap.to(replayBtn, {
                        scale: 1,
                        rotationX: 0,
                        duration: 0.2,
                        ease: "power2.out"
                    });
                }
            });

            startSequence();
        });
    }
};
