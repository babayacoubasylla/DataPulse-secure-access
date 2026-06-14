import json
import re
from dataclasses import dataclass
from html import unescape
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


@dataclass
class ScrapedPage:
    url: str
    title: str | None
    price: float | None
    currency: str
    availability_status: str
    raw_price: str | None
    extraction_method: str = "unknown"
    error: str | None = None


CURRENCY_ALIASES = {
    "FCFA": "XOF",
    "CFA": "XOF",
    "XOF": "XOF",
    "F CFA": "XOF",
    "€": "EUR",
    "EUR": "EUR",
    "$": "USD",
    "USD": "USD",
}


PRICE_PATTERNS = [
    re.compile(
        r"([0-9][0-9\s\u00a0\u202f\.,]{2,})\s*(FCFA|F\s*CFA|XOF|CFA|EUR|USD|€|\$)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(FCFA|F\s*CFA|XOF|CFA|EUR|USD|€|\$)\s*([0-9][0-9\s\u00a0\u202f\.,]{2,})",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:prix|price|montant|tarif)[^0-9]{0,30}([0-9][0-9\s\u00a0\u202f\.,]{2,})",
        re.IGNORECASE,
    ),
]


META_PRICE_PATTERNS = [
    re.compile(
        r'<meta[^>]+(?:property|name)=["\'](?:product:price:amount|og:price:amount|twitter:data1|price)["\'][^>]+content=["\']([^"\']+)["\']',
        re.IGNORECASE,
    ),
    re.compile(
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:product:price:amount|og:price:amount|twitter:data1|price)["\']',
        re.IGNORECASE,
    ),
]


META_CURRENCY_PATTERNS = [
    re.compile(
        r'<meta[^>]+(?:property|name)=["\'](?:product:price:currency|og:price:currency)["\'][^>]+content=["\']([^"\']+)["\']',
        re.IGNORECASE,
    ),
    re.compile(
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\'](?:product:price:currency|og:price:currency)["\']',
        re.IGNORECASE,
    ),
]


def canonical_currency(value: str | None) -> str:
    if not value:
        return "XOF"

    key = re.sub(r"\s+", " ", value.strip().upper())

    return CURRENCY_ALIASES.get(
        key,
        key if len(key) <= 3 else "XOF",
    )


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
    meta_match = re.search(
        r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']',
        html,
        flags=re.IGNORECASE,
    )

    if meta_match:
        return unescape(meta_match.group(1)).strip()[:250]

    match = re.search(
        r"<title[^>]*>([\s\S]*?)</title>",
        html,
        flags=re.IGNORECASE,
    )

    if not match:
        h1 = re.search(
            r"<h1[^>]*>([\s\S]*?)</h1>",
            html,
            flags=re.IGNORECASE,
        )

        return strip_html(h1.group(1))[:250] if h1 else None

    title = strip_html(match.group(1))

    return title[:250] if title else None


def normalize_price(raw: str | int | float | None) -> float | None:
    if raw is None:
        return None

    if isinstance(raw, (int, float)):
        return float(raw)

    cleaned = str(raw).replace("\u202f", " ").replace("\xa0", " ").strip()
    cleaned = re.sub(r"[^0-9,\.]", "", cleaned)

    if not cleaned:
        return None

    # 250.000 ou 250,000 = séparateur de milliers
    if cleaned.count(",") == 1 and len(cleaned.split(",")[-1]) == 3 and cleaned.count(".") == 0:
        cleaned = cleaned.replace(",", "")

    elif cleaned.count(".") == 1 and len(cleaned.split(".")[-1]) == 3 and cleaned.count(",") == 0:
        cleaned = cleaned.replace(".", "")

    elif cleaned.count(".") > 1 and cleaned.count(",") == 0:
        cleaned = cleaned.replace(".", "")

    elif cleaned.count(",") > 1 and cleaned.count(".") == 0:
        cleaned = cleaned.replace(",", "")

    else:
        cleaned = cleaned.replace(",", ".")

    try:
        return float(cleaned)
    except ValueError:
        return None


