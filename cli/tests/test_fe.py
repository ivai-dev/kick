import json
import shutil
import subprocess
from pathlib import Path

import pytest
from helpers import write_kickoff

from kickoff import fe
from kickoff.cli import main
from kickoff.model import load_project, load_state

MINI = Path(__file__).resolve().parents[2] / "examples" / "mini"


@pytest.fixture
def template(tmp_path, monkeypatch):
    """A small stand-in for templates/fe with the same layout."""
    t = tmp_path / "template"
    files = {
        "package.json": '{"name": "root"}\n',
        "pnpm-workspace.yaml": "packages: [apps/*, packages/*]\n",
        ".gitignore.kickoff": "node_modules\ndist\n",
        "apps/web/package.json": '{"name": "web"}\n',
        "apps/web/src/main.tsx": "// main\n",
        "apps/web/src/kickoff/config.ts": "// sample config\n",
        "apps/web/src/kickoff/screens.ts": "// sample screens\n",
        "apps/web/src/kickoff/scenarios.ts": "// sample scenarios\n",
        "apps/web/src/screens/sc-01.tsx": "// sample screen\n",
        "apps/web/node_modules/x/index.js": "// never copied\n",
        "packages/ui/src/button.tsx": "// button v1\n",
        "packages/kit/package.json": '{"name": "@kickoff/kit"}\n',
        "packages/kit/src/router.tsx": "// router v1\n",
        "packages/kit/MIGRATION.md": "# Migration\n\n- 0.5.0: first kit package\n",
    }
    for rel, text in files.items():
        (t / rel).parent.mkdir(parents=True, exist_ok=True)
        (t / rel).write_text(text, encoding="utf-8")
    monkeypatch.setenv("KICKOFF_FE_TEMPLATE", str(t))
    return t


@pytest.fixture
def mini(tmp_path):
    root = tmp_path / "mini"
    shutil.copytree(MINI / ".kickoff", root / ".kickoff")
    shutil.copytree(MINI / "docs", root / "docs")
    return root


# ---------------------------------------------------------------- ux-spec and generated files
def test_parse_ux_spec_reads_the_inventory():
    rows = fe.parse_ux_spec(MINI / "docs" / "05-design" / "ux-spec.md")
    assert [r["code"] for r in rows] == ["SC-01", "SC-02", "SC-03", "A-01"]
    assert rows[0]["roles"] == ["librarian", "admin"] and rows[3]["platform"] == "android"


def test_new_writes_the_template_and_the_generated_files(template, mini):
    assert main(["--root", str(mini), "fe", "new"]) == 0
    web = mini / "apps" / "web"
    assert (web / "src" / "main.tsx").exists() and (mini / "packages" / "kit" / "src" / "router.tsx").exists()
    assert not (web / "node_modules").exists()
    assert sorted(p.name for p in (web / "src" / "screens").iterdir()) == ["a-01.tsx", "sc-01.tsx", "sc-02.tsx",
                                                                          "sc-03.tsx"]
    assert (web / "src" / "screens" / "sc-01.tsx").read_text(encoding="utf-8") == fe.STUB_TSX
    config = (web / "src" / "kickoff" / "config.ts").read_text(encoding="utf-8")
    assert 'product: "Library Loans",' in config and 'releases: ["MVP", "R2"],' in config
    assert '{ id: "librarian", name: "Librarian", shell: "app", home: "sc-01" },' in config
    assert '{ id: "member", name: "Member", shell: "app", home: "a-01" },' in config
    assert 'defaultRole: "librarian",' in config
    screens = (web / "src" / "kickoff" / "screens.ts").read_text(encoding="utf-8")
    assert ('  { id: "sc-03", code: "SC-03", name: "Monthly report", roles: ["admin"], platforms: ["web"], '
            'rel: "R2", nav: "Monthly report", page: "data" },') in screens
    assert 'platforms: ["android"]' in screens
    assert "export const scenarios: Scenario[] = [];" in (web / "src" / "kickoff" / "scenarios.ts").read_text(
        encoding="utf-8")
    assert (mini / ".gitignore").read_text(encoding="utf-8") == "node_modules\ndist\n"


