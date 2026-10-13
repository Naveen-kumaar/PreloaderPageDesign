/* ==========================================================================
   SHANTHI PRODUCTIONS — script.js
   1. Site configuration (edit this)   2. Preloader controller
   3. Navigation                       4. Contact form
   ========================================================================== */

/* ---------- 1. Site configuration ----------
   Fill in the details you want shown in the Contact section.
   Empty values are simply not displayed, so nothing is invented. */
const SITE_CONFIG = {
  email: "",      // e.g. "hello@yourdomain.com"  (also used by the contact form's mail fallback)
  phone: "",      // e.g. "+91 00000 00000"
  address: "",    // e.g. "Studio address, City"
  instagram: ""   // e.g. "https://instagram.com/yourhandle"
};

(function () {
  "use strict";

  /* ---------- 2. Preloader controller ---------- */
  const DESIGN_W = 1344;           // design size of the preloader stage (matches the reference video, 1344 x 768)
  const DESIGN_H = 768;
  const ANIMATION_MS = 6000;       // master timeline length (see css/style.css)
  const EXIT_AT_MS = 5750;         // start dissolving into the site while the ident is still holding
  const EXIT_FADE_MS = 700;
  const ASSET_TIMEOUT_MS = 8000;   // never trap the visitor on a slow connection
  const FONT_TIMEOUT_MS = 2500;

  const body = document.body;
  const preloader = document.getElementById("preloader");
  const stage = document.getElementById("preStage");
  const video = document.getElementById("preloaderVideo");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let resizeFrame = 0;
  let exitTimer = 0;
  let finished = false;
  let fallbackStarted = false;
  let fallbackAssetsReady = Promise.resolve();

  /* Keep the complete 1344 x 768 stage visible, including on portrait screens. */
  function fitStage() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / DESIGN_W, vh / DESIGN_H);
    stage.style.setProperty("--pre-scale", scale.toFixed(4));
  }

  function onResize() {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(function () {
      resizeFrame = 0;
      fitStage();
    });
  }

  /* A few drifting dust specks, like the reference footage. */
  function seedDust() {
    const host = preloader.querySelector(".pre-dust");
    if (!host) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 16; i++) {
      const s = document.createElement("i");
      const size = (1 + Math.random() * 2.2).toFixed(1) + "px";
      s.style.setProperty("--x", (Math.random() * 100).toFixed(1) + "%");
      s.style.setProperty("--y", (Math.random() * 100).toFixed(1) + "%");
      s.style.setProperty("--s", size);
      s.style.setProperty("--dx", (Math.random() * 60 - 30).toFixed(0) + "px");
      s.style.setProperty("--dy", (Math.random() * 60 - 30).toFixed(0) + "px");
      s.style.setProperty("--d", (4 + Math.random() * 4).toFixed(1) + "s");
      s.style.setProperty("--delay", (-Math.random() * 6).toFixed(1) + "s");
      frag.appendChild(s);
    }
    host.appendChild(frag);
  }

  function waitForImage(img) {
    return new Promise(function (resolve) {
      const done = function () { resolve(); };
      if (img.complete && img.naturalWidth > 0) {
        if (img.decode) { img.decode().then(done, done); } else { done(); }
        return;
      }
      img.addEventListener("load", function () {
        if (img.decode) { img.decode().then(done, done); } else { done(); }
      }, { once: true });
      img.addEventListener("error", done, { once: true });
    });
  }

  function waitForFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const loads = Promise.all([
      document.fonts.load('500 88px "Cinzel"', "SHANTHI"),
      document.fonts.load('300 17px "Jost"', "PRODUCTIONS"),
      document.fonts.load('600 42px "Dancing Script"', "Stories. Frames. Cinema.")
    ]).catch(function () {});
    const timeout = new Promise(function (resolve) { setTimeout(resolve, FONT_TIMEOUT_MS); });
    return Promise.race([loads, timeout]);
  }

  function waitForVideo() {
    if (!video) return Promise.resolve(false);
    if (video.readyState >= 2 && video.videoWidth > 0) return Promise.resolve(true);
    if (video.error) return Promise.resolve(false);
    return new Promise(function (resolve) {
      let settled = false;
      const timeout = window.setTimeout(function () { settle(false); }, ASSET_TIMEOUT_MS);
      function settle(ready) {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        video.removeEventListener("loadeddata", onLoaded);
        video.removeEventListener("error", onError);
        resolve(ready);
      }
      function onLoaded() { settle(video.videoWidth > 0); }
      function onError() { settle(false); }
      video.addEventListener("loadeddata", onLoaded, { once: true });
      video.addEventListener("error", onError, { once: true });
    });
  }

  function preloadAssets() {
    const images = Array.prototype.slice.call(preloader.querySelectorAll("img"));
    const all = Promise.all(images.map(waitForImage).concat(waitForFonts()));
    const timeout = new Promise(function (resolve) {
      setTimeout(function () { resolve(false); }, ASSET_TIMEOUT_MS);
    });
    return Promise.race([all, timeout]);
  }

  function revealSite() {
    if (finished) return;
    finished = true;
    clearTimeout(exitTimer);
    if (video) video.pause();
    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", onResize);
    preloader.classList.add("leaving");
    body.classList.add("site-ready");
    window.setTimeout(function () {
      body.classList.remove("is-loading");
      if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
    }, EXIT_FADE_MS);
  }

  function startFallback(reason) {
    if (finished || fallbackStarted || preloader.classList.contains("play")) return;
    fallbackStarted = true;
    if (video) {
      video.pause();
      if (videoEndHandler) video.removeEventListener("ended", videoEndHandler);
    }
    fallbackAssetsReady.then(function () {
      if (finished) return;
      clearTimeout(exitTimer);
      console.warn("Preloader video could not be played; using the animated fallback.", reason || (video && video.error) || "Video unavailable.");
      seedDust();
      preloader.classList.remove("has-video");
      preloader.classList.add("play");
      exitTimer = window.setTimeout(revealSite, EXIT_AT_MS);
    });
  }

  let videoEndHandler = null;

  function startVideo() {
    preloader.classList.add("has-video");
    videoEndHandler = revealSite;
    video.addEventListener("ended", videoEndHandler, { once: true });
    video.addEventListener("error", function () {
      startFallback(video.error);
    }, { once: true });

    let playback;
    try {
      playback = video.play();
    } catch (error) {
      startFallback(error);
      return;
    }

    const scheduleExit = function () {
      const duration = Number.isFinite(video.duration) ? video.duration * 1000 : ANIMATION_MS;
      exitTimer = window.setTimeout(revealSite, duration + EXIT_FADE_MS + 500);
    };
    if (playback && typeof playback.then === "function") {
      playback.then(scheduleExit, startFallback);
    } else {
      scheduleExit();
    }
  }

  function startPreloader() {
    fitStage();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });

    if (reduceMotion.matches) {
      preloader.classList.add("reduced");
      exitTimer = window.setTimeout(revealSite, 1400);
      return;
    }

    fallbackAssetsReady = preloadAssets();

    if (video) {
      video.preload = "auto";
      video.load();
      waitForVideo().then(function (ready) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            if (ready && video.readyState >= 2 && video.videoWidth > 0) {
              startVideo();
            } else {
              startFallback(video.error);
            }
          });
        });
      });
      return;
    }

    fallbackAssetsReady.then(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          startFallback("Reference video is unavailable.");
        });
      });
    });
  }

  if (preloader && stage) {
    startPreloader();
  } else {
    body.classList.remove("is-loading");
    body.classList.add("site-ready");
  }

  /* ---------- 3. Navigation ---------- */
  const nav = document.getElementById("nav");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  function setMenu(open) {
    nav.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  navToggle.addEventListener("click", function () {
    setMenu(!nav.classList.contains("open"));
  });
  navLinks.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      setMenu(false);
      navToggle.focus();
    }
  });

  /* Solid nav background once the page is scrolled: one observer, no scroll handler. */
  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none";
  document.body.prepend(sentinel);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      nav.classList.toggle("scrolled", !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ---------- 4. Contact section ---------- */
  (function renderContactDetails() {
    const list = document.getElementById("contactList");
    const rows = [
      ["Email", SITE_CONFIG.email, SITE_CONFIG.email ? "mailto:" + SITE_CONFIG.email : ""],
      ["Phone", SITE_CONFIG.phone, SITE_CONFIG.phone ? "tel:" + SITE_CONFIG.phone.replace(/[^\d+]/g, "") : ""],
      ["Studio", SITE_CONFIG.address, ""],
      ["Instagram", SITE_CONFIG.instagram, SITE_CONFIG.instagram]
    ].filter(function (r) { return r[1]; });

    if (!rows.length) { list.hidden = true; return; }
    rows.forEach(function (r) {
      const dt = document.createElement("dt");
      dt.textContent = r[0];
      const dd = document.createElement("dd");
      if (r[2]) {
        const a = document.createElement("a");
        a.href = r[2];
        a.textContent = r[1];
        if (r[0] === "Instagram") { a.target = "_blank"; a.rel = "noopener noreferrer"; }
        dd.appendChild(a);
      } else {
        dd.textContent = r[1];
      }
      list.appendChild(dt);
      list.appendChild(dd);
    });
  })();

  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  const fields = {
    name: { input: document.getElementById("cName"), error: document.getElementById("cNameErr"), message: "Enter your name." },
    email: { input: document.getElementById("cEmail"), error: document.getElementById("cEmailErr"), message: "Enter a valid email address." },
    message: { input: document.getElementById("cMessage"), error: document.getElementById("cMessageErr"), message: "Write a short message." }
  };

  function validateField(key) {
    const f = fields[key];
    const ok = f.input.checkValidity() && f.input.value.trim().length > 0;
    f.error.textContent = ok ? "" : f.message;
    f.input.setAttribute("aria-invalid", String(!ok));
    return ok;
  }

  Object.keys(fields).forEach(function (key) {
    fields[key].input.addEventListener("blur", function () { validateField(key); });
    fields[key].input.addEventListener("input", function () {
      if (fields[key].error.textContent) validateField(key);
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.textContent = "";
    status.className = "form-status";

    const valid = Object.keys(fields).map(validateField).every(Boolean);
    if (!valid) {
      const firstBad = Object.keys(fields).find(function (k) { return fields[k].input.getAttribute("aria-invalid") === "true"; });
      fields[firstBad].input.focus();
      return;
    }

    if (SITE_CONFIG.email) {
      const subject = encodeURIComponent("Enquiry from " + fields.name.input.value.trim());
      const text = encodeURIComponent(
        fields.message.input.value.trim() + "\n\n" + fields.name.input.value.trim() + "\n" + fields.email.input.value.trim()
      );
      window.location.href = "mailto:" + SITE_CONFIG.email + "?subject=" + subject + "&body=" + text;
      status.textContent = "Opening your email app with the message ready to send.";
      status.className = "form-status ok";
    } else {
      status.textContent = "This form is not connected yet. Add an email address to SITE_CONFIG in js/script.js, or connect a form service.";
      status.className = "form-status warn";
    }
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
