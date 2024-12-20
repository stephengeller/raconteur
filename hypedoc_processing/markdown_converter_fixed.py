#!/usr/bin/env python3

def convert_to_markdown(input_file, output_file):
    """Convert cleaned entries to Markdown format."""
    with open(input_file, 'r') as f:
        content = f.read()
    
    # Split into quarters using the Q marker
    quarters = content.split('\nQ')
    
    markdown_content = []
    for i, quarter in enumerate(quarters):
        if not quarter.strip():
            continue
            
        # Add back the Q for all but the first split (which already has it)
        if i > 0:
            quarter = 'Q' + quarter
            
        lines = quarter.split('\n')
        
        # Get quarter header (first non-empty line)
        quarter_header = next((line.strip() for line in lines if line.strip()), '')
        if not quarter_header.startswith('Q'):
            continue
            
        # Add quarter header as H1
        markdown_content.append(f'# {quarter_header}')
        markdown_content.append('')  # Empty line after header
        
        current_date = None
        for line in lines:
            line = line.strip()
            if not line or line.startswith('----'):  # Skip separator lines
                continue
                
            if line.endswith(':'):  # This is a date
                current_date = line[:-1]  # Remove the colon
                markdown_content.append(f'## {current_date}')
                markdown_content.append('')  # Empty line after date
            elif line.startswith('- '):  # This is an entry
                markdown_content.append(line)
                markdown_content.append('')  # Empty line after each entry
        
        markdown_content.append('')  # Extra empty line between quarters
    
    # Write the markdown content
    with open(output_file, 'w') as f:
        f.write('\n'.join(markdown_content))

if __name__ == '__main__':
    input_file = '/Users/sgeller/Downloads/Performance Review/cleaned_entries.txt'
    output_file = '/Users/sgeller/Downloads/Performance Review/performance_review.md'
    convert_to_markdown(input_file, output_file)
    print(f"Conversion complete. Check {output_file} for the Markdown formatted content.")