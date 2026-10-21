"""Checks against the ECC plugin installed on this machine; skipped where ECC is not installed (CI)."""

import pytest

from kickoff import ecc

pytestmark = pytest.mark.ecc


@pytest.fixture(scope="module")
def install():
    try:
        return ecc.find_install()
    except ecc.EccError as exc:
        pytest.skip(str(exc))


def test_every_component_kickoff_uses_is_installed(install):
    assert ecc.missing_components(install.root) == []


def test_installed_version_is_supported(install):
    assert ecc.version_key(install.version) >= ecc.version_key(ecc.MIN_ECC)
