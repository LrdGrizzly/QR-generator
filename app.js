"use strict";

const ECL = {
  L: { ordinal: 0, formatBits: 1, label: "Low" },
  M: { ordinal: 1, formatBits: 0, label: "Medium" },
  Q: { ordinal: 2, formatBits: 3, label: "Quartile" },
  H: { ordinal: 3, formatBits: 2, label: "High" },
};

const ECC_CODEWORDS_PER_BLOCK = [
  [-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,24,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
  [-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  [-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
];

const NUM_ERROR_CORRECTION_BLOCKS = [
  [-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
  [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
  [-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
  [-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81],
];

const app = document.getElementById("app");
const state = {
  qrType: "contact",
  logoDataUrl: "",
  logoImage: null,
  logoOutlineDataUrl: "",
  logoOutlineImage: null,
  history: [],
  isRestoring: false,
  lastQr: null,
  lastPayload: "",
};

const defaults = {
  firstName: "Alessandro",
  lastName: "Rossi",
  company: "Example Company",
  jobTitle: "Client Relations",
  email: "alessandro@example.com",
  mobile: "+39 333 123 4567",
  landline: "+39 02 1234 5678",
  whatsapp: "+39 333 123 4567",
  street: "Via Roma 12",
  city: "Milano",
  region: "MI",
  postalCode: "20121",
  country: "Italy",
  website: "example.com",
  pageUrl: getBasePageUrl(),
  websiteTarget: "example.com",
  qrDark: "#111827",
  qrLight: "#ffffff",
  moduleStyle: "square",
  errorCorrection: "H",
  logoSize: 15,
  logoBacking: "rounded",
  logoBorder: true,
  labelCompany: "Example Company",
  labelWebsite: "example.com",
  labelCustom: "",
};

function init() {
  const parsed = readContactFromHash();
  if (parsed) {
    renderContactPage(parsed);
  } else {
    renderGenerator();
    updateQr();
  }
}

window.addEventListener("hashchange", () => {
  const parsed = readContactFromHash();
  if (parsed) {
    renderContactPage(parsed);
  } else {
    renderGenerator();
    updateQr();
  }
});

function getBasePageUrl() {
  const url = new URL(window.location.href);
  url.hash = "";
  return url.href;
}

function renderGenerator() {
  app.innerHTML = `
    <div class="generator-shell">
      <header class="topbar">
        <div class="brand">
          <h1>QR Contact Generator</h1>
          <p>Create a formal contact-card QR or a direct website QR. Add brand colors, a centered logo, and export clean PNG or SVG files for cards, print, and digital sharing.</p>
        </div>
        <div class="top-controls">
          <button type="button" class="btn undo-btn" id="undoBtn" disabled>Undo</button>
          <div class="mode-pill" role="tablist" aria-label="QR type">
            <button type="button" data-type="contact" class="active">Contact Card</button>
            <button type="button" data-type="website">Website</button>
          </div>
        </div>
      </header>

      <div class="workspace">
        <section class="panel form-panel">
          <div id="contactFields">
            <div class="section">
              <div class="section-title">
                <div>
                  <h2>Contact details</h2>
                  <p>These fields are mapped into the generated phone contact.</p>
                </div>
              </div>
              <div class="grid">
                ${field("firstName", "First name", defaults.firstName)}
                ${field("lastName", "Surname", defaults.lastName)}
                ${field("company", "Company", defaults.company)}
                ${field("jobTitle", "Job title", defaults.jobTitle)}
                ${field("email", "Email", defaults.email, "email")}
                ${field("mobile", "Mobile number", defaults.mobile)}
                ${field("landline", "Landline", defaults.landline)}
                ${field("whatsapp", "WhatsApp", defaults.whatsapp)}
                ${field("website", "Website", defaults.website)}
                ${field("pageUrl", "Contact page URL", defaults.pageUrl)}
              </div>
            </div>

            <div class="section">
              <div class="section-title">
                <div>
                  <h2>Physical address</h2>
                  <p>Structured address fields improve contact import behavior.</p>
                </div>
              </div>
              <div class="grid">
                ${field("street", "Street address", defaults.street)}
                ${field("city", "City", defaults.city)}
                ${field("region", "Region / province", defaults.region)}
                ${field("postalCode", "Postal code", defaults.postalCode)}
                ${field("country", "Country", defaults.country)}
              </div>
            </div>
          </div>

          <div id="websiteFields" class="hidden">
            <div class="section">
              <div class="section-title">
                <div>
                  <h2>Website destination</h2>
                  <p>The QR opens this website directly.</p>
                </div>
              </div>
              <div class="grid single">
                ${field("websiteTarget", "Website URL", defaults.websiteTarget)}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              <div>
                <h2>QR styling</h2>
                <p>Use restrained branding and keep contrast high.</p>
              </div>
            </div>
            <div class="grid three">
              ${field("qrDark", "Foreground", defaults.qrDark, "color")}
              ${field("qrLight", "Background", defaults.qrLight, "color")}
              <label class="field">
                <span>Module style</span>
                <select id="moduleStyle">
                  <option value="square">Square</option>
                  <option value="rounded">Rounded</option>
                  <option value="dot">Dots</option>
                </select>
              </label>
              <label class="field">
                <span>Error correction</span>
                <select id="errorCorrection">
                  <option value="H" selected>High</option>
                  <option value="Q">Quartile</option>
                  <option value="M">Medium</option>
                  <option value="L">Low</option>
                </select>
              </label>
              <label class="field">
                <span>Logo size</span>
                <input id="logoSize" type="range" min="8" max="24" value="${defaults.logoSize}">
                <small class="hint">Recommended: 15%. Warning above 20%.</small>
              </label>
              <label class="field">
                <span>Logo backing</span>
                <select id="logoBacking">
                  <option value="rounded" selected>White rounded square</option>
                  <option value="square">White square</option>
                  <option value="circle">White circle</option>
                  <option value="none">None</option>
                </select>
              </label>
            </div>
            <div class="grid">
              <label class="field">
                <span>Logo upload</span>
                <input id="logoInput" type="file" accept="image/*">
                <small class="hint">The app uses an outline-only version of the logo so it integrates cleanly in the QR.</small>
              </label>
              <label class="field">
                <span>Logo border</span>
                <select id="logoBorder">
                  <option value="yes" selected>Show subtle outline</option>
                  <option value="no">No outline</option>
                </select>
              </label>
            </div>
          </div>

          <div class="section">
            <div class="section-title">
              <div>
                <h2>Label below QR</h2>
                <p>Optional text appears below the QR, outside the scannable area.</p>
              </div>
            </div>
            <div class="grid">
              ${field("labelCompany", "Company label", defaults.labelCompany)}
              ${field("labelWebsite", "Website label", defaults.labelWebsite)}
              ${field("labelCustom", "Custom label", defaults.labelCustom)}
            </div>
          </div>
        </section>

        <aside class="panel preview-panel">
          <div class="qr-card">
            <div class="qr-wrap">
              <canvas id="qrCanvas" width="1024" height="1024" aria-label="QR preview"></canvas>
            </div>
            <div id="qrLabel" class="qr-label"></div>
            <div class="actions">
              <button class="btn primary" type="button" id="downloadPng">PNG</button>
              <button class="btn" type="button" id="downloadPngHi">2048 PNG</button>
              <button class="btn full" type="button" id="downloadSvg">SVG</button>
            </div>
          </div>
          <div id="statusList" class="status-list"></div>
        </aside>
      </div>
    </div>
  `;

  bindGeneratorEvents();
  pushHistory();
}

function field(id, label, value = "", type = "text") {
  return `
    <label class="field">
      <span>${escapeHtml(label)}</span>
      <input id="${id}" type="${type}" value="${escapeAttr(value)}">
    </label>
  `;
}

function bindGeneratorEvents() {
  document.getElementById("undoBtn").addEventListener("click", undoLastChange);

  document.querySelectorAll(".mode-pill button").forEach((button) => {
    button.addEventListener("click", () => {
      pushHistory();
      state.qrType = button.dataset.type;
      document.querySelectorAll(".mode-pill button").forEach((b) => b.classList.toggle("active", b === button));
      document.getElementById("contactFields").classList.toggle("hidden", state.qrType !== "contact");
      document.getElementById("websiteFields").classList.toggle("hidden", state.qrType !== "website");
      updateQr();
      pushHistory();
    });
  });

  document.querySelectorAll("input, select, textarea").forEach((input) => {
    if (input.id !== "logoInput") {
      input.addEventListener("focus", pushHistory);
      input.addEventListener("input", () => {
        updateQr();
        pushHistory();
      });
    }
  });

  document.getElementById("logoInput").addEventListener("change", async (event) => {
    pushHistory();
    const file = event.target.files && event.target.files[0];
    state.logoDataUrl = file ? await fileToDataUrl(file) : "";
    state.logoImage = state.logoDataUrl ? await loadImage(state.logoDataUrl) : null;
    state.logoOutlineDataUrl = state.logoImage ? createLogoOutlineDataUrl(state.logoImage) : "";
    state.logoOutlineImage = state.logoOutlineDataUrl ? await loadImage(state.logoOutlineDataUrl) : null;
    updateQr();
    pushHistory();
  });

  document.getElementById("downloadPng").addEventListener("click", () => downloadPng(1024));
  document.getElementById("downloadPngHi").addEventListener("click", () => downloadPng(2048));
  document.getElementById("downloadSvg").addEventListener("click", downloadSvg);
}

function collectValues() {
  const get = (id) => (document.getElementById(id)?.value || "").trim();
  return {
    firstName: get("firstName"),
    lastName: get("lastName"),
    company: get("company"),
    jobTitle: get("jobTitle"),
    email: get("email"),
    mobile: get("mobile"),
    landline: get("landline"),
    whatsapp: get("whatsapp"),
    website: get("website"),
    street: get("street"),
    city: get("city"),
    region: get("region"),
    postalCode: get("postalCode"),
    country: get("country"),
    pageUrl: get("pageUrl"),
    websiteTarget: get("websiteTarget"),
    qrDark: get("qrDark") || "#111827",
    qrLight: get("qrLight") || "#ffffff",
    moduleStyle: get("moduleStyle") || "square",
    errorCorrection: get("errorCorrection") || "H",
    logoSize: Number(get("logoSize") || 15),
    logoBacking: get("logoBacking") || "rounded",
    logoBorder: get("logoBorder") !== "no",
    labelCompany: get("labelCompany"),
    labelWebsite: get("labelWebsite"),
    labelCustom: get("labelCustom"),
  };
}

function updateQr() {
  updateUndoButton();
  const values = collectValues();
  const payload = buildQrPayload(values);
  state.lastPayload = payload;
  try {
    state.lastQr = QrCode.encodeText(payload, ECL[values.errorCorrection] || ECL.H);
    renderCanvas(document.getElementById("qrCanvas"), state.lastQr, values, 1024);
    document.getElementById("qrLabel").textContent = buildLabel(values);
    renderStatus(values, payload, null);
  } catch (error) {
    state.lastQr = null;
    clearCanvas(document.getElementById("qrCanvas"));
    document.getElementById("qrLabel").textContent = "";
    renderStatus(values, payload, error);
  }
}

function buildQrPayload(values) {
  if (state.qrType === "website") return normalizeUrl(values.websiteTarget);
  const contact = {
    fn: values.firstName,
    ln: values.lastName,
    co: values.company,
    jt: values.jobTitle,
    em: values.email,
    mo: values.mobile,
    la: values.landline,
    wa: values.whatsapp,
    st: values.street,
    ci: values.city,
    rg: values.region,
    pc: values.postalCode,
    cy: values.country,
    wb: values.website,
  };
  const encoded = base64UrlEncode(JSON.stringify(contact));
  const page = normalizeOwnPageUrl(values.pageUrl);
  return `${page}#c=${encoded}`;
}

function normalizeOwnPageUrl(value) {
  const fallback = getBasePageUrl();
  const text = value || fallback;
  if (/^file:/i.test(text)) return text.split("#")[0];
  return normalizeUrl(text).split("#")[0];
}

function normalizeUrl(value) {
  const text = (value || "").trim();
  if (!text) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(text)) return text;
  return `https://${text}`;
}

function buildLabel(values) {
  return [values.labelCompany, values.labelWebsite, values.labelCustom].filter(Boolean).join(" · ");
}

function renderStatus(values, payload, error) {
  const items = [];
  if (error) {
    items.push(["bad", error.message || "QR could not be generated."]);
  } else {
    items.push(["ok", "QR generated. Quiet zone is included."]);
  }
  if (state.qrType === "contact") {
    const hasName = values.firstName || values.lastName || values.company;
    const hasMethod = values.email || values.mobile || values.landline || values.whatsapp || values.website;
    items.push([hasName ? "ok" : "bad", hasName ? "Contact has a display name." : "Add a name or company."]);
    items.push([hasMethod ? "ok" : "bad", hasMethod ? "At least one contact method is present." : "Add at least one contact method."]);
    items.push([isValidEmail(values.email) || !values.email ? "ok" : "warn", values.email && !isValidEmail(values.email) ? "Email format may be invalid." : "Email field is acceptable."]);
    items.push([values.whatsapp && !normalizePhoneDigits(values.whatsapp) ? "warn" : "ok", values.whatsapp ? "WhatsApp link can be generated from the number." : "WhatsApp is optional."]);
    items.push([/^file:/i.test(values.pageUrl) ? "warn" : "ok", /^file:/i.test(values.pageUrl) ? "Local file URLs are for preview only; use a hosted URL before printing." : "Contact page URL is web-accessible."]);
  } else {
    items.push([payload ? "ok" : "bad", payload ? "Website URL is present." : "Add a website URL."]);
  }
  const contrast = contrastRatio(values.qrDark, values.qrLight);
  items.push([contrast >= 4.5 ? "ok" : "warn", contrast >= 4.5 ? "QR contrast is strong." : "QR contrast is low; scanning may suffer."]);
  items.push([values.logoSize <= 20 ? "ok" : "warn", values.logoSize <= 20 ? "Logo size is within the safe range." : "Logo is above 20%; test before print."]);
  items.push([state.logoOutlineImage ? "ok" : "warn", state.logoOutlineImage ? "Logo is converted to an outline-only mark." : "No logo uploaded."]);
  if (payload.length > 1200) items.push(["warn", "QR data is long; scan testing is strongly recommended."]);
  document.getElementById("statusList").innerHTML = items.map(([type, text]) => `
    <div class="status-item ${type}">
      <span class="status-dot"></span>
      <span>${escapeHtml(text)}</span>
    </div>
  `).join("");
}

function renderContactPage(contact) {
  const displayName = [contact.fn, contact.ln].filter(Boolean).join(" ") || contact.co || "Contact";
  const roleLine = [contact.jt, contact.co].filter(Boolean).join(" · ");
  const initials = ((contact.fn || "").charAt(0) + (contact.ln || contact.co || "").charAt(0)).toUpperCase() || "C";
  const address = formatAddress(contact);
  const vcard = makeVcard(contact);
  app.innerHTML = `
    <div class="contact-page">
      <article class="contact-card">
        <header class="contact-header">
          <div class="monogram">${escapeHtml(initials)}</div>
          <h1>${escapeHtml(displayName)}</h1>
          ${roleLine ? `<p>${escapeHtml(roleLine)}</p>` : ""}
        </header>
        <div class="contact-actions">
          <button type="button" class="btn primary full" id="addContactBtn">Add to Contacts</button>
          <div class="secondary">
            ${contact.wa ? `<a class="btn" href="${escapeAttr(whatsappUrl(contact.wa))}">WhatsApp</a>` : ""}
            ${contact.mo ? `<a class="btn" href="tel:${escapeAttr(normalizePhoneTel(contact.mo))}">Call</a>` : ""}
            ${contact.em ? `<a class="btn" href="mailto:${escapeAttr(contact.em)}">Email</a>` : ""}
          </div>
        </div>
        <div class="contact-details">
          ${detail("Mobile", contact.mo)}
          ${detail("Landline", contact.la)}
          ${detail("Email", contact.em, contact.em ? `mailto:${contact.em}` : "")}
          ${detail("WhatsApp", contact.wa)}
          ${detail("Address", address)}
          ${detail("Website", contact.wb, contact.wb ? normalizeUrl(contact.wb) : "")}
        </div>
      </article>
    </div>
  `;
  document.getElementById("addContactBtn").addEventListener("click", () => downloadContact(displayName, vcard));
}

function detail(label, value, href = "") {
  if (!value) return "";
  const content = href ? `<a href="${escapeAttr(href)}">${escapeHtml(value)}</a>` : `<span>${escapeHtml(value)}</span>`;
  return `<div class="detail-row"><span>${escapeHtml(label)}</span>${content}</div>`;
}

function readContactFromHash() {
  const match = window.location.hash.match(/^#c=([^&]+)/);
  if (!match) return null;
  try {
    return JSON.parse(base64UrlDecode(match[1]));
  } catch {
    return null;
  }
}

function makeVcard(contact) {
  const fullName = [contact.fn, contact.ln].filter(Boolean).join(" ") || contact.co || "Contact";
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  lines.push(`N:${vEsc(contact.ln || "")};${vEsc(contact.fn || "")};;;`);
  lines.push(`FN:${vEsc(fullName)}`);
  if (contact.co) lines.push(`ORG:${vEsc(contact.co)}`);
  if (contact.jt) lines.push(`TITLE:${vEsc(contact.jt)}`);
  if (contact.em) lines.push(`EMAIL;TYPE=INTERNET,WORK:${vEsc(contact.em)}`);
  if (contact.mo) lines.push(`TEL;TYPE=CELL:${vEsc(contact.mo)}`);
  if (contact.la) lines.push(`TEL;TYPE=WORK,VOICE:${vEsc(contact.la)}`);
  const hasAddress = contact.st || contact.ci || contact.rg || contact.pc || contact.cy;
  if (hasAddress) lines.push(`ADR;TYPE=WORK:;;${vEsc(contact.st || "")};${vEsc(contact.ci || "")};${vEsc(contact.rg || "")};${vEsc(contact.pc || "")};${vEsc(contact.cy || "")}`);
  if (contact.wb) lines.push(`URL:${vEsc(normalizeUrl(contact.wb))}`);
  lines.push("END:VCARD");
  return `${lines.join("\r\n")}\r\n`;
}

function vEsc(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function downloadContact(name, content) {
  const blob = new Blob([content], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(name)}.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatAddress(c) {
  return [c.st, [c.pc, c.ci].filter(Boolean).join(" "), c.rg, c.cy].filter(Boolean).join(", ");
}

function whatsappUrl(number) {
  const digits = normalizePhoneDigits(number);
  return digits ? `https://wa.me/${digits}` : "#";
}

function normalizePhoneDigits(number) {
  return String(number || "").replace(/[^\d]/g, "");
}

function normalizePhoneTel(number) {
  return String(number || "").replace(/[^\d+]/g, "");
}

function downloadPng(size) {
  if (!state.lastQr) return;
  const values = collectValues();
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size + (buildLabel(values) ? Math.round(size * 0.11) : 0);
  renderCanvas(canvas, state.lastQr, values, size, true);
  downloadDataUrl(canvas.toDataURL("image/png"), `qr-${state.qrType}-${size}.png`);
}

function downloadSvg() {
  if (!state.lastQr) return;
  const values = collectValues();
  const svg = renderSvg(state.lastQr, values);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, `qr-${state.qrType}.svg`);
  URL.revokeObjectURL(url);
}

function downloadDataUrl(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function renderCanvas(canvas, qr, values, qrPixels, includeLabel = false) {
  const ctx = canvas.getContext("2d");
  const label = buildLabel(values);
  canvas.width = qrPixels;
  canvas.height = qrPixels + (includeLabel && label ? Math.round(qrPixels * 0.11) : 0);
  drawQr(ctx, qr, values, 0, 0, qrPixels);
  if (includeLabel && label) {
    ctx.fillStyle = values.qrLight;
    ctx.fillRect(0, qrPixels, qrPixels, canvas.height - qrPixels);
    ctx.fillStyle = values.qrDark;
    ctx.font = `${Math.max(22, Math.round(qrPixels * 0.028))}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, qrPixels / 2, qrPixels + (canvas.height - qrPixels) / 2, qrPixels * 0.9);
  }
}

function drawQr(ctx, qr, values, x, y, size) {
  const quiet = 4;
  const count = qr.size + quiet * 2;
  const cell = size / count;
  ctx.fillStyle = values.qrLight;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = values.qrDark;
  for (let row = 0; row < qr.size; row++) {
    for (let col = 0; col < qr.size; col++) {
      if (!qr.getModule(col, row)) continue;
      const px = x + (col + quiet) * cell;
      const py = y + (row + quiet) * cell;
      drawModule(ctx, px, py, cell, values.moduleStyle);
    }
  }
  if (state.logoOutlineImage) drawLogo(ctx, values, x, y, size);
}

function drawModule(ctx, x, y, cell, style) {
  const pad = style === "dot" ? cell * 0.14 : 0;
  if (style === "dot") {
    ctx.beginPath();
    ctx.arc(x + cell / 2, y + cell / 2, cell * 0.36, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === "rounded") {
    roundedRect(ctx, x + pad, y + pad, cell - pad * 2, cell - pad * 2, cell * 0.22);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, cell, cell);
  }
}

function drawLogo(ctx, values, x, y, size) {
  const img = state.logoOutlineImage;
  if (!img) return;
  const logoSize = size * (values.logoSize / 100);
  const cx = x + size / 2 - logoSize / 2;
  const cy = y + size / 2 - logoSize / 2;
  const pad = logoSize * 0.22;
  if (values.logoBacking !== "none") {
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = values.logoBorder ? "rgba(17,24,39,0.18)" : "transparent";
    ctx.lineWidth = Math.max(1, size * 0.002);
    const bx = cx - pad / 2, by = cy - pad / 2, bw = logoSize + pad, bh = logoSize + pad;
    if (values.logoBacking === "circle") {
      ctx.beginPath();
      ctx.arc(bx + bw / 2, by + bh / 2, bw / 2, 0, Math.PI * 2);
      ctx.fill();
      if (values.logoBorder) ctx.stroke();
    } else {
      roundedRect(ctx, bx, by, bw, bh, values.logoBacking === "rounded" ? bw * 0.16 : 0);
      ctx.fill();
      if (values.logoBorder) ctx.stroke();
    }
  }
  drawTintedImage(ctx, img, cx, cy, logoSize, logoSize, values.qrDark);
}

function drawTintedImage(ctx, img, x, y, width, height, color) {
  const off = document.createElement("canvas");
  off.width = Math.max(1, Math.round(width));
  off.height = Math.max(1, Math.round(height));
  const offCtx = off.getContext("2d");
  offCtx.drawImage(img, 0, 0, off.width, off.height);
  offCtx.globalCompositeOperation = "source-in";
  offCtx.fillStyle = color;
  offCtx.fillRect(0, 0, off.width, off.height);
  ctx.drawImage(off, x, y, width, height);
}

function createTintedLogoDataUrl(color) {
  if (!state.logoOutlineImage) return "";
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(state.logoOutlineImage, 0, 0, size, size);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  return canvas.toDataURL("image/png");
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function renderSvg(qr, values) {
  const quiet = 4;
  const cell = 10;
  const qrSize = (qr.size + quiet * 2) * cell;
  const label = buildLabel(values);
  const labelHeight = label ? 62 : 0;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${qrSize}" height="${qrSize + labelHeight}" viewBox="0 0 ${qrSize} ${qrSize + labelHeight}">`;
  svg += `<rect width="100%" height="100%" fill="${escapeAttr(values.qrLight)}"/>`;
  svg += `<g fill="${escapeAttr(values.qrDark)}">`;
  for (let row = 0; row < qr.size; row++) {
    for (let col = 0; col < qr.size; col++) {
      if (!qr.getModule(col, row)) continue;
      const x = (col + quiet) * cell;
      const y = (row + quiet) * cell;
      if (values.moduleStyle === "dot") svg += `<circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="${cell * 0.36}"/>`;
      else svg += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="${values.moduleStyle === "rounded" ? 2.2 : 0}"/>`;
    }
  }
  svg += `</g>`;
  if (state.logoOutlineDataUrl) {
    const logo = qrSize * (values.logoSize / 100);
    const pad = logo * 0.22;
    const x = qrSize / 2 - logo / 2;
    const y = qrSize / 2 - logo / 2;
    const bx = x - pad / 2, by = y - pad / 2, bw = logo + pad;
    if (values.logoBacking !== "none") {
      if (values.logoBacking === "circle") svg += `<circle cx="${qrSize / 2}" cy="${qrSize / 2}" r="${bw / 2}" fill="#fff" ${values.logoBorder ? `stroke="rgba(17,24,39,0.18)"` : ""}/>`;
      else svg += `<rect x="${bx}" y="${by}" width="${bw}" height="${bw}" rx="${values.logoBacking === "rounded" ? bw * 0.16 : 0}" fill="#fff" ${values.logoBorder ? `stroke="rgba(17,24,39,0.18)"` : ""}/>`;
    }
    const logoHref = createTintedLogoDataUrl(values.qrDark) || state.logoOutlineDataUrl;
    svg += `<image href="${escapeAttr(logoHref)}" x="${x}" y="${y}" width="${logo}" height="${logo}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  if (label) svg += `<text x="${qrSize / 2}" y="${qrSize + 36}" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="${escapeAttr(values.qrDark)}">${escapeHtml(label)}</text>`;
  svg += `</svg>`;
  return svg;
}

function clearCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

function contrastRatio(a, b) {
  const l1 = luminance(hexToRgb(a));
  const l2 = luminance(hexToRgb(b));
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

function hexToRgb(hex) {
  const clean = String(hex || "#000").replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean.padEnd(6, "0").slice(0, 6);
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function luminance(rgb) {
  const vals = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return vals[0] * 0.2126 + vals[1] * 0.7152 + vals[2] * 0.0722;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createLogoOutlineDataUrl(image) {
  const size = 256;
  const source = document.createElement("canvas");
  source.width = size;
  source.height = size;
  const sctx = source.getContext("2d", { willReadFrequently: true });
  sctx.clearRect(0, 0, size, size);
  const scale = Math.min(size * 0.78 / image.width, size * 0.78 / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  sctx.drawImage(image, (size - w) / 2, (size - h) / 2, w, h);
  const data = sctx.getImageData(0, 0, size, size);
  const pixels = data.data;
  const bg = averageCornerColor(pixels, size);
  const mask = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const alpha = pixels[i + 3];
      if (alpha < 32) continue;
      const nearBg = colorDistance([pixels[i], pixels[i + 1], pixels[i + 2]], bg) < 46;
      const nearWhite = pixels[i] > 246 && pixels[i + 1] > 246 && pixels[i + 2] > 246;
      if (!nearBg && !nearWhite) mask[y * size + x] = 1;
    }
  }

  const out = document.createElement("canvas");
  out.width = size;
  out.height = size;
  const octx = out.getContext("2d");
  const outline = octx.createImageData(size, size);
  const o = outline.data;
  const radius = 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!mask[y * size + x]) continue;
      let edge = false;
      for (let dy = -radius; dy <= radius && !edge; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= size || ny >= size || !mask[ny * size + nx]) {
            edge = true;
            break;
          }
        }
      }
      if (edge) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
            const oi = (ny * size + nx) * 4;
            o[oi] = 0;
            o[oi + 1] = 0;
            o[oi + 2] = 0;
            o[oi + 3] = 255;
          }
        }
      }
    }
  }
  octx.putImageData(outline, 0, 0);
  return out.toDataURL("image/png");
}

function averageCornerColor(pixels, size) {
  const samples = [[0, 0], [size - 1, 0], [0, size - 1], [size - 1, size - 1]];
  const sum = [0, 0, 0];
  samples.forEach(([x, y]) => {
    const i = (y * size + x) * 4;
    sum[0] += pixels[i];
    sum[1] += pixels[i + 1];
    sum[2] += pixels[i + 2];
  });
  return sum.map((v) => v / samples.length);
}

function colorDistance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function pushHistory() {
  if (state.isRestoring || !document.getElementById("app")) return;
  const snapshot = snapshotGenerator();
  const last = state.history[state.history.length - 1];
  if (last && JSON.stringify(last) === JSON.stringify(snapshot)) return;
  state.history.push(snapshot);
  if (state.history.length > 40) state.history.shift();
  updateUndoButton();
}

function snapshotGenerator() {
  const fields = {};
  document.querySelectorAll("input, select, textarea").forEach((input) => {
    if (input.id !== "logoInput") fields[input.id] = input.value;
  });
  return {
    qrType: state.qrType,
    fields,
    logoDataUrl: state.logoDataUrl,
    logoOutlineDataUrl: state.logoOutlineDataUrl,
  };
}

async function undoLastChange() {
  if (state.history.length < 2) return;
  state.isRestoring = true;
  state.history.pop();
  const snapshot = state.history[state.history.length - 1];
  state.qrType = snapshot.qrType;
  Object.entries(snapshot.fields).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.value = value;
  });
  document.querySelectorAll(".mode-pill button").forEach((button) => {
    button.classList.toggle("active", button.dataset.type === state.qrType);
  });
  document.getElementById("contactFields").classList.toggle("hidden", state.qrType !== "contact");
  document.getElementById("websiteFields").classList.toggle("hidden", state.qrType !== "website");
  state.logoDataUrl = snapshot.logoDataUrl || "";
  state.logoImage = state.logoDataUrl ? await loadImage(state.logoDataUrl) : null;
  state.logoOutlineDataUrl = snapshot.logoOutlineDataUrl || "";
  state.logoOutlineImage = state.logoOutlineDataUrl ? await loadImage(state.logoOutlineDataUrl) : null;
  state.isRestoring = false;
  updateQr();
}

function updateUndoButton() {
  const undo = document.getElementById("undoBtn");
  if (undo) undo.disabled = state.history.length < 2;
}

function base64UrlEncode(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => binary += String.fromCharCode(byte));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(text) {
  const normalized = text.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function slugify(value) {
  return String(value || "contact").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "contact";
}

class QrCode {
  constructor(version, errorCorrectionLevel, modules) {
    this.version = version;
    this.errorCorrectionLevel = errorCorrectionLevel;
    this.modules = modules;
    this.size = modules.length;
  }

  static encodeText(text, ecl) {
    const bytes = Array.from(new TextEncoder().encode(text));
    for (let version = 1; version <= 40; version++) {
      const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
      const ccBits = version < 10 ? 8 : 16;
      const bitLen = 4 + ccBits + bytes.length * 8;
      if (bitLen <= dataCapacityBits) return QrCode.encodeBytes(bytes, ecl, version);
    }
    throw new Error("The QR data is too long. Shorten the contact fields or website URL.");
  }

  static encodeBytes(bytes, ecl, version) {
    const bb = [];
    appendBits(0x4, 4, bb);
    appendBits(bytes.length, version < 10 ? 8 : 16, bb);
    bytes.forEach((b) => appendBits(b, 8, bb));
    const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;
    appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
    while (bb.length % 8 !== 0) bb.push(0);
    const data = [];
    for (let i = 0; i < bb.length; i += 8) data.push(parseInt(bb.slice(i, i + 8).join(""), 2));
    for (let pad = 0xec; data.length < getNumDataCodewords(version, ecl); pad ^= 0xec ^ 0x11) data.push(pad);
    const codewords = addEccAndInterleave(data, version, ecl);
    return buildQr(version, ecl, codewords);
  }

  getModule(x, y) {
    return this.modules[y][x];
  }
}

function appendBits(value, length, bits) {
  for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
}

function getNumRawDataModules(version) {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function getNumDataCodewords(version, ecl) {
  return Math.floor(getNumRawDataModules(version) / 8) -
    ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][version] * NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][version];
}

function addEccAndInterleave(data, version, ecl) {
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][version];
  const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][version];
  const rawCodewords = Math.floor(getNumRawDataModules(version) / 8);
  const numShortBlocks = numBlocks - rawCodewords % numBlocks;
  const shortBlockDataLen = Math.floor(rawCodewords / numBlocks) - blockEccLen;
  const rsDiv = reedSolomonComputeDivisor(blockEccLen);
  const blocks = [];
  let k = 0;
  for (let i = 0; i < numBlocks; i++) {
    const datLen = shortBlockDataLen + (i < numShortBlocks ? 0 : 1);
    const dat = data.slice(k, k + datLen);
    k += datLen;
    const ecc = reedSolomonComputeRemainder(dat, rsDiv);
    blocks.push(dat.concat(i < numShortBlocks ? [0] : [], ecc));
  }
  const result = [];
  for (let i = 0; i < blocks[blocks.length - 1].length; i++) {
    for (let j = 0; j < blocks.length; j++) {
      if (i !== shortBlockDataLen || j >= numShortBlocks) {
        if (i < blocks[j].length) result.push(blocks[j][i]);
      }
    }
  }
  return result;
}

function reedSolomonComputeDivisor(degree) {
  const result = Array(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = reedSolomonMultiply(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = reedSolomonMultiply(root, 0x02);
  }
  return result;
}

function reedSolomonComputeRemainder(data, divisor) {
  const result = Array(divisor.length).fill(0);
  data.forEach((b) => {
    const factor = b ^ result.shift();
    result.push(0);
    divisor.forEach((coef, i) => result[i] ^= reedSolomonMultiply(coef, factor));
  });
  return result;
}

function reedSolomonMultiply(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function buildQr(version, ecl, codewords) {
  const size = version * 4 + 17;
  const baseModules = Array.from({ length: size }, () => Array(size).fill(false));
  const baseFunction = Array.from({ length: size }, () => Array(size).fill(false));
  const setFunc = (x, y, dark) => {
    baseModules[y][x] = dark;
    baseFunction[y][x] = true;
  };

  drawFunctionPatterns(version, size, setFunc);
  let bestMask = 0;
  let bestModules = null;
  let bestPenalty = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const modules = baseModules.map((r) => r.slice());
    const isFunction = baseFunction.map((r) => r.slice());
    drawCodewords(modules, isFunction, codewords, mask);
    drawFormatBits(modules, isFunction, ecl, mask);
    if (version >= 7) drawVersion(modules, isFunction, version);
    const penalty = getPenaltyScore(modules);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = mask;
      bestModules = modules;
    }
  }
  drawFormatBits(bestModules, baseFunction, ecl, bestMask);
  if (version >= 7) drawVersion(bestModules, baseFunction, version);
  return new QrCode(version, ecl, bestModules);
}

function drawFunctionPatterns(version, size, setFunc) {
  drawFinder(setFunc, 3, 3, size);
  drawFinder(setFunc, size - 4, 3, size);
  drawFinder(setFunc, 3, size - 4, size);
  for (let i = 0; i < size; i++) {
    if (!isFunctionCoordinate(i, 6, size)) setFunc(i, 6, i % 2 === 0);
    if (!isFunctionCoordinate(6, i, size)) setFunc(6, i, i % 2 === 0);
  }
  const aligns = getAlignmentPatternPositions(version);
  aligns.forEach((x, i) => aligns.forEach((y, j) => {
    if (!((i === 0 && j === 0) || (i === 0 && j === aligns.length - 1) || (i === aligns.length - 1 && j === 0))) {
      drawAlignment(setFunc, x, y);
    }
  }));
  drawFormatBitsPlaceholder(setFunc, size);
  if (version >= 7) drawVersionPlaceholder(setFunc, size);
}

function isFunctionCoordinate(x, y, size) {
  return (x <= 8 && y <= 8) || (x >= size - 8 && y <= 8) || (x <= 8 && y >= size - 8);
}

function drawFinder(setFunc, cx, cy, size) {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy;
      if (0 <= x && x < size && 0 <= y && y < size) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        setFunc(x, y, dist !== 2 && dist !== 4);
      }
    }
  }
}

