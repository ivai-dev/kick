import re
import shutil
from pathlib import Path

import pytest

import kickoff
from kickoff.model import load_project
from kickoff.proto import (
    KIT_DIR,
    _route_spec,
    bundle,
    check,
    find_browser,
    lint,
    new_prototype,
    parse_ux_spec,
    update_prototype,
)

MINI = Path(__file__).resolve().parents[2] / "examples" / "mini"
BROWSER = find_browser(load_project(MINI))
browser = pytest.mark.skipif(BROWSER is None, reason="no Edge or Chrome")


def test_parse_ux_spec():
    rows = parse_ux_spec(MINI / "docs" / "05-design" / "ux-spec.md")
    assert [r["code"] for r in rows] == ["SC-01", "SC-02", "SC-03", "A-01"]
    assert rows[0]["roles"] == ["librarian", "admin"]
    assert rows[3]["platform"] == "android"


def copy_mini(tmp_path):
    root = tmp_path / "mini"
    shutil.copytree(MINI / ".kickoff", root / ".kickoff")
    shutil.copytree(MINI / "docs" / "05-design", root / "docs" / "05-design", ignore=shutil.ignore_patterns("prototype"))
    return root


def test_new_prototype_scaffolds_stubs(tmp_path):
    root = copy_mini(tmp_path)
    written = new_prototype(root, load_project(root))
    proto = root / "docs" / "05-design" / "prototype"
    assert (proto / "index.html") in written
    screens = (proto / "js" / "screens.js").read_text(encoding="utf-8")
    assert 'KIT.register("sc-01"' in screens and 'code: "SC-01"' in screens and "KIT.ui.Placeholder" in screens
    assert 'roles: ["member"]' in screens
    html = (proto / "index.html").read_text(encoding="utf-8")
    block = html.split("<!-- kickoff:modules:begin -->")[1].split("<!-- kickoff:modules:end -->")[0]
    assert block.count("<script") == 4
    with pytest.raises(Exception, match="exists"):
        new_prototype(root, load_project(root))


def set_ui_language(root, lang):
    path = root / ".kickoff" / "project.yaml"
    path.write_text(path.read_text(encoding="utf-8").replace("  ui: en", f"  ui: {lang}"), encoding="utf-8")


def test_new_prototype_writes_locale_language_and_shell(tmp_path):
    root = copy_mini(tmp_path)
    set_ui_language(root, "vi")
    new_prototype(root, load_project(root))
    proto = root / "docs" / "05-design" / "prototype"
    config = (proto / "js" / "config.js").read_text(encoding="utf-8")
    assert 'locale: "vi-VN"' in config and 'lang: "vi"' in config and 'shell: "app"' in config
    tokens = (proto / "index.html").read_text(encoding="utf-8").split("/* kickoff:tokens:begin */")[1].split("/* kickoff:tokens:end */")[0]
    assert "--cap-case: none" in tokens


def test_update_prototype_refreshes_core_and_keeps_project_files(tmp_path):
    root = tmp_path / "mini"
    shutil.copytree(MINI, root)
    proto = root / "docs" / "05-design" / "prototype"
    index = proto / "index.html"
    page = index.read_text(encoding="utf-8")
    custom = page.replace("/* kickoff:tokens:end */", "/* project marker */\n/* kickoff:tokens:end */")
    custom = custom.replace("table{color:inherit}", "table{color:red}")  # a stale core rule outside the blocks
    index.write_text(custom, encoding="utf-8")
    (proto / "js" / "shell.js").write_text("// stale kit core\n", encoding="utf-8")
    screens_before = (proto / "js" / "screens.js").read_bytes()

    dry = update_prototype(root, load_project(root), dry=True)
    assert ("js/shell.js", "updated") in dry and ("index.html", "updated") in dry
    assert (proto / "js" / "shell.js").read_text(encoding="utf-8") == "// stale kit core\n"

    changes = update_prototype(root, load_project(root))
    assert changes == dry
    assert (proto / "js" / "shell.js").read_bytes() == (KIT_DIR / "js" / "shell.js").read_bytes()
    after = index.read_text(encoding="utf-8")
    assert "/* project marker */" in after and "table{color:red}" not in after
    assert after.split("<!-- kickoff:modules:begin -->")[1] == page.split("<!-- kickoff:modules:begin -->")[1]
    assert (proto / "js" / "screens.js").read_bytes() == screens_before
    assert update_prototype(root, load_project(root)) == []


def test_update_prototype_needs_a_prototype(tmp_path):
    root = copy_mini(tmp_path)
    with pytest.raises(Exception, match="no prototype"):
        update_prototype(root, load_project(root))


