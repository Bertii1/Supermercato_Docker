let products = [];
let selectedProductId = null; // To keep track of the product selected in the table

// Helper to get form values
function getProductFormData() {
  const element = document.getElementById("productImage");
  return {
    codice: document.getElementById('productId').value ? parseInt(document.getElementById('productId').value) : null,
    descrizione: document.getElementById('productName').value,
    prezzo: parseFloat(document.getElementById('productPrice').value),
    categoria: document.getElementById('productCategory').value,
    tipo: document.getElementById('productType').value,
    calorie: document.getElementById('productCalories').value ? parseInt(document.getElementById('productCalories').value) : null,
  };
}

// Helper to populate form with product data
function setProductFormData(product) {
  document.getElementById('productId').value = product.codice || '';
  document.getElementById('productName').value = product.descrizione || '';
  document.getElementById('productPrice').value = product.prezzo || '';
  document.getElementById('productCategory').value = product.categoria || '0';
  typeElementFill(); // Populate types based on category
  document.getElementById('productType').value = product.tipo || '';
  if (product.calorie != null) {
    document.getElementById('Calorie-div').style.opacity = 100;
    document.getElementById('productCalories').value = product.calorie || '';
  } else {
    document.getElementById('Calorie-div').style.opacity = 0;
  }
  selectedProductId = product.codice;
}

// Clear the form and reset selection
function clearForm() {
  document.getElementById('productId').value = '';
  document.getElementById('productName').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('productCategory').value = '0';
  document.getElementById('productType').innerHTML = ''; // Clear types
  document.getElementById('productCalories').value = '';
  selectedProductId = null;
  // Remove selected class from table rows
  const rows = document.querySelectorAll('#productsTable tbody tr');
  rows.forEach(row => row.classList.remove('selected'));
}

// Populate product types based on category selection
function typeElementFill() {
  const category = document.getElementById('productCategory').value;
  const typeSelect = document.getElementById('productType');
  typeSelect.innerHTML = ''; // Clear existing options

  let types = [];
  if (category === 'alimentari') {
    types = ['fresco', 'confezionato', 'surgelato'];
  } else if (category === 'abbigliamento') {
    types = ['uomo', 'donna', 'bambino'];
  }

  if (types.length > 0) {
    types.forEach(cazzo => {
      const option = document.createElement('option');
      option.value = cazzo;
      option.textContent = cazzo.charAt(0).toUpperCase() + cazzo.slice(1);
      typeSelect.appendChild(option);
    });
  } else {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Seleziona un tipo';
    typeSelect.appendChild(option);
  }
}

// Fetch products from the database
function downloadProducts() {
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

      return response.text().then(text => {
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
      if (data.status === 'info' || data.status === 'error') {
        // Se il server risponde con un messaggio informativo (es. 404 "Nessun prodotto trovato")
        // o un errore, gestiscilo come un errore ma azzera i prodotti.
        console.warn('Avviso dal server:', data.message);
        products = []; // Nessun prodotto trovato
        renderProducts();
      } else if (Array.isArray(data)) {
        products = data;
        renderProducts();
        console.log('Prodotti caricati:', products);
      } else {
        throw new Error('Formato dati non valido dal server.');
      }
    })
    .catch(error => {
      console.error('Errore nel caricamento dei dati:', error);
      alert('Errore nel caricamento dei dati: ' + error.message);
    });
}

// Render products in the table
function renderProducts() {
  const tableBody = document.querySelector('#productsTable tbody');
  tableBody.innerHTML = ''; // Clear existing rows

  if (products.length === 0) {
    const row = tableBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 8; // Adjust colSpan to match the number of columns
    cell.textContent = 'Nessun prodotto disponibile.';
    cell.style.textAlign = 'center';
    return;
  }

  products.forEach(product => {
    const row = tableBody.insertRow();
    row.dataset.id = product.codice; // Store product ID on the row
    const imgurl = `../media/${product.descrizione.toLowerCase()}.png`;
    row.insertCell().textContent = product.codice;
    console.log(imgurl);
    const imgCell = row.insertCell();
    const img = document.createElement('img');
    img.onerror = function() {
      // If JPG fails, try PNG
      const pngUrl = `../media/${product.descrizione.toLowerCase()}.png`;
      img.onerror = function() {
        // If both fail, use placeholder
        img.src = '../media/placeholder.png';
      };
      img.src = pngUrl;
    };
    img.src = `../media/${product.descrizione.toLowerCase()}.jpg`;
    img.alt = product.descrizione;
    img.className = 'product-image-preview';
    imgCell.appendChild(img);
    row.insertCell().textContent = product.descrizione;
    row.insertCell().textContent = `€${product.prezzo.toFixed(2)}`;
    row.insertCell().textContent = product.tipo;
    row.insertCell().textContent = product.categoria;
    row.insertCell().textContent = product.calorie || '-'; // Display '-' if no calories

    const actionCell = row.insertCell();
    const selectBtn = document.createElement('button');
    selectBtn.textContent = 'Seleziona';
    selectBtn.className = 'btn-small';
    selectBtn.onclick = (event) => {
      event.stopPropagation(); // Prevent row click from firing again
      selectProductForEdit(product.codice);
    };
    actionCell.appendChild(selectBtn);

    // Add click listener to select row
    row.addEventListener('click', () => selectProductForEdit(product.codice));
  });
}

