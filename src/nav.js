// --[ Top bar ]--
class SiteHeader extends HTMLElement {
    connectedCallback() {
        const back = this.getAttribute("back");
        const title = this.textContent.trim() || "Spot the Bot";
        const page = location.pathname.split("/").pop();
        const current = (href) => (page === href ? 'aria-current="page"' : "");

        this.innerHTML = `
            ${back
                ? `<a href="${back}" class="icon-btn" id="backBtn" aria-label="Back"><i class="icon">arrow_back</i></a>`
                : `<a href="index.html" class="icon-btn" aria-label="Home"><img src="images/logo.svg" alt="" width="32"></a>`}
            <span class="title">${title}</span>
            <div class="end">
                <a href="settings.html" class="icon-btn" aria-label="Settings" ${current("settings.html")}><i class="icon">settings</i></a>
                <a href="profile.html" class="icon-btn" aria-label="Profile" ${current("profile.html")}><i class="icon">account_circle</i></a>
            </div>`;

        this.querySelector("#backBtn")?.addEventListener("click", (event) => {
            if (document.referrer.startsWith(location.origin)) {
                event.preventDefault();
                history.back();
            }
        });
    }
}

// --[ Bottom nav ]--
class SiteNav extends HTMLElement {
    connectedCallback() {
        const link = (href, icon, label, i) => `<a href="${href}" style="--i:${i}"><i class="icon">${icon}</i>${label}</a>`;

        this.innerHTML = `
            <input type="checkbox" id="menuToggle" class="menu-toggle">
            <label for="menuToggle" class="scrim"></label>
            <label for="menuToggle" class="corner menu" aria-label="Menu"><i class="icon">ads_click</i></label>
            <nav class="menu-items">
                ${link("index.html", "home", "Home", 3)}
                ${link("activities.html", "stadia_controller", "Activities", 2)}
                ${link("tips.html", "lightbulb", "Tips", 1)}
                ${link("add-friend.html", "person_add", "Add Friend", 0)}
            </nav>
            <a href="chat.html" class="corner chat" aria-label="Chat"><i class="icon">forum</i><small>Chat</small></a>`;

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") this.querySelector("#menuToggle").checked = false;
        });
    }
}

customElements.define("site-header", SiteHeader);
customElements.define("site-nav", SiteNav);
