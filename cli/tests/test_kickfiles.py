import subprocess
from datetime import date
from pathlib import Path

import pytest
import yaml

from kick.cli import main
from kick.errors import KickError
from kick.files import write_yaml
from kick.kickfile import finish_kick, kick_folders, load_kick, new_kick
from kick.projectfile import init_project, languages_line, load_project, make_languages

DAY = date(2026, 10, 28)


@pytest.fixture
def root(tmp_path):
    init_project(tmp_path, make_languages("vi"))
    return tmp_path


def set_agreed(folder: Path, **agreed):
    data = yaml.safe_load((folder / "kick.yaml").read_text(encoding="utf-8"))
    data["agreed"] = agreed
    write_yaml(folder / "kick.yaml", data)


# ---------------------------------------------------------------- project
def test_init_writes_languages_and_pages(tmp_path):
    written = init_project(tmp_path, make_languages("vi", ui=["vi", "en"]))
    names = sorted(p.name for p in written)
    assert names == ["api.md", "data.md", "design.md", "overview.md", "project.yaml", "roadmap.md"]
    project = load_project(tmp_path)
    assert project.languages == {"chat": "vi", "docs": "vi", "code": "en", "ui": ["vi", "en"], "commits": "en"}
    assert languages_line(project) == "Languages: chat vi · docs vi · code en · UI vi, en · commits en"


def test_init_refuses_twice_and_update_changes_only_the_languages(root):
    with pytest.raises(KickError, match="--update"):
        init_project(root, make_languages("en"))
    (root / "docs/kick/project/overview.md").write_text("# Mine\n", encoding="utf-8")
    init_project(root, make_languages("en", base=load_project(root).languages), update=True)
    assert load_project(root).languages["chat"] == "en"
    assert (root / "docs/kick/project/overview.md").read_text(encoding="utf-8") == "# Mine\n"


def test_update_without_a_project_is_refused(tmp_path):
    with pytest.raises(KickError, match="without --update"):
        init_project(tmp_path, make_languages("vi"), update=True)


@pytest.mark.parametrize("bad", ["VI", "vietnamese", "v", ""])
def test_bad_language_tags_are_refused(tmp_path, bad):
    with pytest.raises(KickError, match="languages"):
        init_project(tmp_path, {**make_languages("vi"), "chat": bad})


def test_missing_project_names_kick_init(tmp_path):
    with pytest.raises(KickError, match="run kick init"):
        load_project(tmp_path)


def test_init_command_with_defaults_and_update(tmp_path, capsys):
    assert main(["--root", str(tmp_path), "init", "--chat", "vi", "--ui", "vi,en"]) == 0
    assert "Languages: chat vi · docs vi · code en · UI vi, en · commits en" in capsys.readouterr().out
    assert main(["--root", str(tmp_path), "init", "--update", "--docs", "en"]) == 0
    assert load_project(tmp_path).languages["docs"] == "en"
    assert load_project(tmp_path).languages["ui"] == ["vi", "en"]


# ---------------------------------------------------------------- kicks
def test_new_kick_fills_the_templates(root):
    written = new_kick(root, "library", "Thư viện trường", "product", today=DAY)
    assert sorted(p.name for p in written) == ["brief.md", "design.md", "feedback.md", "kick.yaml", "log.md",
                                               "tasks.md"]
    folder = root / "docs/kick/library"
    assert (folder / "brief.md").read_text(encoding="utf-8").startswith("# Thư viện trường — brief")
    assert "- 2026-10-28: started." in (folder / "log.md").read_text(encoding="utf-8")
    assert '"this is the product"' in (folder / "tasks.md").read_text(encoding="utf-8")
    kick = load_kick(folder)
    assert (kick.kind, kick.status, kick.started, kick.step) == ("product", "active", DAY, "understand")


def test_feature_kick_links_the_roadmap(root):
    new_kick(root, "lending", "Lending", "feature", roadmap="lending")
    kick = load_kick(root / "docs/kick/lending")
    assert kick.roadmap == "lending"
    assert '"it works as agreed"' in (root / "docs/kick/lending/tasks.md").read_text(encoding="utf-8")


