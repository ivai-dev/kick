"""Error types. Every expected failure is a KickoffError so the CLI can print it without a traceback."""


class KickoffError(Exception):
    """A user-facing error: bad input, a missing file, a failed external tool."""
