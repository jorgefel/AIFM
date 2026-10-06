import os
import re

versions_dir = 'alembic/versions'
files = [f for f in os.listdir(versions_dir) if f.endswith('.py')]

for filename in files:
    filepath = os.path.join(versions_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'def upgrade() -> None:' in content and 'Inspector.from_engine' not in content:
        content = content.replace('def upgrade() -> None:', '''def upgrade() -> None:
    from sqlalchemy.engine.reflection import Inspector
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    existing_tables = inspector.get_table_names()''')
        
        def replacer(match):
            table_name = match.group(1)
            return f"if '{table_name}' not in existing_tables:\\n        op.create_table('{table_name}'"
        
        content = re.sub(r"op\.create_table\(['\"]([^'\"]+)['\"]", replacer, content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Modified {filename}')