// Select a product from the table to edit in the form
function selectProductForEdit(id) {
  const product = products.find(p => p.codice === id);
  if (product) {
    setProductFormData(product);
    // Highlight the selected row
    const rows = document.querySelectorAll('#productsTable tbody tr');
    rows.forEach(row => {
      if (parseInt(row.dataset.id) === id) {
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }
    });
  }
}


// Add a new product
function addProduct() {
  const formData = getProductFormData();
  if (!formData.descrizione || isNaN(formData.prezzo) || formData.prezzo <= 0 || !formData.categoria || !formData.tipo) {
    alert('Per favore, compila tutti i campi obbligatori (Descrizione, Prezzo, Categoria, Tipo).');
    return;
  }

  console.log('Sending data:', formData); // Debug log

  fetch("../api/products.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(formData)
  })
    .then(response => {
      console.log('Response status:', response.status); // Debug log
      return response.text().then(text => {
        console.log('Raw server response:', text); // Debug log
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse server response:', text);
          throw new Error('Errore nella risposta del server');
        }
      });
    })
    .then(data => {
      console.log('Parsed response:', data); // Debug log
      if (data.status === 'success') {
        alert(data.message);
        clearForm();
        downloadProducts();
      } else {
        throw new Error(data.message || 'Errore durante l\'aggiunta del prodotto');
      }
    })
    .catch(error => {
      console.error('Error details:', error);
      alert('Si è verificato un errore durante l\'aggiunta del prodotto: ' + error.message);
    });
}

// Save (update) an existing product
function saveProduct() {
  if (!selectedProductId) {
    alert('Seleziona un prodotto da modificare.');
    return;
  }

  const productName = document.getElementById('productName').value;
  const productPrice = parseFloat(document.getElementById('productPrice').value);
  const productType = document.getElementById('productType').value;
  const productCategory = document.getElementById('productCategory').value;
  const productCalories = parseInt(document.getElementById('productCalories').value) || null; // Assumi che 'calorie' sia un campo nel tuo form

  if (!productName || isNaN(productPrice) || productPrice < 0 || !productType || !productCategory) {
    alert('Per favore, compila tutti i campi obbligatori per la modifica.');
    return;
  }

  const data = {
    codice: selectedProductId, // Assicurati che l'ID sia corretto
    descrizione: productName,
    prezzo: productPrice,
    categoria: productCategory,
    tipo: productType,
    calorie: productCalories
  };

  fetch("../api/products.php", { // Nuovo endpoint unificato
    method: "PUT", // Metodo PUT per l'aggiornamento
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(data)
  })
    .then(response => {
      console.log(data);
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.message || 'Errore del server'); });
      }
      return response.json();
    })
    .then(result => {
      console.log('Risposta aggiornamento prodotto:', result);
      if (result.status === 'success') {
        alert(result.message);
        clearForm();
        downloadProducts(); // Ricarica la lista dei prodotti
      } else {
        alert('Errore nell\'aggiornamento del prodotto: ' + result.message);
      }
    })
    .catch(error => {
      console.error('Errore nella richiesta PUT per aggiornamento prodotto:', error);
      alert('Errore di rete o del server: ' + error.message);
    });
  downloadProducts();
  renderProducts();
}

// Assicurati che 'selectedProductId' sia gestito correttamente quando selezioni un prodotto nella tabella.
// Probabilmente lo imposti in `selectProduct()` o una funzione simile.

// Funzione da collegare al click sulla riga della tabella per selezionare il prodotto
function selectProduct(product) {
  selectedProductId = product.codice;
  document.getElementById('productId').value = product.codice; // Assumi che tu abbia un campo ID nascosto o disabilitato
  document.getElementById('productName').value = product.descrizione;
  document.getElementById('productPrice').value = product.prezzo;
  document.getElementById('productCategory').value = product.categoria;
  typeElementFill(); // Ricarica i tipi basandosi sulla categoria
  document.getElementById('productType').value = product.tipo;
  document.getElementById('productCalories').value = product.calorie; // Assumi che tu abbia un campo calorie
}

