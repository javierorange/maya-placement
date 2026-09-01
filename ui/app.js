const state = {
  region: "all",
  q: "",
  data: null,
};

function daysUntil(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - Date.now()) / 86400000);
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function render() {
  const data = state.data;
  if (!data) return;

  document.getElementById("week-label").textContent = data.week_of
    ? `Week of ${data.week_of}`
    : "";
  document.getElementById("example-banner").hidden = !data.is_example;

  document.getElementById("stats").innerHTML = `
    <div class="stat"><b>${data.summary.new_offers}</b><span>New offers</span></div>
    <div class="stat"><b>${data.summary.new_sources}</b><span>New websites</span></div>
    <div class="stat"><b>${data.summary.dropped}</b><span>Dropped (too short / grad)</span></div>
  `;

  const check = document.getElementById("maya-check");
  if (data.summary.maya_check?.length) {
    check.hidden = false;
    check.innerHTML =
      "<strong>Maya should check:</strong> " +
      data.summary.maya_check
        .map(
          (item) =>
            `<a href="${esc(item.url)}" target="_blank" rel="noreferrer">${esc(item.name)}</a> — ${esc(item.note)}`
        )
        .join("<br />");
  } else {
    check.hidden = true;
  }

  const q = state.q.trim().toLowerCase();
  const offers = (data.offers || []).filter((o) => {
    const regionOk = state.region === "all" || o.region === state.region;
    const hay = [o.title, o.company, o.location, o.function, o.source, o.why]
      .join(" ")
      .toLowerCase();
    return regionOk && (!q || hay.includes(q));
  });

  document.getElementById("offer-count").textContent = `(${offers.length})`;
  const list = document.getElementById("offers");
  const empty = document.getElementById("offers-empty");
  list.innerHTML = "";
  empty.hidden = offers.length > 0;

  for (const o of offers) {
    const days = daysUntil(o.deadline);
    const soon = days !== null && days <= 21;
    const deadline = o.deadline
      ? soon
        ? `Deadline ${o.deadline}${days >= 0 ? ` · ${days}d` : " · passed"}`
        : `Deadline ${o.deadline}`
      : "Deadline unknown";

    const link = o.link || {};
    const linkOk = link.status === "ok";
    const href = link.final_url || o.url;
    const action = linkOk
      ? `<a href="${esc(href)}" target="_blank" rel="noreferrer">Open listing</a>`
      : `<span class="broken">Link not verified${link.status ? ` (${esc(link.status)})` : ""}</span>`;
    const linkTag = linkOk
      ? `<span class="tag ok">Link checked</span>`
      : `<span class="tag dead">Link ${esc(link.status || "unchecked")}</span>`;

    list.appendChild(
      el(`
        <article class="card">
          <div class="card-top">
            <div>
              <h3 class="company">${esc(o.company)}</h3>
              <p class="title">${esc(o.title)}</p>
            </div>
          </div>
          <div class="meta">
            <span class="tag ${o.region === "UK" ? "uk" : "intl"}">${esc(o.region)}</span>
            <span class="tag">${esc(o.location)}</span>
            <span class="tag">${esc(o.duration)}</span>
            <span class="tag">${esc(o.function)}</span>
            <span class="tag${soon ? " soon" : ""}">${esc(deadline)}</span>
            ${linkTag}
          </div>
          <p class="why">${esc(o.why)}</p>
          <div class="card-actions">
            <span class="source">${esc(o.source)}</span>
            ${action}
          </div>
        </article>
      `)
    );
  }

  const sources = data.sources_added || [];
  document.getElementById("source-count").textContent = `(${sources.length})`;
  const sList = document.getElementById("sources");
  sList.innerHTML = "";
  for (const s of sources) {
    sList.appendChild(
      el(`
        <div class="source-row">
          <div>
            <a href="${esc(s.url)}" target="_blank" rel="noreferrer">${esc(s.name)}</a>
            <p>${esc(s.region)} · ${esc(s.access)} · ${esc(s.why)}</p>
          </div>
        </div>
      `)
    );
  }
}

document.getElementById("region-filters").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-region]");
  if (!btn) return;
  state.region = btn.dataset.region;
  for (const b of e.currentTarget.querySelectorAll(".chip")) {
    b.classList.toggle("is-on", b === btn);
  }
  render();
});

document.getElementById("q").addEventListener("input", (e) => {
  state.q = e.target.value;
  render();
});

fetch("../data/latest.json")
  .then((r) => {
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  })
  .then((data) => {
    state.data = data;
    render();
  })
  .catch((err) => {
    document.getElementById("subtitle").textContent =
      "Could not load data/latest.json. Serve the repo root (python3 -m http.server) rather than opening the HTML file directly.";
    console.error(err);
  });