function drawAlignment(setFunc, cx, cy) {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      setFunc(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
}

function getAlignmentPatternPositions(version) {
  if (version === 1) return [];
  const numAlign = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result = [6];
  for (let pos = version * 4 + 10; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
  return result;
}

function drawFormatBitsPlaceholder(setFunc, size) {
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      setFunc(8, i, false);
      setFunc(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    setFunc(size - 1 - i, 8, false);
    setFunc(8, size - 1 - i, false);
  }
  setFunc(8, size - 8, true);
}

function drawVersionPlaceholder(setFunc, size) {
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 3; j++) {
      setFunc(size - 11 + j, i, false);
      setFunc(i, size - 11 + j, false);
    }
  }
}

function drawFormatBits(modules, isFunction, ecl, mask) {
  const size = modules.length;
  let data = ecl.formatBits << 3 | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  const set = (x, y, bit) => {
    modules[y][x] = bit;
    isFunction[y][x] = true;
  };
  for (let i = 0; i <= 5; i++) set(8, i, getBit(bits, i));
  set(8, 7, getBit(bits, 6));
  set(8, 8, getBit(bits, 7));
  set(7, 8, getBit(bits, 8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, getBit(bits, i));
  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, getBit(bits, i));
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, getBit(bits, i));
  set(8, size - 8, true);
}

