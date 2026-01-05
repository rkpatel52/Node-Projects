// public/js/validators.js
// Validate ONLY on submit (no live validation)

(function () {
  "use strict";

  const form = document.querySelector(".contact-form");
  if (!form) return;

  /* ======================
     Helpers
  ====================== */
  const isEmpty = (v) => !v || !String(v).trim();

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email).trim());

  const isValidName = (name) => {
    const s = String(name).trim();
    return /^[a-zA-Z][a-zA-Z\s.'-]{1,59}$/.test(s); // 2–60 chars
  };

  const isValidSubject = (subject) => {
    const s = String(subject).trim();
    return s.length >= 3 && s.length <= 120;
  };

  const isValidMessage = (msg) => {
    const s = String(msg).trim();
    return s.length >= 10 && s.length <= 2000;
  };

  /* ======================
     Error styles
  ====================== */
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

  /* ======================
     Grab inputs
  ====================== */
  const nameInput = form.querySelector('input[name="name"]');
  const emailInput = form.querySelector('input[name="email"]');
  const phoneInput = document.getElementById("phone");
  const subjectInput = form.querySelector('input[name="subject"]');
  const messageInput = form.querySelector('textarea[name="message"]');

  const allInputs = [
    nameInput,
    emailInput,
    phoneInput,
    subjectInput,
    messageInput,
  ].filter(Boolean);

  const iti =
    phoneInput && phoneInput._intlTelInput
      ? phoneInput._intlTelInput
      : null;

  /* ======================
     Validation on submit
  ====================== */
  function validateAllOnSubmit() {
    clearAllErrors(allInputs);
    let ok = true;

    // Name
    if (nameInput) {
      const v = nameInput.value;
      if (isEmpty(v)) {
        setFieldError(nameInput, "Name is required.");
        ok = false;
      } else if (!isValidName(v)) {
        setFieldError(nameInput, "Enter a valid name.");
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

    // Phone — EXACTLY 10 digits (national number)
    if (phoneInput) {
      const raw = phoneInput.value || "";
      const digits = raw.replace(/\D/g, "");

      if (isEmpty(raw)) {
        setFieldError(phoneInput, "Phone number is required.");
        ok = false;
      } else if (digits.length !== 10) {
        setFieldError(
          phoneInput,
          "Phone number must be exactly 10 digits."
        );
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
        setFieldError(
          subjectInput,
          "Subject should be 3–120 characters."
        );
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
        setFieldError(
          messageInput,
          "Message should be 10–2000 characters."
        );
        ok = false;
      }
    }

    if (!ok) {
      const firstInvalid = form.querySelector(".is-invalid");
      if (firstInvalid) firstInvalid.focus();
    }

    return ok;
  }

  /* ======================
     Submit handler
  ====================== */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateAllOnSubmit()) return;

    const btn = form.querySelector('button[type="submit"]');
    const oldText = btn ? btn.textContent : "";

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Sending...";
    }

    try {
      const formData = new FormData(form);

// ✅ Always build phone as "+<countrycode> <10digits>" (robust)
      const phoneEl = document.getElementById("phone");
      const digits = String(phoneEl.value || "").replace(/\D/g, "");

      // try from intl-tel-input, else fallback from DOM
      let dialCode = null;

      if (window.iti && typeof window.iti.getSelectedCountryData === "function") {
        dialCode = window.iti.getSelectedCountryData().dialCode; // "1"
      } else {
        const dialEl = document.querySelector(".iti__selected-dial-code");
        if (dialEl) dialCode = dialEl.textContent.replace("+", "").trim(); // "1"
      }

      if (dialCode && digits.length === 10) {
        formData.set("phone", `+${dialCode} ${digits}`); // ✅ "+1 6478828193"
      }


      const payload = Object.fromEntries(formData.entries());
      console.log("SENDING PHONE:", payload.phone);

      const res = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error || "Something went wrong.");
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
