import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD9imRu3ckf2bE6J9izCm43rnAGXOiqvSA",
  authDomain: "smol-devs.firebaseapp.com",
  projectId: "smol-devs",
  storageBucket: "smol-devs.appspot.com",
  messagingSenderId: "675801229903",
  appId: "1:675801229903:web:8d366648305b0731f8183a",
  measurementId: "G-RJ1NS8E4K9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM references
const categoryList = document.getElementById('category-list');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalProducts = document.getElementById('modal-products');
const modalProductDetail = document.getElementById('modal-product-detail');
const modalClose = document.getElementById('modal-close');
const backToProductsBtn = document.getElementById('back-to-products');

// Detail view elements
const detailName = document.getElementById('detail-name');
const detailImage = document.getElementById('detail-image');
const detailPrice = document.getElementById('detail-price');
const detailStock = document.getElementById('detail-stock');
const detailDescription = document.getElementById('detail-description');
const addToCartBtn = document.getElementById('add-to-cart');

// Cart
let cart = [];

const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const discordInput = document.getElementById("discord-username");
const placeOrderBtn = document.getElementById("place-order");

// Load categories
async function loadCategories() {
  const categoriesSnapshot = await getDocs(collection(db, "categories"));
  if (categoriesSnapshot.empty) {
    categoryList.innerHTML = '<p>No categories found.</p>';
    return;
  }

  categoryList.innerHTML = '';
  categoriesSnapshot.forEach(doc => {
    const categoryId = doc.id;
    const div = document.createElement('div');
    div.className = 'category-card';
    div.textContent = categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
    div.onclick = () => openCategoryModal(categoryId);
    categoryList.appendChild(div);
  });
}

async function openCategoryModal(categoryId) {
  modalTitle.textContent = categoryId;
  modalProducts.innerHTML = 'Loading...';
  modalProducts.style.display = 'grid';
  modalProductDetail.style.display = 'none';

  const productsRef = collection(db, "categories", categoryId, "products");
  const productsSnapshot = await getDocs(productsRef);

  modalProducts.innerHTML = '';
  productsSnapshot.forEach(doc => {
    const data = doc.data();
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.innerHTML = `
      <img src="${data.image || 'https://via.placeholder.com/150'}" alt="${data.name}" />
      <h4>${data.name}</h4>
      <p>$${data.price?.toFixed(2) || '0.00'}</p>
    `;
    productCard.onclick = () => showProductDetail(data);
    modalProducts.appendChild(productCard);
  });

  modal.style.display = "block";
}

let currentProduct = null;

function showProductDetail(product) {
  currentProduct = product;
  modalTitle.textContent = product.name;
  detailName.textContent = product.name;
  detailImage.src = product.image || 'https://via.placeholder.com/300x200';
  detailImage.alt = product.name;
  detailPrice.textContent = product.price?.toFixed(2) || '0.00';
  detailStock.textContent = (product.stock < 0) ? '∞' : (product.stock ?? 'N/A');
  detailDescription.textContent = product.description || '';
  
  modalProducts.style.display = 'none';
  modalProductDetail.style.display = 'block';
}

// Add product to cart
addToCartBtn.onclick = () => {
  if (!currentProduct) return;
  cart.push(currentProduct);
  updateCart();
  alert(`${currentProduct.name} added to cart.`);
};

// Update cart display
function updateCart() {
  cartItemsEl.innerHTML = '';
  let total = 0;
  cart.forEach((item, index) => {
    const li = document.createElement('li');
    li.textContent = `${item.name} - $${item.price.toFixed(2)}`;
    total += item.price;
    cartItemsEl.appendChild(li);
  });
  cartTotalEl.textContent = total.toFixed(2);
}

// Send cart to Discord webhook
placeOrderBtn.onclick = async () => {
  const username = discordInput.value.trim();
  if (!username) {
    alert("Please enter your Discord username.");
    return;
  }
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const content = `🛒 **New Order from ${username}**\n\n` + cart.map(p => `• ${p.name} - $${p.price.toFixed(2)}`).join('\n');

  const webhookUrl = 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN'; // Replace with yours

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      alert("Order placed and sent to Discord!");
      cart = [];
      updateCart();
      discordInput.value = "";
    } else {
      throw new Error("Failed to send webhook");
    }
  } catch (err) {
    alert("Something went wrong: " + err.message);
  }
};

// Modal close handlers
modalClose.onclick = () => { modal.style.display = "none"; };
backToProductsBtn.onclick = () => {
  modalProductDetail.style.display = 'none';
  modalProducts.style.display = 'grid';
};
window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

loadCategories();
