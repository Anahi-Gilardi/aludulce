/**
 * ALU DULCE — Script Principal (Vanilla JavaScript)
 * Funcionalidades:
 * 1. Menú hamburguesa mobile accesible
 * 2. Sombra en el header fijo y resaltado del ítem activo del menú al hacer scroll
 * 3. Animaciones suaves al hacer scroll con IntersectionObserver
 * 4. Lightbox interactivo para la galería de fotos (con teclado y swipe en celular)
 * 5. Mini formulario de presupuesto que arma el mensaje y abre WhatsApp (wa.me)
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ==========================================================================
     1. MENÚ HAMBURGUESA (MOBILE)
     ========================================================================== */
  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menu-toggle');
  const mainNav = document.getElementById('main-nav');
  const navLinks = document.querySelectorAll('.nav-link');

  /**
   * Abre o cierra el menú de navegación en dispositivos móviles.
   * @param {boolean} [forceState] - Estado forzado opcional (true = abrir, false = cerrar)
   */
  function toggleMobileMenu(forceState) {
    if (!menuToggle || !mainNav) return;

    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    const nextState = typeof forceState === 'boolean' ? forceState : !isExpanded;

    menuToggle.setAttribute('aria-expanded', String(nextState));
    menuToggle.setAttribute(
      'aria-label',
      nextState ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'
    );
    mainNav.classList.toggle('is-open', nextState);
  }

  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => toggleMobileMenu());

    // Cerrar menú al tocar cualquier link de navegación
    navLinks.forEach((link) => {
      link.addEventListener('click', () => toggleMobileMenu(false));
    });

    // Cerrar menú al tocar fuera del header
    document.addEventListener('click', (event) => {
      const isMenuOpen = mainNav.classList.contains('is-open');
      if (isMenuOpen && header && !header.contains(event.target)) {
        toggleMobileMenu(false);
      }
    });

    // Cerrar menú al presionar la tecla Escape
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && mainNav.classList.contains('is-open')) {
        toggleMobileMenu(false);
        menuToggle.focus();
      }
    });
  }

  /* ==========================================================================
     2. SOMBRA DEL HEADER Y RESALTADO DEL ÍTEM ACTIVO DEL MENÚ
     ========================================================================== */
  const trackedSections = Array.from(navLinks)
    .map((link) => {
      const targetId = link.getAttribute('href');
      if (!targetId || !targetId.startsWith('#')) return null;
      const sectionEl = document.querySelector(targetId);
      return sectionEl ? { link, sectionEl } : null;
    })
    .filter(Boolean);

  function updateHeaderAndActiveNav() {
    const scrollY = window.scrollY;

    // Agregar clase cuando se baja más de 20px
    if (header) {
      header.classList.toggle('scrolled', scrollY > 20);
    }

    // Determinar qué sección está activa según la posición actual del scroll
    const scrollCheckPos = scrollY + 150;
    let currentMatch = trackedSections[0];

    for (const item of trackedSections) {
      if (item.sectionEl.offsetTop <= scrollCheckPos) {
        currentMatch = item;
      }
    }

    if (currentMatch) {
      navLinks.forEach((link) => link.classList.remove('active'));
      currentMatch.link.classList.add('active');
    }
  }

  window.addEventListener('scroll', updateHeaderAndActiveNav, { passive: true });
  updateHeaderAndActiveNav();

  /* ==========================================================================
     3. ANIMACIONES SUAVES CON INTERSECTION OBSERVER
     ========================================================================== */
  const revealElements = document.querySelectorAll('.reveal');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  }

  /* ==========================================================================
     4. LIGHTBOX INTERACTIVO PARA LA GALERÍA
     ========================================================================== */
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
  const lightbox = document.getElementById('lightbox');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxImgWrap = document.getElementById('lightbox-img-wrap');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxPlaceholderTitle = document.getElementById('lightbox-placeholder-title');
  const lightboxPlaceholderPath = document.getElementById('lightbox-placeholder-path');

  let currentGalleryIndex = 0;
  let lastFocusedGalleryButton = null;
  let touchStartX = 0;

  function renderLightboxItem(index) {
    if (!galleryItems.length || !lightboxImg) return;

    // Ciclo continuo entre primera y última foto
    currentGalleryIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentGalleryIndex];

    const src = item.dataset.src || '';
    const title = item.dataset.title || 'Alu Dulce';
    const caption = item.dataset.caption || '';

    // Actualizar textos
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxCaption) lightboxCaption.textContent = caption;
    if (lightboxCounter) {
      lightboxCounter.textContent = `${currentGalleryIndex + 1} / ${galleryItems.length}`;
    }
    if (lightboxPlaceholderTitle) lightboxPlaceholderTitle.textContent = title;
    if (lightboxPlaceholderPath) lightboxPlaceholderPath.textContent = src;

    // Resetear estado de fallback antes de cargar la nueva imagen
    if (lightboxImgWrap) lightboxImgWrap.classList.remove('img-fallback');

    lightboxImg.alt = `${title} - ${caption}`;
    lightboxImg.onerror = () => {
      if (lightboxImgWrap) lightboxImgWrap.classList.add('img-fallback');
    };
    lightboxImg.src = src;
  }

  function openLightbox(index, triggerButton) {
    if (!lightbox) return;
    lastFocusedGalleryButton = triggerButton || null;
    renderLightboxItem(index);
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if (lastFocusedGalleryButton) {
      lastFocusedGalleryButton.focus();
    }
  }

  if (galleryItems.length && lightbox) {
    galleryItems.forEach((item, index) => {
      item.addEventListener('click', () => openLightbox(index, item));
    });

    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    if (lightboxBackdrop) {
      lightboxBackdrop.addEventListener('click', closeLightbox);
    }

    if (lightboxPrev) {
      lightboxPrev.addEventListener('click', () => renderLightboxItem(currentGalleryIndex - 1));
    }

    if (lightboxNext) {
      lightboxNext.addEventListener('click', () => renderLightboxItem(currentGalleryIndex + 1));
    }

    // Navegación con teclado (Escape, Flecha Izquierda, Flecha Derecha)
    document.addEventListener('keydown', (event) => {
      if (lightbox.hidden) return;

      if (event.key === 'Escape') {
        closeLightbox();
      } else if (event.key === 'ArrowLeft') {
        renderLightboxItem(currentGalleryIndex - 1);
      } else if (event.key === 'ArrowRight') {
        renderLightboxItem(currentGalleryIndex + 1);
      }
    });

    // Soporte táctil (swipe izquierda / derecha en celular)
    lightbox.addEventListener(
      'touchstart',
      (event) => {
        if (event.changedTouches && event.changedTouches.length > 0) {
          touchStartX = event.changedTouches[0].screenX;
        }
      },
      { passive: true }
    );

    lightbox.addEventListener(
      'touchend',
      (event) => {
        if (!event.changedTouches || event.changedTouches.length === 0) return;
        const touchEndX = event.changedTouches[0].screenX;
        const deltaX = touchEndX - touchStartX;

        if (Math.abs(deltaX) > 45) {
          if (deltaX < 0) {
            renderLightboxItem(currentGalleryIndex + 1);
          } else {
            renderLightboxItem(currentGalleryIndex - 1);
          }
        }
      },
      { passive: true }
    );
  }

  /* ==========================================================================
     5. MINI FORMULARIO DE PRESUPUESTO -> ENVÍO DIRECTO A WHATSAPP
     ========================================================================== */
  const budgetForm = document.getElementById('budget-form');
  const fechaInput = document.getElementById('fecha');
  const formFeedback = document.getElementById('form-feedback');

  // Establecer fecha mínima en hoy para evitar fechas pasadas por error
  if (fechaInput) {
    const todayISO = new Date().toISOString().split('T')[0];
    fechaInput.setAttribute('min', todayISO);
  }

  /**
   * Formatea una fecha YYYY-MM-DD al formato argentino DD/MM/AAAA
   * @param {string} isoDate
   * @returns {string}
   */
  function formatDateAR(isoDate) {
    if (!isoDate || !isoDate.includes('-')) return isoDate;
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }

  if (budgetForm) {
    // Limpiar estilos de error cuando el usuario escribe
    const requiredInputs = budgetForm.querySelectorAll('[required]');
    requiredInputs.forEach((field) => {
      field.addEventListener('input', () => {
        field.classList.remove('input-error');
        if (formFeedback) formFeedback.hidden = true;
      });
      field.addEventListener('change', () => {
        field.classList.remove('input-error');
        if (formFeedback) formFeedback.hidden = true;
      });
    });

    budgetForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const nombreEl = document.getElementById('nombre');
      const fechaEl = document.getElementById('fecha');
      const personasEl = document.getElementById('personas');
      const tipoEventoEl = document.getElementById('tipo-evento');
      const mensajeEl = document.getElementById('mensaje');

      const nombre = nombreEl ? nombreEl.value.trim() : '';
      const fecha = fechaEl ? fechaEl.value.trim() : '';
      const personas = personasEl ? personasEl.value.trim() : '';
      const tipoEvento = tipoEventoEl ? tipoEventoEl.value.trim() : '';
      const mensaje = mensajeEl ? mensajeEl.value.trim() : '';

      // Validación de campos obligatorios
      let hasError = false;
      [nombreEl, fechaEl, personasEl, tipoEventoEl].forEach((el) => {
        if (el && !el.value.trim()) {
          el.classList.add('input-error');
          hasError = true;
        }
      });

      if (hasError) {
        if (formFeedback) {
          formFeedback.textContent =
            'Por favor completá tu nombre, la fecha, el tipo de evento y la cantidad aproximada de personas.';
          formFeedback.hidden = false;
        }
        return;
      }

      // Construcción del mensaje para WhatsApp
      const lineasMensaje = [
        'Hola Alu Dulce! Quiero pedir un presupuesto para un evento.',
        '',
        `• Nombre: ${nombre}`,
        `• Fecha del evento: ${formatDateAR(fecha)}`,
        `• Tipo de evento: ${tipoEvento}`,
        `• Cantidad de personas aprox.: ${personas}`
      ];

      if (mensaje) {
        lineasMensaje.push(`• Mensaje: ${mensaje}`);
      }

      const textoFinal = lineasMensaje.join('\n');
      const urlWhatsApp = `https://wa.me/5491138764187?text=${encodeURIComponent(textoFinal)}`;

      // Abrir WhatsApp en nueva pestaña/aplicación
      window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');
    });
  }
});
