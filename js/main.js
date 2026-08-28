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
     sempre. Chamada direta a cada scroll (sem throttle por rAF, já que o custo é
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
      var items = Array.prototype.slice.call(container.querySelectorAll(".carousel__item"));
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
    pushModalHistory("foto");
  }

  function renderLightbox() {
    var item = currentGroup[currentIndex];
    var full = item.getAttribute("data-full");
    var caption = item.getAttribute("data-caption") || "";
    lbImg.src = full;
    lbImg.alt = caption;
    lbCaption.textContent = caption;
  }

  function closeLightbox(fromPopstate) {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lbImg.src = "";
    document.removeEventListener("keydown", onKeydown);
    if (lastFocused) lastFocused.focus();
    if (!fromPopstate) consumeModalHistory();
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

  lbClose.addEventListener("click", function () { closeLightbox(); });
  lbNext.addEventListener("click", showNext);
  lbPrev.addEventListener("click", showPrev);
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  /* ---------- fecha modais (fotos/avaliações) com o botão/gesto "voltar" do
     navegador, em vez de deixar o usuário preso ou navegar pra fora da página ---------- */
  var openModalName = null;
  function pushModalHistory(name) {
    openModalName = name;
    history.pushState({ modal: name }, "", "#" + name);
  }
  function consumeModalHistory() {
    if (openModalName) {
      openModalName = null;
      history.back();
    }
  }
  window.addEventListener("popstate", function () {
    openModalName = null;
    if (lightbox.classList.contains("is-open")) closeLightbox(true);
    if (reviewsModal && reviewsModal.classList.contains("is-open")) closeReviewsModal(true);
  });

  /* ---------- carrossel (fotos dos ambientes + avaliações) ---------- */
  document.querySelectorAll(".carousel").forEach(function (carousel) {
    var track = carousel.querySelector(".carousel__track");
    var prev = carousel.querySelector(".carousel__arrow--prev");
    var next = carousel.querySelector(".carousel__arrow--next");
    if (!track || !prev || !next) return;

    function update() {
      var scrollable = track.scrollWidth - track.clientWidth > 4;
      carousel.classList.toggle("carousel--static", !scrollable);
      prev.disabled = !scrollable || track.scrollLeft <= 4;
      next.disabled = !scrollable || track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
    }

    function step(dir) {
      var item = track.firstElementChild;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0) || 16;
      var width = item ? item.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
      track.scrollBy({ left: dir * width, behavior: "smooth" });
    }

    prev.addEventListener("click", function () { step(-1); });
    next.addEventListener("click", function () { step(1); });
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  /* ---------- avaliações: modal com todas + foco na clicada ---------- */
  var reviewsModal = document.getElementById("reviewsModal");
  var reviewsModalList = document.getElementById("reviewsModalList");
  var reviewsModalClose = document.getElementById("reviewsModalClose");
  var reviewButtons = Array.prototype.slice.call(document.querySelectorAll(".review"));
  var GOOGLE_REVIEWS_URL = "https://www.google.com/maps/place/Maxin+%7C+M%C3%B3veis+Planejados+BH/@-19.8785156,-43.9354263,20z/data=!4m6!3m5!1s0x493dd965b6391fa5:0x40df2199ec184b53!8m2!3d-19.8785156!4d-43.9354263!16s%2Fg%2F11kjpfq629?hl=pt-BR&entry=ttu&g_ep=EgoyMDI2MDgyNi4wIKXMDSoASAFQAw%3D%3D";
  var closeReviewsModal = function () {};

  if (reviewsModal && reviewsModalList && reviewButtons.length) {
    reviewButtons.forEach(function (btn, i) {
      var clone = btn.cloneNode(true);
      clone.removeAttribute("type");
      var wrap = document.createElement("div");
      wrap.className = "reviews-modal__item";
      wrap.id = "review-" + i;
      wrap.appendChild(clone);
      reviewsModalList.appendChild(wrap);

      btn.addEventListener("click", function () { openReviewsModal(i); });
    });

    var seeAllLink = document.createElement("a");
    seeAllLink.href = GOOGLE_REVIEWS_URL;
    seeAllLink.target = "_blank";
    seeAllLink.rel = "noopener";
    seeAllLink.className = "reviews-modal__cta";
    seeAllLink.textContent = "Ver tudo no Google ↗";
    reviewsModalList.appendChild(seeAllLink);

    var onReviewsKeydown = function (e) { if (e.key === "Escape") closeReviewsModal(); };

    function openReviewsModal(focusIndex) {
      reviewsModal.classList.add("is-open");
      reviewsModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onReviewsKeydown);
      pushModalHistory("avaliacoes");
      if (typeof focusIndex === "number") {
        var target = document.getElementById("review-" + focusIndex);
        if (target) {
          requestAnimationFrame(function () {
            target.scrollIntoView({ block: "center" });
            target.classList.add("is-highlighted");
            setTimeout(function () { target.classList.remove("is-highlighted"); }, 1800);
          });
        }
      }
    }

    closeReviewsModal = function (fromPopstate) {
      reviewsModal.classList.remove("is-open");
      reviewsModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onReviewsKeydown);
      if (!fromPopstate) consumeModalHistory();
    };

    if (reviewsModalClose) reviewsModalClose.addEventListener("click", function () { closeReviewsModal(); });
    reviewsModal.addEventListener("click", function (e) {
      if (e.target === reviewsModal) closeReviewsModal();
    });
  }

  /* ---------- smooth-close mobile menu on hash nav from desktop links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function () {
      if (navMobile.classList.contains("is-open")) closeMobile();
    });
  });
})();