def extract_json_ld_price(html: str) -> tuple[float | None, str | None, str, str]:
    scripts = re.findall(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>([\s\S]*?)</script>',
        html,
        flags=re.IGNORECASE,
    )

    def walk(node):
        if isinstance(node, dict):
            offers = node.get("offers")

            if offers:
                offer_nodes = offers if isinstance(offers, list) else [offers]

                for offer in offer_nodes:
                    if isinstance(offer, dict):
                        raw_price = (
                            offer.get("price")
                            or offer.get("lowPrice")
                            or offer.get("highPrice")
                        )

                        currency = (
                            offer.get("priceCurrency")
                            or node.get("priceCurrency")
                            or "XOF"
                        )

                        price = normalize_price(raw_price)

                        if price is not None:
                            return (
                                price,
                                str(raw_price),
                                canonical_currency(str(currency)),
                                "json_ld_offers",
                            )

            raw_price = (
                node.get("price")
                or node.get("lowPrice")
                or node.get("highPrice")
            )

            if raw_price is not None:
                price = normalize_price(raw_price)
                currency = node.get("priceCurrency") or "XOF"

                if price is not None:
                    return (
                        price,
                        str(raw_price),
                        canonical_currency(str(currency)),
                        "json_ld_price",
                    )

            for value in node.values():
                result = walk(value)

                if result[0] is not None:
                    return result

        elif isinstance(node, list):
            for item in node:
                result = walk(item)

                if result[0] is not None:
                    return result

        return None, None, "XOF", "unknown"

    for script in scripts:
        try:
            data = json.loads(unescape(script.strip()))
            result = walk(data)

            if result[0] is not None:
                return result

        except Exception:
            continue

    return None, None, "XOF", "unknown"


def extract_meta_price(html: str) -> tuple[float | None, str | None, str, str]:
    raw_price = None

    for pattern in META_PRICE_PATTERNS:
        match = pattern.search(html)

        if match:
            raw_price = unescape(match.group(1)).strip()
            break

    if raw_price is None:
        return None, None, "XOF", "unknown"

    currency = "XOF"

    for pattern in META_CURRENCY_PATTERNS:
        match = pattern.search(html)

        if match:
            currency = canonical_currency(
                unescape(match.group(1)).strip()
            )
            break

    price = normalize_price(raw_price)

    if price is None:
        return None, raw_price, currency, "unknown"

    return price, raw_price, currency, "meta_tags"


def extract_regex_price(text: str) -> tuple[float | None, str | None, str, str]:
    for pattern in PRICE_PATTERNS:
        match = pattern.search(text)

        if not match:
            continue

        groups = match.groups()

        if len(groups) >= 2 and canonical_currency(groups[0]) in {
            "XOF",
            "EUR",
            "USD",
        }:
            currency = canonical_currency(groups[0])
            raw_price = groups[1]

        elif len(groups) >= 2:
            raw_price = groups[0]
            currency = canonical_currency(groups[1])

        else:
            raw_price = groups[0]
            currency = "XOF"

        price = normalize_price(raw_price)

        if price is not None:
            return price, raw_price, currency, "regex_text"

    return None, None, "XOF", "unknown"


def extract_price(html: str, text: str) -> tuple[float | None, str | None, str, str]:
    for extractor in (
        extract_json_ld_price,
        extract_meta_price,
    ):
        price, raw, currency, method = extractor(html)

        if price is not None:
            return price, raw, currency, method

    return extract_regex_price(text)


def detect_availability(text: str) -> str:
    lower = text.lower()

    unavailable_keywords = [
        "rupture de stock",
        "out of stock",
        "indisponible",
        "épuisé",
        "epuise",
        "sold out",
        "non disponible",
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


def validate_url(url: str) -> None:
    parsed = urlparse(url)

    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("URL invalide. Utilisez http:// ou https://")


def fetch_html(url: str, timeout: int = 20) -> str:
    validate_url(url)

    request = Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125 Safari/537.36 DataPulseBot/0.2"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        },
    )

    with urlopen(request, timeout=timeout) as response:
        content_type = response.headers.get("Content-Type", "")
        charset = "utf-8"

        match = re.search(
            r"charset=([^;]+)",
            content_type,
            re.IGNORECASE,
        )

        if match:
            charset = match.group(1).strip()

        return response.read().decode(
            charset,
            errors="ignore",
        )


def scrape_url(url: str) -> ScrapedPage:
    try:
        html = fetch_html(url)
        text = strip_html(html)
        title = extract_title(html)

        price, raw_price, currency, method = extract_price(
            html,
            text,
        )

        availability = detect_availability(text)

        return ScrapedPage(
            url=url,
            title=title,
            price=price,
            currency=currency,
            availability_status=availability,
            raw_price=raw_price,
            extraction_method=method,
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