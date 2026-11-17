(function () {
  "use strict";

  var VIDEOS = window.PORTFOLIO_VIDEOS || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Work out what kind of link was pasted ---- */
  function parseSource(raw) {
    var src = (raw || "").trim();
    if (!src) return null;
    var m;

    if (/\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(src)) return { type: "file", url: src };

    if ((m = src.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/i))) {
      return {
        type: "embed",
        url: "https://www.youtube.com/embed/" + m[1] + "?autoplay=1&rel=0&playsinline=1",
        tall: /\/shorts\//i.test(src)
      };
    }
    if ((m = src.match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/i))) {
      var kind = m[1] === "reels" ? "reel" : m[1];
      return { type: "embed", url: "https://www.instagram.com/" + kind + "/" + m[2] + "/embed", tall: true };
    }
    if ((m = src.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=)([\w-]+)/i))) {
      return { type: "embed", url: "https://drive.google.com/file/d/" + m[1] + "/preview", tall: true };
    }
    if ((m = src.match(/vimeo\.com\/(?:video\/)?(\d+)/i))) {
      return { type: "embed", url: "https://player.vimeo.com/video/" + m[1] + "?autoplay=1", tall: false };
    }
    // Anything else: assume it is a direct video file link.
    return { type: "file", url: src };
  }

  /* ---- Lightbox ---- */
  var lightbox = document.getElementById("lightbox");
  var stage = document.getElementById("lightboxStage");
  var inlineVideos = [];

  function openLightbox(source, startAt) {
    stage.innerHTML = "";
    inlineVideos.forEach(function (v) { v.pause(); });

    if (source.type === "file") {
      var v = document.createElement("video");
      v.src = source.url;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      if (startAt) v.currentTime = startAt;
      stage.appendChild(v);
    } else {
      var f = document.createElement("iframe");
      f.src = source.url;
      f.className = source.tall ? "r-tall" : "r-wide";
      f.allow = "autoplay; fullscreen; encrypted-media; picture-in-picture";
      f.allowFullscreen = true;
      f.title = "Video player";
      stage.appendChild(f);
    }
    lightbox.showModal();
  }

  function closeLightbox() {
    if (lightbox.open) lightbox.close();
  }

  lightbox.addEventListener("close", function () {
    stage.innerHTML = "";
    inlineVideos.forEach(function (v) { if (v._visible) v.play().catch(function () {}); });
  });
  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox || e.target === stage) closeLightbox();
  });

  /* ---- Build every frame ---- */
  var playObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target;
          v._visible = entry.isIntersecting;
          if (entry.isIntersecting && !lightbox.open) v.play().catch(function () {});
          else v.pause();
        });
      }, { threshold: 0.45 })
    : null;

  document.querySelectorAll(".frame[data-slot]").forEach(function (frame) {
    var slot = frame.dataset.slot;
    var poster = "assets/" + slot + ".jpg";
    var alt = frame.dataset.alt || "";

    var img = document.createElement("img");
    img.src = poster;
    img.alt = alt;
    img.loading = "lazy";
    frame.appendChild(img);

    var source = parseSource(VIDEOS[slot]);
    if (!source) return;

    frame.classList.add("has-video");
    frame.tabIndex = 0;
    frame.setAttribute("role", "button");
    frame.setAttribute("aria-label", "Play video: " + alt);

    var badge = document.createElement("span");
    badge.className = "frame__play";
    badge.textContent = source.type === "file" ? "Sound on" : "Play";
    frame.appendChild(badge);

    var inline = null;
    if (source.type === "file" && playObserver && !reduceMotion) {
      inline = document.createElement("video");
      inline.src = source.url;
      inline.muted = true;
      inline.loop = true;
      inline.playsInline = true;
      inline.preload = "metadata";
      inline.poster = poster;
      inline.setAttribute("aria-hidden", "true");
      inline.addEventListener("playing", function () { frame.classList.add("is-playing"); });
      inline.addEventListener("error", function () { frame.classList.remove("is-playing"); });
      frame.appendChild(inline);
      inlineVideos.push(inline);
      playObserver.observe(inline);
    }

    function activate() {
      openLightbox(source, inline ? inline.currentTime : 0);
    }
    frame.addEventListener("click", activate);
    frame.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
    });
  });

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---- Nav ---- */
  var nav = document.getElementById("nav");
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");

  function onScroll() { nav.classList.toggle("is-stuck", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    links.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", function () { setMenu(!links.classList.contains("is-open")); });
  links.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });

  /* ---- WhatsApp links ---- */
  var WA_NUMBER = "919656124965";
  var WA_MESSAGE = "Hi Mikdad, I saw your portfolio and I'd like to discuss a video project with you.";
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(WA_MESSAGE);
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
