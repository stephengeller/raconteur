#!/usr/bin/env python3
import re
from collections import defaultdict
from datetime import datetime

def parse_date(date_str):
    """Parse date strings in various formats."""
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
    """Get quarter from date object."""
    return f"Q{(date.month - 1) // 3 + 1} {date.year}"

def categorize_achievement(entry):
    """Categorize the type of achievement based on content."""
    categories = {
        'technical': [
            r'implement(ed|ing)',
            r'refactor(ed|ing)',
            r'optimiz(ed|ing)',
            r'enhanc(ed|ing)',
            r'fix(ed|ing)',
            r'updat(ed|ing)',
        ],
        'documentation': [
            r'document(ed|ing)',
            r'README',
            r'instruct(ed|ing)',
        ],
        'process': [
            r'improv(ed|ing)',
            r'streamlin(ed|ing)',
            r'automat(ed|ing)',
        ],
        'collaboration': [
            r'coordinat(ed|ing)',
            r'collaborat(ed|ing)',
            r'led',
            r'facilitat(ed|ing)',
        ]
    }
    
    entry_lower = entry.lower()
    found_categories = []
    
    for category, patterns in categories.items():
        if any(re.search(pattern, entry_lower) for pattern in patterns):
            found_categories.append(category)
    
    return found_categories or ['other']

def extract_metrics(entry):
    """Extract any metrics or quantitative improvements from the entry."""
    metric_patterns = [
        r'(\d+(?:\.\d+)?%)',  # Percentages
        r'(\d+(?:\.\d+)?)\s*(?:ms|minutes?|hours?)',  # Time measurements
        r'reduced.*?by\s+(\d+(?:\.\d+)?%)',  # Reductions
        r'improved.*?by\s+(\d+(?:\.\d+)?%)',  # Improvements
        r'increased.*?by\s+(\d+(?:\.\d+)?%)'  # Increases
    ]
    
    metrics = []
    for pattern in metric_patterns:
        matches = re.finditer(pattern, entry, re.IGNORECASE)
        metrics.extend(match.group(1) for match in matches)
    
    return metrics

def generate_narrative(entries):
    """Generate a narrative summary from a list of entries."""
    if not entries:
        return ""
    
    # Group entries by category
    categorized_entries = defaultdict(list)
    for entry in entries:
        categories = categorize_achievement(entry)
        for category in categories:
            categorized_entries[category].append(entry)
    
    # Generate narrative paragraphs
    paragraphs = []
    
    # Technical achievements
    if categorized_entries['technical']:
        tech_summary = "Technical achievements during this quarter focused on "
        if len(categorized_entries['technical']) > 1:
            tech_summary += "multiple areas, including "
        tech_summary += "improving system functionality and reliability. "
        tech_summary += "Key implementations included "
        tech_summary += ", ".join(e.strip('- ').split('(')[0].strip() for e in categorized_entries['technical'][:3])
        tech_summary += "."
        paragraphs.append(tech_summary)
    
    # Process improvements
    if categorized_entries['process']:
        process_summary = "Process improvements were made to enhance efficiency and reliability. "
        process_summary += "Notable improvements included "
        process_summary += ", ".join(e.strip('- ').split('(')[0].strip() for e in categorized_entries['process'][:3])
        process_summary += "."
        paragraphs.append(process_summary)
    
    # Documentation and collaboration
    if categorized_entries['documentation'] or categorized_entries['collaboration']:
        collab_summary = "Documentation and collaboration efforts strengthened the team's foundation. "
        if categorized_entries['documentation']:
            collab_summary += "Documentation was enhanced through "
            collab_summary += ", ".join(e.strip('- ').split('(')[0].strip() for e in categorized_entries['documentation'][:2])
            collab_summary += ". "
        if categorized_entries['collaboration']:
            collab_summary += "Cross-team collaboration was demonstrated through "
            collab_summary += ", ".join(e.strip('- ').split('(')[0].strip() for e in categorized_entries['collaboration'][:2])
            collab_summary += "."
        paragraphs.append(collab_summary)
    
    # Extract and highlight metrics
    all_metrics = []
    for entry in entries:
        metrics = extract_metrics(entry)
        if metrics:
            all_metrics.extend(metrics)
    
    if all_metrics:
        metrics_summary = "Quantifiable improvements included "
        metrics_summary += ", ".join(all_metrics)
        metrics_summary += "."
        paragraphs.append(metrics_summary)
    
    return "\n\n".join(paragraphs)

def process_entries(input_file):
    """Process entries from input file and generate quarterly narratives."""
    with open(input_file, 'r') as f:
        content = f.read()
    
    # Split content into entries
    quarters = {}
    current_quarter = None
    current_entries = []
    
    for line in content.split('\n'):
        line = line.strip()
        if not line or line.startswith('----'):
            continue
            
        if line.startswith('Q'):
            if current_quarter and current_entries:
                quarters[current_quarter] = current_entries
            current_quarter = line.split(':')[0].strip()
            current_entries = []
        elif line.startswith('-'):
            current_entries.append(line)
    
    # Add last quarter
    if current_quarter and current_entries:
        quarters[current_quarter] = current_entries
    
    # Generate narratives for each quarter
    narratives = []
    for quarter, entries in sorted(quarters.items(), reverse=True):
        narrative = f"# {quarter}\n\n"
        narrative += generate_narrative(entries)
        narratives.append(narrative)
    
    return "\n\n".join(narratives)

def main():
    input_file = "cleaned_entries.txt"
    output_file = "quarterly_narratives.md"
    
    narratives = process_entries(input_file)
    
    with open(output_file, "w") as f:
        f.write(narratives)
    
    print(f"Processing complete. Check {output_file} for results.")

if __name__ == "__main__":
    main()