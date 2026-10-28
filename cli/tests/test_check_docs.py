from helpers import project_dict, write_kickoff

from kick.cli import main


def project_with_rules(tmp_path):
    return write_kickoff(tmp_path, project=project_dict(rules={"forbidden_phrases": [r"\bClaude\b"]}))


def test_findings_are_listed_with_file_and_line(tmp_path, capsys):
    root = project_with_rules(tmp_path)
    doc = root / "docs" / "01-discovery" / "vision-scope.md"
    doc.parent.mkdir(parents=True)
    doc.write_text("# Vision\n\nOwner: {{owner}}\n\n```\n{{example}}\n```\n\nDrafted by claude.\n", encoding="utf-8")
    js = root / "docs" / "05-design" / "prototype" / "js" / "home.js"
    js.parent.mkdir(parents=True)
    js.write_text("const s = html`<div style=${{gap: 4}}>`;\n", encoding="utf-8")
    assert main(["--root", str(root), "check-docs", str(root / "docs")]) == 1
    out = capsys.readouterr().out
    assert f"{doc}:3: placeholder {{{{…}}}}" in out
    assert ":6:" not in out  # inside a code fence
    assert f"{doc}:9: forbidden phrase /\\bClaude\\b/" in out
    assert str(js) not in out  # `{{` is code in JS
    assert out.rstrip().endswith("2 findings")


def test_nested_and_mixed_fences(tmp_path, capsys):
    root = project_with_rules(tmp_path)
    doc = root / "guide.MD"
    doc.write_text("````md\n```\n{{inside}}\n```\n````\n~~~\n```\n{{tilde}}\n~~~\nOwner: {{after}}\n", encoding="utf-8")
    assert main(["--root", str(root), "check-docs", str(doc), str(doc)]) == 1
    out = capsys.readouterr().out
    assert out.count("placeholder") == 1 and f"{doc}:10:" in out  # duplicates collapse, fences hold


def test_an_invalid_forbidden_phrase_is_reported(tmp_path, capsys):
    root = write_kickoff(tmp_path, project=project_dict(rules={"forbidden_phrases": ["(oops"]}))
    (root / "a.md").write_text("x\n", encoding="utf-8")
    assert main(["--root", str(root), "check-docs", str(root / "a.md")]) == 2
    assert "invalid regular expression" in capsys.readouterr().err


def test_clean_files_pass(tmp_path, capsys):
    root = project_with_rules(tmp_path)
    doc = root / "docs" / "plan.md"
    doc.parent.mkdir(parents=True)
    doc.write_text("# Plan\n\nAll owners are roles.\n", encoding="utf-8")
    assert main(["--root", str(root), "check-docs", str(doc), str(root / ".kickoff")]) == 0
    assert "check-docs passed (5 files)" in capsys.readouterr().out


def test_a_missing_path_is_refused(tmp_path, capsys):
    root = project_with_rules(tmp_path)
    assert main(["--root", str(root), "check-docs", str(root / "nope.md")]) == 2
    assert "no such file or folder" in capsys.readouterr().err