@pytest.mark.parametrize("slug", ["A", "x", "-a", "a_b", "../up", "a/b", "project", "done", "a" * 42])
def test_bad_or_reserved_names_are_refused(root, slug):
    with pytest.raises(KickError):
        new_kick(root, slug, "T", "feature")


def test_existing_names_are_refused_also_when_done(root):
    new_kick(root, "billing", "Billing", "feature")
    with pytest.raises(KickError, match="already exists"):
        new_kick(root, "billing", "Billing", "feature")
    finish_kick(root, "billing")
    with pytest.raises(KickError, match="already exists"):
        new_kick(root, "billing", "Billing again", "feature")


def test_new_needs_the_project(tmp_path, capsys):
    assert main(["--root", str(tmp_path), "new", "x1", "--title", "T", "--kind", "feature"]) == 2
    assert "run kick init" in capsys.readouterr().err


@pytest.mark.parametrize(("agreed", "step"), [
    ({}, "understand"),
    ({"understand": DAY}, "shape"),
    ({"understand": DAY, "shape": DAY}, "plan"),
    ({"understand": DAY, "shape": DAY, "plan": DAY}, "build"),
    ({"understand": DAY, "shape": DAY, "plan": DAY, "result": DAY}, "finish"),
    ({"understand": DAY, "plan": DAY}, "shape"),
])
def test_step_follows_the_agreements(root, agreed, step):
    new_kick(root, "app", "App", "product")
    set_agreed(root / "docs/kick/app", **agreed)
    assert load_kick(root / "docs/kick/app").step == step


def test_agreements_out_of_order_warn(root):
    new_kick(root, "app", "App", "product")
    set_agreed(root / "docs/kick/app", understand=DAY, plan=DAY)
    assert load_kick(root / "docs/kick/app").agreement_warnings() == ["app: 'plan' is agreed but 'shape' is not"]


def test_invalid_kick_yaml_is_reported(root):
    new_kick(root, "app", "App", "product")
    path = root / "docs/kick/app/kick.yaml"
    path.write_text(path.read_text(encoding="utf-8").replace("kind: product", "kind: epic"), encoding="utf-8")
    with pytest.raises(KickError, match="kind"):
        load_kick(root / "docs/kick/app")


# ---------------------------------------------------------------- done
def test_done_moves_an_untracked_kick_and_warns_without_result(root):
    new_kick(root, "app", "App", "product")
    target, warnings = finish_kick(root, "app")
    assert target == root / "docs/kick/done/app" and not (root / "docs/kick/app").exists()
    assert warnings == ["app: nobody agreed 'this is the product' yet; it is moved to done/ anyway"]
    assert load_kick(target).status == "done" and load_kick(target).step == "done"
    assert kick_folders(root) == [] and kick_folders(root, done=True) == [target]


def test_done_uses_git_mv_for_a_tracked_kick(root):
    subprocess.run(["git", "init", "-q"], cwd=root, check=True)
    new_kick(root, "app", "App", "feature")
    set_agreed(root / "docs/kick/app", understand=DAY, shape=DAY, plan=DAY, result=DAY)
    subprocess.run(["git", "add", "-A"], cwd=root, check=True)
    _, warnings = finish_kick(root, "app")
    assert warnings == []
    staged = subprocess.run(["git", "diff", "--cached", "--name-status"], cwd=root, capture_output=True, text=True)
    assert "docs/kick/done/app/kick.yaml" in staged.stdout
    assert "docs/kick/app/kick.yaml" not in staged.stdout.replace("docs/kick/done/app", "")


def test_done_command(root, capsys):
    new_kick(root, "app", "App", "product")
    assert main(["--root", str(root), "done", "app"]) == 0
    out = capsys.readouterr().out
    assert "warn: app: nobody agreed" in out and "moved to docs/kick/done/app" in out
    assert main(["--root", str(root), "done", "app"]) == 2
