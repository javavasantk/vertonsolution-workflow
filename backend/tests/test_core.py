from fastapi.testclient import TestClient

from app.main import app, required_string, scrypt_hash, scrypt_verify, unavailable_profile


client = TestClient(app)


def test_health_is_public_and_identifies_fastapi_service():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "verton-workforce-hub-fastapi"}


def test_scrypt_password_hash_round_trips_with_legacy_node_parameters():
    stored = scrypt_hash("ReplacementDemo!2026")

    assert scrypt_verify("ReplacementDemo!2026", stored)
    assert not scrypt_verify("WrongPassword!2026", stored)
    assert not scrypt_verify("ReplacementDemo!2026", "not-a-node-scrypt-hash")


def test_unavailable_resume_is_explicitly_human_reviewed_and_non_decisional():
    fallback = unavailable_profile()

    assert fallback["confidence"] == "low"
    assert fallback["skills"] == []
    assert any("No automated candidate decision" in note for note in fallback["recruiterNotes"])


def test_required_string_rejects_blank_and_accepts_zero_length_when_explicitly_allowed():
    assert required_string("   ", "optional", 0, 255) == ""
    assert required_string("  valid  ", "value", 1, 10) == "valid"
