const backBtn = document.getElementById("backBtn");

// Pavlo : Ron this takes care of the Back button. If you came to Settings from one of our pages
// it sends you back to that same page. If not (like someone opened settings.html straight away)
// the href="index.html" on the button just sends them Home.
backBtn.addEventListener("click", (event) => {
    if (document.referrer.startsWith(window.location.origin)) {
        event.preventDefault();   // Pavlo - stops it from going to index.html
        history.back();
    }
});