def test_route_spec_reads_roles_and_parameters():
    screens = [{"id": "sc-01", "code": "SC-01", "roles": ["librarian", "admin"]}, {"id": "a-01", "code": "A-01", "roles": ["member"]}]
    assert _route_spec("sc-01", screens) == {"id": "sc-01", "role": "librarian", "query": "", "label": "sc-01"}
    assert _route_spec("SC-01-admin", screens)["role"] == "admin"
    spec = _route_spec("sc-01-admin-dark?kiosk=1&id=b7", screens)
    assert spec == {"id": "sc-01", "role": "admin", "query": "kiosk=1&id=b7", "label": "sc-01-admin-dark-kiosk-1-id-b7"}
    assert _route_spec("a-01-librarian", screens)["role"] == "member"
    assert _route_spec("sc-09", screens) is None


def test_lint_flags_missing_locale(tmp_path):
    root = tmp_path / "mini"
    shutil.copytree(MINI, root)
    set_ui_language(root, "vi")
    _, failures = lint(root, load_project(root))
    assert any(f.startswith("locale:") and "vi-VN" in f for f in failures)
    config = root / "docs" / "05-design" / "prototype" / "js" / "config.js"
    config.write_text(config.read_text(encoding="utf-8").replace("window.KIT_CONFIG = {", 'window.KIT_CONFIG = {\n  locale: "vi-VN",'), encoding="utf-8")
    _, failures = lint(root, load_project(root))
    assert not any(f.startswith("locale:") for f in failures)


def test_cli_update_dry_lists_changes(tmp_path, capsys):
    from kickoff.cli import main

    root = tmp_path / "mini"
    shutil.copytree(MINI, root)
    (root / "docs" / "05-design" / "prototype" / "js" / "ui.js").write_text("// stale\n", encoding="utf-8")
    assert main(["--root", str(root), "proto", "update", "--dry"]) == 0
    assert "would update: js/ui.js" in capsys.readouterr().out
    assert main(["--root", str(MINI), "proto", "update", "--dry"]) == 0
    assert "kit core up to date" in capsys.readouterr().out


def test_kit_ships_inside_the_package():
    assert (KIT_DIR / "index.html").is_file()
    assert KIT_DIR.resolve().is_relative_to(Path(kickoff.__file__).resolve().parent)


def kit_css() -> str:
    page = (KIT_DIR / "index.html").read_text(encoding="utf-8")
    return page.split("<style>", 1)[1].split("</style>", 1)[0]


def test_kit_loads_inter_variable():
    page = (KIT_DIR / "index.html").read_text(encoding="utf-8")
    link = next(line for line in page.splitlines() if 'id="kit-fonts"' in line)
    assert "Inter:opsz,wght@14..32,400..700" in link and "display=swap" in link


def test_kit_pins_web_awesome():
    page = (KIT_DIR / "index.html").read_text(encoding="utf-8")
    core = (KIT_DIR / "js" / "core.js").read_text(encoding="utf-8")
    version = re.search(r'name: "@awesome\.me/webawesome", version: "([\d.]+)"', core).group(1)
    assert version == "3.14.0"
    urls = re.findall(r"https://cdn\.jsdelivr\.net/npm/@awesome\.me/webawesome@([^/\"']+)/", page)
    assert len(urls) >= 2 and set(urls) == {version}
    for banned in ("webawesome.css", "native.css", "autoloader", "webawesome-pro", "kit.webawesome.com"):
        assert banned not in page, banned
    assert "window.KIT_LIB" in page


def test_kit_has_foundation_tokens():
    css = kit_css()
    for mode in ("compact", "comfortable", "touch", "kiosk"):
        start = css.index(f'[data-density="{mode}"])')
        block = css[start : css.index("}", start)]
        for token in ("--ctl-h:", "--t-body:", "--row-h:", "--section-gap:"):
            assert token in block, (mode, token)
    assert css.index("/* kickoff:tokens:end */") < css.index(":where([data-density=\"compact\"])")
    assert not re.search(r"font-weight\s*:\s*800", css)
    assert not re.search(r"line-height\s*:\s*1\s*;", css)


def test_mini_prototype_core_matches_the_kit():
    proto = MINI / "docs" / "05-design" / "prototype"
    names = ("route", "logic", "core", "ui", "charts", "scope", "shell", "scenario", "audit", "main")
    for name in ["narrow.html", *(f"js/{n}.js" for n in names)]:
        assert (proto / name).read_bytes() == (KIT_DIR / name).read_bytes(), name


