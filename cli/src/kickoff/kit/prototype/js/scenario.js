// scenario.js — guided demo scenarios (KIT.scenario). A project lists them in js/scenarios.js:
//   KIT.SCENARIOS = [{ id, name, role, platform, steps: [{ text, go: [screenId, params?], expect: cssSelector }] }]
// Two ways to run one:
//   - #scn-<id> (or Play on the start page): sets the scenario's role and platform, then runs
//     one step every 600 ms. After each step it checks that `expect` matches an element of the
//     rendered page; a miss sets <html data-err="scenario <id> step <n>: missing <selector>">
//     and stops. After the last step it sets <html data-scenario="done">. The viewer can stop
//     the run at any time with the guide panel's Stop button.
//   - Once stopped or done, the guide panel steps through by hand (Previous, Next, Close).
// Steps navigate through the app API only, never by clicking the DOM, so the automated run
// and the manual walk-through behave the same. Core file.
(function () {
  "use strict";
  const { html, hooks, useApp } = KIT;
  const { useEffect } = hooks;
  const { cx } = KIT.util;
  const { Icon, Button } = KIT.ui;

  const STEP_MS = 600;
  const root = document.documentElement;
  let token = 0; // bumped by every new run and by Stop; a queued step of an older run does nothing

  const find = (id) => (KIT.SCENARIOS || []).find((s) => s.id === id);

  // Navigate to a step's screen with the scenario's role kept.
  function show(api, step) {
    const go = step && step.go;
    if (Array.isArray(go) && go[0]) api.go(go[0], go[1] || {});
  }

  function run(api, id) {
    const sc = find(id);
    if (!sc) {
      KIT.stampErr("scenario " + id + ": not found");
      return;
    }
    if (!KIT.config().roles.some((r) => r.id === sc.role)) {
      KIT.stampErr("scenario " + id + ": unknown role " + sc.role);
      return;
    }
    const mine = ++token;
    root.dataset.scenario = "running";
    api.beginScenario(sc);
    const app = () => document.getElementById("app");
    const step = (i) => {
      if (token !== mine) return;
      const s = sc.steps[i];
      try {
        show(api, s);
      } catch (e) {
        KIT.stampErr(`scenario ${id} step ${i + 1}: ${(e && e.message) || e}`);
        api.setScenario({ playing: false });
        return;
      }
      api.setScenario({ n: i });
      setTimeout(() => {
        if (token !== mine) return;
        let found = true;
        if (s.expect) {
          try {
            found = !!app().querySelector(s.expect);
          } catch (e) {
            found = false;
          }
        }
        if (!found) {
          KIT.stampErr(`scenario ${id} step ${i + 1}: missing ${s.expect}`);
          api.setScenario({ playing: false });
          return;
        }
        if (i + 1 < sc.steps.length) step(i + 1);
        else {
          root.dataset.scenario = "done";
          api.setScenario({ playing: false });
        }
      }, STEP_MS);
    };
    if (sc.steps.length) step(0);
    else {
      root.dataset.scenario = "done";
      api.setScenario({ playing: false });
    }
  }

  function stop(api) {
    token++;
    if (root.dataset.scenario === "running") root.dataset.scenario = "stopped";
    api.setScenario({ playing: false });
  }

  // Fixed bottom-left panel: the scenario name, step n of N and its text; Stop while playing,
  // then Previous / Next / Close.
  function GuidePanel() {
    const A = useApp();
    const st = A.scenario;
    const sc = st && find(st.id);
    useEffect(() => {
      if (!sc) return undefined;
      const key = (e) => e.key === "Escape" && A.closeScenario();
      document.addEventListener("keydown", key);
      return () => document.removeEventListener("keydown", key);
    }, [!!sc]);
    if (!sc) return null;
    const n = Math.min(st.n, sc.steps.length - 1);
    const N = sc.steps.length;
    const move = (k) => {
      stop(KIT._api);
      show(KIT._api, sc.steps[k]);
      A.setScenario({ n: k });
    };
    return html`<section class=${cx("guide", A.layout !== "web" && A.layout !== "windows" && "guide-phone")} role="region" aria-label="Guided scenario" data-guide=${sc.id}>
      <div class="guide-h"><span class="guide-ic"><${Icon} n="route" s=${16} /></span>
        <div class="col grow minw0"><b class="t-h3 clamp1">${sc.name}</b><span class="t-meta">Step ${n + 1} of ${N}${st.playing ? " · playing" : ""}</span></div>
        <${Button} kind="ghost" size="sm" icon="x" label="Close scenario" onClick=${A.closeScenario} /></div>
      ${N > 0 && html`<p class="t-ui guide-txt">${sc.steps[n].text}</p>`}
      <div class="row gap-8">
        ${st.playing
          ? html`<${Button} size="sm" icon="stop" onClick=${() => stop(KIT._api)}>Stop<//>`
          : html`<${Button} size="sm" icon="left" disabled=${n === 0} onClick=${() => move(n - 1)}>Previous<//>
            <${Button} kind="primary" size="sm" iconRight="right" disabled=${n >= N - 1} onClick=${() => move(n + 1)}>Next<//>`}
      </div>
    </section>`;
  }

  KIT.scenario = { run, stop, GuidePanel, STEP_MS };
})();
