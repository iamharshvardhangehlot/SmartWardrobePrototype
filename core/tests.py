import json

from django.contrib.auth.models import User
from django.test import TestCase

from .models import UserProfile


class ProfileApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="tester", password="pass1234")
        self.client.force_login(self.user)

    def test_profile_accepts_json_payload(self):
        payload = {"skin_undertone": "Warm"}
        response = self.client.post(
            "/api/profile/",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(profile.skin_undertone, "Warm")
