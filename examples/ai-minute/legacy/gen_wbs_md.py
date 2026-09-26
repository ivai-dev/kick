# -*- coding: utf-8 -*-
import json
import sys
from datetime import datetime

sys.path.insert(0, sys.argv[1])
import plan_data as d  # noqa: E402
import tickets_en as t  # noqa: E402

S = json.load(open(sys.argv[2], encoding="utf-8"))
OUT = sys.argv[3]


def dd(iso):
    return datetime.strptime(iso, "%Y-%m-%d").strftime("%d/%m/%Y")


PH_EN = {"0": "GĐ0 Initiation (done)", "1": "GĐ1 Preparation and technical validation", "2": "GĐ2 Build the web MVP",
         "3": "GĐ3 UAT and MVP acceptance", "4": "GĐ4 Pilot and stabilization", "5": "GĐ5 Windows and Android apps",
         "6": "GĐ6 Release 2", "7": "GĐ7 Release 3", "8": "GĐ8 Rollout and handover", "9": "GĐ9 Warranty (12 months)",
         "10": "QL Project management (throughout)"}
GRP_EN = {"1.1": "Test data and ASR model selection", "1.2": "Requirements, architecture and design", "1.3": "Technical foundation",
          "1.4": "Gate G1", "2.1": "Build batch 1 – web recording and live transcript", "2.2": "Build batch 2 – minutes end to end",
          "2.3": "Build batch 3 – completion and packaging", "2.4": "Stabilization and release candidate", "3.1": "UAT preparation",
          "3.2": "UAT and acceptance"}
GATE_EN = {"G1": "Technical and scope decisions", "G2": "Demo: web recording and live transcript", "G3": "Demo: full critical journey",
           "G4": "Release candidate", "G5": "MVP acceptance", "G6": "End of pilot", "G7": "Windows and Android apps released",
           "G8": "Release 2 acceptance", "G9": "Release 3 acceptance", "G10": "Final acceptance and handover", "G11": "End of warranty"}

role_of = {}
eff_by_phase_role = {}
for ph in d.PHASES:
    for it in d.W[ph[1]]:
        if it[0] == "L3":
            role = t.ROLE_EN[d.ROLES[it[9]][0]]
            role_of[it[1]] = role
            key = (ph[1], role)
            eff_by_phase_role[key] = eff_by_phase_role.get(key, 0) + (S[it[1]][3] or 0)

L = []
L.append("# Work Breakdown Structure\n")
L.append("Status: v2.0 — 2026-09-25. The master WBS and schedule is the Vietnamese workbook `ke-hoach-tong-the-ai-minute.xlsx` "
         f"({sum(1 for c in S if c.count('.') == 2)} level-3 work packages for the whole project). This page is generated from it; when the two differ, the workbook wins.\n")
L.append("## Basis\n")
L.append("- **Scope:** MVP is web first (no separate spikes); Windows and Android apps follow in GĐ5 and are the recommended way to record in the final product (ADR-001).")
L.append("- **Team:** three people, one per role — project lead (management, architecture, backend, ASR/LLM, server deployment), full-stack developer, QA. Warranty: project lead.")
L.append("- **Effort:** estimated working days per package, including detailed design, tests and documentation.")
L.append("- **Scheduling:** each role works its packages one after another; a package starts when the packages it depends on are finished. The project lead spends 80% of the time on project work (20% management), the developer and QA 90%. Durations are rounded to whole working days; Vietnamese public holidays are excluded.")
L.append("- Estimates from GĐ5 onwards are preliminary (±30%) and are re-estimated at the start of each phase.\n")
L.append("## Summary by phase\n")
L.append("| Phase | Start | End | Project lead | Developer | QA | Total effort (d) | Gate |")
L.append("| --- | --- | --- | --- | --- | --- | --- | --- |")
PH_GATE_EN = {"1": "G1", "2": "G2, G3, G4", "3": "**G5 MVP acceptance**", "4": "G6", "5": "G7", "6": "G8", "7": "G9", "8": "G10", "9": "G11"}
tot = {"Project lead": 0, "Developer": 0, "QA": 0}
for ph in d.PHASES:
    code = ph[1]
    s, e = S[code][0], S[code][1]
    vals = [eff_by_phase_role.get((code, r), 0) for r in ("Project lead", "Developer", "QA")]
    for r, v in zip(("Project lead", "Developer", "QA"), vals):
        tot[r] += v
    fmt = lambda v: f"{v:g}" if v else "—"
    L.append(f"| {PH_EN[code]} | {dd(s)} | {dd(e)} | {fmt(vals[0])} | {fmt(vals[1])} | {fmt(vals[2])} | {S[code][3]:g} | {PH_GATE_EN.get(code, '—')} |")
