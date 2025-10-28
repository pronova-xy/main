import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyD9imRu3ckf2bE6J9izCm43rnAGXOiqvSA",
  authDomain: "smol-devs.firebaseapp.com",
  projectId: "smol-devs",
  storageBucket: "smol-devs.firebasestorage.app",
  messagingSenderId: "675801229903",
  appId: "1:675801229903:web:8d366648305b0731f8183a",
  measurementId: "G-RJ1NS8E4K9"
};

// ✅ Correct modular initialization
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Detect localhost for App Check debug
const isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
if (isLocalhost) {
  // Enables debug mode on localhost
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6Lf-anUrAAAAADCtRE4m06mzc5WTQYOa0mvOggyi"),
  isTokenAutoRefreshEnabled: true
});


// ===================
// DOM References
// ===================
const productGrid = document.getElementById('product-grid');
const startModal = document.getElementById('start-modal');
const startBtn = document.getElementById('start-btn');
const cartEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

let cart = [];

// ===================
// Start Modal
// ===================
const bgMusic = document.getElementById('bg-music');
const playlist = ['bg2.mp3','bg3.mp3','bg4.mp3','bg5.mp3'];
let currentTrack = 0;

function playRandomTrack() {
  currentTrack = Math.floor(Math.random() * playlist.length);
  bgMusic.src = playlist[currentTrack];
  // Resume audio context first
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => bgMusic.play());
  } else {
    bgMusic.play();
  }
  currentTrack = currentTrack + 1;
}

// Track ends → play new random track
bgMusic.addEventListener('ended', playRandomTrack);

// Start button click
startBtn.addEventListener('click', () => {
  startModal.style.display = 'none';
  playRandomTrack();
});

function flashCart() {
  const cartEl = document.getElementById('cart');
  cartEl.classList.add('flash');
  setTimeout(() => cartEl.classList.remove('flash'), 400);
}
// DOM references
const tosBtn = document.querySelector('.tos-btn');
const ppBtn = document.querySelector('.pp-btn');
const refundBtn = document.querySelector('.refund-btn');
const FAQBtn = document.querySelector('.FAQ-btn');
const CONTACTbtn = document.querySelector('.CONTACT-btn');


const tosModal = document.getElementById('tos-modal');
const ppModal = document.getElementById('pp-modal');
const refundModal = document.getElementById('refund-modal');
const FAQModal = document.getElementById('FAQ-modal');

const closeBtns = document.querySelectorAll('.close-btn');

// Open modals only when clicked
tosBtn.addEventListener('click', () => { tosModal.style.display = 'flex'; });
ppBtn.addEventListener('click', () => { ppModal.style.display = 'flex'; });
refundBtn.addEventListener('click', () => { refundModal.style.display = 'flex'; });
FAQBtn.addEventListener('click', () => { FAQModal.style.display = 'flex'; });
CONTACTbtn.addEventListener('click', () => { window.open('https://discord.com/users/727496722707775538') });



// Close modals when clicking the close button
closeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.modal').style.display = 'none';
  });
});

// Close modals by clicking outside content
window.addEventListener('click', e => {
  if(e.target.classList.contains('modal')) e.target.style.display = 'none';
});




const canvas = document.getElementById('audio-visualizer');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const audioSource = audioCtx.createMediaElementSource(bgMusic);
const analyser = audioCtx.createAnalyser();

