(function () {
  var root = document.documentElement;
  var theme = null;

  root.classList.add('js');

  try {
    theme = window.localStorage.getItem('portafolio-tema');
  } catch (error) {
    theme = null;
  }

  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  root.setAttribute('data-theme', theme);
})();