def test_force_keeps_the_generated_files_and_adds_new_screens(template, mini, capsys):
    assert main(["--root", str(mini), "fe", "new"]) == 0
    kickoff_dir = mini / "apps" / "web" / "src" / "kickoff"
    (kickoff_dir / "config.ts").write_text((kickoff_dir / "config.ts").read_text(encoding="utf-8")
                                           .replace('shell: "app", home: "a-01"', 'shell: "site", home: "a-01"'),
                                           encoding="utf-8")
    (kickoff_dir / "scenarios.ts").write_text("// the real journeys\n", encoding="utf-8")
    spec = mini / "docs" / "05-design" / "ux-spec.md"
    spec.write_text(spec.read_text(encoding="utf-8").replace(
        "| A-01  | My loans       | member            | android  | MVP     |",
        "| A-01  | My loans       | member            | android  | MVP     |\n| SC-04 | Fines | treasurer | web | R2 |"),
        encoding="utf-8")
    capsys.readouterr()
    assert main(["--root", str(mini), "fe", "new", "--force"]) == 0
    out = capsys.readouterr().out
    assert 'shell: "site", home: "a-01"' in (kickoff_dir / "config.ts").read_text(encoding="utf-8")
    assert (kickoff_dir / "scenarios.ts").read_text(encoding="utf-8") == "// the real journeys\n"
    screens = (kickoff_dir / "screens.ts").read_text(encoding="utf-8")
    assert screens.count('id: "sc-04"') == 1 and screens.rstrip().endswith("];")
    assert (mini / "apps" / "web" / "src" / "screens" / "sc-04.tsx").exists()
    assert "warn: role treasurer is in the ux-spec but not in apps/web/src/kickoff/config.ts" in out
    assert main(["--root", str(mini), "fe", "new", "--force"]) == 0
    assert (kickoff_dir / "screens.ts").read_text(encoding="utf-8").count('id: "sc-04"') == 1


@pytest.mark.parametrize(("rows", "message"), [
    ("| SC-01 | A | x | web | MVP |\n| sc 01 | B | x | web | MVP |", "both become the screen id 'sc-01'"),
    ("| --- x --- | A | x | web | MVP |\n| ! | B | x | web | MVP |", "has no usable ID"),
])
def test_new_refuses_colliding_or_empty_ids(template, tmp_path, capsys, rows, message):
    root = write_kickoff(tmp_path / "p")
    (root / "docs" / "05-design").mkdir(parents=True)
    (root / "docs" / "05-design" / "ux-spec.md").write_text(
        "| ID | Screen | Roles | Platform | Release |\n| -- | -- | -- | -- | -- |\n" + rows + "\n", encoding="utf-8")
    assert main(["--root", str(root), "fe", "new"]) == 2
    assert message in capsys.readouterr().err


def test_new_refuses_an_existing_app_and_force_keeps_project_files(template, mini, capsys):
    assert main(["--root", str(mini), "fe", "new"]) == 0
    button = mini / "packages" / "ui" / "src" / "button.tsx"
    button.write_text("// customised by the project\n", encoding="utf-8")
    stub = mini / "apps" / "web" / "src" / "screens" / "sc-02.tsx"
    stub.write_text("// the real loans screen\n", encoding="utf-8")
    router = mini / "packages" / "kit" / "src" / "router.tsx"
    router.write_text("// edited by mistake\n", encoding="utf-8")
    assert main(["--root", str(mini), "fe", "new"]) == 2
    assert "exists; use --force" in capsys.readouterr().err
    assert main(["--root", str(mini), "fe", "new", "--force"]) == 0
    assert button.read_text(encoding="utf-8") == "// customised by the project\n"
    assert stub.read_text(encoding="utf-8") == "// the real loans screen\n"
    assert router.read_text(encoding="utf-8") == "// router v1\n"
    assert (mini / ".gitignore").read_text(encoding="utf-8").count("node_modules") == 1


