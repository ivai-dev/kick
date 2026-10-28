import pytest

from kick.tables import ENDPOINTS, FEATURES, TASKS, parse_days, read_endpoints, read_items

HEAD = "| Task | Done when | After | Days (min–likely–max) | Confidence | Basis | Status |\n| --- | --- | --- | --- | --- | --- | --- |\n"


def page(tmp_path, rows: str, head: str = HEAD, heading: str = "## Tasks", name: str = "tasks.md"):
    path = tmp_path / name
    path.write_text(f"# T\n\n<!-- | not: a table | -->\n\n{heading}\n\n{head}{rows}\n## Finished when\n", encoding="utf-8")
    return path


@pytest.mark.parametrize(("text", "expected"), [
    ("2–3–5", (2, 3, 5, False)), ("2-3-5", (2, 3, 5, False)), ("2 / 3 / 5", (2, 3, 5, False)),
    ("0,5–1–2", (0.5, 1, 2, False)), ("1 - 2 - 4", (1, 2, 4, False)), ("3", (3, 3, 3, True)),
    ("2.5", (2.5, 2.5, 2.5, True)),
])
def test_days(text, expected):
    assert parse_days(text) == expected


@pytest.mark.parametrize("text", ["5–3–8", "1–2", "a–b–c", "1–2–3–4"])
def test_bad_days(text):
    with pytest.raises(ValueError):
        parse_days(text)


def test_tasks_are_read_with_keys_after_and_probes(tmp_path):
    path = page(tmp_path, "| shell: app shell | key screen matches | | 2–3–5 | medium | last project | done |\n"
                          "| lend: lend flow | 3 steps | shell | 2-3-6 | low | [unclear: scanner] | doing |\n"
                          "| probe-scan: scanner? (probe) | answered | | 1 | Low | | |\n")
    items, errors = read_items(path, TASKS)
    assert errors == []
    assert [(i.key, i.after, i.status, i.point, i.probe) for i in items] == [
        ("shell", [], "done", False, False), ("lend", ["shell"], "doing", False, False),
        ("probe-scan", [], "todo", True, True)]
    assert items[1].line == 10 and items[2].confidence == "low"


def test_empty_template_table_has_no_rows_and_no_errors(tmp_path):
    assert read_items(page(tmp_path, ""), TASKS) == ([], [])


def test_errors_name_the_line(tmp_path):
    path = page(tmp_path, "| no key here | x | | 1 | low | | todo |\n"
                          "| a: A | x | b | 5–3–8 | sure | | started |\n")
    _, errors = read_items(path, TASKS)
    assert errors[0].startswith("tasks.md:9: 'no key here' does not start with a short key")
    assert any("tasks.md:10: days '5–3–8'" in e for e in errors)
    assert any("confidence 'sure'" in e for e in errors)
    assert any("status 'started'" in e for e in errors)
    assert any("a waits for b, which is not in the table" in e for e in errors)


def test_duplicate_keys_and_cycles(tmp_path):
    path = page(tmp_path, "| a: A | x | | 1 | low | | todo |\n| a: again | x | | 1 | low | | todo |\n")
    assert any("the key a is used twice" in e for e in read_items(path, TASKS)[1])
    path = page(tmp_path, "| a: A | x | c | 1 | low | | todo |\n| b: B | x | a | 1 | low | | todo |\n"
                          "| c: C | x | b | 1 | low | | todo |\n")
    assert read_items(path, TASKS)[1] == ["tasks.md: the tasks wait for each other in a circle: a → c → b → a"]


def test_missing_heading_or_columns(tmp_path):
    path = tmp_path / "tasks.md"
    path.write_text("# T\n\nnothing\n", encoding="utf-8")
    assert read_items(path, TASKS)[1] == ["tasks.md: no '## Tasks' table"]
    path = page(tmp_path, "", head="| Task | Days |\n| --- | --- |\n")
    assert "lacks the column(s) Done when, After, Confidence, Basis, Status" in read_items(path, TASKS)[1][0]


def test_extra_columns_and_escaped_pipes(tmp_path):
    head = ("| Task | Done when | After | Days | Confidence | Basis | Status | Release |\n"
            "|---|---|---|---|---|---|---|---|\n")
    path = page(tmp_path, "| a: A \\| B | x | | 1–2–3 | high | | todo | first |\n", head=head)
    items, errors = read_items(path, TASKS)
    assert errors == [] and items[0].title == "A | B" and items[0].release == "first"


def test_roadmap_features(tmp_path):
    head = ("| Feature | After | Days (min–likely–max) | Confidence | Basis | Release | Kick |\n"
            "| --- | --- | --- | --- | --- | --- | --- |\n")
    path = page(tmp_path, "| foundation: sign-in, db | | 4–6–10 | medium | | first | foundation |\n"
                          "| lending: lend for real | foundation | 5–8–14 | low | | first | |\n",
                head=head, heading="## Features", name="roadmap.md")
    items, errors = read_items(path, FEATURES)
    assert errors == []
    assert [(i.key, i.kick, i.release, i.after) for i in items] == [
        ("foundation", "foundation", "first", []), ("lending", "", "first", ["foundation"])]


def test_endpoints(tmp_path):
    head = "| Endpoint | Used by | Roles | Status | Cost |\n| --- | --- | --- | --- | --- |\n"
    path = page(tmp_path, "| GET /loans | lend | librarian | mock | |\n| GET /report | dash | librarian | Real | "
                          "expensive |\n| POST /x | y | z | fake | |\n",
                head=head, heading="## Endpoints", name="api.md")
    endpoints, errors = read_endpoints(path)
    assert [(e.status, e.cost) for e in endpoints] == [("mock", ""), ("real", "expensive"), ("fake", "")]
    assert errors == ["api.md:11: status 'fake' is not mock or real"]
    assert ENDPOINTS[0] == "Endpoints"
