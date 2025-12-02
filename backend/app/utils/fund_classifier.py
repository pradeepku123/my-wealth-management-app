def classify_fund(scheme_name):
    """Classify mutual fund by category and sub-category based on scheme name."""
    name_upper = scheme_name.upper()
    
    # Determine category (Equity or Debt)
    # Determine category (Equity or Debt)
    if any(keyword in name_upper for keyword in ['EQUITY', 'BLUECHIP', 'LARGECAP', 'MIDCAP', 'SMALLCAP', 'MULTICAP', 'FLEXICAP', 'FOCUSED', 'ELSS', 'TAX SAVER', 'INDEX', 'VALUE', 'CONTRA', 'DIVIDEND', 'SECTOR', 'THEMATIC', 'PHARMA', 'TECHNOLOGY', 'INFRASTRUCTURE']):
        category = 'Equity'
    elif any(keyword in name_upper for keyword in ['DEBT', 'BOND', 'GILT', 'LIQUID', 'ULTRA SHORT', 'SHORT TERM', 'MEDIUM TERM', 'LONG TERM', 'CORPORATE BOND', 'FIXED', 'INCOME', 'CREDIT RISK', 'FLOATING RATE', 'MONEY MARKET', 'TREASURY', 'PSU', 'BANKING & PSU']):
        category = 'Debt'
    else:
        category = 'Other'
    
    # Determine sub-category for Equity funds
    if category == 'Equity':
        if any(keyword in name_upper for keyword in ['LARGE CAP', 'LARGECAP', 'BLUECHIP', 'TOP 100', 'NIFTY 50']):
            sub_category = 'Large Cap'
        elif any(keyword in name_upper for keyword in ['MID CAP', 'MIDCAP', 'MID-CAP']):
            sub_category = 'Mid Cap'
        elif any(keyword in name_upper for keyword in ['SMALL CAP', 'SMALLCAP', 'SMALL-CAP']):
            sub_category = 'Small Cap'
        elif any(keyword in name_upper for keyword in ['MULTI CAP', 'MULTICAP', 'MULTI-CAP']):
            sub_category = 'Multi Cap'
        elif any(keyword in name_upper for keyword in ['FLEXI CAP', 'FLEXICAP', 'FLEXI-CAP']):
            sub_category = 'Flexi Cap'
        else:
            sub_category = 'Other Equity'
    elif category == 'Debt':
        if any(keyword in name_upper for keyword in ['LIQUID', 'OVERNIGHT']):
            sub_category = 'Liquid'
        elif any(keyword in name_upper for keyword in ['ULTRA SHORT', 'SHORT TERM']):
            sub_category = 'Short Term'
        elif any(keyword in name_upper for keyword in ['MEDIUM TERM', 'INTERMEDIATE']):
            sub_category = 'Medium Term'
        elif any(keyword in name_upper for keyword in ['LONG TERM', 'GILT']):
            sub_category = 'Long Term'
        else:
            sub_category = 'Other Debt'
    else:
        sub_category = 'Other'
    
    return category, sub_category