function drawVersion(modules, isFunction, version) {
  const size = modules.length;
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  const bits = (version << 12) | rem;
  for (let i = 0; i < 18; i++) {
    const bit = getBit(bits, i);
    const a = size - 11 + i % 3;
    const b = Math.floor(i / 3);
    modules[b][a] = bit;
    modules[a][b] = bit;
    isFunction[b][a] = true;
    isFunction[a][b] = true;
  }
}

function drawCodewords(modules, isFunction, data, mask) {
  const size = modules.length;
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFunction[y][x] && i < data.length * 8) {
          const bit = getBit(data[Math.floor(i / 8)], 7 - (i % 8));
          modules[y][x] = bit !== maskBit(mask, x, y);
          i++;
        }
      }
    }
  }
}

function maskBit(mask, x, y) {
  switch (mask) {
    case 0: return (x + y) % 2 === 0;
    case 1: return y % 2 === 0;
    case 2: return x % 3 === 0;
    case 3: return (x + y) % 3 === 0;
    case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5: return (x * y) % 2 + (x * y) % 3 === 0;
    case 6: return ((x * y) % 2 + (x * y) % 3) % 2 === 0;
    case 7: return ((x + y) % 2 + (x * y) % 3) % 2 === 0;
    default: return false;
  }
}

function getBit(x, i) {
  return ((x >>> i) & 1) !== 0;
}

