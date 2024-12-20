#!/usr/bin/env python3
"""
Process and organize hypedoc entries for performance reviews.

This script processes raw hypedoc entries, organizing them by quarter and removing duplicates.
It handles various date formats and ensures entries are properly formatted with links.

Author: Stephen Geller
"""

import re
from datetime import datetime
from collections import defaultdict

def parse_date(date_str):
    """
    Parse date strings in various formats.
    
    Args:
        date_str (str): Date string in formats like "December 4, 2024" or "Dec 4 2024"
        
    Returns:
        datetime: Parsed datetime object or None if parsing fails
    """
    date_formats = [
        "%B %d, %Y",  # December 4, 2024
        "%b %d, %Y",  # Dec 4, 2024
        "%B %d %Y",   # December 4 2024
        "%b %d %Y"    # Dec 4 2024
    ]
    
    for fmt in date_formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None

def get_quarter(date):
    """
    Get quarter from date object.
    
    Args:
        date (datetime): Date to determine quarter for
        
    Returns:
        str: Quarter string in format "Q1 2024"
    """
    return f"Q{(date.month - 1) // 3 + 1} {date.year}"

def is_high_impact_entry(entry):
    """
    Check if entry has significant impact based on content.
    
    Evaluates entries based on:
    - Impact indicators (improved, enhanced, implemented, etc.)
    - Presence of metrics (percentages, time measurements)
    - Links to PRs or commits
    
    Args:
        entry (str): Entry text to evaluate
        
    Returns:
        bool: True if entry is considered high impact
    """
    impact_indicators = [
        r'\d+%',           # Percentage improvements
        r'improv(ed|ing)',
        r'enhanc(ed|ing)',
        r'implement(ed|ing)',
        r'reduc(ed|ing)',
        r'optimiz(ed|ing)',
        r'led',
        r'launch(ed|ing)',
        r'migrat(ed|ing)',
        r'refactor(ed|ing)',
        r'coordinat(ed|ing)',
        r'architect(ed|ing)'
    ]
    
    # Count how many impact indicators are present
    impact_score = sum(1 for indicator in impact_indicators if re.search(indicator, entry.lower()))
    
    # Check for metrics
    has_metrics = bool(re.search(r'\d+(?:%|ms|minutes?|hours?)', entry))
    
    # Check for PR/commit links
    has_link = 'github.com' in entry or 'pull' in entry
    
    # Entry should have at least 2 impact indicators or metrics
    return (impact_score >= 2 or has_metrics) and has_link

def process_hypedoc(input_file):
    """
    Process hypedoc entries from input file.
    
    Reads entries, organizes by quarter, removes duplicates, and ensures proper formatting.
    
    Args:
        input_file (str): Path to input file containing hypedoc entries
        
    Returns:
        dict: Entries organized by quarter
    """
    entries_by_quarter = defaultdict(list)
    seen_entries = set()
    
    with open(input_file, 'r') as f:
        content = f.read()
    
    # Split content into entries
    date_pattern = r'([A-Z][a-z]+ \d{1,2},? \d{4}):'
    sections = re.split(date_pattern, content)
    
    # Process each section
    for i in range(1, len(sections), 2):
        date_str = sections[i]
        content = sections[i + 1] if i + 1 < len(sections) else ""
        
        date = parse_date(date_str)
        if not date:
            continue
            
        quarter = get_quarter(date)
        
        # Process bullet points
        entries = [e.strip() for e in content.split('\n') if e.strip() and e.strip().startswith('-')]
        
        for entry in entries:
            # Create normalized version for deduplication
            normalized = re.sub(r'https?://\S+', '', entry.lower())
            normalized = re.sub(r'\s+', ' ', normalized).strip()
            
            if normalized not in seen_entries and is_high_impact_entry(entry):
                seen_entries.add(normalized)
                entries_by_quarter[quarter].append((date, entry))
    
    return entries_by_quarter

def generate_quarterly_summary(entries_by_quarter):
    """
    Generate summary for each quarter.
    
    Creates formatted summary with entries organized by quarter and date.
    
    Args:
        entries_by_quarter (dict): Dictionary of entries organized by quarter
        
    Returns:
        str: Formatted summary text
    """
    summaries = []
    
    for quarter, entries in sorted(entries_by_quarter.items(), reverse=True):
        summary = [f"\n{quarter} Summary:"]
        summary.append("-" * 40)
        
        # Sort entries by date within quarter
        sorted_entries = sorted(entries, key=lambda x: x[0], reverse=True)
        
        for date, entry in sorted_entries:
            summary.append(f"{date.strftime('%B %d, %Y')}:")
            summary.append(entry)
        
        summaries.append('\n'.join(summary))
    
    return '\n\n'.join(summaries)

def main():
    """
    Main function to process hypedoc entries.
    
    Reads from original_hypedoc.txt and writes processed entries to cleaned_entries.txt.
    """
    input_file = "original_hypedoc.txt"
    entries_by_quarter = process_hypedoc(input_file)
    
    # Write cleaned entries
    with open("cleaned_entries.txt", "w") as f:
        f.write(generate_quarterly_summary(entries_by_quarter))
    
    print("Processing complete. Check cleaned_entries.txt for results.")

if __name__ == "__main__":
    main()