import unittest

from app.main import AiTask, WorkforceRole, can_use_task


class FastApiAccessContractTests(unittest.TestCase):
    def test_recruiter_summary_is_limited_to_recruiter_and_administrator(self) -> None:
        self.assertTrue(can_use_task(WorkforceRole.RECRUITER, AiTask.RECRUITER_SUMMARY))
        self.assertTrue(can_use_task(WorkforceRole.ADMIN, AiTask.RECRUITER_SUMMARY))
        self.assertFalse(can_use_task(WorkforceRole.CONSULTANT, AiTask.RECRUITER_SUMMARY))

    def test_access_review_is_administrator_only(self) -> None:
        self.assertTrue(can_use_task(WorkforceRole.ADMIN, AiTask.ACCESS_REVIEW))
        self.assertFalse(can_use_task(WorkforceRole.RECRUITER, AiTask.ACCESS_REVIEW))

    def test_onboarding_guidance_is_available_to_each_authenticated_role(self) -> None:
        self.assertTrue(can_use_task(WorkforceRole.CONSULTANT, AiTask.ONBOARDING_GUIDANCE))
        self.assertTrue(can_use_task(WorkforceRole.HR_COMPLIANCE, AiTask.ONBOARDING_GUIDANCE))
