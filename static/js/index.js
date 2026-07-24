$(document).ready(function() {
  $(".navbar-burger").click(function() {
    $(".navbar-burger").toggleClass("is-active");
    $(".navbar-menu").toggleClass("is-active");
  });

  initTableOfContents();
  initFigurePlaceholders();
  initVideoCarousel({
    trackId: "#real-carousel-track",
    counterId: "#real-rollout-counter",
    prevId: "#real-prev",
    nextId: "#real-next",
    basePath: "/static/videos/rollouts/",
    tasks: REAL_WORLD_TASKS
  });
  initImageCarousel({
    trackId: "#overview-carousel-track",
    counterId: "#overview-carousel-counter",
    prevId: "#overview-prev",
    nextId: "#overview-next",
    basePath: "/static/images/figures/overview/",
    items: OVERVIEW_FIGURES,
    startIndex: OVERVIEW_FIGURES.length - 1
  });
  initTaskMediaCarousel({
    trackId: "#figure5-carousel-track",
    counterId: "#figure5-carousel-counter",
    prevId: "#figure5-prev",
    nextId: "#figure5-next",
    videoBasePath: "/static/videos/examples/",
    imageBasePath: "/static/images/figures/real_world/",
    legendImage: "real_world_legend.png",
    titlesImage: "real_world_titles.png",
    tasks: FIGURE5_TASKS
  });
  initVideoAspectFromMetadata();
  initPresentationVideo();
});

var FIGURE5_TASKS = [
  { success: "power_conn_good.mp4", failure: "power_conn_bad.mp4", image: "real_world_assembly.png", label: "Assembly" },
  { success: "shoe_in_bag_good.mp4", failure: "shoe_in_bag_bad.mp4", image: "real_world_shoe_in_bag.png", label: "Shoe-in-Bag" },
  { success: "bag_placing_good.mp4", failure: "bag_placing_bad.mp4", image: "real_world_bag_placement.png", label: "Bag-Placement" }
];

var OVERVIEW_FIGURES = [
  { file: "naive_async.png", label: "Naive Asynchronous" },
  { file: "naive_async_rl.png", label: "Naive Asynchronous with DSRL" },
  { file: "intermediate_actions.png", label: "Asynchronous DSRL with Intermediate Actions" },
  { file: "intermediate_state.png", label: 'Asynchronous DSRL with Intermediate Information (<span class="arli">ARLI</span>)' }
];

var REAL_WORLD_TASKS = [
  { file: "training_video_binned_grid_powercon.mp4", label: "Assembly" },
  { file: "training_video_binned_grid_shoeinbag.mp4", label: "Shoe-in-Bag" },
  { file: "training_video_binned_grid_bagplacement.mp4", label: "Bag-Placement" }
];

function hideControlsOnEnd(v) {
  v.addEventListener("ended", function() { v.controls = false; });
  v.addEventListener("play", function() { v.controls = true; });
  v.addEventListener("mouseenter", function() { v.controls = true; });
  v.addEventListener("mouseleave", function() {
    if (v.ended) { v.controls = false; }
  });
}

