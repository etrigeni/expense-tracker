from typing import Optional
from datetime import date, datetime
from decimal import Decimal
import html
import re
from urllib.parse import urljoin, urlparse
import httpx


def format_currency(amount: Decimal) -> str:
    """Format a decimal amount as currency"""
    return f"${amount:.2f}"


def get_current_date() -> date:
    """Get the current date"""
    return date.today()


def calculate_percentage(part: Decimal, total: Decimal) -> float:
    """Calculate percentage"""
    if total == 0:
        return 0.0
    return float((part / total) * 100)


def _extract_meta_content(html_text: str, key: str) -> Optional[str]:
    pattern = re.compile(
        rf'<meta[^>]+(?:property|name)=["\']{re.escape(key)}["\'][^>]*>',
        re.IGNORECASE,
    )
    for match in pattern.finditer(html_text):
        tag = match.group(0)
        content_match = re.search(r'content=["\'](.*?)["\']', tag, re.IGNORECASE)
        if content_match:
            return html.unescape(content_match.group(1).strip())
    return None


async def fetch_open_graph_image(url: str) -> Optional[str]:
    """Fetch og:image or twitter:image for a given URL."""
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return None

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=6.0) as client:
            response = await client.get(url, headers={"User-Agent": "BudgetTracker/1.0"})
            if response.status_code >= 400:
                return None
            html_text = response.text
    except httpx.HTTPError:
        return None

    image_url = _extract_meta_content(html_text, "og:image:secure_url")
    if not image_url:
        image_url = _extract_meta_content(html_text, "og:image")
    if not image_url:
        image_url = _extract_meta_content(html_text, "twitter:image")

    if not image_url:
        return None

    return urljoin(url, image_url)
