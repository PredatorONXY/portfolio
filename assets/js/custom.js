/**
 * Portfolio Interactive Animation Engine
 * Jaskaran Singh — Web Developer
 * Features:
 * - Magnetic Glowing Cursor & Follower
 * - 3D Card Physics & Layered Parallax Tilt
 * - Dynamic Laser Spotlight Overlay
 * - Cyber Text Scramble & Decode Engine
 * - Magnetic Button Physics
 * - GSAP Staggered Entrance Choreography
 */

(function () {
  'use strict';

  // --- 1. Custom Magnetic Cursor System ---
  function initMagneticCursor() {
    // Only initialize on pointer devices (desktop)
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const dot = document.createElement('div');
    dot.className = 'cursor-dot';
    const follower = document.createElement('div');
    follower.className = 'cursor-follower';

    document.body.appendChild(dot);
    document.body.appendChild(follower);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let dotX = mouseX;
    let dotY = mouseY;
    let folX = mouseX;
    let folY = mouseY;

    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.opacity = '1';
      follower.style.opacity = '1';
    });

    window.addEventListener('mouseleave', function () {
      dot.style.opacity = '0';
      follower.style.opacity = '0';
    });

    window.addEventListener('mousedown', function () {
      follower.classList.add('is-clicking');
    });

    window.addEventListener('mouseup', function () {
      follower.classList.remove('is-clicking');
    });

    // Smooth Lerp Render Loop
    function renderCursor() {
      // Dot is snappy
      dotX += (mouseX - dotX) * 0.75;
      dotY += (mouseY - dotY) * 0.75;
      dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0)`;

      // Follower has silky inertia
      folX += (mouseX - folX) * 0.18;
      folY += (mouseY - folY) * 0.18;
      follower.style.transform = `translate3d(${folX}px, ${folY}px, 0)`;

      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    // Hover triggers for interactive elements
    const interactiveSelectors = 'a, button, .chip, .project, .panel, .header--logo, .side-nav li, .outer-nav li, .intro--options > a';
    
    document.addEventListener('mouseover', function (e) {
      const target = e.target.closest(interactiveSelectors);
      if (target) {
        follower.classList.add('is-hovering');
      }
    });

    document.addEventListener('mouseout', function (e) {
      const target = e.target.closest(interactiveSelectors);
      if (target) {
        follower.classList.remove('is-hovering');
      }
    });
  }

  // --- 2. 3D Card Physics & Interactive Spotlight ---
  function init3DTiltAndSpotlight() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const cards = document.querySelectorAll('.project, .panel, .intro--options > a, .about--copy, .contact--lockup .modal, .about--flow li');
    
    cards.forEach((card) => {
      card.classList.add('tilt-card');

      card.addEventListener('mousemove', function (e) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Set CSS custom properties for radial laser spotlight
        card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
        card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);

        // Compute 3D rotation angles (-10deg to +10deg)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -9;
        const rotateY = ((x - centerX) / centerX) * 9;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(6px)`;
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        card.style.setProperty('--mouse-x', '50%');
        card.style.setProperty('--mouse-y', '50%');
      });
    });
  }

  // --- 3. Cyber Text Scramble & Decode Engine ---
  class TextScrambler {
    constructor(el) {
      this.el = el;
      this.chars = '!<>-_\\/[]{}—=+*^?#________0123456789ABCDEF';
      this.update = this.update.bind(this);
    }

    setText(newText) {
      const oldText = this.el.innerText;
      const length = Math.max(oldText.length, newText.length);
      const promise = new Promise((resolve) => (this.resolve = resolve));
      this.queue = [];
      for (let i = 0; i < length; i++) {
        const from = oldText[i] || '';
        const to = newText[i] || '';
        const start = Math.floor(Math.random() * 15);
        const end = start + Math.floor(Math.random() * 18);
        this.queue.push({ from, to, start, end });
      }
      cancelAnimationFrame(this.frameRequest);
      this.frame = 0;
      this.update();
      return promise;
    }

    update() {
      let output = '';
      let complete = 0;
      for (let i = 0, n = this.queue.length; i < n; i++) {
        let { from, to, start, end, char } = this.queue[i];
        if (this.frame >= end) {
          complete++;
          output += to;
        } else if (this.frame >= start) {
          if (!char || Math.random() < 0.28) {
            char = this.randomChar();
            this.queue[i].char = char;
          }
          output += `<span style="color:var(--cyan);opacity:0.9;">${char}</span>`;
        } else {
          output += from;
        }
      }
      this.el.innerHTML = output;
      if (complete === this.queue.length) {
        this.resolve();
      } else {
        this.frameRequest = requestAnimationFrame(this.update);
        this.frame++;
      }
    }

    randomChar() {
      return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
  }

  function initTextScramblers() {
    // Scramble on Hero Load
    const heroName = document.querySelector('.intro--banner h1 .name');
    if (heroName) {
      const scrambler = new TextScrambler(heroName);
      setTimeout(() => {
        scrambler.setText('JASKARAN SINGH');
      }, 350);
    }

    // Scramble on Hover for Section Headings
    const headings = document.querySelectorAll('.work--head h2, .skills h2, .modal h2, .project h3');
    headings.forEach((heading) => {
      const originalText = heading.innerText;
      let scrambler = new TextScrambler(heading);
      let isScrambling = false;

      heading.addEventListener('mouseenter', () => {
        if (isScrambling) return;
        isScrambling = true;
        scrambler.setText(originalText).then(() => {
          isScrambling = false;
        });
      });
    });
  }

  // --- 4. Magnetic Button Physics ---
  function initMagneticButtons() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const magneticElements = document.querySelectorAll('.cta, .intro--link, .header--logo, .badge--solid');

    magneticElements.forEach((btn) => {
      btn.addEventListener('mousemove', function (e) {
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (e.clientX - centerX) * 0.35;
        const deltaY = (e.clientY - centerY) * 0.35;

        if (typeof gsap !== 'undefined') {
          gsap.to(btn, {
            x: deltaX,
            y: deltaY,
            duration: 0.3,
            ease: 'power2.out'
          });
        } else {
          btn.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
        }
      });

      btn.addEventListener('mouseleave', function () {
        if (typeof gsap !== 'undefined') {
          gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: 'elastic.out(1, 0.4)'
          });
        } else {
          btn.style.transform = 'translate3d(0, 0, 0)';
        }
      });
    });
  }

  // --- 5. GSAP Section Stagger Entrance Orchestration ---
  function initSectionEntranceAnimations() {
    if (typeof gsap === 'undefined') return;

    const sideNav = document.querySelector('.side-nav');
    if (!sideNav) return;

    function triggerSectionEntrance(sectionIndex) {
      const activeSection = document.querySelectorAll('.l-main-content .l-section')[sectionIndex];
      if (!activeSection) return;

      // Hero Elements
      if (sectionIndex === 0) {
        gsap.fromTo(
          activeSection.querySelectorAll('.intro--banner h1, .intro--lead, .intro--tags, .intro--banner .cta, .intro--options > a'),
          { y: 25, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, stagger: 0.08, ease: 'power3.out', overwrite: 'auto' }
        );
      }
      // Projects
      else if (sectionIndex === 1) {
        const h2 = activeSection.querySelector('.work--head h2');
        if (h2) new TextScrambler(h2).setText('SELECTED PROJECTS');
        gsap.fromTo(
          activeSection.querySelectorAll('.work--head, .project'),
          { y: 35, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: 'power3.out', overwrite: 'auto' }
        );
      }
      // About
      else if (sectionIndex === 2) {
        gsap.fromTo(
          activeSection.querySelectorAll('.about--banner h2, .about--copy, .about--flow li'),
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, stagger: 0.1, ease: 'power3.out', overwrite: 'auto' }
        );
      }
      // Skills
      else if (sectionIndex === 3) {
        const h2 = activeSection.querySelector('.skills h2');
        if (h2) new TextScrambler(h2).setText('SKILLS & STACK');
        gsap.fromTo(
          activeSection.querySelectorAll('.skills h2, .panel, .chip'),
          { y: 20, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, duration: 0.55, stagger: 0.03, ease: 'back.out(1.4)', overwrite: 'auto' }
        );
      }
      // Contact
      else if (sectionIndex === 4) {
        const h2 = activeSection.querySelector('.modal h2');
        if (h2) new TextScrambler(h2).setText("LET'S BUILD SOMETHING");
        gsap.fromTo(
          activeSection.querySelectorAll('.modal, .modal--options li'),
          { y: 30, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.1, ease: 'power3.out', overwrite: 'auto' }
        );
      }
    }

    // Observer for active section changes
    const observer = new MutationObserver(function () {
      const activeLi = sideNav.querySelector('.is-active');
      if (activeLi) {
        const index = Array.from(sideNav.children).indexOf(activeLi);
        if (index !== -1) {
          triggerSectionEntrance(index);
        }
      }
    });
    observer.observe(sideNav, { attributes: true, subtree: true, attributeFilter: ['class'] });

    // Initial Trigger on load
    triggerSectionEntrance(0);
  }

  // --- 6. In-Page Navigation Hook ---
  function initDataGoto() {
    if (typeof jQuery !== 'undefined') {
      $('[data-goto]').on('click', function (e) {
        e.preventDefault();
        const targetIndex = $(this).data('goto');
        $('.side-nav li').eq(targetIndex).trigger('click');
      });
    }
  }

  // --- Master Initialization ---
  document.addEventListener('DOMContentLoaded', function () {
    initMagneticCursor();
    init3DTiltAndSpotlight();
    initTextScramblers();
    initMagneticButtons();
    initSectionEntranceAnimations();
    initDataGoto();
  });
})();