function capitalizeLabel(label) {
  if (!label) {
    return "";
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function initVideoCarousel(opts) {
  var $track = $(opts.trackId);
  var $counter = $(opts.counterId);
  var $prev = $(opts.prevId);
  var $next = $(opts.nextId);

  if (!$track.length || !$prev.length || !$next.length) {
    return;
  }

  var tasks = opts.tasks.map(function(entry) {
    return {
      file: entry.file,
      label: capitalizeLabel(entry.label)
    };
  });

  if (!tasks.length) {
    return;
  }

  var $viewport = $track.closest(".sim-carousel").find(".sim-carousel-viewport");
  var basePath = opts.basePath;
  var n = tasks.length;
  var CLONES = 2;

  function makeCard(task) {
    var $card = $(
      '<div class="sim-carousel-card">' +
        '<div class="video-aspect sim-video-aspect">' +
          '<video controls playsinline preload="metadata"></video>' +
        '</div>' +
        '<p class="figure-caption video-card-caption has-text-centered"></p>' +
      '</div>'
    );
    var video = $card.find("video")[0];
    video.src = basePath + task.file;
    $card.find("p").text(task.label);
    video.addEventListener("loadedmetadata", function() {
      applySharedAspect(video.videoWidth, video.videoHeight);
    });
    video.addEventListener("ended", function() {
      if ($card.hasClass("is-active")) { step(1); }
    });
    hideControlsOnEnd(video);
    return $card;
  }

  var aspectSet = false;
  function applySharedAspect(w, h) {
    if (aspectSet || !w || !h) { return; }
    aspectSet = true;
    $track.find(".sim-video-aspect").css("aspect-ratio", w + " / " + h);
  }

  var order = [];
  for (var i = n - CLONES; i < n; i++) { order.push(i); }
  for (var i = 0; i < n; i++) { order.push(i); }
  for (var i = 0; i < CLONES; i++) { order.push(i); }
  order.forEach(function(idx) { $track.append(makeCard(tasks[idx])); });

  var $cards = $track.find(".sim-carousel-card");
  var pos = CLONES;
  var animating = false;

  var $dots = [];
  $counter.empty();
  for (var di = 0; di < n; di++) {
    var $dot = $('<button type="button" class="sim-dot"></button>');
    $dot.attr("aria-label", "Go to rollout " + (di + 1));
    (function(idx) { $dot.on("click", function() { goTo(idx); }); })(di);
    $counter.append($dot);
    $dots.push($dot);
  }

  function position(animate) {
    var card = $cards[pos];
    if (!card) { return; }
    var vw = $viewport[0].clientWidth;
    var cardW = card.offsetWidth;
    var offset = vw / 2 - (card.offsetLeft + cardW / 2);
    $track[0].style.transition = animate ? "" : "none";
    $track[0].style.transform = "translateX(" + offset + "px)";

    $cards.removeClass("is-active");
    $(card).addClass("is-active");

    var logical = ((pos - CLONES) % n + n) % n;
    $dots.forEach(function($d, i) { $d.toggleClass("is-active", i === logical); });
  }

  function playActive() {
    $cards.each(function() {
      var active = $(this).hasClass("is-active");
      $(this).find("video").each(function() {
        if (active) {
          this.muted = true;
          var p = this.play();
          if (p && p.catch) { p.catch(function() {}); }
        } else {
          this.pause();
        }
      });
    });
  }

  function step(delta) {
    if (animating) { return; }
    animating = true;
    pos += delta;
    position(true);
    playActive();
  }

  function goTo(target) {
    if (animating) { return; }
    var logical = ((pos - CLONES) % n + n) % n;
    if (target === logical) { return; }
    animating = true;
    pos = CLONES + target;
    position(true);
    playActive();
  }

  $track.on("transitionend", function(e) {
    if (e.target !== $track[0]) { return; }
    animating = false;
    if (pos >= n + CLONES) {
      pos -= n;
      position(false);
      playActive();
    } else if (pos < CLONES) {
      pos += n;
      position(false);
      playActive();
    }
  });

  $prev.on("click", function() { step(-1); });
  $next.on("click", function() { step(1); });
  $(window).on("resize", function() { position(false); });

  position(false);
  $cards.eq(pos).find("video")[0].addEventListener("loadedmetadata", function() {
    position(false);
  });
  playActive();
}

function initTaskMediaCarousel(opts) {
  var $track = $(opts.trackId);
  var $counter = $(opts.counterId);
  var $prev = $(opts.prevId);
  var $next = $(opts.nextId);

  if (!$track.length || !$prev.length || !$next.length) {
    return;
  }

  var tasks = opts.tasks.map(function(entry) {
    return {
      success: entry.success,
      failure: entry.failure,
      image: entry.image,
      label: capitalizeLabel(entry.label)
    };
  });

  if (!tasks.length) {
    return;
  }

  var $viewport = $track.closest(".sim-carousel").find(".sim-carousel-viewport");
  var videoBasePath = opts.videoBasePath;
  var imageBasePath = opts.imageBasePath;
  var legendImage = opts.legendImage;
  var titlesImage = opts.titlesImage;
  var n = tasks.length;
  var CLONES = 2;

  function makeCard(task) {
    var $card = $(
      '<div class="sim-carousel-card task-media-card">' +
        '<div class="rollout-variants task-example-videos">' +
          '<div class="rollout-cell">' +
            '<div class="video-aspect ar169 task-media-video">' +
              '<video controls playsinline preload="metadata"></video>' +
            '</div>' +
            '<p class="method-label">Success</p>' +
          '</div>' +
          '<div class="rollout-cell">' +
            '<div class="video-aspect ar169 task-media-video">' +
              '<video controls playsinline preload="metadata"></video>' +
            '</div>' +
            '<p class="method-label">Failure</p>' +
          '</div>' +
        '</div>' +
        '<div class="task-results-block">' +
          '<img class="task-legend-img" alt="Legend">' +
          '<img class="task-titles-img" alt="Column titles">' +
          '<img class="task-plot-img" alt="">' +
        '</div>' +
        '<p class="figure-caption video-card-caption has-text-centered"></p>' +
      '</div>'
    );
    var videos = $card.find("video");
    var legendImg = $card.find(".task-legend-img")[0];
    var titlesImg = $card.find(".task-titles-img")[0];
    var plotImg = $card.find(".task-plot-img")[0];
    videos[0].src = videoBasePath + task.success;
    videos[1].src = videoBasePath + task.failure;
    legendImg.src = imageBasePath + legendImage;
    titlesImg.src = imageBasePath + titlesImage;
    plotImg.src = imageBasePath + task.image;
    plotImg.alt = task.label + " results";
    $card.find(".video-card-caption").text(task.label);
    $card.find("video").each(function() {
      var video = this;
      video.addEventListener("loadedmetadata", function() {
        applyVideoAspect(video.videoWidth, video.videoHeight);
        position(false);
      });
      hideControlsOnEnd(video);
    });
    function onResultImageLoad() {
      position(false);
    }
    legendImg.addEventListener("load", onResultImageLoad);
    titlesImg.addEventListener("load", onResultImageLoad);
    plotImg.addEventListener("load", onResultImageLoad);
    return $card;
  }

  var videoAspectSet = false;
  function applyVideoAspect(w, h) {
    if (videoAspectSet || !w || !h) { return; }
    videoAspectSet = true;
    $track.find(".task-media-video").css("aspect-ratio", w + " / " + h);
  }

  var order = [];
  for (var i = n - CLONES; i < n; i++) { order.push(i); }
  for (var i = 0; i < n; i++) { order.push(i); }
  for (var i = 0; i < CLONES; i++) { order.push(i); }
  order.forEach(function(idx) { $track.append(makeCard(tasks[idx])); });

  var $cards = $track.find(".sim-carousel-card");
  var pos = CLONES;
  var animating = false;

  var $dots = [];
  $counter.empty();
  for (var di = 0; di < n; di++) {
    var $dot = $('<button type="button" class="sim-dot"></button>');
    $dot.attr("aria-label", "Go to task " + (di + 1));
    (function(idx) { $dot.on("click", function() { goTo(idx); }); })(di);
    $counter.append($dot);
    $dots.push($dot);
  }

  function position(animate) {
    var card = $cards[pos];
    if (!card) { return; }
    var vw = $viewport[0].clientWidth;
    var offset = vw / 2 - (card.offsetLeft + card.offsetWidth / 2);
    $track[0].style.transition = animate ? "" : "none";
    $track[0].style.transform = "translateX(" + offset + "px)";

    $cards.removeClass("is-active");
    $(card).addClass("is-active");

    var logical = ((pos - CLONES) % n + n) % n;
    $dots.forEach(function($d, i) { $d.toggleClass("is-active", i === logical); });
  }

  function playActive() {
    $cards.each(function() {
      var active = $(this).hasClass("is-active");
      $(this).find("video").each(function() {
        if (active) {
          this.muted = true;
          var p = this.play();
          if (p && p.catch) { p.catch(function() {}); }
        } else {
          this.pause();
        }
      });
    });
  }

  function step(delta) {
    if (animating) { return; }
    animating = true;
    pos += delta;
    position(true);
    playActive();
  }

  function goTo(target) {
    if (animating) { return; }
    var logical = ((pos - CLONES) % n + n) % n;
    if (target === logical) { return; }
    animating = true;
    pos = CLONES + target;
    position(true);
    playActive();
  }

  $track.on("transitionend", function(e) {
    if (e.target !== $track[0]) { return; }
    animating = false;
    if (pos >= n + CLONES) {
      pos -= n;
      position(false);
      playActive();
    } else if (pos < CLONES) {
      pos += n;
      position(false);
      playActive();
    }
  });

  $prev.on("click", function() { step(-1); });
  $next.on("click", function() { step(1); });
  $(window).on("resize", function() { position(false); });

  position(false);
  playActive();
}

function initImageCarousel(opts) {
  var $track = $(opts.trackId);
  var $counter = $(opts.counterId);
  var $prev = $(opts.prevId);
  var $next = $(opts.nextId);

  if (!$track.length || !$prev.length || !$next.length) {
    return;
  }

  var items = opts.items;
  if (!items.length) {
    return;
  }

  var $viewport = $track.closest(".sim-carousel").find(".sim-carousel-viewport");
  var basePath = opts.basePath;
  var n = items.length;
  var CLONES = 2;

  function makeCard(item) {
    var $card = $(
      '<div class="sim-carousel-card">' +
        '<div class="figure-carousel-aspect sim-video-aspect">' +
          '<img alt="">' +
        '</div>' +
        '<p class="figure-caption video-card-caption has-text-centered"></p>' +
      '</div>'
    );
    var img = $card.find("img")[0];
    img.src = basePath + item.file;
    img.alt = item.label.replace(/<[^>]+>/g, "");
    $card.find("p").html(item.label);
    img.addEventListener("load", function() {
      applySharedAspect(img.naturalWidth, img.naturalHeight);
      position(false);
    });
    return $card;
  }

  var aspectSet = false;
  function applySharedAspect(w, h) {
    if (aspectSet || !w || !h) { return; }
    aspectSet = true;
    $track.find(".figure-carousel-aspect").css("aspect-ratio", w + " / " + h);
  }

  var order = [];
  for (var i = n - CLONES; i < n; i++) { order.push(i); }
  for (var i = 0; i < n; i++) { order.push(i); }
  for (var i = 0; i < CLONES; i++) { order.push(i); }
  order.forEach(function(idx) { $track.append(makeCard(items[idx])); });

  var $cards = $track.find(".sim-carousel-card");
  var startIndex = typeof opts.startIndex === "number" ? opts.startIndex : 0;
  startIndex = ((startIndex % n) + n) % n;
  var pos = CLONES + startIndex;
  var animating = false;

  var $dots = [];
  $counter.empty();
  for (var di = 0; di < n; di++) {
    var $dot = $('<button type="button" class="sim-dot"></button>');
    $dot.attr("aria-label", "Go to variant " + (di + 1));
    (function(idx) { $dot.on("click", function() { goTo(idx); }); })(di);
    $counter.append($dot);
    $dots.push($dot);
  }

  function position(animate) {
    var card = $cards[pos];
    if (!card) { return; }
    var vw = $viewport[0].clientWidth;
    var offset = vw / 2 - (card.offsetLeft + card.offsetWidth / 2);
    $track[0].style.transition = animate ? "" : "none";
    $track[0].style.transform = "translateX(" + offset + "px)";

    $cards.removeClass("is-active");
    $(card).addClass("is-active");

    var logical = ((pos - CLONES) % n + n) % n;
    $dots.forEach(function($d, i) { $d.toggleClass("is-active", i === logical); });
  }

  function step(delta) {
    if (animating) { return; }
    animating = true;
    pos += delta;
    position(true);
  }

  function goTo(target) {
    if (animating) { return; }
    var logical = ((pos - CLONES) % n + n) % n;
    if (target === logical) { return; }
    animating = true;
    pos = CLONES + target;
    position(true);
  }

  $track.on("transitionend", function(e) {
    if (e.target !== $track[0]) { return; }
    animating = false;
    if (pos >= n + CLONES) {
      pos -= n;
      position(false);
    } else if (pos < CLONES) {
      pos += n;
      position(false);
    }
  });

  $prev.on("click", function() { step(-1); });
  $next.on("click", function() { step(1); });
  $(window).on("resize", function() { position(false); });

  position(false);
}

function initTableOfContents() {
  var nav = document.getElementById("toc-nav");
  if (!nav) { return; }
  var secs = Array.prototype.slice.call(nav.querySelectorAll(".toc-item")).map(function(item) {
    var anchor = document.getElementById(item.getAttribute("href").slice(1));
    return { item: item, section: anchor ? anchor.closest("section") : null };
  }).filter(function(s) { return s.section; });

  function update() {
    var trigger = window.scrollY + window.innerHeight * 0.35;
    var current = null;
    secs.forEach(function(s) { if (s.section.offsetTop <= trigger) { current = s; } });
    secs.forEach(function(s) { s.item.classList.toggle("active", s === current); });
    nav.style.opacity = current ? "1" : "0";
    nav.style.pointerEvents = current ? "auto" : "none";
  }

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

function initFigurePlaceholders() {
  document.querySelectorAll("img[data-placeholder]").forEach(function(img) {
    function showPlaceholder() {
      if (img.dataset.placeholderShown) { return; }
      img.dataset.placeholderShown = "1";
      var placeholder = document.createElement("div");
      placeholder.className = "figure-placeholder";
      placeholder.textContent = img.dataset.placeholder || "Figure coming soon";
      img.style.display = "none";
      img.parentNode.insertBefore(placeholder, img);
    }

    img.addEventListener("error", showPlaceholder);
    if (img.complete && img.naturalWidth === 0) {
      showPlaceholder();
    }
  });
}

function setAspectFromVideo(videoEl, wrapperEl) {
  if (!videoEl || !wrapperEl || !videoEl.videoWidth || !videoEl.videoHeight) {
    return;
  }
  wrapperEl.style.aspectRatio = videoEl.videoWidth + " / " + videoEl.videoHeight;
}

function initPresentationVideo() {
  var video = document.querySelector(".presentation-video-wrapper video");
  if (!video) {
    return;
  }

  var muteUntil = 2;
  var muteLockReleased = false;

  function enforceMuteWindow() {
    if (video.currentTime < muteUntil) {
      muteLockReleased = false;
      video.muted = true;
      return;
    }
    if (!muteLockReleased) {
      muteLockReleased = true;
      video.muted = false;
    }
  }

  video.addEventListener("play", enforceMuteWindow);
  video.addEventListener("timeupdate", enforceMuteWindow);
  video.addEventListener("seeked", enforceMuteWindow);
  video.addEventListener("volumechange", function() {
    if (video.currentTime < muteUntil && !video.muted) {
      video.muted = true;
    }
  });
}

function initVideoAspectFromMetadata() {
  $(".video-card .video-aspect video, .video-aspect video").each(function() {
    var video = this;
    var wrapper = video.parentElement;
    function update() {
      setAspectFromVideo(video, wrapper);
    }
    if (video.readyState >= 1) {
      update();
    }
    video.addEventListener("loadedmetadata", update);
  });
}