audioSource.connect(analyser);
analyser.connect(audioCtx.destination);
analyser.fftSize = 8192; // 512 frequency bins

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);

  analyser.getByteFrequencyData(dataArray);

  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxBarHeight = canvas.height * 0.35;
  const horizontalScale = 4;
  const halfBuffer = Math.floor(bufferLength / 2);

  function drawBar(x, height) {
    // Gradient spans the full visualizer horizontally
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, '#ff69b4');    // pink at start
    grad.addColorStop(0.4, '#ff69b4');
    grad.addColorStop(0.6, '#00e1ffff')  // extend pink longer
    grad.addColorStop(1, '#00e1ffff');    // yellow at the right

    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.shadowColor = grad;
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(x, centerY - height);
    ctx.lineTo(x, centerY + height);
    ctx.stroke();
  }

  // Right half
  for (let i = 0; i < halfBuffer; i++) {
    const value = dataArray[i];
    const barHeight = (value / 255) * maxBarHeight;
    const x = centerX + i * horizontalScale;
    drawBar(x, barHeight);
  }

  // Left half (mirrored)
  for (let i = 0; i < halfBuffer; i++) {
    const value = dataArray[i];
    const barHeight = (value / 255) * maxBarHeight;
    const x = centerX - i * horizontalScale;
    drawBar(x, barHeight);
  }
}


drawVisualizer();



import { doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

async function loadProducts() {
  const categoriesCol = collection(db, 'categories');
  const catSnap = await getDocs(categoriesCol);

  catSnap.forEach(async (catDoc) => {
    const productsCol = collection(db, 'categories', catDoc.id, 'products');
    const prodSnap = await getDocs(productsCol);

    prodSnap.forEach(prodDoc => {
      const product = prodDoc.data();

      let isAvailable;
      if(product.stock >= 0) isAvailable = true;
      else if(product.stock < 0 && product.stock > -10) isAvailable = false;
      else if(product.stock <= -10) isAvailable = true;

      const card = document.createElement('div');
      card.className = 'product';
      card.innerHTML = `
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p>Price: $${product.price}</p>
        <button ${!isAvailable ? 'disabled' : ''}>Add to Cart</button>
      `;

      productGrid.appendChild(card);
      hideLoading();

      if(isAvailable) {
        card.querySelector('button').addEventListener('click', () => addToCart(product));
      }
    });
  });
}

loadProducts();


// ===================
// Cart Functions
// ===================
function addToCart(item) {
  const existing = cart.find(i => i.name === item.name);
  if(existing) existing.quantity++;
  else cart.push({...item, quantity: 1});
  renderCart();
  flashCart();
}

function renderCart() {
  cartEl.innerHTML = '';
  let total = 0;

  cart.forEach((i, index) => {
    total += i.price * i.quantity;

    const li = document.createElement('li');
    li.innerHTML = `
      ${i.name} x${i.quantity} - $${(i.price*i.quantity).toFixed(2)}
      <button class="remove-btn" data-index="${index}">✕</button>
    `;
    cartEl.appendChild(li);
  });

  cartTotalEl.textContent = total.toFixed(2);

  // Add remove functionality
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = e.target.getAttribute('data-index');
      cart.splice(idx, 1);
      renderCart();
    });
  });
}

const categoryGrid = document.getElementById('category-grid');

let selectedCategory = null; // tracks which category is active

async function loadCategories() {
  const catSnap = await getDocs(collection(db, 'categories'));
  catSnap.forEach(catDoc => {
    const category = catDoc.data();

    const catHeader = document.createElement('div');
    catHeader.className = 'category-header';
    catHeader.textContent = `---------- ${category.name.toUpperCase()} ---------`;

    catHeader.addEventListener('click', () => {
      selectedCategory = catDoc.id;
      loadProducts(selectedCategory);
    });

    categoryGrid.appendChild(catHeader);
  });
}
loadCategories();

const loadingOverlay = document.getElementById('loading-overlay');
const cartFeedback = document.getElementById('cart-feedback');

// Show loading initially
loadingOverlay.style.display = 'flex';

// Hide after products loaded
function hideLoading() {
  loadingOverlay.style.display = 'none';
}
// ===================
// Checkout
// ===================
checkoutBtn.addEventListener('click', async () => {
  if(cart.length === 0) return alert('Cart is empty');

  try {
    const res = await fetch('https://api.pronova.store/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems: cart })
    });

    const data = await res.json();
    if(data.url) window.location = data.url;
    else alert('Checkout failed');
  } catch (err) {
    console.error('Checkout error:', err);
    alert('Checkout error');
  }
});
