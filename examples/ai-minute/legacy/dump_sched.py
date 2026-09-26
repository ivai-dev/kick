# -*- coding: utf-8 -*-
"""Dump the simulated plan schedule, the same one build_plan.py writes as formulas.

    python dump_sched.py [sched.json]   # write {code: [start, end, workdays, effort, name_vi, role_vi]}
    python dump_sched.py --chains       # print each role's chain for phases 1-3

The JSON covers every level-1, level-2 and level-3 code. Groups (levels 1 and 2)
take the earliest start, the latest end and the sum of the level-3 effort, and
their role is "Cả đội". Management packages (QL_RATE) get the workbook's effort
formula: ROUND(workdays / 5 * rate, 1).
"""

import json
import math
import os
import sys
from datetime import date, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
MARKER = "# ---------------------------------------------------------------- styles"


def load_simulation():
    """Execute the part of build_plan.py before the styles marker and return its namespace."""
    sys.path.insert(0, HERE)
    argv = sys.argv
    sys.argv = ["build_plan.py", os.devnull]
    try:
        with open(os.path.join(HERE, "build_plan.py"), encoding="utf-8") as f:
            src = f.read().split(MARKER)[0]
        ns = {"__name__": "build_plan_sim"}
        exec(src, ns)
    finally:
        sys.argv = argv
    return ns


def num(x):
    x = round(x, 2)
    return int(x) if float(x).is_integer() else x


def build(ns):
    d, hol = ns["d"], set(ns["HOL"])
    S, E = ns["SIM_S"], ns["SIM_E"]

    def networkdays(a, b):
        n, cur = 0, a
        while cur <= b:
            if cur.weekday() < 5 and cur not in hol:
                n += 1
            cur += timedelta(days=1)
        return n

    def l3_entry(it):
        code, s, e = it[1], S[it[1]], E[it[1]]
        wd = networkdays(s, e)
        eff = math.floor(wd / 5 * d.QL_RATE[code] * 10 + 0.5 + 1e-9) / 10 if code in d.QL_RATE else it[8]
        return [s.isoformat(), e.isoformat(), wd, num(eff), it[2], d.ROLES[it[9]][0]]

    out = {}
    for ph in d.PHASES:
        items = d.W[ph[1]]
        l3 = {it[1]: l3_entry(it) for it in items if it[0] == "L3"}

        def group(code, name):
            members = [v for c, v in l3.items() if c.startswith(code + ".")]
            s, e = min(v[0] for v in members), max(v[1] for v in members)
            wd = networkdays(date.fromisoformat(s), date.fromisoformat(e))
            return [s, e, wd, num(sum(v[3] for v in members)), name, "Cả đội"]

        out[ph[1]] = group(ph[1], ph[2])
        for it in items:
            out[it[1]] = l3[it[1]] if it[0] == "L3" else group(it[1], it[2])
    return out


def print_chains(ns):
    chains, BY, S, E = ns["chains"], ns["BYCODE"], ns["SIM_S"], ns["SIM_E"]
    for role, ch in chains.items():
        print("==", role)
        for c in ch:
            if c.split(".")[0] in ("1", "2", "3"):
                it = BY[c]
                print(f"  {c:7} {S[c]} {E[c]} {it[8]:>5} {','.join(it[10]) or '-'}")


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ns = load_simulation()
    if "--chains" in sys.argv[1:]:
        print_chains(ns)
        return
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    path = args[0] if args else os.path.join(HERE, "sched.json")
    data = build(ns)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=0)
    print(f"{len(data)} codes -> {path}")


if __name__ == "__main__":
    main()
