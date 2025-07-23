#!/usr/bin/env python
"""
Script to reset the database completely
"""
import os
import sys
import django
from pathlib import Path

# Add the project root to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotlyvf_backend.settings')
django.setup()

from django.db import connection
from django.core.management import call_command

def reset_database():
    """Reset the database completely"""
    print("🗑️  Resetting database...")
    
    # Get database cursor
    cursor = connection.cursor()
    
    try:
        # Get all table names
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]
        
        if tables:
            # Disable foreign key checks temporarily
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            
            # Drop all tables
            for table in tables:
                try:
                    cursor.execute(f"DROP TABLE IF EXISTS `{table}`")
                    print(f"✅ Dropped table: {table}")
                except Exception as e:
                    print(f"⚠️  Could not drop table {table}: {e}")
            
            # Re-enable foreign key checks
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        else:
            print("ℹ️  No tables found to drop")
        
        print("✅ Database reset completed!")
        
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        return False
    
    return True

def create_fresh_migrations():
    """Create fresh migrations"""
    print("📦 Creating fresh migrations...")
    
    try:
        # Remove old migration files
        import shutil
        migrations_path = BASE_DIR / 'apps' / 'auth_service' / 'migrations'
        
        if migrations_path.exists():
            for file in migrations_path.glob('0*.py'):
                file.unlink()
                print(f"🗑️  Removed old migration: {file.name}")
        
        # Create new migrations
        call_command('makemigrations', 'auth_service')
        print("✅ Fresh migrations created!")
        
    except Exception as e:
        print(f"❌ Error creating migrations: {e}")
        return False
    
    return True

def apply_migrations():
    """Apply all migrations"""
    print("⚡ Applying migrations...")
    
    try:
        call_command('migrate')
        print("✅ Migrations applied successfully!")
        
    except Exception as e:
        print(f"❌ Error applying migrations: {e}")
        return False
    
    return True

if __name__ == '__main__':
    print("🚀 Starting database reset process...")
    
    # Step 1: Reset database
    if not reset_database():
        sys.exit(1)
    
    # Step 2: Create fresh migrations
    if not create_fresh_migrations():
        sys.exit(1)
    
    # Step 3: Apply migrations
    if not apply_migrations():
        sys.exit(1)
    
    print("🎉 Database setup completed successfully!")
    print("✨ Your Spotlyvf backend database is ready!")
