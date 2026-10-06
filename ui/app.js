const DATA = "../data";

const FALLBACK_LISTS = [
  {
    id: "all",
    title: "All companies",
    blurb: "No employee cap. Ranked top 20 this week.",
    employee_cap: null,
  },
];

const state = {
  region: "all",
  q: "",
  data: null,
  archive: { weeks: [] },
  weekId: null,
};

function weekFromQuery() {
  const raw = new URLSearchParams(location.search).get("week");
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function setWeekInUrl(weekOf) {
  const url = new URL(location.href);
  url.searchParams.set("week", weekOf);
  history.replaceState({}, "", url);
}

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

function sortedWeeks() {
  return [...(state.archive.weeks || [])].sort((a, b) =>
    a.week_of < b.week_of ? 1 : a.week_of > b.week_of ? -1 : 0
  );
}

function offerLists(data) {
  const lists = data.lists;
  if (lists && (lists.all || lists.midsize)) {
    return [
      lists.all && {
        id: "all",
        title: lists.all.title || "All companies",
        blurb: lists.all.blurb || "No employee cap. Ranked top 20 this week.",
        offers: lists.all.offers || [],
      },
      lists.midsize && {
        id: "midsize",
        title: lists.midsize.title || "Under 20,000 employees",
        blurb:
          lists.midsize.blurb ||
          "Group headcount ≤20,000. Ranked top 20 this week.",
        offers: lists.midsize.offers || [],
      },
    ].filter(Boolean);
  }
  return [
    {
      ...FALLBACK_LISTS[0],
      offers: data.offers || [],
    },
  ];
}

function filteredOffers(offers) {
  const q = state.q.trim().toLowerCase();
  return (offers || []).filter((o) => {
    const regionOk = state.region === "all" || o.region === state.region;
    const hay = [o.title, o.company, o.location, o.function, o.source, o.why]
      .join(" ")
      .toLowerCase();
    return regionOk && (!q || hay.includes(q));
  });
}

function archiveLabel(w) {
  if (w.label && w.new_offers_all != null && w.new_offers_midsize != null) {
    return `${w.week_of} · All ${w.new_offers_all} · Under 20k ${w.new_offers_midsize}`;
  }
  if (w.label) return `${w.week_of} · ${w.label}`;
  return `${w.week_of} · ${w.new_offers ?? 0} offers`;
}

function renderArchive() {
  const nav = document.getElementById("archive");
  nav.innerHTML = "";
  const weeks = sortedWeeks();
  if (!weeks.length) {
    nav.textContent = "No weeks yet.";
    return;
  }
  for (const w of weeks) {
    const current = w.week_of === state.weekId;
    const a = el(
      `<a class="chip${current ? " is-current" : ""}" href="?week=${esc(w.week_of)}">${esc(archiveLabel(w))}</a>`
    );
    nav.appendChild(a);
  }
}

function offerCard(o) {
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

  return el(`
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
  `);
}

function render() {
  const data = state.data;
  if (!data) return;

  document.getElementById("week-label").textContent = data.week_of
    ? `Week of ${data.week_of}`
    : "";
  document.getElementById("example-banner").hidden = !data.is_example;

  const lists = offerLists(data);
  const allCount =
    data.summary.new_offers_all ??
    lists.find((l) => l.id === "all")?.offers.length ??
    data.summary.new_offers ??
    0;
  const midCount =
    data.summary.new_offers_midsize ??
    lists.find((l) => l.id === "midsize")?.offers.length;
  const sourceCount = data.summary.new_sources ?? 0;

  const stats = [
    `<div class="stat"><b>${allCount}</b><span>All companies</span></div>`,
  ];
  if (midCount != null) {
    stats.push(
      `<div class="stat"><b>${midCount}</b><span>Under 20,000 employees</span></div>`
    );
  }
  stats.push(
    `<div class="stat"><b>${sourceCount}</b><span>New websites</span></div>`
  );
  document.getElementById("stats").innerHTML = stats.join("");

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

  const host = document.getElementById("offer-lists");
  host.innerHTML = "";
  for (const list of lists) {
    const offers = filteredOffers(list.offers);
    const block = el(`
      <section class="list-block" data-list="${esc(list.id)}">
        <h2 class="section-title">${esc(list.title)} <span>(${offers.length})</span></h2>
        <p class="list-blurb">${esc(list.blurb)}</p>
        <div class="cards"></div>
        <p class="empty" hidden>No offers match these filters.</p>
      </section>
    `);
    const cards = block.querySelector(".cards");
    const empty = block.querySelector(".empty");
    empty.hidden = offers.length > 0;
    for (const o of offers) cards.appendChild(offerCard(o));
    host.appendChild(block);
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

  renderArchive();
}

function loadWeek(weekOf) {
  const path = `${DATA}/weeks/${weekOf}.json`;
  return fetch(path).then((r) => {
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  });
}

function boot() {
  fetch(`${DATA}/archive.json`)
    .then((r) => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    })
    .then((archive) => {
      state.archive = archive;
      const weeks = sortedWeeks();
      const requested = weekFromQuery();
      const latest = weeks[0]?.week_of;
      const weekId =
        requested && weeks.some((w) => w.week_of === requested)
          ? requested
          : latest;
      if (!weekId) throw new Error("No weeks in archive.json");
      state.weekId = weekId;
      setWeekInUrl(weekId);
      return loadWeek(weekId);
    })
    .then((data) => {
      state.data = data;
      render();
    })
    .catch((err) => {
      document.getElementById("subtitle").textContent =
        "Could not load digest data. Serve the repo root (python3 -m http.server) rather than opening the HTML file directly.";
      console.error(err);
    });
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

boot();
