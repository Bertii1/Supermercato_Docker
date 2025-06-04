// Global variables for products, cart, and user session
let products = []; // Stores all available products
let cart = []; // Stores items currently in the shopping cart
let selectedProduct = null; // Stores the product currently selected in the product grid
let currentUsername = "Ospite"; // Default username, "Guest" in Italian

/**
 * Displays a custom modal message instead of using alert() or confirm().
 * @param {string} message - The message to display.
 * @param {boolean} isConfirm - If true, displays "OK" and "Annulla" buttons.
 * @returns {Promise<boolean>} - Resolves to true for OK/Conferma, false for Annulla/Chiudi.
 */
function showCustomModal(message, isConfirm = false) {
  return new Promise((resolve) => {
    const modalId = 'customModal';
    let modal = document.getElementById(modalId);

    // Create modal if it doesn't exist
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300 opacity-0';
      modal.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center transform scale-95 transition-transform duration-300">
                    <p id="modalMessage" class="mb-4 text-lg font-semibold text-gray-800"></p>
                    <div class="flex justify-center space-x-4">
                        <button id="modalOkBtn" class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors duration-200">OK</button>
                        <button id="modalCancelBtn" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition-colors duration-200 hidden">Annulla</button>
                    </div>
                </div>
            `;
      document.body.appendChild(modal);
    }

    // Set message and button visibility
    document.getElementById('modalMessage').textContent = message;
    const okBtn = document.getElementById('modalOkBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    if (isConfirm) {
      okBtn.textContent = 'Conferma';
      cancelBtn.classList.remove('hidden');
    } else {
      okBtn.textContent = 'OK';
      cancelBtn.classList.add('hidden');
    }

    // Show modal with animation
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.querySelector('div').classList.remove('scale-95');

    // Event listeners for buttons
    const handleOk = () => {
      hideModal();
      resolve(true);
    };
    const handleCancel = () => {
      hideModal();
      resolve(false);
    };

    okBtn.onclick = handleOk;
    cancelBtn.onclick = handleCancel;

    // Function to hide the modal with animation
    const hideModal = () => {
      modal.querySelector('div').classList.add('scale-95');
      modal.classList.add('opacity-0');
      setTimeout(() => {
        modal.classList.add('pointer-events-none');
        okBtn.onclick = null; // Clean up event listeners
        cancelBtn.onclick = null;
      }, 300); // Match transition duration
    };
  });
}


/**
 * Gets a query parameter from the URL.
 * @param {string} name - The name of the query parameter.
 * @returns {string|null} - The value of the query parameter or null if not found.
 */
function getQueryParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * Loads product data from the backend API.
 */
async function loadData() {
  console.log('Caricamento dati dal database...');
  try {
    const response = await fetch('../api/products.php', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();

    // The response for GET products will be directly the array, or an object with 'status' and 'message' in case of info/error
    if (data.status === 'info' || data.status === 'error') {
      throw new Error(data.message);
    }

    if (Array.isArray(data) && data.length > 0) {
      products = data;
      displayProducts();
      console.log('Prodotti caricati:', products);
    } else {
      console.log('Nessun prodotto trovato nel database o array vuoto.');
      products = []; // Reset products if none are found
      displayProducts();
    }
  } catch (error) {
    console.error('Errore nel caricamento dei dati:', error);
    showCustomModal('Errore nel caricamento dei dati: ' + error.message);
  }
}

/**
 * Displays products in the grid.
 * @param {Array} filteredProducts - The array of products to display (defaults to all products).
 */
function displayProducts(filteredProducts = products) {
  const productsGrid = document.getElementById('productsGrid');
  productsGrid.innerHTML = ''; // Clear existing products

  if (filteredProducts.length === 0) {
    productsGrid.innerHTML = '<div class="empty-state text-center py-4 text-gray-500"><p>Nessun prodotto trovato.</p></div>';
    return;
  }

  filteredProducts.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card bg-white rounded-lg shadow-md p-4 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow duration-200';
    productCard.dataset.id = product.codice;

    productCard.innerHTML = `
            <img src="${`../media/${product.descrizione.toLowerCase()}.jpg` || '../media/placeholder.png'}" alt="${product.descrizione}" class="product-image w-32 h-32 object-cover mb-4 rounded-md">
            <h3 class="text-lg font-semibold text-gray-800 mb-1">${product.descrizione}</h3>
            <p class="text-gray-700">Prezzo: €${parseFloat(product.prezzo).toFixed(2)}</p>
            <p class="text-gray-600 text-sm">Categoria: ${product.categoria}</p>
            <p class="text-gray-600 text-sm">Tipo: ${product.tipo}</p>
            ${product.calorie ? `<p class="text-gray-600 text-sm">Calorie: ${product.calorie}</p>` : ''}
        `;

    // Add click event listener to select the product
    productCard.addEventListener('click', () => {
      selectProduct(product.codice);
    });
    productsGrid.appendChild(productCard);
  });
}

/**
 * Selects a product from the grid and adds it to the cart.
 * @param {string} productId - The unique ID of the product.
 */
function selectProduct(productId) {
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => card.classList.remove('selected', 'border-2', 'border-blue-500')); // Remove existing selections

  const selectedCard = document.querySelector(`.product-card[data-id="${productId}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected', 'border-2', 'border-blue-500'); // Add selection styling
    selectedProduct = products.find(p => p.codice === productId);
    console.log('Prodotto selezionato:', selectedProduct);
    addSelectedToCart(); // Add to cart automatically when selected
  }
}

/**
 * Adds the currently selected product to the cart.
 */
function addSelectedToCart() {
  if (!selectedProduct) {
    console.log('Nessun prodotto selezionato');
    showCustomModal('Seleziona un prodotto prima di aggiungerlo al carrello.');
    return;
  }

  // Check if product already exists in cart
  const existingItem = cart.find(item => item.codice === selectedProduct.codice);

  if (existingItem) {
    // If product exists, increment quantity
    existingItem.quantity = (existingItem.quantity || 0) + 1; // Ensure quantity starts from 0 if undefined
  } else {
    // If product is new, add it with quantity 1
    cart.push({
      ...selectedProduct,
      quantity: 1
    });
  }

  console.log('Prodotto aggiunto al carrello:', selectedProduct);
  console.log('Carrello aggiornato:', cart);

  displayCart();
  saveCartForUser(); // Save cart after modification
}

/**
 * Removes an item from the cart.
 * @param {string} productId - The unique ID of the product to remove.
 */
function removeCartItem(productId) {
  cart = cart.filter(item => item.codice !== productId);
  displayCart();
  saveCartForUser(); // Save cart after modification
}

/**
 * Updates the quantity of an item in the cart.
 * @param {string} productId - The unique ID of the product.
 * @param {string} newQuantity - The new quantity as a string (will be parsed to int).
 */
function updateCartItemQuantity(productId, newQuantity) {
  const item = cart.find(i => i.codice === productId);
  if (item) {
    const quantity = parseInt(newQuantity);
    if (!isNaN(quantity) && quantity > 0) {
      item.quantity = quantity;
    } else {
      // If invalid quantity, revert to 1
      item.quantity = 1;
      showCustomModal('Quantità non valida, impostata a 1.');
    }
  }
  displayCart();
  saveCartForUser(); // Save cart after modification
}

/**
 * Displays the current contents of the shopping cart.
 */
function displayCart() {
  const cartItemsContainer = document.getElementById('cartItems');
  cartItemsContainer.innerHTML = ''; // Clear existing cart items

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<div class="empty-state text-center py-4 text-gray-500"><p>Il carrello è vuoto</p></div>';
    document.getElementById('cartCount').textContent = '0';
    document.getElementById('totalAmount').textContent = '€0.00';
    return;
  }

  let totalItems = 0;
  let totalAmount = 0;

  cart.forEach(item => {
    totalItems += item.quantity;
    totalAmount += parseFloat(item.prezzo) * item.quantity;

    const cartItemDiv = document.createElement('div');
    cartItemDiv.className = 'cart-item bg-white p-3 rounded-lg shadow-sm flex items-center justify-between mb-2';
    cartItemDiv.innerHTML = `
        <img src="${`../media/${item.descrizione.toLowerCase()}.jpg` || '../media/placeholder.png'}" alt="${item.descrizione}" class="cart-item-image-styled">
        <div class="flex-grow">
            <h4 class="font-semibold text-gray-800">${item.descrizione}</h4>
            <p class="text-gray-600 text-sm">€${parseFloat(item.prezzo).toFixed(2)} x ${item.quantity}</p>
        </div>
        <div class="cart-item-controls flex items-center space-x-2">
            <input type="number" value="${item.quantity}" min="1" class="quantity-input-cart w-16 p-1 border rounded-md text-center"
                           onchange="updateCartItemQuantity(${item.codice}, this.value)">
            <button class="remove-btn btn-small bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors duration-200" onclick="removeCartItem(${item.codice})">Rimuovi</button>
        </div>
    `;
    cartItemsContainer.appendChild(cartItemDiv);
  });

  document.getElementById('cartCount').textContent = totalItems;
  document.getElementById('totalAmount').textContent = `€${totalAmount.toFixed(2)}`;
}

/**
 * Clears the entire cart after user confirmation.
 */
async function clearCart() {
  if (confirm("sicuro che vuoi svuotare il carrello")) {
    cart = [];
    displayCart();
    saveCartForUser(); // Save empty cart
  }
}

/**
 * Generates and displays a receipt for the current cart contents.
 */
function generateReceipt() {
  if (cart.length === 0) {
    showCustomModal('Il carrello è vuoto. Aggiungi prodotti prima di generare lo scontrino.');
    return;
  }

  let receipt = '==============================\n';
  receipt += '       SCONTRINO SUPERMERCATO       \n';
  receipt += '==============================\n';
  let total = 0;

  cart.forEach(item => {
    const itemTotal = parseFloat(item.prezzo) * item.quantity;
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

/**
 * Searches and filters products based on input and category.
 */
function searchProducts() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;

  const filtered = products.filter(product => {
    const matchesSearch = product.descrizione.toLowerCase().includes(searchTerm);
    const matchesCategory = category === 'all' || product.categoria === category;
    return matchesSearch && matchesCategory;
  });

  displayProducts(filtered);
}

// --- Cart Persistence Functions ---

/**
 * Saves the current cart to the database for the logged-in user.
 */
async function saveCartForUser() {
  // Only save cart if a user is logged in (not "Ospite")
  if (currentUsername === "Ospite") {
    console.log("Saving cart is disabled for guest user.");
    return;
  }

  console.log("Saving cart for user:", currentUsername, cart);

  try {
    const response = await fetch('../api/cartSave.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username: currentUsername, cart_items: cart.map(item => ({ product_id: item.codice, quantity: item.quantity })) })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();

    if (data.status === 'success') {
      console.log('Carrello salvato con successo:', data.message);
    } else {
      console.error('Errore durante il salvataggio del carrello:', data.message);
      showCustomModal('Errore durante il salvataggio del carrello: ' + data.message);
    }
  } catch (error) {
    console.error('Errore di rete durante il salvataggio del carrello:', error);
    showCustomModal('Si è verificato un errore di rete durante il salvataggio del carrello.');
  }
}

/**
 * Loads the cart from the database for the current user.
 * It first loads all products, then populates the cart with complete details.
 */
async function loadCartForUser() {
  if (currentUsername === "Ospite") {
    console.log("Loading cart is disabled for guest user.");
    await loadData(); // Just load products
    return;
  }

  console.log("Loading cart for user:", currentUsername);

  try {
    const response = await fetch(`../api/cartGet.php?username=${encodeURIComponent(currentUsername)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();

    if (data.status === 'success' && Array.isArray(data.cart_items) && data.cart_items.length > 0) {
      // Fetch all products first to get full details
      const productsResponse = await fetch('../api/products.php'); // Using the unified products.php
      if (!productsResponse.ok) {
        const errorText = await productsResponse.text();
        throw new Error(`HTTP error! status: ${productsResponse.status}, message: ${errorText}`);
      }
      products = await productsResponse.json(); // Ensure all products are loaded globally

      cart = data.cart_items.map(cartItem => {
        const productDetail = products.find(p => p.codice === cartItem.product_id);
        return productDetail ? { ...productDetail, quantity: cartItem.quantity } : null;
      }).filter(item => item !== null); // Filter out any items for which product details weren't found

      displayProducts(); // Display all available products
      displayCart(); // Display the loaded cart
      console.log('Carrello caricato con successo:', cart);
    } else if (data.status === 'info' && data.message.includes('Nessun carrello trovato')) {
      console.log('Nessun carrello salvato per questo utente.');
      cart = [];
      await loadData(); // Load products anyway
      displayCart();
    } else {
      console.error('Errore durante il caricamento del carrello:', data.message);
      showCustomModal('Errore durante il caricamento del carrello: ' + data.message);
      cart = [];
      await loadData(); // Load products anyway
      displayCart();
    }
  } catch (error) {
    console.error('Errore di rete durante il caricamento del carrello:', error);
    showCustomModal('Si è verificato un errore di rete durante il caricamento del carrello.');
    cart = [];
    await loadData(); // Load products anyway
    displayCart();
  }
}

// --- Event Listeners ---

// Set username on page load and load data/cart
document.addEventListener('DOMContentLoaded', async () => {
  const username = getQueryParam('username');
  if (username) {
    currentUsername = decodeURIComponent(username);
    document.getElementById('username').textContent = currentUsername;
  } else {
    document.getElementById('username').textContent = "Ospite";
  }

  // Load cart for the logged-in user (if not guest)
  if (currentUsername !== "Ospite") {
    await loadCartForUser(currentUsername);
  } else {
    await loadData(); // Load products anyway for guests
  }
});

// Event listener for search input
document.getElementById('searchInput').addEventListener('input', searchProducts);

// Event listener for category filter
document.getElementById('categoryFilter').addEventListener('change', searchProducts);

// Event listener for user icon (logout)
document.getElementById('user-iconId').addEventListener('click', async function () {
  const confirmed = await showCustomModal('Sei sicuro di voler effettuare il logout?', true);
  if (confirmed) {
    // Here you might want to call a logout API endpoint
    // For now, just redirect to the login page
    window.location.href = '../index.html';
  }
});

// Add hover effect for user icon
document.getElementById('user-iconId').addEventListener('mouseover', function () {
  this.style.cursor = 'pointer';
});

// Expose functions to the global scope if needed for inline HTML event handlers (e.g., onclick)
window.updateCartItemQuantity = updateCartItemQuantity;
window.removeCartItem = removeCartItem;
window.clearCart = clearCart;
window.generateReceipt = generateReceipt;
window.showCustomModal = showCustomModal;