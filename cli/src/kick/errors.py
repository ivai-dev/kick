"""Error types. Every expected failure is a KickError so the CLI can print it without a traceback."""


class KickError(Exception):
    """A user-facing error: bad input, a missing file, a failed external tool."""
