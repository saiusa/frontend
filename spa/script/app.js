document.addEventListener("alpine:init", () => {
// Alpine.store("settings", {
//     apiBaseUrl: "http://172.17.100.14:3329/usa2/api",
//     appName: "contact application",
// });


    Alpine.store("settings", {
        apiBaseUrl: "http://127.0.0.1:8017/api/products",  // Update to match backend port
        appName: "bts album products",
    });

    Alpine.store("GlobalVariable", {
        contacts: Alpine.reactive({ data: [], total: 0 }),
        errorMessage: '',
        queryParams: Alpine.reactive({}),
        content: '',
        loading: false,
        carts: [],
        cart: {
            totalItems: 0
        },
        csrfToken: '',

        async init() {
            await this.fetchCsrfToken();
            await this.fetchCart();
            await this.loadContent('products/product_display');
        },

        async fetchCsrfToken() {
        try {
            const response = await fetch(`${Alpine.store("settings").apiBaseUrl}/products/get-csrf-token/`, {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch CSRF token');
            this.csrfToken = this.getCookie('csrftoken');
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
            this.errorMessage = 'Failed to initialize CSRF protection';
        }
    },

        getCookie(name) {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }
    });

    Alpine.store("GlobalFunctions", {
        async ensureCsrfToken() {
            if (!Alpine.store("GlobalVariable").csrfToken) {
                await Alpine.store("GlobalVariable").fetchCsrfToken();
            }
            return Alpine.store("GlobalVariable").csrfToken;
        },

        async fetchContacts() {
            try {
                const response = await fetch(`${Alpine.store("settings").apiBaseUrl}/contacts/`, {
                    headers: { "Content-Type": "application/json" },
                    credentials: 'include'
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                Alpine.store("GlobalVariable").contacts.data = data;
                Alpine.store("GlobalVariable").contacts.total = data.length;
            } catch (error) {
                console.error("Error fetching contacts:", error);
                Alpine.store("GlobalVariable").errorMessage = `Failed to load contacts: ${error.message}`;
                $('.ui.error.message').show().delay(3000).fadeOut();
            }
        },

        async loadContent(path) {
            Alpine.store("GlobalVariable").loading = true;
            try {
                const response = await fetch(`${path}.html`);
                if (!response.ok) throw new Error('Failed to load content');
                Alpine.store("GlobalVariable").content = await response.text();
            } catch (error) {
                Alpine.store("GlobalVariable").content = `<div class="ui error message">Error loading content: ${error.message}</div>`;
            } finally {
                Alpine.store("GlobalVariable").loading = false;
            }
        },

        async fetchCart() {
            Alpine.store("GlobalVariable").loading = true;
            try {
                const response = await fetch(`${Alpine.store("settings").apiBaseUrl}/carts/`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Failed to fetch carts');
                Alpine.store("GlobalVariable").carts = await response.json();
                Alpine.store("GlobalVariable").cart.totalItems = Alpine.store("GlobalVariable").carts.reduce((total, cart) => 
                    total + cart.items.reduce((sum, item) => sum + item.quantity, 0), 0);
            } catch (error) {
                console.error('Error fetching carts:', error);
                Alpine.store("GlobalVariable").errorMessage = `Failed to load carts: ${error.message}`;
                $('.ui.error.message').show().delay(3000).fadeOut();
            } finally {
                Alpine.store("GlobalVariable").loading = false;
            }
        },

        async addToCart(productId, quantity) {
            Alpine.store("GlobalVariable").loading = true;
            try {
                await this.ensureCsrfToken();
                let activeCart = Alpine.store("GlobalVariable").carts.find(cart => cart.status === 'ACTIVE');
                let url, method, body;

                if (activeCart) {
                    url = `${Alpine.store("settings").apiBaseUrl}/carts/${activeCart.id}/items/${productId}/`;
                    method = 'PATCH';
                    body = JSON.stringify({ quantity });
                } else {
                    url = `${Alpine.store("settings").apiBaseUrl}/carts/`;
                    method = 'POST';
                    body = JSON.stringify({ product_id: productId, quantity });
                }

                const response = await fetch(url, {
                    method,
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-CSRFToken': Alpine.store("GlobalVariable").csrfToken
                    },
                    credentials: 'include',
                    body
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to add to cart');
                }
                await this.fetchCart();
                return { success: true, message: 'Product added to cart!' };
            } catch (error) {
                Alpine.store("GlobalVariable").errorMessage = error.message;
                $('.ui.error.message').show().delay(3000).fadeOut();
                return { success: false, message: error.message };
            } finally {
                Alpine.store("GlobalVariable").loading = false;
            }
        },

        navigateTo(route) {
            window.navigateTo(route);
        },
    });

    $(document).ready(() => {
        $('.ui.dropdown').dropdown({ on: 'click' });
    });
});