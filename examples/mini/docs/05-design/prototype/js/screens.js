// screens.js — Library Loans screens: SC-01 Home, SC-02 Loans, SC-03 Monthly report (R2),
// A-01 My loans (Android).
(function () {
  "use strict";
  const { html, hooks, useApp, D } = KIT;
  const { useState } = hooks;
  const { Button, Field, Table, KPI, StatusChip, Card, PageHeader, Drawer, EmptyState, Rel } = KIT.ui;
  const { BarChart, Donut } = KIT.charts;

  const book = (id) => D.books.find((b) => b.id === id);
  const member = (id) => D.members.find((m) => m.id === id);
  const STATUS = { out: ["On loan", "info"], overdue: ["Overdue", "warn"], returned: ["Returned", "ok"] };
  const day = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const plusDays = (iso, n) => {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const Status = ({ st }) => html`<${StatusChip} tone=${STATUS[st][1]}>${STATUS[st][0]}<//>`;
  const active = () => D.loans.filter((l) => l.status !== "returned");
  const byDue = (a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0);

  const LOAN_COLUMNS = [
    { key: "book", label: "Book", render: (l) => html`<span class="t-strong">${book(l.book).title}</span>` },
    { key: "member", label: "Member", render: (l) => member(l.member).name },
    { key: "due", label: "Due", render: (l) => day(l.due) },
    { key: "status", label: "Status", render: (l) => html`<${Status} st=${l.status} />` },
  ];

  /* ---------------- SC-01 Home ---------------- */
  function Home() {
    const A = useApp();
    const open = active();
    const overdue = open.filter((l) => l.status === "overdue");
    const librarian = A.role === "librarian";
    return html`
      <${PageHeader} eyebrow="SC-01" title="Today at the library" desc="Books on loan, overdue loans and what is due back soon.">
        ${librarian && html`<${Button} kind="primary" icon="plus" onClick=${() => A.go("sc-02", { lend: true })}>Lend a book<//>`}
      <//>
      <div class="kpis">
        <${KPI} id="loans" label="Books on loan" value=${open.length} icon="book" />
        <${KPI} id="overdue" label="Overdue" value=${overdue.length} icon="clock" note=${overdue.length ? "Remind by e-mail" : "None"} />
        <${KPI} id="members" label="Members" value=${D.members.length} icon="users" />
      </div>
      <${Card} title="Due back soon" flush
        actions=${librarian && html`<${Button} kind="ghost" size="sm" iconRight="right" onClick=${() => A.go("sc-02")}>All loans<//>`}>
        <${Table} caption="Loans due back soon" columns=${LOAN_COLUMNS} rows=${open.slice().sort(byDue).slice(0, 4)} empty="Nothing is out right now." />
      <//>
      <${Rel} r="R2">
        <${Card} title="Monthly report" sub="Loans per month and by genre.">
          ${A.role === "admin"
            ? html`<div><${Button} icon="chart" onClick=${() => A.go("sc-03")}>Open the monthly report<//></div>`
            : html`<p class="t-meta">The administrator reads the monthly report.</p>`}
        <//>
      <//>`;
  }

  /* ---------------- SC-02 Loans ---------------- */
  function Loans() {
    const A = useApp();
    const [loans, setLoans] = useState(() => D.loans.slice());
    const [lending, setLending] = useState(!!A.params.lend);
    const [form, setForm] = useState({ member: "", book: "" });
    const [err, setErr] = useState({});
    const lent = new Set(loans.filter((l) => l.status !== "returned").map((l) => l.book));
    const free = D.books.filter((b) => !lent.has(b.id));
    const save = (next) => {
      D.loans = next;
      setLoans(next);
    };
    const giveBack = (l) => {
      save(loans.map((x) => (x.id === l.id ? { ...x, status: "returned" } : x)));
      A.toast(`${book(l.book).title} is back on the shelf.`, { icon: "check" });
    };
    const lend = () => {
      const e = {};
      if (!form.member) e.member = "Choose a member.";
      if (!form.book) e.book = "Choose a book.";
      setErr(e);
      if (Object.keys(e).length) return;
      const loan = { id: "l" + (loans.length + 1), book: form.book, member: form.member, out: D.today, due: plusDays(D.today, 14), status: "out" };
      save([loan, ...loans]);
      setLending(false);
      setForm({ member: "", book: "" });
      A.toast(`Lent ${book(loan.book).title} to ${member(loan.member).name}, due ${day(loan.due)}.`, { icon: "book" });
    };
    const columns = [
      ...LOAN_COLUMNS,
      { key: "act", label: "", num: true, render: (l) => (l.status === "returned" ? null : html`<${Button} size="sm" icon="undo" onClick=${() => giveBack(l)}>Return<//>`) },
    ];
    return html`
      <${PageHeader} eyebrow="SC-02" title="Loans" desc="Every loan with its due date. Overdue loans come first.">
        <${Button} kind="primary" icon="plus" onClick=${() => setLending(true)}>Lend a book<//>
      <//>
      <${Card} flush>
        <${Table} caption="All loans" columns=${columns} rows=${loans.slice().sort((a, b) => (a.status === "overdue" ? -1 : b.status === "overdue" ? 1 : byDue(a, b)))} />
      <//>
      <${Drawer} open=${lending} title="Lend a book" onClose=${() => setLending(false)}
        footer=${html`<${Button} onClick=${() => setLending(false)}>Cancel<//><${Button} kind="primary" icon="check" onClick=${lend}>Lend for 14 days<//>`}>
        <${Field} id="lend-member" label="Member" req err=${err.member}>
          <select id="lend-member" class="select" value=${form.member} aria-invalid=${!!err.member} onChange=${(e) => setForm({ ...form, member: e.currentTarget.value })}>
            <option value="">Choose a member</option>
            ${D.members.map((m) => html`<option key=${m.id} value=${m.id}>${m.name} · ${m.card}</option>`)}
          </select>
        <//>
        <${Field} id="lend-book" label="Book" req err=${err.book} hint=${free.length + " of " + D.books.length + " books are on the shelf."}>
          <select id="lend-book" class="select" value=${form.book} aria-invalid=${!!err.book} onChange=${(e) => setForm({ ...form, book: e.currentTarget.value })}>
            <option value="">Choose a book</option>
            ${free.map((b) => html`<option key=${b.id} value=${b.id}>${b.title}</option>`)}
          </select>
        <//>
      <//>`;
  }

  /* ---------------- SC-03 Monthly report (R2) ---------------- */
  function MonthlyReport() {
    const genres = {};
    for (const l of D.loans) {
      const g = book(l.book).genre;
      genres[g] = (genres[g] || 0) + 1;
    }
    const tones = ["primary", "accent", "ok", "warn", "ink3"];
    return html`
      <${PageHeader} eyebrow="SC-03" title="Monthly report" desc="Loans per month over the last six months." />
      <div class="grid-2">
        <${Card} title="Loans per month" sub="October so far">
          <${BarChart} label="Loans per month" data=${D.monthly.map((m) => ({ label: m.month, value: m.loans }))} highlightLast />
        <//>
        <${Card} title="Loans by genre" sub="Current sample">
          <${Donut} label="Loans by genre" parts=${Object.keys(genres).map((g, i) => ({ name: g, value: genres[g], tone: tones[i % tones.length] }))} center=${{ value: D.loans.length, label: "loans" }} />
        <//>
      </div>`;
  }

  /* ---------------- A-01 My loans (Android) ---------------- */
  function MyLoans() {
    const me = member(D.me);
    const mine = D.loans.filter((l) => l.member === me.id);
    const now = mine.filter((l) => l.status !== "returned").sort(byDue);
    const past = mine.filter((l) => l.status === "returned");
    const row = (l) => html`<div class="m-row" key=${l.id}>
      <div class="col grow minw0"><span class="t-strong clamp1">${book(l.book).title}</span><span class="t-meta">${l.status === "returned" ? "Borrowed " + day(l.out) : "Due " + day(l.due)}</span></div>
      <${Status} st=${l.status} />
    </div>`;
    return html`
      <div class="col gap-4"><span class="t-cap">Card ${me.card}</span><h2 class="t-h2">Hello, ${me.name.split(" ")[0]}</h2></div>
      <section class="col gap-8" aria-label="On loan now">
        <span class="t-cap">On loan now</span>
        ${now.length ? html`<div class="m-card">${now.map(row)}</div>` : html`<${EmptyState} icon="book" title="Nothing on loan" />`}
      </section>
      <section class="col gap-8" aria-label="Returned">
        <span class="t-cap">Returned</span>
        <div class="m-card">${past.map(row)}</div>
      </section>`;
  }

  KIT.register("sc-01", { comp: Home, code: "SC-01", name: "Home", roles: ["librarian", "admin"], platforms: ["web"], rel: "MVP", nav: "Library", icon: "home" });
  KIT.register("sc-02", { comp: Loans, code: "SC-02", name: "Loans", roles: ["librarian"], platforms: ["web"], rel: "MVP", nav: "Library", icon: "book" });
  KIT.register("sc-03", { comp: MonthlyReport, code: "SC-03", name: "Monthly report", roles: ["admin"], platforms: ["web"], rel: "R2", nav: "Reports", icon: "chart" });
  KIT.register("a-01", { comp: MyLoans, code: "A-01", name: "My loans", roles: ["member"], platforms: ["android"], rel: "MVP", nav: "Loans", icon: "library" });
})();
