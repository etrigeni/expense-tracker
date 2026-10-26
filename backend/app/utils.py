from decimal import Decimal


def format_currency(amount: Decimal) -> str:
    """Format a decimal amount as currency"""
    return f"${amount:.2f}"


def calculate_percentage(part: Decimal, total: Decimal) -> float:
    """Calculate percentage"""
    if total == 0:
        return 0.0
    return float((part / total) * 100)
