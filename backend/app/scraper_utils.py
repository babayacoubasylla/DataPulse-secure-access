import re
from dataclasses import dataclass
from html import unescape
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


@dataclass
class ScrapedPage:
    url: str
    title: str | None
    price: float | None
    currency: str
    availability_status: str
    raw_price: str | None
    error: str | None = None


PRICE_PATTERNS = [
    re.compile(r"([0-9][0-9\s\.,]{2,})\s*(FCFA|XOF|CFA)", re.IGNORECASE),
    re.compile(r"(FCFA|XOF|CFA)\s*([0-9][0-9\s\.,]{2,})", re.IGNORECASE),
    re.compile(r"prix[^0-9]{0,20}([0-9][0-9\s\.,]{2,})", re.IGNORECASE),
]


def strip_html(html: str) -> str:
    without_scripts = re.sub(
        r"<script[\s\S]*?</script>",
        " ",
        html,
        flags=re.IGNORECASE,
    )

    without_styles = re.sub(
        r"<style[\s\S]*?</style>",
        " ",
        without_scripts,
        flags=re.IGNORECASE,
    )

    text = re.sub(r"<[^>]+>", " ", without_styles)
    text = unescape(text)

    return re.sub(r"\s+", " ", text).strip()


def extract_title(html: str) -> str | None:
    match = re.search(
        r"<title[^>]*>([\s\S]*?)</title>",
        html,
        flags=re.IGNORECASE,
    )

    if not match:
        return None

    title = strip_html(match.group(1))

    return title[:250] if title else None


def normalize_price(raw: str) -> float | None:
    cleaned = raw.replace("\u202f", " ").replace("\xa0", " ")
    cleaned = re.sub(r"[^0-9,\.]", "", cleaned)

    if not cleaned:
        return None

    # Cas fréquent : 125.000 ou 125,000 = séparateur de milliers
    if cleaned.count(",") == 1 and len(cleaned.split(",")[-1]) == 3:
        cleaned = cleaned.replace(",", "")
    elif cleaned.count(".") == 1 and len(cleaned.split(".")[-1]) == 3:
        cleaned = cleaned.replace(".", "")
    else:
        cleaned = cleaned.replace(" ", "").replace(",", ".")

    cleaned = re.sub(r"[^0-9.]", "", cleaned)

    try:
        return float(cleaned)
    except ValueError:
        return None


def extract_price(text: str) -> tuple[float | None, str | None, str]:
    for pattern in PRICE_PATTERNS:
        match = pattern.search(text)

        if not match:
            continue

        groups = match.groups()

        if len(groups) >= 2 and groups[0].upper() in {"FCFA", "XOF", "CFA"}:
            currency = groups[0].upper()
            raw_price = groups[1]
        elif len(groups) >= 2:
            raw_price = groups[0]
            currency = groups[1].upper()
        else:
            raw_price = groups[0]
            currency = "XOF"

        price = normalize_price(raw_price)

        if price is not None:
            if currency in {"FCFA", "CFA"}:
                currency = "XOF"

            return price, raw_price, currency

    return None, None, "XOF"


def detect_availability(text: str) -> str:
    lower = text.lower()

    unavailable_keywords = [
        "rupture de stock",
        "out of stock",
        "indisponible",
        "épuisé",
        "epuise",
        "sold out",
    ]

    limited_keywords = [
        "stock limité",
        "stock limite",
        "plus que",
        "dernières pièces",
        "dernieres pieces",
        "limited stock",
    ]

    if any(keyword in lower for keyword in unavailable_keywords):
        return "out_of_stock"

    if any(keyword in lower for keyword in limited_keywords):
        return "limited_stock"

    return "available"


def fetch_html(url: str, timeout: int = 15) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 "
                "(compatible; DataPulseBot/0.1; +https://datapulse.local)"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )

    with urlopen(request, timeout=timeout) as response:
        content_type = response.headers.get("Content-Type", "")
        charset = "utf-8"

        match = re.search(r"charset=([^;]+)", content_type, re.IGNORECASE)

        if match:
            charset = match.group(1).strip()

        return response.read().decode(charset, errors="ignore")


def scrape_url(url: str) -> ScrapedPage:
    try:
        html = fetch_html(url)
        text = strip_html(html)

        title = extract_title(html)
        price, raw_price, currency = extract_price(text)
        availability = detect_availability(text)

        return ScrapedPage(
            url=url,
            title=title,
            price=price,
            currency=currency,
            availability_status=availability,
            raw_price=raw_price,
        )

    except HTTPError as error:
        return ScrapedPage(
            url=url,
            title=None,
            price=None,
            currency="XOF",
            availability_status="unknown",
            raw_price=None,
            error=f"HTTP {error.code}: {error.reason}",
        )

    except URLError as error:
        return ScrapedPage(
            url=url,
            title=None,
            price=None,
            currency="XOF",
            availability_status="unknown",
            raw_price=None,
            error=f"URL error: {error.reason}",
        )

    except Exception as error:
        return ScrapedPage(
            url=url,
            title=None,
            price=None,
            currency="XOF",
            availability_status="unknown",
            raw_price=None,
            error=str(error),
        )