// ============ CONFIG ============
const PRODUCT = {
  name: "Stain Rol",
  price: 290, // INR
};
// TODO: replace with your real UPI ID before going live
const UPI_VPA = "xsq@ptyes";
const DELIVERY_MIN_DAYS = 4;
const DELIVERY_MAX_DAYS = 6;

document.getElementById("year").textContent = new Date().getFullYear();

// ============ GALLERY ============
const mainImage = document.getElementById("mainImage");
document.querySelectorAll(".thumb").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".thumb").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    mainImage.src = btn.dataset.src;
  });
});

// ============ MODAL OPEN / CLOSE ============
const overlay = document.getElementById("modalOverlay");
const stepForm = document.getElementById("stepForm");
const stepSuccess = document.getElementById("stepSuccess");
const buyNowBtn = document.getElementById("buyNowBtn");
const modalClose = document.getElementById("modalClose");
const closeSuccessBtn = document.getElementById("closeSuccessBtn");

function openModal() {
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
  if (window.fbq) fbq('track', 'InitiateCheckout', { value: PRODUCT.price, currency: 'INR' });
}
function closeModal() {
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}
function resetToForm() {
  stepSuccess.hidden = true;
  stepForm.hidden = false;
}

buyNowBtn.addEventListener("click", openModal);
modalClose.addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
closeSuccessBtn.addEventListener("click", () => { closeModal(); resetToForm(); document.getElementById("orderForm").reset(); });

// ============ PAYMENT METHOD TOGGLE ============
const upiNote = document.getElementById("upiNote");
document.querySelectorAll('input[name="payment"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    upiNote.classList.toggle("hidden", e.target.value !== "UPI");
  });
});

// ============ FORM SUBMIT ============
const form = document.getElementById("orderForm");
const formError = document.getElementById("formError");
const placeOrderBtn = document.getElementById("placeOrderBtn");

let addressTracked = false;
const addressField = form.querySelector('textarea[name="address"]');
addressField.addEventListener("blur", () => {
  if (!addressTracked && addressField.value.trim().length > 5) {
    addressTracked = true;
    if (window.fbq) fbq('trackCustom', 'AddressStarted', { value: PRODUCT.price, currency: 'INR' });
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.textContent = "";

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());
  const orderId = generateOrderId();
  const deliveryDate = estimatedDeliveryDate();

  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = "Placing order...";

  try {
    // ============ RAZORPAY SPACE ============
    // If data.payment === "UPI" and Razorpay is wired up, trigger checkout here
    // and only call submitOrder() inside the handler's success callback.
    // See the commented block in index.html for the Razorpay options object.
    // For now, UPI opens a plain UPI deep link (works without a payment gateway).
    if (data.payment === "UPI") {
      openUpiApp(orderId);
    }

    await submitOrder({ ...data, orderId, deliveryDate });
    showSuccess(orderId, deliveryDate);
  } catch (err) {
    formError.textContent = "Something went wrong. Please try again or contact support.";
    console.error(err);
  } finally {
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = "Place Order";
  }
});

function openUpiApp(orderId) {
  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_VPA)}&pn=${encodeURIComponent("CleanGlide")}&am=${PRODUCT.price}&cu=INR&tn=${encodeURIComponent("Order " + orderId)}`;
  // Opens the user's UPI app on mobile devices. Desktop browsers will typically ignore this.
  window.location.href = upiUrl;
}

async function submitOrder(order) {
  const res = await fetch("/api/send-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...order,
      product: PRODUCT.name,
      amount: PRODUCT.price,
    }),
  });
  if (!res.ok) throw new Error("Order email failed: " + res.status);
  return res.json().catch(() => ({}));
}

function generateOrderId() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CG-${rand}`;
}

function estimatedDeliveryDate() {
  const min = new Date();
  const max = new Date();
  min.setDate(min.getDate() + DELIVERY_MIN_DAYS);
  max.setDate(max.getDate() + DELIVERY_MAX_DAYS);
  const opts = { day: "numeric", month: "short" };
  return `${min.toLocaleDateString("en-IN", opts)} – ${max.toLocaleDateString("en-IN", opts)}`;
}

function showSuccess(orderId, deliveryDate) {
  document.getElementById("orderIdOut").textContent = orderId;
  document.getElementById("deliveryDateOut").textContent = deliveryDate;
  stepForm.hidden = true;
  stepSuccess.hidden = false;

  // restart tick animation
  const tick = document.querySelector(".success-tick");
  tick.querySelectorAll("*").forEach((el) => {
    el.style.animation = "none";
    void el.offsetWidth; // reflow to restart
    el.style.animation = "";
  });

  playSuccessSound();

  // ============ META PIXEL: Purchase ============
  if (window.fbq) fbq('track', 'Purchase', { value: PRODUCT.price, currency: 'INR' });
}

// ============ SUCCESS SOUND (no audio file needed) ============
function playSuccessSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const notes = [880, 1108.73]; // pleasant two-tone chime
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch (e) {
    // Audio not supported/blocked — fail silently, animation still shows.
  }
}
