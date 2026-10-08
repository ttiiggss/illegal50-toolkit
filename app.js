(function () {
  const STORAGE_KEY = "illegal50_installed_v1";
  const grid = document.getElementById("grid");
  const searchBox = document.getElementById("searchBox");
  const filterRow = document.getElementById("filterRow");
  const installedCountEl = document.getElementById("installedCount");
  const progressFill = document.getElementById("progressFill");
  const installAllBtn = document.getElementById("installAllBtn");
  const resetAllBtn = document.getElementById("resetAllBtn");

  let installed = loadInstalled();
  let activeCategory = "All";
  let query = "";

  function loadInstalled() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) {
      return new Set();
    }
  }

  function saveInstalled() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...installed]));
  }

  function categories() {
    const cats = ["All", ...new Set(SITES.map((s) => s.cat))];
    return cats;
  }

  function renderFilters() {
    filterRow.innerHTML = "";
    categories().forEach((cat) => {
      const chip = document.createElement("button");
      chip.className = "chip" + (cat === activeCategory ? " active" : "");
      chip.textContent = cat;
      chip.addEventListener("click", () => {
        activeCategory = cat;
        renderFilters();
        renderGrid();
      });
      filterRow.appendChild(chip);
    });
  }

  function matchesFilter(site) {
    const inCategory = activeCategory === "All" || site.cat === activeCategory;
    const q = query.trim().toLowerCase();
    const inSearch =
      !q ||
      site.name.toLowerCase().includes(q) ||
      site.desc.toLowerCase().includes(q) ||
      site.cat.toLowerCase().includes(q);
    return inCategory && inSearch;
  }

  function toggleInstall(id) {
    if (installed.has(id)) {
      installed.delete(id);
    } else {
      installed.add(id);
    }
    saveInstalled();
    renderGrid();
    updateProgress();
  }

  function updateProgress() {
    installedCountEl.textContent = installed.size;
    progressFill.style.width = Math.round((installed.size / SITES.length) * 100) + "%";
  }

  function renderGrid() {
    const visible = SITES.filter(matchesFilter);
    grid.innerHTML = "";

    if (visible.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No websites match your search/filter.";
      grid.appendChild(empty);
      return;
    }

    visible.forEach((site) => {
      const isInstalled = installed.has(site.n);
      const card = document.createElement("div");
      card.className = "card" + (isInstalled ? " is-installed" : "");

      card.innerHTML = `
        <div class="card-top">
          <div class="card-title">
            <span class="card-icon">${site.icon}</span>
            <span class="card-name">${escapeHtml(site.name)}</span>
          </div>
          <span class="card-num">#${site.n}</span>
        </div>
        <div class="card-cat">${escapeHtml(site.cat)}</div>
        <div class="card-desc">${escapeHtml(site.desc)}</div>
        <div class="card-actions">
          <button class="install-btn ${isInstalled ? "installed" : ""}" data-id="${site.n}">
            ${isInstalled ? "✓ Installed" : "Install"}
          </button>
          <a class="visit-btn" href="${site.url}" target="_blank" rel="noopener noreferrer" title="Open ${escapeHtml(site.name)}">↗</a>
        </div>
      `;

      const installBtn = card.querySelector(".install-btn");
      installBtn.addEventListener("click", () => {
        if (!isInstalled) {
          window.open(site.url, "_blank", "noopener,noreferrer");
        }
        toggleInstall(site.n);
      });

      grid.appendChild(card);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  searchBox.addEventListener("input", (e) => {
    query = e.target.value;
    renderGrid();
  });

  installAllBtn.addEventListener("click", () => {
    SITES.forEach((s) => installed.add(s.n));
    saveInstalled();
    renderGrid();
    updateProgress();
  });

  resetAllBtn.addEventListener("click", () => {
    if (confirm("Reset all installed marks? This won't close any open tabs, just clears your checklist.")) {
      installed.clear();
      saveInstalled();
      renderGrid();
      updateProgress();
    }
  });

  renderFilters();
  renderGrid();
  updateProgress();
})();
