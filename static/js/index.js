$(document).ready(function() {
  $(".navbar-burger").click(function() {
    $(".navbar-burger").toggleClass("is-active");
    $(".navbar-menu").toggleClass("is-active");
  });

  initTableOfContents();
  initFigurePlaceholders();
  initVideoAspectFromMetadata();
});

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
