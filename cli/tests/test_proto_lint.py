"""kickoff proto lint: the foundation rules L1–L18 (kit 0.3)."""

import shutil
from pathlib import Path

import pytest

from kickoff.model import load_project
from kickoff.proto import lint

MINI = Path(__file__).resolve().parents[2] / "examples" / "mini"


@pytest.fixture
def mini(tmp_path):
    root = tmp_path / "mini"
    shutil.copytree(MINI, root)
    return root


def proto(root):
    return root / "docs" / "05-design" / "prototype"


def add_tokens(root, css):
    index = proto(root) / "index.html"
    index.write_text(index.read_text(encoding="utf-8").replace("/* kickoff:tokens:end */", css + "\n/* kickoff:tokens:end */"), encoding="utf-8")


def add_module(root, text, name="extra.js"):
    path = proto(root) / "js" / name
    path.write_text(text, encoding="utf-8")


def set_lang(root, lang):
    path = root / ".kickoff" / "project.yaml"
    path.write_text(path.read_text(encoding="utf-8").replace("  ui: en", f"  ui: {lang}"), encoding="utf-8")


def run(root):
    metrics, failures = lint(root, load_project(root))
    return metrics, failures, metrics["warnings"]


def test_lint_mini_passes_with_no_warnings_from_the_kit(mini):
    metrics, failures, warnings = run(mini)
    assert failures == []
    assert not any("index.html" in w and "spacing" not in w for w in warnings), warnings


def test_lint_flags_weight_800_in_tokens_block(mini):
    add_tokens(mini, ":root { --fw-heavy: 800; }")
    _, failures, warnings = run(mini)
    assert any(f.startswith("weight 800+ in index.html:") for f in failures)
    assert any(w.startswith("deprecated: --fw-heavy") for w in warnings)


def test_lint_flags_line_height_1(mini):
    add_tokens(mini, ".big { line-height: 1; }")
    _, failures, _ = run(mini)
    assert any(f.startswith("line-height below 1.2 in index.html:") for f in failures)


def test_lint_allows_marked_line(mini):
    add_tokens(mini, ".idle-number { line-height: 1; } /* kit:allow L2 */\n.other { line-height: 1.0; } /* kit:allow lh */")
    _, failures, _ = run(mini)
    assert not any(f.startswith("line-height below 1.2") for f in failures)


def test_lint_flags_negative_tracking_vi(mini):
    add_tokens(mini, ".h { letter-spacing: -.01em; }")
    _, failures, warnings = run(mini)
    assert not any("negative letter-spacing" in f for f in failures)
    assert any("negative letter-spacing" in w for w in warnings)
    set_lang(mini, "vi")
    config = proto(mini) / "js" / "config.js"
    config.write_text(config.read_text(encoding="utf-8").replace("window.KIT_CONFIG = {", 'window.KIT_CONFIG = {\n  locale: "vi-VN",'), encoding="utf-8")
    _, failures, _ = run(mini)
    assert any("negative letter-spacing" in f for f in failures)


def test_lint_flags_library_tags(mini):
    add_module(mini, "const x = html`<wa-dialog open></wa-dialog>`;\n")
    _, failures, _ = run(mini)
    assert "library element in js/extra.js:1; use KIT.ui" in failures


def test_lint_flags_title_on_button(mini):
    add_module(mini, 'const a = html`<button type="button" title="Đóng">×</button>`;\nconst b = html`<${U.IconButton} icon="x" title="Đóng" />`;\n')
    _, failures, _ = run(mini)
    assert sum("title tooltip on a button" in f for f in failures) == 2


def test_lint_flags_conditional_overlay(mini):
    add_module(mini, "const a = html`${open && html`<${U.Drawer} title=\"x\" />`}`;\nconst b = html`<${U.Dialog} open=${open} />`;\n")
    _, failures, _ = run(mini)
    assert [f for f in failures if f.startswith("conditionally mounted overlay")] == [
        "conditionally mounted overlay in js/extra.js:1; pass open= so it can animate out"]


def test_lint_flags_handmade_overlay(mini):
    add_module(mini, 'const a = html`<div class="scrim"><aside role="dialog" aria-modal="true"></aside></div>`;\n'
               'document.addEventListener("keydown", (e) => e.key === "Escape" && close());\n')
    _, failures, _ = run(mini)
    assert sum(f.startswith("hand-made overlay in js/extra.js") for f in failures) == 4