def test_new_without_screens_is_refused(template, tmp_path, capsys):
    root = write_kickoff(tmp_path / "p")
    (root / "docs" / "05-design").mkdir(parents=True)
    (root / "docs" / "05-design" / "ux-spec.md").write_text("# UX\n\nNo inventory yet.\n", encoding="utf-8")
    assert main(["--root", str(root), "fe", "new"]) == 2
    assert "no screens found" in capsys.readouterr().err


# ---------------------------------------------------------------- update
def test_update_replaces_only_the_kit_package(template, mini, capsys):
    assert main(["--root", str(mini), "fe", "new"]) == 0
    (template / "packages" / "kit" / "src" / "router.tsx").write_text("// router v2\n", encoding="utf-8")
    (template / "packages" / "kit" / "src" / "rel.tsx").write_text("// new\n", encoding="utf-8")
    (mini / "packages" / "kit" / "src" / "old.tsx").write_text("// gone in v2\n", encoding="utf-8")
    (template / "packages" / "ui" / "src" / "button.tsx").write_text("// button v2\n", encoding="utf-8")
    capsys.readouterr()
    assert main(["--root", str(mini), "fe", "update", "--dry"]) == 0
    out = capsys.readouterr().out
    assert "would be updated: packages" in out and "would be added:" in out and "would be removed:" in out
    assert (mini / "packages" / "kit" / "src" / "router.tsx").read_text(encoding="utf-8") == "// router v1\n"
    assert main(["--root", str(mini), "fe", "update"]) == 0
    out = capsys.readouterr().out
    assert "migration: 0.5.0: first kit package" in out
    assert (mini / "packages" / "kit" / "src" / "router.tsx").read_text(encoding="utf-8") == "// router v2\n"
    assert (mini / "packages" / "kit" / "src" / "rel.tsx").exists()
    assert not (mini / "packages" / "kit" / "src" / "old.tsx").exists()
    assert (mini / "packages" / "ui" / "src" / "button.tsx").read_text(encoding="utf-8") == "// button v1\n"


# ---------------------------------------------------------------- check
def manifest_for(codes, roles=None, rel="MVP"):
    return {"screens": [{"id": c.lower(), "code": c, "roles": (roles or {}).get(c, ["librarian"]), "platforms": ["web"],
                         "rel": rel} for c in codes], "scenarios": []}


def test_coverage_reports_missing_extra_and_mismatched_screens():
    rows = fe.parse_ux_spec(MINI / "docs" / "05-design" / "ux-spec.md")
    manifest = manifest_for(["SC-01", "SC-02", "SC-03", "X-99"], roles={"SC-01": ["librarian", "admin"],
                                                                        "SC-03": ["admin"]})
    out = fe.coverage(rows, manifest)
    assert "coverage: A-01 in ux-spec but not registered" in out
    assert "coverage: X-99 registered but not in ux-spec" in out
    assert "coverage: SC-03 release 'MVP' differs from the ux-spec 'R2'" in out
    assert not any("SC-01" in line for line in out)


class FakeRun:
    def __init__(self, fail=None, output="", manifest=None):
        self.fail, self.output, self.manifest, self.calls = fail or {}, output, manifest, []

    def __call__(self, argv, cwd, env=None, **kw):
        script = "detect" if "detect" in argv else argv[-1]
        self.calls.append((script, (env or {}).get("PW_CHANNEL")))
        kw.pop("stdin", None), kw.pop("timeout", None)
        if script == "manifest":
            return subprocess.CompletedProcess(argv, 0, json.dumps(self.manifest), "")
        code = self.fail.get(script, 0)
        return subprocess.CompletedProcess(argv, code, self.output if code else "", "")


