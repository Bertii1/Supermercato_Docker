let products = [];
let cart = [];
let selectedProduct = null;
let selectedCartProduct = null;
let currentUsername = "Ospite"; // Default username

// Function to get query parameters (for username)
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Set username on page load
document.addEventListener('DOMContentLoaded', () => {
    const username = getQueryParam('username');
    if (username) {
        currentUsername = decodeURIComponent(username);
        document.getElementById('username').textContent = currentUsername;
    } else {
        document.getElementById('username').textContent = "Ospite";
    }

    // Load cart for the logged-in user (if not guest)
    if (currentUsername !== "Ospite") {
        loadCartForUser(currentUsername);
    } else {
        loadData(); // Load products anyway for guests
    }
});


// Load data from the database
function loadData() {
    console.log('Caricamento dati dal database...');
    fetch('../api/products.php', { // Nuovo endpoint unificato
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        console.log('Response headers:', Array.from(response.headers.entries()));
        
        return response.text()
        .then(text => {
            console.log('Raw response:', text);
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse response as JSON:', text);
                throw new Error('Server did not return valid JSON');
            }
        });
    })
    .then(data => {
        // La risposta per GET prodotti sarà direttamente l'array, o un oggetto con 'status' e 'message' in caso di info/errore
        if (data.status === 'info' || data.status === 'error') {
            throw new Error(data.message);
        }
        if (Array.isArray(data) && data.length > 0) {
            products = data;
            displayProducts();
            console.log('Prodotti caricati:', products);
        } else {
            // Potrebbe essere un 404 con status 'info' o semplicemente un array vuoto
            console.log('Nessun prodotto trovato nel database o array vuoto.');
            products = []; // Azzera i prodotti se non ne trova
            displayProducts();
        }
    })
    .catch(error => {
        console.error('Errore nel caricamento dei dati:', error);
        alert('Errore nel caricamento dei dati: ' + error.message);
    });
  }

// Display products in the grid
function displayProducts(filteredProducts = products) {
  const productsGrid = document.getElementById('productsGrid');
  productsGrid.innerHTML = ''; // Clear existing products

  if (filteredProducts.length === 0) {
    productsGrid.innerHTML = '<div class="empty-state"><p>Nessun prodotto trovato.</p></div>';
    return;
  }

  filteredProducts.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.dataset.id = product.codice;

    productCard.innerHTML = `
      <img src="${product.immagine_url || '../media/placeholder.png'}" alt="${product.descrizione}" class="product-image">
      <h3>${product.descrizione}</h3>
      <p>Prezzo: €${product.prezzo.toFixed(2)}</p>
      <p>Categoria: ${product.categoria}</p>
      <p>Tipo: ${product.tipo}</p>
      ${product.calorie ? `<p>Calorie: ${product.calorie}</p>` : ''}
    `;
    productCard.addEventListener('click', () => selectCartProduct(product.codice));
    productsGrid.appendChild(productCard);
  });
}