L.append(f"| **Total** | | | {tot['Project lead']:g} | {tot['Developer']:g} | {tot['QA']:g} | **{sum(tot.values()):g}** | |\n")
L.append("## Gates\n")
L.append("| Gate | Date | WBS |")
L.append("| --- | --- | --- |")
for g, code in d.GATE_WBS.items():
    L.append(f"| {g} {GATE_EN[g]} | {dd(S[code][1])} | {code} |")
L.append("")
L.append(f"MVP target: before December 2026 (27/11/2026). Planned MVP acceptance: **{dd(S['3'][1])}**.\n")
L.append("## MVP work packages\n")
for ph_code in ("1", "2", "3"):
    L.append(f"### {PH_EN[ph_code]} ({dd(S[ph_code][0])} – {dd(S[ph_code][1])})\n")
    for it in d.W[ph_code]:
        if it[0] == "L2":
            L.append(f"\n**{it[1]} {GRP_EN[it[1]]}** ({dd(S[it[1]][0])} – {dd(S[it[1]][1])})\n")
            L.append("| WBS | Work package | Role | Effort (d) | Planned | Depends on |")
            L.append("| --- | --- | --- | --- | --- | --- |")
        else:
            code = it[1]
            title = t.T[code][0]
            deps = ", ".join(it[10]) if it[10] else "—"
            L.append(f"| {code} | {title} | {role_of[code]} | {it[8]:g} | {dd(S[code][0])} – {dd(S[code][1])} | {deps} |")
    L.append("")
L.append("## After the MVP\n")
L.append("Phases GĐ4–GĐ9 and project management are broken down in the workbook (sheet WBS). Main contents:\n")
L.append("- **GĐ4 Pilot:** 2–3 units on the web version, on-site support, metrics, release 1.1.")
L.append("- **GĐ5 Apps:** Windows app (Electron: main-process recorder, encrypted local storage, signed installer, auto-update) and Android app (Capacitor + Kotlin foreground-service recorder, Keystore encryption, APK distribution); reliability matrices; release 1.5.")
L.append("- **GĐ6 Release 2:** speaker identification, several recording devices, external microphones, scheduling, rooms, meeting classification and access rules, unit and system administration screens (6.5), statistics, periodic reports and the notification center, retention, full-text search, dark theme.")
L.append("- **GĐ7 Release 3:** SSO, recurring meetings, Khmer and translation, semantic search and Q&A over the minutes archive, multi-server deployment and high availability, security testing.")
L.append("- **GĐ8 Rollout and handover**, **GĐ9 Warranty** (12 months).\n")
L.append("## Scope-cut order if the MVP slips\n")
L.append("1. F2.10 scripts are already minimal; next cut: F6.13 mobile web view.")
L.append("2. F9.6 monitoring reduced to health checks.")
L.append("3. F5.3 second recognition pass (keep batch transcription).")
L.append("4. F10.3 automated end-to-end tests reduced to smoke tests.\n")
L.append("Web recording with recovery (F4.5, F4.6), live transcript (F5.1, F5.6), minutes generation, edit and export (F6.2, F6.4, F6.7) and the offline install (F9.3) are never cut.")
open(OUT, "w", encoding="utf-8", newline="\n").write("\n".join(L) + "\n")
print("written", OUT)
