const appContent = document.getElementById("app-content");

function loadPage(routePath) {
    fetch(routePath)
        .then(response => {
            if (!response.ok) {
                console.error("Page not found:", routePath);
                return fetch("pages/404/404.html");
            }
            return response.text();
        })
        .then(html => {
            document.getElementById("app-content").innerHTML = html;
            executePageScripts();
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
    const [path, queryString] = route.split("?");
    const formattedRoute = path.replace(/^\/|\/$/g, "");
    const routePath = `pages/${formattedRoute}.html`;

    history.pushState({}, "", `#${formattedRoute}`);
    loadPage(routePath);

    if (Alpine.store("GlobalVariable")) {
        Alpine.store("GlobalVariable").queryParams = Alpine.reactive(getQueryParams(queryString));
    }
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
    document.querySelectorAll("script").forEach(oldScript => {
        if (oldScript.hasAttribute("data-keep")) return;
        const newScript = document.createElement("script");
        newScript.textContent = oldScript.textContent;
        document.body.appendChild(newScript).parentNode.removeChild(newScript);
    });
}

window.addEventListener("popstate", () => {
    navigateTo(location.hash.slice(1) || "home/welcome");
});

document.addEventListener("DOMContentLoaded", () => {
    navigateTo(location.hash.slice(1) || "home/welcome");
});