function getPenaltyScore(modules) {
  const size = modules.length;
  let result = 0;
  for (let y = 0; y < size; y++) {
    let runColor = false, runX = 0;
    for (let x = 0; x < size; x++) {
      if (modules[y][x] === runColor) {
        runX++;
        if (runX === 5) result += 3;
        else if (runX > 5) result++;
      } else {
        runColor = modules[y][x];
        runX = 1;
      }
    }
  }
  for (let x = 0; x < size; x++) {
    let runColor = false, runY = 0;
    for (let y = 0; y < size; y++) {
      if (modules[y][x] === runColor) {
        runY++;
        if (runY === 5) result += 3;
        else if (runY > 5) result++;
      } else {
        runColor = modules[y][x];
        runY = 1;
      }
    }
  }
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const color = modules[y][x];
      if (color === modules[y][x + 1] && color === modules[y + 1][x] && color === modules[y + 1][x + 1]) result += 3;
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size - 10; x++) {
      if (finderPenalty(modules[y].slice(x, x + 11))) result += 40;
    }
  }
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size - 10; y++) {
      const bits = [];
      for (let k = 0; k < 11; k++) bits.push(modules[y + k][x]);
      if (finderPenalty(bits)) result += 40;
    }
  }
  let dark = 0;
  modules.forEach((row) => row.forEach((v) => dark += v ? 1 : 0));
  const k = Math.ceil(Math.abs(dark * 20 - size * size * 10) / (size * size)) - 1;
  result += k * 10;
  return result;
}

function finderPenalty(bits) {
  const pattern1 = [true,false,true,true,true,false,true,false,false,false,false];
  const pattern2 = [false,false,false,false,true,false,true,true,true,false,true];
  return bits.every((b, i) => b === pattern1[i]) || bits.every((b, i) => b === pattern2[i]);
}

init();
