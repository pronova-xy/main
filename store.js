import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app-check.js";

// ---------------- Firestore Init ----------------
const firebaseConfig = {
  apiKey: "AIzaSyD9imRu3ckf2bE6J9izCm43rnAGXOiqvSA",
  authDomain: "smol-devs.firebaseapp.com",
  projectId: "smol-devs",
  storageBucket: "smol-devs.firebasestorage.app",
  messagingSenderId: "675801229903",
  appId: "1:675801229903:web:8d366648305b0731f8183a",
  measurementId: "G-RJ1NS8E4K9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// AppCheck debug
const isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
if (isLocalhost) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6Lf-anUrAAAAADCtRE4m06mzc5WTQYOa0mvOggyi"),
  isTokenAutoRefreshEnabled: true
});

// ---------------- DOM ----------------
const productGrid = document.getElementById('product-grid');
const categoryGrid = document.getElementById('category-grid');
const startModal = document.getElementById('start-modal');
const startBtn = document.getElementById('start-btn');
const cartEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const loadingOverlay = document.getElementById('loading-overlay');
const cartFeedback = document.getElementById('cart-feedback');

// Modals
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

let cart = [];
let selectedCategory = null;

// ---------------- Audio ----------------
const bgMusic = document.getElementById('bg-music');
const playlist = ['bg1.mp3','bg2.mp3','bg3.mp3','bg4.mp3','bg5.mp3'];
let currentTrack = 0;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const audioSource = audioCtx.createMediaElementSource(bgMusic);
const analyser = audioCtx.createAnalyser();
audioSource.connect(analyser);
analyser.connect(audioCtx.destination);
analyser.fftSize = 8192;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

function playRandomTrack() {
  currentTrack = Math.floor(Math.random() * playlist.length);
  bgMusic.src = playlist[currentTrack];
  if (audioCtx.state === 'suspended') audioCtx.resume().then(() => bgMusic.play());
  else bgMusic.play();
}
bgMusic.addEventListener('ended', playRandomTrack);

startBtn.addEventListener('click', () => {
  startModal.style.display = 'none';
  playRandomTrack();
});

// ---------------- Canvas Visualizer ----------------
const canvas = document.getElementById('audio-visualizer');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  analyser.getByteFrequencyData(dataArray);
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxBarHeight = canvas.height * 0.35;
  const horizontalScale = 4;
  const halfBuffer = Math.floor(bufferLength / 2);

  function drawBar(x, height) {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, '#ff69b4');
    grad.addColorStop(0.4, '#ff69b4');
    grad.addColorStop(0.6, '#00e1ffff');
    grad.addColorStop(1, '#00e1ffff');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.shadowColor = grad;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(x, centerY - height);
    ctx.lineTo(x, centerY + height);
    ctx.stroke();
  }

  for (let i = 0; i < halfBuffer; i++) {
    const value = dataArray[i];
    const barHeight = (value / 255) * maxBarHeight;
    drawBar(centerX + i * horizontalScale, barHeight);
    drawBar(centerX - i * horizontalScale, barHeight);
  }
}
drawVisualizer();

async function loadCategoriesWithProducts() {
  productGrid.innerHTML = ''; // Clear existing content

  const catSnap = await getDocs(collection(db, 'categories'));

  for (const catDoc of catSnap.docs) {
    const category = catDoc.data();

    // Category header on its own line
    const catHeader = document.createElement('div');
    catHeader.className = 'category-header';
    catHeader.style.fontWeight = 'bold';
    catHeader.style.marginTop = '20px';
    catHeader.textContent = category.name;
    productGrid.appendChild(catHeader);

    // Fetch products for this category
    const prodSnap = await getDocs(collection(db, 'categories', catDoc.id, 'products'));

    for (const prodDoc of prodSnap.docs) {
      const product   = prodDoc.data();
      const isAvailable = product.stock >= 0 || product.stock <= -10;

      const prodLine = document.createElement('div');
      prodLine.className = 'product';
      prodLine.style.marginLeft = '20px'; // indent for clarity
      prodLine.style.marginBottom = '10px';
      prodLine.textContent = `${product.name} - $${product.price} - ${product.description}`;

      const button = document.createElement('button');
      button.textContent = 'Add to Cart';
      button.disabled = !isAvailable;
      button.style.marginLeft = '10px';
      if (isAvailable) button.addEventListener('click', () => addToCart(product));

      prodLine.appendChild(button);
      productGrid.appendChild(prodLine);

    }
  }

  hideLoading(); // hide overlay once everything is rendered
}

loadCategoriesWithProducts();

// ---------------- Cart ----------------
function flashCart() {
  cartEl.classList.add('flash');
  setTimeout(() => cartEl.classList.remove('flash'), 400);
}

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

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      cart.splice(e.target.dataset.index, 1);
      renderCart();
    });
  });
}

// ---------------- Modals ----------------
tosBtn.addEventListener('click', () => tosModal.style.display='flex');
ppBtn.addEventListener('click', () => ppModal.style.display='flex');
refundBtn.addEventListener('click', () => refundModal.style.display='flex');
FAQBtn.addEventListener('click', () => FAQModal.style.display='flex');
CONTACTbtn.addEventListener('click', () => window.open('https://discord.gg/mcrGnEBB9m'));

closeBtns.forEach(btn => btn.addEventListener('click', () => btn.closest('.modal').style.display='none'));
window.addEventListener('click', e => { if(e.target.classList.contains('modal')) e.target.style.display='none'; });

// ---------------- Loading ----------------
function hideLoading() { loadingOverlay.style.display = 'none'; }

// ---------------- Checkout ----------------
checkoutBtn.addEventListener('click', async () => {
  if(cart.length === 0) return alert('Cart is empty');
  const discordName = document.getElementById('discord-username').value.trim();
  if(!discordName) return alert('Enter your Discord username');

  try {
    const res = await fetch('https://api.pronova.store/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems: cart, discordName })
    });
    const data = await res.json();
    if(data.url) window.location = data.url;
    else alert('Checkout failed');
  } catch(err) {
    console.error(err);
    alert('Checkout error');
  }
});