@pytest.fixture
def ready(template, mini, monkeypatch):
    assert main(["--root", str(mini), "fe", "new"]) == 0
    (mini / "node_modules").mkdir()
    monkeypatch.setattr(fe.shutil, "which", lambda name: "/usr/bin/pnpm" if name == "pnpm" else None)
    monkeypatch.setenv("PW_CHANNEL", "chromium")
    monkeypatch.setenv("KICKOFF_IMPECCABLE", "impeccable-fake")
    return mini


ALL = ["SC-01", "SC-02", "SC-03", "A-01"]
ROLES = {"SC-01": ["librarian", "admin"], "SC-03": ["admin"], "A-01": ["member"]}


def full_manifest():
    m = manifest_for(ALL, roles=ROLES)
    m["screens"][2]["rel"] = "R2"
    return m


def test_check_runs_every_script_then_coverage(ready, tmp_path):
    run = FakeRun(manifest=full_manifest())
    assert fe.check(ready, load_project(ready), run=run) == []
    seen = {}
    fe.check(ready, load_project(ready), run=lambda argv, cwd, env=None, **kw: seen.setdefault(argv[-1], env) and None
             or FakeRun(manifest=full_manifest())(argv, cwd, env), shots=tmp_path / "shots")
    assert seen["e2e"]["KICKOFF_SHOTS"] == str((tmp_path / "shots").resolve())
    assert [c[0] for c in run.calls] == ["typecheck", "lint", "test", "build", "e2e", "manifest", "detect"]
    assert run.calls[4][1] == "chromium"


def test_check_reports_a_failing_script_with_its_output(ready):
    run = FakeRun(fail={"lint": 1}, output="src/a.tsx\n  3:1  error  raw hex colour  kickoff/no-raw-hex\n",
                  manifest=full_manifest())
    failures = fe.check(ready, load_project(ready), run=run)
    assert failures[0].startswith("lint: failed (exit 1)") and "kickoff/no-raw-hex" in failures[0]


def test_skip_e2e_and_a_missing_browser(ready):
    run = FakeRun(manifest=full_manifest())
    fe.check(ready, load_project(ready), skip_e2e=True, run=run)
    assert "e2e" not in [c[0] for c in run.calls]
    run = FakeRun(fail={"e2e": 1}, output="browserType.launch: Executable doesn't exist at /ms-playwright/chromium",
                  manifest=full_manifest())
    with pytest.raises(fe.ToolMissing, match="no browser"):
        fe.check(ready, load_project(ready), run=run)


def test_a_missing_browser_keeps_the_failures_already_found(ready):
    run = FakeRun(fail={"lint": 1, "e2e": 1}, output="browserType.launch: Executable doesn't exist",
                  manifest=full_manifest())
    failures = fe.check(ready, load_project(ready), run=run)
    assert failures[0].startswith("lint: failed") and failures[1].startswith("e2e: skipped (no browser")


def test_the_detector_runs_on_the_project_ui_code(ready, monkeypatch):
    calls = []

    def run(argv, cwd, env=None, **kw):
        if "detect" in argv:
            calls.append((argv, env))
            return subprocess.CompletedProcess(argv, 2, "", "apps/web/src/screens/sc-01.tsx:4 side-tab border\n")
        return FakeRun(manifest=full_manifest())(argv, cwd, env, **kw)

    failures = fe.check(ready, load_project(ready), run=run)
    assert failures[0].startswith("detect: impeccable found AI-default patterns") and "side-tab" in failures[0]
    argv, env = calls[0]
    assert argv[:2] == ["impeccable-fake", "detect"] and argv[2:] == ["apps/web/src", "packages/ui/src"]
    assert env["IMPECCABLE_NO_TELEMETRY"] == "1"
    calls.clear()
    assert fe.check(ready, load_project(ready), run=run, skip_detect=True) == [] and calls == []


