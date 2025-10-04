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

const attachListeners = () => {
  enableSearchOnBlurElement();
  enableClipboardElements();
};

const init = () => {
  attachListeners();
};

init();
