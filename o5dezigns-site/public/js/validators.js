// public/js/validators.js
// Validate ONLY when user clicks "Send Message" (submit). No live validation.

(function () {
  "use strict";

  const form = document.querySelector(".contact-form");
  if (!form) return;

  // ------- helpers -------
  const isEmpty = (v) => !v || !String(v).trim();
  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email).trim());
  const isValidName = (name) => {
    const s = String(name).trim();
    return /^[a-zA-Z][a-zA-Z\s.'-]{1,59}$/.test(s); // 2-60 chars
  };
  const isValidSubject = (subject) => {
    const s = String(subject).trim();
    return s.length >= 3 && s.length <= 120;
  };
  const isValidMessage = (msg) => {
    const s = String(msg).trim();
    return s.length >= 10 && s.length <= 2000;
  };
  const isValidPhoneFallback = (raw) => {
    const s = String(raw || "").replace(/[^\d+]/g, "");
    const digits = s.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  };

  function addStylesOnce() {
    if (document.getElementById("validator-styles")) return;
    const style = document.createElement("style");
    style.id = "validator-styles";
    style.textContent = `
      .field-error{
        margin-top:6px;
        font-size:12px;
        line-height:1.3;
        color:#d93025;
      }
      .is-invalid{
        border-color:#d93025 !important;
        box-shadow:0 0 0 3px rgba(217,48,37,.10);
      }
    `;
    document.head.appendChild(style);
  }

  function setFieldError(input, message) {
    if (!input) return;
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");

    const host = input.closest("label") || input.parentElement;
    if (!host) return;

    let err = host.querySelector(".field-error");
    if (!err) {
      err = document.createElement("div");
      err.className = "field-error";
      err.setAttribute("role", "alert");
      host.appendChild(err);
    }
    err.textContent = message;
  }

  function clearFieldError(input) {
    if (!input) return;
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");

    const host = input.closest("label") || input.parentElement;
    if (!host) return;

    const err = host.querySelector(".field-error");
    if (err) err.remove();
  }

  function clearAllErrors(inputs) {
    inputs.forEach(clearFieldError);
  }

  addStylesOnce();

  // Grab inputs (works with your current HTML)
  const nameInput =
    form.querySelector('input[name="name"]') ||
    form.querySelector('input[type="text"][placeholder="Your Name"]');
  const emailInput =
    form.querySelector('input[name="email"]') ||
    form.querySelector('input[type="email"]');
  const phoneInput =
    document.getElementById("phone") ||
    form.querySelector('input[name="phone"]') ||
    form.querySelector('input[type="tel"]');
  const subjectInput =
    form.querySelector('input[name="subject"]') ||
    form.querySelector('input[type="text"][placeholder="Subject"]');
  const messageInput =
    form.querySelector('textarea[name="message"]') || form.querySelector("textarea");

  const allInputs = [nameInput, emailInput, phoneInput, subjectInput, messageInput].filter(
    Boolean
  );

  // Detect intl-tel-input instance if you use it
  const iti = phoneInput && phoneInput._intlTelInput ? phoneInput._intlTelInput : null;

  function validateAllOnSubmit() {
    // Clear previous errors only when user tries submit
    clearAllErrors(allInputs);

    let ok = true;

    // Name
    if (nameInput) {
      const v = nameInput.value;
      if (isEmpty(v)) {
        setFieldError(nameInput, "Name is required.");
        ok = false;
      } else if (!isValidName(v)) {
        setFieldError(nameInput, "Enter a valid name (letters only).");
        ok = false;
      }
    }

    // Email
    if (emailInput) {
      const v = emailInput.value;
      if (isEmpty(v)) {
        setFieldError(emailInput, "Email is required.");
        ok = false;
      } else if (!isValidEmail(v)) {
        setFieldError(emailInput, "Enter a valid email address.");
        ok = false;
      }
    }

    // Phone
    if (phoneInput) {
      const v = phoneInput.value;
      const digits = String(v || "").replace(/\D/g, ""); // only digits user typed

      if (isEmpty(v)) {
        setFieldError(phoneInput, "Phone number is required.");
        ok = false;
      } else if (digits.length !== 10) {
        setFieldError(phoneInput, "Phone number must be exactly 10 digits.");
        ok = false;
      }
    }


    // Subject
    if (subjectInput) {
      const v = subjectInput.value;
      if (isEmpty(v)) {
        setFieldError(subjectInput, "Subject is required.");
        ok = false;
      } else if (!isValidSubject(v)) {
        setFieldError(subjectInput, "Subject should be 3–120 characters.");
        ok = false;
      }
    }

    // Message
    if (messageInput) {
      const v = messageInput.value;
      if (isEmpty(v)) {
        setFieldError(messageInput, "Message is required.");
        ok = false;
      } else if (!isValidMessage(v)) {
        setFieldError(messageInput, "Message should be 10–2000 characters.");
        ok = false;
      }
    }

    if (!ok) {
      const firstInvalid = form.querySelector(".is-invalid");
      if (firstInvalid) firstInvalid.focus({ preventScroll: false });
    }

    return ok;
  }

  form.addEventListener("submit", async (e) => {
  const ok = validateAllOnSubmit();
  if (!ok) {
    e.preventDefault();
    return;
  }

  // ✅ prevent normal page reload
  e.preventDefault();

  const btn = form.querySelector('button[type="submit"]');
  const oldText = btn ? btn.textContent : "";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Sending...";
  }

  try {
    const formData = new FormData(form);

    // If intl-tel-input exists, store full international number
    const phoneInput = document.getElementById("phone");
    const iti = phoneInput && phoneInput._intlTelInput ? phoneInput._intlTelInput : null;
    if (iti && typeof iti.getNumber === "function") {
      // ✅ Store phone as "+<countrycode> <10digits>"
      const phoneEl = document.getElementById("phone");
      const iti = phoneEl && phoneEl._intlTelInput ? phoneEl._intlTelInput : null;

      if (iti) {
        const dialCode = iti.getSelectedCountryData().dialCode; // "1", "91"
        const digits = String(phoneEl.value || "").replace(/\D/g, ""); // 10 digits
        formData.set("phone", `+${dialCode} ${digits}`); // ✅ +1 6478828193
      }       
    }

    const payload = Object.fromEntries(formData.entries());

    const res = await fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // server-side validation errors
      const msg = data?.error || "Something went wrong. Please try again.";
      alert(msg);
      return;
    }

    alert("✅ Message sent successfully!");
    form.reset();

  } catch (err) {
    console.error(err);
    alert("Server error. Please try again.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  }
});

})();
