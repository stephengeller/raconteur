# Hypedoc Processing Scripts

This directory contains Python scripts for processing and formatting performance review entries from your hypedoc. These scripts help organize, clean, and format your achievements for better presentation.

## Scripts Overview

### process_entries.py
Processes raw hypedoc entries to create a clean, organized summary by quarter:
- Removes duplicate entries
- Groups entries by quarter
- Validates and formats dates
- Ensures proper formatting of links and descriptions
- Creates a cleaned output file (`cleaned_entries.txt`)

Usage:
```bash
python process_entries.py
```

Input: Expects `original_hypedoc.txt` in the same directory
Output: Generates `cleaned_entries.txt` with organized, deduplicated entries

### generate_quarterly_narratives.py (if present)
Generates narrative summaries for each quarter based on the cleaned entries:
- Creates a cohesive narrative from bullet points
- Organizes achievements by category (technical, process, documentation)
- Maintains links to original PRs
- Outputs in markdown format

### markdown_converter_fixed.py (if present)
Converts the cleaned entries into markdown format suitable for Google Docs:
- Formats entries with proper markdown syntax
- Maintains chronological order
- Preserves links and formatting
- Creates a performance_review.md file

## Usage Instructions

1. Place your original hypedoc content in `original_hypedoc.txt`
2. Run `process_entries.py` to clean and organize entries
3. (Optional) Run additional conversion scripts as needed
4. Find the processed output in the respective output files

## Output Files
- `cleaned_entries.txt`: Organized, deduplicated entries by quarter
- `quarterly_narratives.md`: Narrative summaries of achievements by quarter
- `performance_review.md`: Markdown formatted version for Google Docs

## Best Practices
1. Always review the output files to ensure accuracy
2. Keep original files backed up before processing
3. Verify dates and links in the processed output
4. Update entries regularly to maintain accuracy

## Troubleshooting
- If dates aren't parsing correctly, ensure they follow the format "Month DD, YYYY"
- Verify that PR links are complete and properly formatted
- Check for proper indentation in the original file