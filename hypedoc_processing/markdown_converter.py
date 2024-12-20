#!/usr/bin/env python3

def convert_to_markdown(input_file, output_file):
    """Convert cleaned entries to Markdown format."""
    with open(input_file, 'r') as f:
        content = f.read()
    
    # Split into quarters
    quarters = content.strip().split('\n\n')
    
    markdown_content = []
    for quarter in quarters:
        if not quarter.strip():
            continue
            
        lines = quarter.split('\n')
        # Get quarter header
        quarter_header = lines[0].strip()
        if not quarter_header.startswith('Q'):
            continue
            
        # Add quarter header as H1
        markdown_content.append(f'# {quarter_header}')
        markdown_content.append('')  # Empty line after header
        
        # Process entries
        current_date = None
        for line in lines[2:]:  # Skip the header and separator line
            line = line.strip()
            if not line:
                continue
                
            if line.endswith(':'):  # This is a date
                current_date = line[:-1]  # Remove the colon
                markdown_content.append(f'## {current_date}')
                markdown_content.append('')  # Empty line after date
            elif line.startswith('- '):  # This is an entry
                # Keep the bullet point but ensure proper spacing
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