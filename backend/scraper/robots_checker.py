import urllib.robotparser
import logging

logger = logging.getLogger(__name__)

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

class ScreenerRobotsChecker:
    def __init__(self, base_url: str = "https://www.screener.in"):
        self.base_url = base_url.rstrip("/")
        self.robots_url = f"{self.base_url}/robots.txt"
        self.parser = urllib.robotparser.RobotFileParser()
        self._is_parsed = False
        # Fallback explicit disallow rules from constraint specifications
        self.explicit_disallows = ["/user/", "/company/source/quarter/"]

    def load_robots_txt(self):
        try:
            self.parser.set_url(self.robots_url)
            self.parser.read()
            self._is_parsed = True
            logger.info("Successfully fetched and parsed robots.txt from Screener.in")
        except Exception as e:
            logger.warning(f"Failed to fetch robots.txt dynamically: {e}. Utilizing strict fallback rules.")
            self._is_parsed = False

    def can_fetch(self, target_url: str) -> bool:
        # 1. Check explicit disallowed paths
        for path in self.explicit_disallows:
            if path in target_url:
                logger.warning(f"Blocked URL via explicit policy rule: {target_url} contains {path}")
                return False

        if "?" in target_url and "/company/" in target_url and not target_url.endswith("/consolidated/"):
            # Avoid query strings as per robots constraint (/*?)
            logger.warning(f"Blocked query-string URL: {target_url}")
            return False

        if self._is_parsed:
            allowed = self.parser.can_fetch(USER_AGENT, target_url)
            if not allowed:
                logger.warning(f"Blocked URL by robots.txt parser: {target_url}")
            return allowed
        
        return True
