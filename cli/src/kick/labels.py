"""Visible strings of the estimate workbook, keyed by languages.workbook."""

from __future__ import annotations

LABELS: dict[str, dict[str, str]] = {
    "en": {
        # sheets
        "sheet_estimate": "Estimate", "sheet_wbs": "WBS", "sheet_resources": "Resources",
        "sheet_assumptions": "Assumptions", "sheet_holidays": "Holidays",
        # titles and notes
        "title_estimate": "{name}: effort and schedule estimate",
        "note_estimate": "Baseline estimate generated from .kickoff/plan.yaml; it does not track progress. "
                         "Blue cells are inputs; every date, duration and total is a formula.",
        "title_wbs": "Work breakdown structure and schedule",
        "note_wbs": "Change an effort (blue) here or a focus on {resources} and the dates move. Role, schedule mode, "
                    "dependencies and order come from plan.yaml: change them there and run kickoff workbook again.",
        "title_resources": "Team and focus",
        "note_resources": "One person per role. Focus is the share of each working day spent on this project; "
                          "duration = effort / focus.",
        "title_assumptions": "Assumptions",
        "note_assumptions": "The estimate holds only while these assumptions hold.",
        "title_holidays": "Holidays",
        "note_holidays": "Non-working days used by every date formula. Add dates in the empty rows below the list.",
        # key figures
        "plan_start": "Plan start", "planned_end": "Planned end", "working_days": "Working days",
        "total_effort": "Total effort (person-days)",
        # milestones
        "milestones": "Milestones", "gate": "Gate", "name": "Name", "wbs": "WBS", "planned_date": "Planned date",
        "hard_date": "Hard date", "spare_days": "Spare working days", "verdict": "Verdict", "on_time": "On time",
        "late": "Late", "criteria": "Exit criteria",
        # summaries
        "by_phase": "Effort by phase and role (person-days)", "phase": "Phase", "total": "Total",
        "start": "Start", "end": "End",
        "by_release": "Effort by release and role (person-days)", "release": "Release", "no_release": "(none)",
        # WBS columns
        "code": "Code", "level": "Level", "desc": "Description", "prio": "Priority", "role": "Role",
        "mode": "Schedule", "deps": "Depends on", "follows": "After (same role)", "effort": "Effort (person-days)",
        "rate": "Effort rate", "days": "Working days", "ref": "Reference", "coop": "Cooperation", "note": "Note",
        # schedule modes
        "mode_seq": "Sequential", "mode_fixed": "Fixed dates", "mode_span": "Span {a} to {b}",
        "mode_period": "{months} months after {after}", "mode_tail": "Last {days} days of {of}",
        # resources, assumptions, holidays
        "role_id": "Role ID", "focus": "Focus", "duties": "Duties",
        "id": "ID", "kind": "Kind", "assumption": "Assumption", "scope": "Scope", "source": "Source",
        "date": "Date",
    },
    "vi": {
        "sheet_estimate": "Ước tính", "sheet_wbs": "WBS", "sheet_resources": "Nguồn lực",
        "sheet_assumptions": "Giả định", "sheet_holidays": "Ngày nghỉ",
        "title_estimate": "{name}: ước tính công và tiến độ",
        "note_estimate": "Ước tính cơ sở lập từ .kickoff/plan.yaml, không dùng để theo dõi tiến độ thực hiện. "
                         "Ô chữ xanh là dữ liệu nhập; mọi ngày, thời lượng và tổng đều là công thức.",
        "title_wbs": "Cấu trúc phân chia công việc và tiến độ",
        "note_wbs": "Sửa công (ô xanh) ở đây hoặc tỷ lệ tập trung ở trang {resources}, các ngày sẽ tự tính lại. "
                    "Vai trò, cách lập lịch, phụ thuộc và thứ tự lấy từ plan.yaml: sửa ở đó rồi chạy lại "
                    "kickoff workbook.",
        "title_resources": "Nhân sự và tỷ lệ tập trung",
        "note_resources": "Mỗi vai trò một người. Tỷ lệ tập trung là phần thời gian mỗi ngày làm việc dành cho dự án; "
                          "thời lượng = công / tỷ lệ tập trung.",
        "title_assumptions": "Giả định",
        "note_assumptions": "Ước tính chỉ đúng khi các giả định này còn đúng.",
        "title_holidays": "Ngày nghỉ",
        "note_holidays": "Các ngày không làm việc, dùng trong mọi công thức tính ngày. Thêm ngày vào các dòng trống "
                         "bên dưới danh sách.",
        "plan_start": "Ngày bắt đầu", "planned_end": "Ngày kết thúc dự kiến", "working_days": "Số ngày làm việc",
        "total_effort": "Tổng công (ngày công)",
        "milestones": "Các mốc", "gate": "Mốc", "name": "Tên", "wbs": "WBS", "planned_date": "Ngày dự kiến",
        "hard_date": "Hạn cứng", "spare_days": "Dự phòng (ngày làm việc)", "verdict": "Đánh giá",
        "on_time": "Kịp hạn", "late": "Trễ hạn", "criteria": "Tiêu chí hoàn thành",
        "by_phase": "Công theo giai đoạn và vai trò (ngày công)", "phase": "Giai đoạn", "total": "Tổng",
        "start": "Bắt đầu", "end": "Kết thúc",
        "by_release": "Công theo đợt phát hành và vai trò (ngày công)", "release": "Phát hành",
        "no_release": "(chưa gán)",
        "code": "Mã", "level": "Cấp", "desc": "Mô tả", "prio": "Ưu tiên", "role": "Vai trò",
        "mode": "Cách lập lịch", "deps": "Phụ thuộc", "follows": "Làm sau (cùng vai trò)",
        "effort": "Công (ngày công)", "rate": "Tỷ lệ công", "days": "Số ngày làm việc", "ref": "Tham chiếu",
        "coop": "Phối hợp", "note": "Ghi chú",
        "mode_seq": "Tuần tự", "mode_fixed": "Ngày cố định", "mode_span": "Kéo dài từ {a} đến {b}",
        "mode_period": "{months} tháng sau {after}", "mode_tail": "{days} ngày cuối của {of}",
        "role_id": "Mã vai trò", "focus": "Tỷ lệ tập trung", "duties": "Nhiệm vụ",
        "id": "Mã", "kind": "Loại", "assumption": "Giả định", "scope": "Phạm vi", "source": "Nguồn",
        "date": "Ngày",
    },
}


def label(lang: str, key: str, **fmt: object) -> str:
    """LABELS[lang][key] with {placeholders} filled from fmt."""
    s = LABELS[lang][key]
    return s.format(**fmt) if fmt else s