def test_bundle_inlines_project_scripts(tmp_path):
    out = bundle(MINI, load_project(MINI), tmp_path / "prototype.html")
    html = out.read_text(encoding="utf-8")
    assert 'src="js/' not in html and "https://cdn.jsdelivr.net/npm/preact@10.24.3" in html
    assert 'KIT.register("sc-01"' in html
    assert not html.lstrip().lower().startswith(("<!doctype", "<html"))


def test_bundle_and_new_write_lf_line_endings(tmp_path):
    out = bundle(MINI, load_project(MINI), tmp_path / "prototype.html")
    assert b"\r" not in out.read_bytes()
    root = copy_mini(tmp_path)
    for path in new_prototype(root, load_project(root)):
        if path.suffix in (".js", ".html"):
            assert b"\r" not in path.read_bytes(), path.name


def test_lint_mini_passes():
    metrics, failures = lint(MINI, load_project(MINI))
    assert failures == []
    assert metrics["raw_hex"] == 0


def test_lint_flags_forbidden_and_hex(tmp_path):
    root = tmp_path / "mini"
    shutil.copytree(MINI, root)
    data = root / "docs" / "05-design" / "prototype" / "js" / "data.js"
    data.write_text(data.read_text(encoding="utf-8") + '\nconst x = "Join the VPN"; const c = "#ff0000";\n', encoding="utf-8")
    _, failures = lint(root, load_project(root))
    assert any("forbidden" in f and "VPN" in f for f in failures)
    assert any("raw hex" in f for f in failures)


def test_cli_check_exits_4_without_a_browser(monkeypatch, capsys):
    from kickoff.cli import main

    monkeypatch.setattr("kickoff.proto.find_browser", lambda project: None)
    assert main(["--root", str(MINI), "proto", "check"]) == 4
    assert "no Edge or Chrome" in capsys.readouterr().out


def test_cli_lint_exit_codes(tmp_path, capsys):
    from kickoff.cli import main

    assert main(["--root", str(MINI), "proto", "lint"]) == 0
    root = tmp_path / "mini"
    shutil.copytree(MINI, root)
    data = root / "docs" / "05-design" / "prototype" / "js" / "data.js"
    data.write_text(data.read_text(encoding="utf-8") + '\nconst c = "#ff0000";\n', encoding="utf-8")
    assert main(["--root", str(root), "proto", "lint"]) == 1
    assert "raw hex colour #ff0000 in js/data.js" in capsys.readouterr().out


@pytest.mark.browser
@browser
def test_check_mini_passes():
    assert check(MINI, load_project(MINI)) == []


@pytest.mark.browser
@browser
def test_check_new_stubs_pass(tmp_path):
    root = copy_mini(tmp_path)
    new_prototype(root, load_project(root))
    assert check(root, load_project(root)) == []


@pytest.mark.browser
@browser
def test_check_site_shell_and_parameter_routes(tmp_path):
    root = tmp_path / "mini"
    shutil.copytree(MINI, root)
    config = root / "docs" / "05-design" / "prototype" / "js" / "config.js"
    text = config.read_text(encoding="utf-8")
    text = text.replace('{ id: "librarian", name: "Librarian", home: "sc-01" }', '{ id: "librarian", name: "Librarian", home: "sc-01", shell: "site", tabs: ["sc-01", "sc-02"] }')
    text = text.replace("window.KIT_CONFIG = {", 'window.KIT_CONFIG = {\n  site: { org: "City Library", menu: ["sc-02", "sc-01"], footer: ["Open every day"] },')
    config.write_text(text, encoding="utf-8")
    shots = tmp_path / "shots"
    assert check(root, load_project(root), routes=["sc-01", "sc-02-librarian?month=3"], shots=shots) == []
    names = {p.name for p in shots.iterdir()}
    assert {"sc-01-light.png", "sc-01-dark.png", "sc-01-narrow.png"} <= names
    assert "sc-02-librarian-month-3-light.png" in names
    assert check(root, load_project(root), routes=["sc-99"]) == ["route: no registered screen matches sc-99"]


@pytest.mark.browser
@browser
def test_check_reports_coverage_gap(tmp_path):
    root = tmp_path / "mini"
    shutil.copytree(MINI, root)
    spec = root / "docs" / "05-design" / "ux-spec.md"
    spec.write_text(spec.read_text(encoding="utf-8") + "| SC-09 | Missing | admin | web | R2 |\n", encoding="utf-8")
    failures = check(root, load_project(root), routes=[])
    assert "coverage: SC-09 in ux-spec but not registered" in failures