// Select a product from the grid
function selectProduct(productId) {
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => card.classList.remove('selected'));

  const selectedCard = document.querySelector(`.product-card[data-id="${productId}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
    selectedProduct = products.find(p => p.codice === productId);
    console.log('Prodotto selezionato:', selectedProduct);
  }
  addSelectedToCart();
}

function selectCartProduct (id){
  
}

// Add selected product to cart
function addSelectedToCart() {
  if (!selectedCartProduct) {
    alert('Seleziona un prodotto da aggiungere al carrello.');
    return;
  }

  const quantityInput = document.getElementById('quantityInput');
  const quantity = parseInt(quantityInput.value);

  if (isNaN(quantity) || quantity <= 0) {
    alert('Inserisci una quantità valida.');
    return;
  }

  const existingCartItem = cart.find(item => item.codice === selectedCartProduct.codice);

  if (existingCartItem) {
    existingCartItem.quantity += quantity;
  } else {
    cart.push({ ...selectedCartProduct, quantity: quantity });
  }

  displayCart();
  saveCartForUser(); // Save cart after modification
}

// Remove item from cart
function removeCartItem(productId) {
  cart = cart.filter(item => item.codice !== productId);
  displayCart();
  saveCartForUser(); // Save cart after modification
}

// Update quantity of an item in the cart
function updateCartItemQuantity(productId, newQuantity) {
  const item = cart.find(i => i.codice === productId);
  if (item) {
    const quantity = parseInt(newQuantity);
    if (!isNaN(quantity) && quantity > 0) {
      item.quantity = quantity;
    } else {
      // If invalid quantity, revert to 1 or remove if 0
      item.quantity = 1;
      alert('Quantità non valida, impostata a 1.');
    }
  }
  displayCart();
  saveCartForUser(); // Save cart after modification
}

// Display cart contents
function displayCart() {
  const cartItemsContainer = document.getElementById('cartItems');
  cartItemsContainer.innerHTML = ''; // Clear existing cart items

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<div class="empty-state"><p>Il carrello è vuoto</p></div>';
    document.getElementById('cartCount').textContent = '0';
    document.getElementById('totalAmount').textContent = '€0.00';
    return;
  }

  let totalItems = 0;
  let totalAmount = 0;

  cart.forEach(item => {
    totalItems += item.quantity;
    totalAmount += item.prezzo * item.quantity;

    const cartItemDiv = document.createElement('div');
    cartItemDiv.className = 'cart-item';
    cartItemDiv.innerHTML = `
      <img src="${item.immagine_url || '../media/placeholder.png'}" alt="${item.descrizione}" class="cart-item-image">
      <div onclick="selectCartProduct(${item.codice})">
        <h4>${item.descrizione}</h4>
        <p>€${item.prezzo.toFixed(2)} x ${item.quantity}</p>
      </div>
      <div class="cart-item-controls">
        <input type="number" value="${item.quantity}" min="1" class="quantity-input-cart"
               onchange="updateCartItemQuantity(${item.codice}, this.value)">
        <button class="remove-btn btn-small" onclick="removeCartItem(${item.codice})">Rimuovi</button>
      </div>
    `;
    cartItemsContainer.appendChild(cartItemDiv);
  });

  document.getElementById('cartCount').textContent = totalItems;
  document.getElementById('totalAmount').textContent = `€${totalAmount.toFixed(2)}`;
}

// Clear the entire cart
function clearCart() {
  if (confirm('Sei sicuro di voler svuotare il carrello?')) {
    cart = [];
    displayCart();
    saveCartForUser(); // Save empty cart
  }
}

// Generate receipt
function generateReceipt() {
  if (cart.length === 0) {
    alert('Il carrello è vuoto. Aggiungi prodotti prima di generare lo scontrino.');
    return;
  }

  let receipt = '==============================\n';
  receipt += '      SCONTRINO SUPERMERCATO     \n';
  receipt += '==============================\n';
  let total = 0;

  cart.forEach(item => {
    const itemTotal = item.prezzo * item.quantity;
    receipt += `${item.descrizione} x ${item.quantity} = €${itemTotal.toFixed(2)}\n`;
    total += itemTotal;
  });

  receipt += '------------------------------\n';
  receipt += 'TOTALE: €' + total.toFixed(2) + '\n';
  receipt += '==============================\n';
  receipt += 'Grazie per la visita!';

  document.getElementById('receiptContent').textContent = receipt;
  document.getElementById('receiptSection').style.display = 'block';
}

// Search and filter products
function searchProducts() {
  var searchTerm = document.getElementById('searchInput').value.toLowerCase();
  var category = document.getElementById('categoryFilter').value;

  var filtered = products.filter(product => {
    var matchesSearch = product.descrizione.toLowerCase().includes(searchTerm);
    var matchesCategory = category === 'all' || product.categoria === category;
    return matchesSearch && matchesCategory;
  });

  displayProducts(filtered);
}

document.getElementById('searchInput').addEventListener('input', searchProducts);
document.getElementById('categoryFilter').addEventListener('change', searchProducts);

// User icon click listener (logout)
document.getElementById('user-iconId').addEventListener('click', function(){
    if (confirm('Sei sicuro di voler effettuare il logout?')) {
        // Here you might want to call a logout API endpoint
        // For now, just redirect to the login page
        window.location.href = '../index.html';
    }
});
document.getElementById('user-iconId').addEventListener('mouseover', function(){
  this.style.cursor = 'pointer';
});

// --- Cart Persistence Functions ---

// Save cart to the database
function saveCartForUser() {
    // Only save cart if a user is logged in (not "Ospite")
    if (currentUsername === "Ospite") {
        console.log("Saving cart is disabled for guest user.");
        return;
    }

    console.log("Saving cart for user:", currentUsername, cart);

    fetch('../api/cartSave.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ username: currentUsername, cart_items: cart.map(item => ({ product_id: item.codice, quantity: item.quantity })) })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(`HTTP error! status: ${response.status}, message: ${text}`); });
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            console.log('Carrello salvato con successo:', data.message);
        } else {
            console.error('Errore durante il salvataggio del carrello:', data.message);
        }
    })
    .catch(error => {
        console.error('Errore di rete durante il salvataggio del carrello:', error);
    });
}

// Load cart from the database for the current user
function loadCartForUser() {
    if (currentUsername === "Ospite") {
        console.log("Loading cart is disabled for guest user.");
        loadData(); // Just load products
        return;
    }

    console.log("Loading cart for user:", currentUsername);

    fetch(`../api/cartGet.php?username=${encodeURIComponent(currentUsername)}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(`HTTP error! status: ${response.status}, message: ${text}`); });
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success' && Array.isArray(data.cart_items) && data.cart_items.length > 0) {
            // Merge loaded cart items with full product details
            // First, load all products, then populate cart with complete details
            fetch('../api/prodottiGet.php')
                .then(res => res.json())
                .then(allProducts => {
                    products = allProducts; // Ensure all products are loaded globally
                    cart = data.cart_items.map(cartItem => {
                        const productDetail = products.find(p => p.codice === cartItem.product_id);
                        return productDetail ? { ...productDetail, quantity: cartItem.quantity } : null;
                    }).filter(item => item !== null); // Filter out any items for which product details weren't found
                    displayProducts(); // Display all available products
                    displayCart(); // Display the loaded cart
                    console.log('Carrello caricato con successo:', cart);
                })
                .catch(err => {
                    console.error('Errore durante il recupero dei dettagli dei prodotti per il carrello:', err);
                    alert('Impossibile caricare i dettagli dei prodotti per il carrello.');
                    products = []; // Clear products on error
                    displayProducts();
                    cart = []; // Clear cart on error
                    displayCart();
                });
        } else if (data.status === 'info' && data.message.includes('Nessun carrello trovato')) {
            console.log('Nessun carrello salvato per questo utente.');
            cart = [];
            displayProducts(); // Load products anyway
            displayCart();
        } else {
            console.error('Errore durante il caricamento del carrello:', data.message);
            alert('Errore durante il caricamento del carrello: ' + data.message);
            cart = [];
            displayProducts(); // Load products anyway
            displayCart();
        }
    })
    .catch(error => {
        console.error('Errore di rete durante il caricamento del carrello:', error);
        alert('Si è verificato un errore di rete durante il caricamento del carrello.');
        cart = [];
        displayProducts(); // Load products anyway
        displayCart();
    });
}