// Delete a product
function deleteProduct() {
  if (!selectedProductId) {
    alert('Seleziona un prodotto da eliminare.');
    return;
  }

  if (!confirm('Sei sicuro di voler eliminare il prodotto selezionato?')) {
    return;
  }

  fetch(`../api/products.php?id=${selectedProductId}`, { // Nuovo endpoint unificato e ID nella query string
    method: 'DELETE' // Metodo DELETE
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.message || 'Errore del server'); });
      }
      return response.json();
    })
    .then(result => {
      console.log('Risposta eliminazione prodotto:', result);
      if (result.status === 'success') {
        alert(result.message);
        clearForm();
        downloadProducts(); // Ricarica la lista dei prodotti
      } else {
        alert('Errore nell\'eliminazione del prodotto: ' + result.message);
      }
    })
    .catch(error => {
      console.error('Errore nella richiesta DELETE per eliminazione prodotto:', error);
      alert('Errore di rete o del server: ' + error.message);
    });
}

function uploadProducts() {
  const productName = document.getElementById('productName').value;
  const productPrice = parseFloat(document.getElementById('productPrice').value);
  const productType = document.getElementById('productType').value;
  const productCategory = document.getElementById('productCategory').value;
  const productCalories = parseInt(document.getElementById('productCalories').value) || null; // Assumi che 'calorie' sia un campo nel tuo form

  if (!productName || isNaN(productPrice) || productPrice < 0 || !productType || !productCategory) {
    alert('Per favore, compila tutti i campi obbligatori (Descrizione, Prezzo, Categoria, Tipo).');
    return;
  }

  const data = {
    descrizione: productName,
    prezzo: productPrice,
    categoria: productCategory,
    tipo: productType,
    calorie: productCalories
  };

  fetch("../api/products.php", { // Nuovo endpoint unificato
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(data)
  })
    .then(response => {
      if (!response.ok) {
        // Controlla se la risposta non è OK (es. 400, 500)
        return response.json().then(err => { throw new Error(err.message || 'Errore del server'); });
      }
      return response.json();
    })
    .then(result => {
      console.log('Risposta aggiunta prodotto:', result);
      if (result.status === 'success') {
        alert(result.message);
        clearForm();
        downloadProducts(); // Ricarica la lista dei prodotti
      } else {
        alert('Errore nell\'aggiunta del prodotto: ' + result.message);
      }
    })
    .catch(error => {
      console.error('Errore nella richiesta POST per aggiunta prodotto:', error);
      alert('Errore di rete o del server: ' + error.message);
    });
}
function setupFileUploadForm() {
  const uploadForm = document.getElementById('uploadForm');
  const uploadStatus = document.getElementById('uploadStatus');

  // Ensure the form element exists before attaching the event listener
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (event) => {
      // Prevent the default form submission behavior (page reload)
      event.preventDefault();

      // Show a loading message
      uploadStatus.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
      uploadStatus.classList.add('bg-blue-100', 'text-blue-700');
      uploadStatus.textContent = 'Caricamento in corso...';

      // Create a FormData object from the form data
      const formData = new FormData(uploadForm);

      try {
        // Send the asynchronous request to your PHP script
        const response = await fetch('../api/upload.php', {
          method: 'POST',
          body: formData // FormData automatically handles the Content-Type header for file uploads
        });

        // Check if the HTTP response was successful
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Errore HTTP! Stato: ${response.status}, Messaggio: ${errorText}`);
        }

        // Parse the JSON response from the PHP script
        const data = await response.json();

        // Update the status message based on the PHP response
        if (data.status === 'success') {
          uploadStatus.classList.remove('bg-blue-100', 'text-blue-700', 'bg-red-100', 'text-red-700');
          uploadStatus.classList.add('bg-green-100', 'text-green-700');
          renderProducts();
          uploadStatus.textContent = `Upload completato: ${data.file_path || 'Nessun percorso restituito'}`;
          // Here you can do something with data.file_path, e.g., display the image
          console.log('File caricato con successo:', data.file_path);
          // Reset the form after a successful upload
          uploadForm.reset();
        } else {
          uploadStatus.classList.remove('bg-blue-100', 'text-blue-700', 'bg-green-100', 'text-green-700');
          uploadStatus.classList.add('bg-red-100', 'text-red-700');
          uploadStatus.textContent = `Errore nell'upload: ${data.message || 'Errore sconosciuto dal server.'}`;
          console.error('Errore dal server:', data.message);
        }

      } catch (error) {
        // Handle network errors or errors thrown during processing
        uploadStatus.classList.remove('bg-blue-100', 'text-blue-700', 'bg-green-100', 'text-green-700');
        uploadStatus.classList.add('bg-red-100', 'text-red-700');
        uploadStatus.textContent = `Errore di rete o elaborazione: ${error.message}`;
        console.error('Errore durante l\'upload:', error);
      } finally {
        // Ensure the status message is visible
        uploadStatus.classList.remove('hidden');
      }
    });
  }
}

// Call the setup function once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', setupFileUploadForm);

// Initial load of products when the page loads
document.addEventListener('DOMContentLoaded', () => {
  downloadProducts();
  typeElementFill(); 
});