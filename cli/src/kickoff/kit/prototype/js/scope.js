// scope.js — the release scope layer. The prototype shows the full product (every release);
// the lens chosen in the prototype bar (or the hash token -full, -tags, -mvp) changes how
// later releases appear:
//   full  everything as designed, no marks;
//   tags  everything, with a small release tag on what arrives after the first release;
//   mvp   the first release only: later parts become a muted placeholder (or disappear inline),
//         later screens are dimmed under a note.
// Release names come from KIT_CONFIG.releases; the first one is the MVP. Core file.
(function () {
  "use strict";
  const { html, useApp } = KIT;
  const { cx } = KIT.util;
  const { Icon } = KIT.ui;

  const releases = () => KIT.config().releases;
  // Index of a release in the configured order; an unknown release counts as the last one.
  const relIndex = (r) => {
    const i = releases().indexOf(r);
    return i < 0 ? releases().length : i;
  };
  const isLater = (r) => !!r && relIndex(r) > 0;

  // A small release tag; colour by position: first, second, third, later.
  function RelBadge({ r, cls }) {
    if (!r) return null;
    const i = Math.min(relIndex(r), 3);
    return html`<span class=${cx("rel-badge", "rb-" + i, cls)} title=${i === 0 ? KIT.t("rel.in", { r }) : KIT.t("rel.arrives", { r })}>${r}</span>`;
  }

  // Rel({ r, children, inline }) wraps a part of a screen that arrives in release r.
  function Rel({ r, children, inline }) {
    const A = useApp();
    const lens = (A && A.lens) || "full";
    if (!isLater(r) || lens === "full") return children;
    if (lens === "tags") {
      return inline
        ? html`<span class="rel-inline">${children}<${RelBadge} r=${r} /></span>`
        : html`<div class="rel-block">${children}<${RelBadge} r=${r} cls="rel-flag" /></div>`;
    }
    if (inline) return null;
    return html`<div class="rel-ph" role="note" title=${KIT.t("rel.arrives", { r })}><${Icon} n="lock" s=${14} /><span>${r}</span></div>`;
  }

  // The lens applied to a whole screen (used by the shell around every screen).
  function ScreenRel({ r, children }) {
    const A = useApp();
    if (!isLater(r) || A.lens === "full") return children;
    const first = releases()[0];
    if (A.lens === "tags") {
      return html`<div class="rel-strip" role="note"><${RelBadge} r=${r} /><span>${KIT.t("rel.screen", { r })}</span></div>${children}`;
    }
    return html`<div class="rel-strip dim" role="note"><${Icon} n="lock" s=${16} /><span><b>${KIT.t("rel.notIn", { first })}</b> ${KIT.t("rel.screen", { r })}</span></div>
      <div class="rel-dim" aria-disabled="true" inert=${true}>${children}</div>`;
  }

  Object.assign(KIT.ui, { Rel, RelBadge, ScreenRel });
  KIT.scope = { relIndex, isLater, releases };
})();
