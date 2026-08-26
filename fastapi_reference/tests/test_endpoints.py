import os
import unittest

from fastapi.testclient import TestClient

from app.main import Principal, WorkforceRole, app, read_principal


class FastApiEndpointTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)
        os.environ["FASTAPI_INTERNAL_JWT_SECRET"] = "reference-test-secret"

    def tearDown(self) -> None:
        app.dependency_overrides.clear()
        os.environ.pop("FASTAPI_INTERNAL_JWT_SECRET", None)

    def set_principal(self, role: WorkforceRole, user_id: int = 7) -> None:
        app.dependency_overrides[read_principal] = lambda: Principal(user_id=user_id, role=role)

    def test_rejects_an_invalid_internal_jwt(self) -> None:
        response = self.client.get("/api/profile/me", headers={"Authorization": "Bearer invalid-token"})
        self.assertEqual(response.status_code, 401)

    def test_rejects_non_administrator_access_summary(self) -> None:
        self.set_principal(WorkforceRole.RECRUITER)
        response = self.client.get("/api/access/summary")
        self.assertEqual(response.status_code, 403)

    def test_rejects_non_recruiter_progress_access(self) -> None:
        self.set_principal(WorkforceRole.CONSULTANT)
        response = self.client.get("/api/recruiting/progress")
        self.assertEqual(response.status_code, 403)

    def test_profile_is_scoped_to_the_authenticated_principal(self) -> None:
        self.set_principal(WorkforceRole.CONSULTANT, user_id=27)
        response = self.client.get("/api/profile/me")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user_id"], 27)

    def test_rejects_too_short_ai_context_before_model_invocation(self) -> None:
        self.set_principal(WorkforceRole.ADMIN)
        response = self.client.post("/api/ai/assist", json={"task": "access_review", "context": "short"})
        self.assertEqual(response.status_code, 422)
