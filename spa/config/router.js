

const appContent = document.getElementById("app-content"); // Main content area

function loadPage(routePath) {
    fetch(routePath)
        .then(response => {
            if (!response.ok) {
                console.error("Page not found:", routePath);
                return fetch("pages/404/404.html"); // Load 404 page if file not found
            }
            return response.text();
        })
        .then(html => {
            document.getElementById("app-content").innerHTML = html;
            executePageScripts(); // Ensure page scripts run after load
        })
        .catch(error => {
            console.error("Load Error:", error);
            fetch("pages/404/404.html")
                .then(response => response.text())
                .then(html => {
                    document.getElementById("app-content").innerHTML = html;
                    executePageScripts();
                });
        });
}


function navigateTo(route) {

    const [path,queryString] = route.split("?"); // Extract the base path (before ?id=...)

    const formattedRoute = path.replace(/^\/|\/$/g, ""); // Remove leading/trailing slashes
    // console.log("Navigating to:", formattedRoute); // Debugging
    // console.log("Navigating to:", route); // Debugging
    // Dynamic path handling for multi-level pages
    const routePath = `pages/${formattedRoute}.html`;

    history.pushState({}, "", `#${formattedRoute}`);
    loadPage(routePath);

    if (Alpine.store("GlobalVariable")) {
        // Merge query parameters safely        
        Alpine.store("GlobalVariable").queryParams = Alpine.reactive(getQueryParams(queryString));
    }

    // Store extracted query parameters in the global store
    

}


function getQueryParams(queryString = "") {
    const params = new URLSearchParams(queryString);
    const queryObject = {};

    for (const [key, value] of params.entries()) {
        queryObject[key] = value;
    }

    return queryObject;
}

function executePageScripts() {
    // Reload inline scripts (if any exist in dynamically loaded pages)
    document.querySelectorAll("script").forEach(oldScript => {
        if (oldScript.hasAttribute("data-keep")) return; // Skip persistent scripts
        const newScript = document.createElement("script");
        newScript.textContent = oldScript.textContent; // Preserve inline script content
        document.body.appendChild(newScript).parentNode.removeChild(newScript);
    });

   
}

// Reinitialize Semantic UI Dropdown
$('.ui.dropdown').dropdown({
    on: 'hover' // Change to 'hover' if needed
});

// Handle browser back/forward navigation
window.addEventListener("popstate", () => {
    navigateTo(location.hash.slice(1) || "home");
});

// Initial page load
document.addEventListener("DOMContentLoaded", () => {
    navigateTo(location.hash.slice(1) || "home/welcome");
});