def test_a_missing_detector_is_a_failure_unless_skipped(ready, monkeypatch):
    monkeypatch.delenv("KICKOFF_IMPECCABLE")
    monkeypatch.setattr(fe.design, "detector", lambda project=None: None)
    failures = fe.check(ready, load_project(ready), run=FakeRun(manifest=full_manifest()))
    assert failures == ["detect: impeccable's detector not found; install impeccable (kickoff design doctor), "
                        "or pass --skip-detect (reported as skipped)"]


def test_directions_need_their_css_and_a_lock_after_the_phase(ready):
    styles = ready / "apps" / "web" / "src" / "styles"
    manifest = {**full_manifest(), "directions": ["ledger", "harbour"], "direction": None}
    run = FakeRun(manifest=manifest)
    (styles / "directions").mkdir(parents=True)
    (styles / "directions" / "ledger.css").write_text(':root[data-direction="ledger"] { --brand-h: 30; }\n',
                                                      encoding="utf-8")
    (styles / "directions.css").write_text('@import "./directions/ledger.css";\n', encoding="utf-8")
    failures = fe.check(ready, load_project(ready), run=run, need_lock=True)
    assert failures == [
        'direction ledger: apps/web/src/styles/directions/ledger.css has no dark block '
        '(:root[data-direction="ledger"][data-theme="dark"])',
        "direction harbour: missing apps/web/src/styles/directions/harbour.css",
        "direction: kickoff:design-direction is done but none is locked; set `direction` in "
        "apps/web/src/kickoff/config.ts to the direction the customer approved (gate CD)",
    ]
    (styles / "directions" / "ledger.css").write_text(
        ':root[data-direction="ledger"] { --brand-h: 30; }\n'
        ':root[data-direction="ledger"][data-theme="dark"] { --brand-h: 30; }\n', encoding="utf-8")
    locked = FakeRun(manifest={**full_manifest(), "directions": ["ledger"], "direction": "ledger"})
    assert fe.check(ready, load_project(ready), run=locked, need_lock=True) == []


def test_a_dark_block_must_repeat_the_light_variables_and_comments_do_not_count(ready):
    styles = ready / "apps" / "web" / "src" / "styles"
    (styles / "directions").mkdir(parents=True)
    (styles / "directions" / "ledger.css").write_text(
        '/* :root[data-direction="ledger"][data-theme="dark"] { --radius: 0; } */\n'
        ':root[data-direction="ledger"] { --brand-h: 30; --radius: 0.25rem; }\n'
        ':root[data-direction="ledger"][data-theme="dark"] { --brand-h: 30; }\n', encoding="utf-8")
    (styles / "directions.css").write_text('/* @import "./directions/ledger.css"; */\n', encoding="utf-8")
    run = FakeRun(manifest={**full_manifest(), "directions": ["ledger"], "direction": "ledger"})
    assert fe.check(ready, load_project(ready), run=run) == [
        'direction ledger: the dark block (:root[data-direction="ledger"][data-theme="dark"]) lacks --radius',
        "direction ledger: not imported in apps/web/src/styles/directions.css",
    ]


def test_a_detector_that_cannot_start_is_a_failure_not_a_crash(ready):
    def run(argv, cwd, env=None, **kw):
        if "detect" in argv:
            raise FileNotFoundError(2, "No such file or directory")
        return FakeRun(manifest=full_manifest())(argv, cwd, env, **kw)

    failures = fe.check(ready, load_project(ready), run=run)
    assert failures == ["detect: could not run impeccable-fake: [Errno 2] No such file or directory"]


def test_the_sweep_runs_in_a_chosen_direction(ready):
    seen = {}

    def run(argv, cwd, env=None, **kw):
        seen.setdefault(argv[-1], env)
        return FakeRun(manifest={**full_manifest(), "directions": [], "direction": None})(argv, cwd, env, **kw)

    failures = fe.check(ready, load_project(ready), run=run, direction="ledger")
    assert seen["e2e"]["KICKOFF_DIRECTION"] == "ledger"
    assert failures == ["direction ledger: not in config.ts directions"]


