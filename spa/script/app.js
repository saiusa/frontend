Alpine.store("settings", {
    apiBaseUrl: "http://172.17.100.14:3329/usa2/api",  
    appName: "contact application",  
});

// Automatically fetch products when the page is loaded
document.addEventListener("DOMContentLoaded", () => {
    Alpine.store("GlobalFunctions").fetchProducts();
});
Alpine.store("settings", {
    apiBaseUrl: "http://localhost:2004/api/products",  // Updated API base URL
    appName: "bts album ecommerce",
});

Alpine.store("GlobalVariable", {
    contacts: Alpine.reactive({ data: [], total: 0 }),
    queryParams: Alpine.reactive({}),
    products: Alpine.reactive({ data: [], total: 0 }),
    queryParamsProducts: Alpine.reactive({}),
    cart: Alpine.reactive({ data: [], total: 0, cart_id: null }),
    orders: Alpine.reactive({ data: [], total: 0 }),
});

Alpine.store("GlobalFunctions", { 
    findContactById(id) {        
        let contacts = Alpine.store("GlobalVariable").contacts.data;
        let foundContact = contacts.find(c => Number(c.id) === Number(id));
        return foundContact ? { ...foundContact } : {};
    },

    async fetchProducts() {
        try {
            const response = await fetch(`${Alpine.store("settings").apiBaseUrl}/products/`);
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();
            Alpine.store("GlobalVariable").products.data = data;
            Alpine.store("GlobalVariable").products.total = data.length;
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    },

    filterProducts(query) {
        return Alpine.store("GlobalVariable").products.data.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase())
        );
    },

    async addProduct(productData) {
        try {
            const response = await fetch(`${Alpine.store("settings").apiBaseUrl}/products/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to add product: ${errorData.detail || response.statusText}`);
            }
            const newProduct = await response.json();
            Alpine.store("GlobalVariable").products.data.push(newProduct);
            Alpine.store("GlobalVariable").products.total += 1;
            return newProduct;
        } catch (error) {
            console.error("Error adding product:", error);
            throw error;
        }
    },

    async addToCart(product) {
        try {
            const response = await fetch(`${Alpine.store("settings").apiBaseUrl}/carts/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_id: product.id, quantity: 1 }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to add to cart: ${errorData.detail || response.statusText}`);
            }
            const cartItem = await response.json();
            const newItem = {
                id: cartItem.product_id,
                name: product.name,
                price: product.price,
                quantity: cartItem.quantity,
                image: product.image
            };
            if (!Alpine.store("GlobalVariable").cart.cart_id) {
                Alpine.store("GlobalVariable").cart.cart_id = cartItem.cart_id;
            }
            const existingItem = Alpine.store("GlobalVariable").cart.data.find(item => item.id === newItem.id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                Alpine.store("GlobalVariable").cart.data.push(newItem);
            }
            Alpine.store("GlobalVariable").cart.total = Alpine.store("GlobalVariable").cart.data.reduce((sum, item) => sum + item.quantity, 0);
        } catch (error) {
            console.error("Error adding to cart:", error);
            throw error;
        }
    },

    async removeFromCart(item) {
        try {
            const cartId = Alpine.store("GlobalVariable").cart.cart_id;
            const response = await fetch(`${Alpine.store("settings").apiBaseUrl}/carts/${cartId}/items/${item.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to remove from cart: ${errorData.detail || response.statusText}`);
            }
            Alpine.store("GlobalVariable").cart.data = Alpine.store("GlobalVariable").cart.data.filter(cartItem => cartItem.id !== item.id);
            Alpine.store("GlobalVariable").cart.total = Alpine.store("GlobalVariable").cart.data.reduce((sum, item) => sum + item.quantity, 0);
            if (!Alpine.store("GlobalVariable").cart.data.length) {
                Alpine.store("GlobalVariable").cart.cart_id = null;
            }
        } catch (error) {
            console.error("Error removing from cart:", error);
            throw error;
        }
    },

    async updateCartItem(item) {
        try {
            const cartId = Alpine.store("GlobalVariable").cart.cart_id;
            const response = await fetch(`${Alpine.store("settings").apiBaseUrl}/carts/${cartId}/items/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: item.quantity }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to update cart item: ${errorData.detail || response.statusText}`);
            }
            const cartItem = Alpine.store("GlobalVariable").cart.data.find(cartItem => cartItem.id === item.id);
            if (cartItem) {
                cartItem.quantity = item.quantity;
            }
            Alpine.store("GlobalVariable").cart.total = Alpine.store("GlobalVariable").cart.data.reduce((sum, item) => sum + item.quantity, 0);
        } catch (error) {
            console.error("Error updating cart item:", error);
            throw error;
        }
    },

    async fetchOrders() {
        try {
            const response = await fetch(`${Alpine.store("settings").apiBaseUrl}/checkouts/`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to fetch orders: ${errorData.detail || response.statusText}`);
            }
            const data = await response.json();
            Alpine.store("GlobalVariable").orders.data = data;
            Alpine.store("GlobalVariable").orders.total = data.length;
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    },

    async confirmCheckout(checkoutData) {
        try {
            const response = await fetch(`${Alpine.store("settings").apiBaseUrl}/checkouts/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(checkoutData),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to confirm checkout: ${errorData.detail || response.statusText}`);
            }
            const order = await response.json();
            Alpine.store("GlobalVariable").cart.data = [];
            Alpine.store("GlobalVariable").cart.total = 0;
            Alpine.store("GlobalVariable").cart.cart_id = null;
            Alpine.store("GlobalVariable").orders.data.push(order);
            Alpine.store("GlobalVariable").orders.total += 1;
            return order;
        } catch (error) {
            console.error("Error confirming checkout:", error);
            throw error;
        }
    },
});

document.addEventListener("DOMContentLoaded", () => {
    Alpine.store("GlobalFunctions").fetchProducts();
    Alpine.store("GlobalFunctions").fetchOrders();
});

