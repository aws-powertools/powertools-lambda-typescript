function copyToClipboard(e) {
  e.preventDefault();
  navigator.clipboard.writeText(e.target.textContent);
  alert$.next('Copied to clipboard');
}

function enableClipboardElements() {
  const copyElements = document.querySelectorAll('.copyMe');
  copyElements.forEach((element) => {
    element.addEventListener('click', copyToClipboard);
  });
}

document.addEventListener('click', (event) => {
  document.querySelectorAll('.aws-prefs[open]').forEach((details) => {
    if (!details.contains(event.target)) details.removeAttribute('open');
  });
});

const attachListeners = () => {
  enableSearchOnBlurElement();
  enableClipboardElements();
};

const init = () => {
  attachListeners();
};

init();