def test_a_hung_script_times_out(ready):
    def run(argv, cwd, **kw):
        assert kw["stdin"] is subprocess.DEVNULL and kw["timeout"] == fe.TIMEOUT
        if argv[-1] == "build":
            raise subprocess.TimeoutExpired(argv, fe.TIMEOUT)
        return FakeRun(manifest=full_manifest())(argv, cwd, **kw)

    failures = fe.check(ready, load_project(ready), run=run)
    assert failures == [f"build: failed (exit 124)\n    timed out after {fe.TIMEOUT} s"]


def test_forbidden_scan_skips_builds_and_refuses_bad_patterns(ready):
    (ready / "apps" / "web" / "dist").mkdir(parents=True)
    (ready / "apps" / "web" / "dist" / "x.js").write_text("VPN", encoding="utf-8")
    (ready / "packages" / "ui" / "node_modules" / "y").mkdir(parents=True)
    (ready / "packages" / "ui" / "node_modules" / "y" / "z.js").write_text("VPN", encoding="utf-8")
    assert fe.scan_forbidden(ready, load_project(ready)) == []
    project = load_project(ready)
    project.fe["forbidden"] = ["(oops"]
    with pytest.raises(fe.FeError, match="invalid regular expression"):
        fe.scan_forbidden(ready, project)


def test_check_needs_pnpm_and_installed_dependencies(ready, monkeypatch):
    shutil.rmtree(ready / "node_modules")
    assert fe.check(ready, load_project(ready), run=FakeRun()) == ["dependencies: not installed; run: pnpm install"]
    monkeypatch.setattr(fe.shutil, "which", lambda name: None)
    with pytest.raises(fe.ToolMissing, match="pnpm not found"):
        fe.check(ready, load_project(ready), run=FakeRun())


def test_check_scans_forbidden_text(ready):
    (ready / "apps" / "web" / "src" / "data.ts").write_text("export const host = 'corp VPN gateway';\n",
                                                           encoding="utf-8")
    failures = fe.check(ready, load_project(ready), run=FakeRun(manifest=full_manifest()))
    assert failures == ["forbidden: apps/web/src/data.ts:1: /\\bVPN\\b/"]


@pytest.mark.parametrize(("result", "code", "line"), [
    ([], 0, "fe check passed"),
    (["lint: failed (exit 1)"], 1, "1 failures"),
])
def test_check_command_exit_codes(mini, monkeypatch, capsys, result, code, line):
    monkeypatch.setattr("kickoff.commands.fe_cmd.check", lambda root, project, **kw: result)
    assert main(["--root", str(mini), "fe", "check"]) == code
    assert line in capsys.readouterr().out


def test_check_command_exit_4_when_skipped(mini, monkeypatch, capsys):
    def missing(root, project, **kw):
        raise fe.ToolMissing("pnpm not found")

    monkeypatch.setattr("kickoff.commands.fe_cmd.check", missing)
    assert main(["--root", str(mini), "fe", "check"]) == 4
    assert "check skipped, not passed" in capsys.readouterr().out


# ---------------------------------------------------------------- bundle and record
def test_bundle_returns_the_single_file(ready):
    out = ready / "apps" / "web" / "dist-artifact" / "index.html"

    def run(argv, cwd, **kw):
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text("<!doctype html>", encoding="utf-8")
        return subprocess.CompletedProcess(argv, 0, "", "")

    assert fe.bundle(ready, load_project(ready), run=run) == out


def test_record_counts_versions_up(tmp_path, capsys):
    root = write_kickoff(tmp_path)
    assert main(["--root", str(root), "fe", "record", "--artifact", "https://claude.ai/artifact/abc"]) == 0
    assert main(["--root", str(root), "fe", "record", "--artifact", "https://claude.ai/artifact/abc"]) == 0
    assert load_state(root)["prototype"] == {"artifact": "https://claude.ai/artifact/abc", "version": 2}
    assert main(["--root", str(root), "fe", "record", "--artifact", "x", "--version", "1"]) == 2
    assert "lower than the recorded version 2" in capsys.readouterr().err
