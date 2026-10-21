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
        script = argv[-1]
        self.calls.append((script, (env or {}).get("PW_CHANNEL")))
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
    return mini


ALL = ["SC-01", "SC-02", "SC-03", "A-01"]
ROLES = {"SC-01": ["librarian", "admin"], "SC-03": ["admin"], "A-01": ["member"]}


def full_manifest():
    m = manifest_for(ALL, roles=ROLES)
    m["screens"][2]["rel"] = "R2"
    return m


def test_check_runs_every_script_then_coverage(ready):
    run = FakeRun(manifest=full_manifest())
    assert fe.check(ready, load_project(ready), run=run) == []
    assert [c[0] for c in run.calls] == ["typecheck", "lint", "test", "build", "e2e", "manifest"]
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
    monkeypatch.setattr("kickoff.commands.fe_cmd.check", lambda root, project, skip_e2e=False: result)
    assert main(["--root", str(mini), "fe", "check"]) == code
    assert line in capsys.readouterr().out


def test_check_command_exit_4_when_skipped(mini, monkeypatch, capsys):
    def missing(root, project, skip_e2e=False):
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
