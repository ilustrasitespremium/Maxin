(function () {
  "use strict";

  /* ---------- ano no rodapé ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- nav: fundo ao rolar ---------- */
  var nav = document.getElementById("nav");
  function onScrollNav() {
    if (window.scrollY > 40) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  }
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  /* ---------- menu mobile ---------- */
  var burger = document.getElementById("burger");
  var navMobile = document.getElementById("navMobile");
  function closeMobile() {
    navMobile.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  burger.addEventListener("click", function () {
    var open = navMobile.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  navMobile.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMobile);
  });

  /* ---------- scroll reveal ----------
     Checagem manual por getBoundingClientRect (em vez de depender só de
     IntersectionObserver): em rolagens muito rápidas (fling no celular) o
     observer pode não disparar a tempo e deixar o elemento invisível pra
     sempre. Chamada direta a cada scroll (sem throttle por rAF — o custo é
     baixo e a lista só encolhe) garante que nada fique escondido. */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  function checkReveal() {
    if (revealEls.length === 0) return;
    var vh = window.innerHeight;
    revealEls = revealEls.filter(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < vh * 1.15 && rect.bottom > -150) {
        el.classList.add("is-visible");
        return false; // já revelado, remove da lista de checagem
      }
      return true;
    });
    if (revealEls.length === 0) {
      window.removeEventListener("scroll", checkReveal);
      window.removeEventListener("resize", checkReveal);
    }
  }

  checkReveal();
  window.addEventListener("scroll", checkReveal, { passive: true });
  window.addEventListener("resize", checkReveal);
  window.addEventListener("load", checkReveal);

  // Poll por tempo além do listener de scroll: navegadores podem agrupar
  // (coalescer) vários eventos de scroll em um só a cada quadro, então uma
  // rolagem muito rápida pode pular posições intermediárias. O polling
  // garante checagem em intervalos fixos de tempo, não de eventos.
  var pollId = setInterval(function () {
    checkReveal();
    if (revealEls.length === 0) clearInterval(pollId);
  }, 150);

  // rede de segurança final: garante que tudo apareça mesmo em algum cenário imprevisto
  setTimeout(function () {
    clearInterval(pollId);
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
    revealEls = [];
  }, 2500);

  /* ---------- vídeo: botão de play custom ---------- */
  var video = document.getElementById("tourVideo");
  var playBtn = document.getElementById("videoPlay");
  if (video && playBtn) {
    playBtn.addEventListener("click", function () {
      video.play();
    });
    video.addEventListener("play", function () {
      playBtn.classList.add("is-hidden");
    });
    video.addEventListener("pause", function () {
      playBtn.classList.remove("is-hidden");
    });
    video.addEventListener("ended", function () {
      playBtn.classList.remove("is-hidden");
    });
  }

  /* ---------- lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var lbImg = document.getElementById("lightboxImg");
  var lbCaption = document.getElementById("lightboxCaption");
  var lbClose = document.getElementById("lightboxClose");
  var lbPrev = document.getElementById("lightboxPrev");
  var lbNext = document.getElementById("lightboxNext");

  var currentGroup = [];
  var currentIndex = 0;
  var lastFocused = null;

  function buildGroups() {
    var groups = {};
    document.querySelectorAll("[data-lightbox-group]").forEach(function (container) {
      var groupName = container.getAttribute("data-lightbox-group");
      var items = Array.prototype.slice.call(container.querySelectorAll(".bento__item"));
      groups[groupName] = items;
      items.forEach(function (item, idx) {
        item.addEventListener("click", function () {
          openLightbox(groupName, idx);
        });
      });
    });
    return groups;
  }
  var groups = buildGroups();

  function openLightbox(groupName, index) {
    currentGroup = groups[groupName];
    currentIndex = index;
    lastFocused = document.activeElement;
    renderLightbox();
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    lbClose.focus();
    document.addEventListener("keydown", onKeydown);
  }

  function renderLightbox() {
    var item = currentGroup[currentIndex];
    var full = item.getAttribute("data-full");
    var caption = item.getAttribute("data-caption") || "";
    lbImg.src = full;
    lbImg.alt = caption;
    lbCaption.textContent = caption;
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lbImg.src = "";
    document.removeEventListener("keydown", onKeydown);
    if (lastFocused) lastFocused.focus();
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % currentGroup.length;
    renderLightbox();
  }
  function showPrev() {
    currentIndex = (currentIndex - 1 + currentGroup.length) % currentGroup.length;
    renderLightbox();
  }

  function onKeydown(e) {
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showNext();
    if (e.key === "ArrowLeft") showPrev();
  }

  lbClose.addEventListener("click", closeLightbox);
  lbNext.addEventListener("click", showNext);
  lbPrev.addEventListener("click", showPrev);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  /* ---------- smooth-close mobile menu on hash nav from desktop links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function () {
      if (navMobile.classList.contains("is-open")) closeMobile();
    });
  });
})();
