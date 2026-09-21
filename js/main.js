(function () {
  'use strict';

  const STORAGE_KEY = 'portafolio-tema';
  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const storage = {
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        return;
      }
    }
  };

  function initTheme() {
    const buttons = document.querySelectorAll('[data-theme-toggle]');

    function applyTheme(theme, persist) {
      root.setAttribute('data-theme', theme);
      buttons.forEach((button) => {
        button.setAttribute('aria-pressed', String(theme === 'dark'));
      });
      if (persist) {
        storage.set(STORAGE_KEY, theme);
      }
      document.dispatchEvent(new CustomEvent('themechange'));
    }

    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light', false);

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next, true);
      });
    });
  }

  function initMenu() {
    const toggle = document.querySelector('.navbar__toggle');
    const menu = document.getElementById('menu-principal');
    if (!toggle || !menu) {
      return;
    }

    const label = toggle.querySelector('.visually-hidden');

    function setOpen(open) {
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Cerrar menú' : 'Abrir menú';
    }

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        setOpen(false);
      }
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.site-header')) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  function initActiveLink() {
    const links = Array.from(document.querySelectorAll('.site-header .navbar__link'));
    const sections = links
      .map((link) => document.querySelector(link.getAttribute('href')))
      .filter(Boolean);

    if (!sections.length || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          links.forEach((link) => {
            if (link.getAttribute('href') === `#${entry.target.id}`) {
              link.setAttribute('aria-current', 'true');
            } else {
              link.removeAttribute('aria-current');
            }
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
  }

  function initProjectFilter() {
    const buttons = document.querySelectorAll('[data-filter]');
    const cards = document.querySelectorAll('#lista-proyectos .project-card');
    const status = document.querySelector('[data-filter-status]');
    if (!buttons.length || !cards.length) {
      return;
    }

    function applyFilter(filter) {
      let visible = 0;

      cards.forEach((card) => {
        const technologies = (card.dataset.tecnologias || '').split(' ');
        const show = filter === 'todos' || technologies.includes(filter);
        card.hidden = !show;
        if (show) {
          visible += 1;
        }
      });

      buttons.forEach((button) => {
        button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
      });

      if (status) {
        status.textContent = `Mostrando ${visible} de ${cards.length} proyectos`;
      }
    }

    buttons.forEach((button) => {
      button.addEventListener('click', () => applyFilter(button.dataset.filter));
    });

    applyFilter('todos');
  }

  function initProjectModal() {
    const dialog = document.getElementById('modal-proyecto');
    if (!dialog || typeof dialog.showModal !== 'function') {
      return;
    }

    const title = dialog.querySelector('[data-modal-title]');
    const body = dialog.querySelector('[data-modal-body]');

    function addHeading(text) {
      const heading = document.createElement('h4');
      heading.textContent = text;
      body.append(heading);
    }

    function fillModal(card) {
      const image = card.querySelector('.project-card__media img');
      const summary = card.querySelector('.project-card__summary');
      const details = card.querySelector('.project-card__more');
      const technologies = card.querySelector('.badge-list');
      const links = card.querySelectorAll('.project-card__actions a');

      title.textContent = card.querySelector('.project-card__title').textContent;
      body.replaceChildren();

      if (image) {
        const clone = image.cloneNode(true);
        clone.removeAttribute('loading');
        clone.classList.add('modal__image');
        body.append(clone);
      }

      if (summary) {
        const paragraph = document.createElement('p');
        paragraph.textContent = summary.textContent;
        body.append(paragraph);
      }

      if (details) {
        details.childNodes.forEach((node) => body.append(node.cloneNode(true)));
      }

      if (technologies) {
        addHeading('Tecnologías');
        body.append(technologies.cloneNode(true));
      }

      if (links.length) {
        const wrapper = document.createElement('div');
        wrapper.className = 'modal__links';
        links.forEach((link) => wrapper.append(link.cloneNode(true)));
        body.append(wrapper);
      }

      body.scrollTop = 0;
    }

    document.querySelectorAll('[data-open-modal]').forEach((button) => {
      button.hidden = false;
      button.addEventListener('click', () => {
        fillModal(button.closest('.project-card'));
        dialog.showModal();
        document.body.classList.add('is-locked');
      });
    });

    dialog.querySelector('[data-close-modal]').addEventListener('click', () => dialog.close());

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });

    dialog.addEventListener('close', () => {
      document.body.classList.remove('is-locked');
    });
  }

  function initContactForm() {
    const form = document.getElementById('form-contacto');
    if (!form) {
      return;
    }

    const status = form.querySelector('[data-form-status]');
    const fields = Array.from(form.querySelectorAll('.field__control'));
    const mailLink = document.querySelector('.contact-list a[href^="mailto:"]');

    const rules = {
      nombre: (value) =>
        value.trim().length < 3 ? 'Escribe tu nombre completo (mínimo 3 letras).' : '',
      correo: (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
          ? ''
          : 'Escribe un correo válido, por ejemplo nombre@dominio.com.',
      asunto: (value) =>
        value.trim().length < 4 ? 'El asunto debe tener al menos 4 caracteres.' : '',
      mensaje: (value) =>
        value.trim().length < 20 ? 'El mensaje debe tener al menos 20 caracteres.' : ''
    };

    function showError(field, message) {
      const error = document.getElementById(`${field.id}-error`);
      field.setAttribute('aria-invalid', String(Boolean(message)));
      error.textContent = message;
      error.hidden = !message;
    }

    function validateField(field) {
      const message = rules[field.name](field.value);
      showError(field, message);
      return !message;
    }

    function showStatus(message, type) {
      status.textContent = message;
      status.classList.toggle('form-status--error', type === 'error');
      status.hidden = false;
    }

    fields.forEach((field) => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') {
          validateField(field);
        }
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const results = fields.map(validateField);
      const firstInvalid = fields[results.indexOf(false)];

      if (firstInvalid) {
        firstInvalid.focus();
        showStatus('Revisa los campos marcados antes de enviar.', 'error');
        return;
      }

      const data = new FormData(form);
      const recipient = mailLink ? mailLink.getAttribute('href').replace('mailto:', '') : '';
      const subject = encodeURIComponent(data.get('asunto').trim());
      const text = encodeURIComponent(
        `Nombre: ${data.get('nombre').trim()}\nCorreo: ${data.get('correo').trim()}\n\n${data.get('mensaje').trim()}`
      );

      form.reset();
      fields.forEach((field) => showError(field, ''));
      showStatus('Se abrió tu aplicación de correo con el mensaje listo. Solo falta enviarlo.', 'success');
      window.location.href = `mailto:${recipient}?subject=${subject}&body=${text}`;
    });
  }

  function initBackToTop() {
    const button = document.querySelector('[data-back-to-top]');
    if (!button) {
      return;
    }

    function updateVisibility() {
      button.hidden = window.scrollY < 600;
    }

    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();

    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  function initTokenValues() {
    const targets = document.querySelectorAll('[data-token]');
    if (!targets.length) {
      return;
    }

    function render() {
      const styles = window.getComputedStyle(root);
      targets.forEach((target) => {
        target.textContent = styles.getPropertyValue(target.dataset.token).trim();
      });
    }

    render();
    document.addEventListener('themechange', render);
  }

  initTheme();
  initMenu();
  initActiveLink();
  initProjectFilter();
  initProjectModal();
  initContactForm();
  initBackToTop();
  initTokenValues();
})();
