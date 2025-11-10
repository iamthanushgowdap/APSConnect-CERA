# Python script to extract INSERT statements from PostgreSQL dump
import re

def extract_insert_statements(dump_file, output_file):
    """Extract all INSERT INTO statements from PostgreSQL dump file"""

    insert_pattern = re.compile(r'INSERT INTO public\.\w+.*?(?=INSERT INTO|ALTER TABLE|CREATE|COMMENT|\-\-|$)')
    values_pattern = re.compile(r'VALUES\s*\(.*?\)\s*;', re.DOTALL)

    with open(dump_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all INSERT statements
    insert_statements = insert_pattern.findall(content)

    extracted_data = []
    for stmt in insert_statements:
        # Clean up the statement
        stmt = stmt.strip()
        if stmt and 'INSERT INTO public.' in stmt:
            extracted_data.append(stmt + ';')

    # Write to output file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('-- EXTRACTED INSERT STATEMENTS FROM DUMP\n')
        f.write('-- Run this after running the table creation script\n\n')
        for stmt in extracted_data:
            f.write(stmt + '\n\n')

    print(f"Extracted {len(extracted_data)} INSERT statements to {output_file}")

if __name__ == "__main__":
    dump_file = r"c:\Users\choco\Downloads\sip\last_dump.sql"
    output_file = r"c:\Users\choco\Downloads\sip\extracted_data.sql"

    extract_insert_statements(dump_file, output_file)