def test_lint_flags_layout_transition(mini):
    add_tokens(mini, ".side { transition: width 320ms; }")
    _, failures, warnings = run(mini)
    assert any(f.startswith("layout transition in index.html:") for f in failures)
    assert any(w.startswith("motion longer than 300 ms in index.html:") for w in warnings)


def test_lint_flags_spring_easing(mini):
    add_module(mini, 'const css = ".m { transition: transform 200ms cubic-bezier(.34, 1.4, .64, 1); }";\n')
    _, failures, _ = run(mini)
    assert any(f.startswith("spring easing in js/extra.js:1") for f in failures)


def test_lint_flags_tr_onclick(mini):
    add_module(mini, "const r = html`<tr onClick=${() => go(1)}><td>a</td></tr>`;\n")
    _, failures, _ = run(mini)
    assert "click handler on a table row in js/extra.js:1; use DataTable rowLink" in failures


def test_lint_flags_unpinned_cdn(mini):
    index = proto(mini) / "index.html"
    text = index.read_text(encoding="utf-8").replace("<!-- kickoff:modules:end -->",
        '<script src="https://cdn.jsdelivr.net/npm/dayjs/dayjs.min.js"></script>\n<!-- kickoff:modules:end -->')
    index.write_text(text, encoding="utf-8")
    add_module(mini, 'import("https://unpkg.com/lodash@latest/lodash.js");\n')
    _, failures, _ = run(mini)
    assert "unpinned or disallowed URL https://cdn.jsdelivr.net/npm/dayjs/dayjs.min.js" in failures
    assert "unpinned or disallowed URL https://unpkg.com/lodash@latest/lodash.js" in failures


def test_lint_flags_webawesome_pro(mini):
    add_module(mini, 'const u = "https://kit.webawesome.com/abc.js";\n')
    _, failures, _ = run(mini)
    assert any(f.startswith("unpinned or disallowed URL kit.webawesome.com in js/extra.js:1") for f in failures)


def test_lint_flags_font_urls_in_config(mini):
    config = proto(mini) / "js" / "config.js"
    config.write_text(config.read_text(encoding="utf-8").replace("window.KIT_CONFIG = {", 'window.KIT_CONFIG = {\n  fonts: ["https://example.org/font.css"],'), encoding="utf-8")
    _, failures, _ = run(mini)
    assert "unpinned or disallowed URL https://example.org/font.css" in failures


def test_lint_warnings_do_not_fail(mini, capsys):
    from kickoff.cli import main

    add_tokens(mini, ".site-page .btn { height: 52px; }\n.page { max-width: 1240px; }\n.card { padding: 18px; gap: 10px; }")
    add_module(mini, "const a = html`<${U.SidePanel} title=\"x\" footer=${html`<${U.Button} kind=\"danger\">Xóa<//>`} />`;\n"
               "const b = html`<${U.Menu} anchor=${x} />`;\nconst c = html`<${U.Button} kind=\"soft\">x<//>`;\n"
               "const d = html`<${U.Table} rows=${r} onRow=${f} />`;\n")
    config = proto(mini) / "js" / "config.js"
    config.write_text(config.read_text(encoding="utf-8").replace("window.KIT_CONFIG = {", "window.KIT_CONFIG = {\n  audit: { maxSizes: 8, minLh: 1.2 },"), encoding="utf-8")
    metrics, failures, warnings = run(mini)
    assert failures == []
    joined = "\n".join(warnings)
    for text in ("literal control height in index.html:", "page width override in index.html:", "spacing values off the scale",
                 "destructive action in a side panel in js/extra.js:1", "deprecated: KIT.ui.Menu", 'deprecated: kind "soft"',
                 "deprecated: Table onRow", "audit thresholds changed in js/config.js: maxSizes; needs the lead's yes"):
        assert text in joined, text
    assert metrics["off_scale_spacing"] == 2
    assert main(["--root", str(mini), "proto", "lint"]) == 0
    out = capsys.readouterr().out
    assert "warn: page width override" in out and "off-scale spacing 2" in out
