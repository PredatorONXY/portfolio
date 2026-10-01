/**
 * Global navigation & interaction engine
 * Supports: Wheel (Mouse/Trackpad), Native Touch Gestures, Keyboard, Navigation Clicks
 */

$(document).ready(function() {

  var canScroll = true;
  var scrollController = null;

  // --- Wheel Handling (Mouse / Precision Trackpad) ---
  window.addEventListener('wheel', function(e) {
    if ($('.outer-nav').hasClass('is-vis')) return;

    // Check if the user is scrolling inside a section that has internal overflow scroll
    var activeSection = document.querySelector('.section--is-active');
    if (activeSection) {
      var atTop = activeSection.scrollTop <= 0;
      var atBottom = activeSection.scrollTop + activeSection.clientHeight >= activeSection.scrollHeight - 2;
      
      // If user is scrolling down and not yet at bottom of the section content, allow native inner scroll
      if (e.deltaY > 0 && !atBottom) return;
      // If user is scrolling up and not at top of the section content, allow native inner scroll
      if (e.deltaY < 0 && !atTop) return;
    }

    if (!canScroll) return;

    var delta = e.deltaY;
    if (Math.abs(delta) > 25) {
      canScroll = false;
      clearTimeout(scrollController);
      scrollController = setTimeout(function() {
        canScroll = true;
      }, 700);

      updateHelper(delta > 0 ? 1 : -1);
    }
  }, { passive: true });

  // --- Native Touch Gesture Handling (Mobile / Tablets) ---
  var touchStartY = 0;
  var touchStartX = 0;
  var touchStartTime = 0;

  window.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      touchStartTime = Date.now();
    }
  }, { passive: true });

  window.addEventListener('touchend', function(e) {
    if ($('.outer-nav').hasClass('is-vis')) return;
    if (e.changedTouches.length === 0) return;

    var touchEndY = e.changedTouches[0].clientY;
    var touchEndX = e.changedTouches[0].clientX;
    var diffY = touchStartY - touchEndY;
    var diffX = touchStartX - touchEndX;
    var duration = Date.now() - touchStartTime;

    // Only process vertical swipe if vertical distance is greater than horizontal
    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 40 && duration < 800) {
      var activeSection = document.querySelector('.section--is-active');
      if (activeSection) {
        var atTop = activeSection.scrollTop <= 0;
        var atBottom = activeSection.scrollTop + activeSection.clientHeight >= activeSection.scrollHeight - 2;
        
        if (diffY > 0 && !atBottom) return;
        if (diffY < 0 && !atTop) return;
      }

      if (canScroll) {
        canScroll = false;
        clearTimeout(scrollController);
        scrollController = setTimeout(function() {
          canScroll = true;
        }, 600);

        updateHelper(diffY > 0 ? 1 : -1);
      }
    }
  }, { passive: true });

  // --- Navigation Clicks ---
  $('.side-nav li, .outer-nav li').click(function() {
    if (!($(this).hasClass('is-active'))) {
      var $this = $(this);
      var curActive = $this.parent().find('.is-active');
      var curPos = $this.parent().children().index(curActive);
      var nextPos = $this.parent().children().index($this);
      var lastItem = $(this).parent().children().length - 1;

      updateNavs(nextPos);
      updateContent(curPos, nextPos, lastItem);
    }
  });

  // --- Header & Section CTA Buttons ---
  $('.cta').click(function(e) {
    // If it's not an outbound link or mailto
    if ($(this).is('button') || $(this).attr('href') === '#0' || !$(this).attr('href')) {
      var curActive = $('.side-nav').find('.is-active');
      var curPos = $('.side-nav').children().index(curActive);
      var lastItem = $('.side-nav').children().length - 1;
      var nextPos = lastItem; // Go to Contact

      updateNavs(lastItem);
      updateContent(curPos, nextPos, lastItem);
    }
  });

  // --- Keyboard Navigation ---
  $(document).keyup(function(e) {
    if (!($('.outer-nav').hasClass('is-vis'))) {
      if (e.keyCode === 40 || e.keyCode === 38 || e.keyCode === 34 || e.keyCode === 33) {
        e.preventDefault();
        updateHelper(e);
      }
    }
  });

  // Determine scroll, swipe, and arrow key direction
  function updateHelper(param) {
    var curActive = $('.side-nav').find('.is-active');
    var curPos = $('.side-nav').children().index(curActive);
    var lastItem = $('.side-nav').children().length - 1;
    var nextPos = 0;

    if (param.type === "swipeup" || param.keyCode === 40 || param.keyCode === 34 || param > 0) {
      if (curPos !== lastItem) {
        nextPos = curPos + 1;
      } else {
        nextPos = 0;
      }
    } else if (param.type === "swipedown" || param.keyCode === 38 || param.keyCode === 33 || param < 0) {
      if (curPos !== 0) {
        nextPos = curPos - 1;
      } else {
        nextPos = lastItem;
      }
    }

    updateNavs(nextPos);
    updateContent(curPos, nextPos, lastItem);
  }

  // Sync side and outer navigations
  function updateNavs(nextPos) {
    $('.side-nav, .outer-nav').children().removeClass('is-active');
    $('.side-nav').children().eq(nextPos).addClass('is-active');
    $('.outer-nav').children().eq(nextPos).addClass('is-active');
  }

  // Update main content area
  function updateContent(curPos, nextPos, lastItem) {
    $('.main-content').children().removeClass('section--is-active');
    $('.main-content').children().eq(nextPos).addClass('section--is-active');
    $('.main-content .section').children().removeClass('section--next section--prev');

    if (curPos === lastItem && nextPos === 0 || curPos === 0 && nextPos === lastItem) {
      $('.main-content .section').children().removeClass('section--next section--prev');
    } else if (curPos < nextPos) {
      $('.main-content').children().eq(curPos).children().addClass('section--next');
    } else {
      $('.main-content').children().eq(curPos).children().addClass('section--prev');
    }

    if (nextPos !== 0 && nextPos !== lastItem) {
      $('.header--cta').addClass('is-active');
    } else {
      $('.header--cta').removeClass('is-active');
    }

    // Reset scroll position of newly active section
    var newActive = document.querySelectorAll('.main-content .l-section')[nextPos];
    if (newActive) {
      newActive.scrollTop = 0;
    }
  }

  // Outer 3D Perspective Nav Menu
  function outerNav() {
    $('.header--nav-toggle').click(function() {
      $('.perspective').addClass('perspective--modalview');
      setTimeout(function() {
        $('.perspective').addClass('effect-rotate-left--animate');
      }, 25);
      $('.outer-nav, .outer-nav li, .outer-nav--return').addClass('is-vis');
    });

    $('.outer-nav--return, .outer-nav li').click(function() {
      $('.perspective').removeClass('effect-rotate-left--animate');
      setTimeout(function() {
        $('.perspective').removeClass('perspective--modalview');
      }, 400);
      $('.outer-nav, .outer-nav li, .outer-nav--return').removeClass('is-vis');
    });
  }

  outerNav();

});