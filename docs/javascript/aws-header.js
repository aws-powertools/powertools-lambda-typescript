(() => {
  if (window.__awsHeaderMenusBound) {
    return;
  }

  window.__awsHeaderMenusBound = true;

  const menuSelector = ".aws-header__menu";
  const summarySelector = ".aws-header__menu-summary";

  const closeMenus = (except) => {
    document.querySelectorAll(`${menuSelector}[open]`).forEach((menu) => {
      if (menu !== except) {
        menu.removeAttribute("open");
      }
    });
  };

  document.addEventListener("click", (event) => {
    const summary = event.target.closest(summarySelector);

    if (summary) {
      const menu = summary.closest(menuSelector);
      if (menu && !menu.open) {
        closeMenus(menu);
      }
      return;
    }

    if (!event.target.closest(menuSelector)) {
      closeMenus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    const openMenu = document.querySelector(`${menuSelector}[open]`);
    if (!openMenu) {
      return;
    }

    const summary = openMenu.querySelector(summarySelector);
    closeMenus();
    if (summary) {
      summary.focus();
    }
  });
})();

(() => {
  if (window.__awsNavCollapseBound) {
    return;
  }

  window.__awsNavCollapseBound = true;

  const collapsedClass = "aws-nav-collapsed";
  const collapseButtonClass = "aws-nav-collapse";
  const reopenButtonClass = "aws-nav-reopen";
  const storageKey = "aws-nav-collapsed";

  const chevronSvg = (direction) => `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16">
      <path d="M${direction === "left" ? "10.5 3 5.5 8l5 5" : "5.5 3l5 5-5 5"}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
    </svg>
  `;

  const menuSvg = () => `
    <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20">
      <path d="M4 6h12M4 10h12M4 14h12" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"/>
    </svg>
  `;

  const setReopenPosition = () => {
    const mainInner = document.querySelector(".md-main__inner");
    if (!mainInner) {
      return;
    }

    const rect = mainInner.getBoundingClientRect();
    document.documentElement.style.setProperty(
      "--aws-nav-reopen-left",
      `${Math.max(rect.left + 12, 12)}px`
    );
    document.documentElement.style.setProperty(
      "--aws-nav-reopen-top",
      `${Math.max(rect.top + window.scrollY, 0)}px`
    );
  };

  const queueReopenPosition = () => {
    window.requestAnimationFrame(setReopenPosition);
  };

  const restoreState = () => {
    let isCollapsed = false;

    try {
      isCollapsed = localStorage.getItem(storageKey) === "true";
    } catch (_) {
      isCollapsed = false;
    }

    document.documentElement.classList.toggle(collapsedClass, isCollapsed);
  };

  const setCollapsed = (isCollapsed) => {
    document.documentElement.classList.toggle(collapsedClass, isCollapsed);
    queueReopenPosition();

    try {
      localStorage.setItem(storageKey, String(isCollapsed));
    } catch (_) {
      // Ignore storage failures in private browsing or locked-down contexts.
    }
  };

  const createButton = ({ className, label, direction, icon }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    button.innerHTML = icon === "menu" ? menuSvg() : chevronSvg(direction);
    return button;
  };

  const ensureButtons = () => {
    const sidebar = document.querySelector(".md-sidebar--primary");
    const collapseButtonHost =
      sidebar?.querySelector(".md-sidebar__scrollwrap") ?? sidebar;

    if (collapseButtonHost && !sidebar.querySelector(`.${collapseButtonClass}`)) {
      collapseButtonHost.append(
        createButton({
          className: collapseButtonClass,
          label: "Collapse navigation",
          direction: "left",
        })
      );
    }

    if (!document.querySelector(`.${reopenButtonClass}`)) {
      document.body.append(
        createButton({
          className: reopenButtonClass,
          label: "Open navigation",
          icon: "menu",
        })
      );
    }
  };

  restoreState();

  document.addEventListener("click", (event) => {
    const collapseButton = event.target.closest(`.${collapseButtonClass}`);
    const reopenButton = event.target.closest(`.${reopenButtonClass}`);

    if (collapseButton) {
      setCollapsed(true);
      return;
    }

    if (reopenButton) {
      setCollapsed(false);
    }
  });

  const init = () => {
    restoreState();
    ensureButtons();
    queueReopenPosition();
  };

  window.addEventListener("resize", queueReopenPosition);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(init);
  }
})();
