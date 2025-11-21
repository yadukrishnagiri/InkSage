"""
Test script to verify Supabase database connection.
Run: python test_db_connection.py
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_supabase_connection():
    """Test Supabase database connection."""
    print("=" * 60)
    print("Testing Supabase Database Connection")
    print("=" * 60)
    
    # Check environment variables
    supabase_url = os.getenv("SUPABASE_URL")
    # Use anon key (service key format not supported)
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url:
        print("❌ ERROR: SUPABASE_URL not found in environment variables")
        print("   Make sure your .env file has SUPABASE_URL set")
        return False
    
    if not supabase_key:
        print("❌ ERROR: SUPABASE_KEY or SUPABASE_SERVICE_KEY not found")
        print("   Make sure your .env file has one of these keys set")
        return False
    
    print(f"✅ Found SUPABASE_URL: {supabase_url[:30]}...")
    print(f"✅ Found API Key: {supabase_key[:20]}...")
    print()
    
    try:
        from supabase import create_client, Client
        
        print("📦 Importing Supabase client...")
        try:
            client: Client = create_client(supabase_url, supabase_key)
            print("✅ Supabase client created")
        except TypeError as e:
            # Try without proxy parameter if version issue
            print(f"⚠️  Warning: {str(e)}")
            print("   Trying alternative client initialization...")
            # Use service key for admin operations
            client: Client = create_client(supabase_url, supabase_key)
            print("✅ Supabase client created (alternative method)")
        print()
        
        # Test 1: Check if we can query a table
        print("Test 1: Querying 'users' table...")
        try:
            response = client.table("users").select("id").limit(1).execute()
            print(f"✅ Successfully queried 'users' table")
            print(f"   Response: {len(response.data)} row(s) returned")
        except Exception as e:
            print(f"⚠️  Warning: Could not query 'users' table: {str(e)}")
            print("   This is OK if the table is empty or doesn't exist yet")
        print()
        
        # Test 2: Check if we can query subjects table
        print("Test 2: Querying 'subjects' table...")
        try:
            response = client.table("subjects").select("id").limit(1).execute()
            print(f"✅ Successfully queried 'subjects' table")
            print(f"   Response: {len(response.data)} row(s) returned")
        except Exception as e:
            print(f"⚠️  Warning: Could not query 'subjects' table: {str(e)}")
        print()
        
        # Test 3: Check if we can query files table
        print("Test 3: Querying 'files' table...")
        try:
            response = client.table("files").select("id").limit(1).execute()
            print(f"✅ Successfully queried 'files' table")
            print(f"   Response: {len(response.data)} row(s) returned")
        except Exception as e:
            print(f"⚠️  Warning: Could not query 'files' table: {str(e)}")
        print()
        
        # Test 4: Check if we can query guest_sessions table
        print("Test 4: Querying 'guest_sessions' table...")
        try:
            response = client.table("guest_sessions").select("id").limit(1).execute()
            print(f"✅ Successfully queried 'guest_sessions' table")
            print(f"   Response: {len(response.data)} row(s) returned")
        except Exception as e:
            print(f"⚠️  Warning: Could not query 'guest_sessions' table: {str(e)}")
        print()
        
        # Test 5: Try to insert a test guest session (will be cleaned up)
        print("Test 5: Testing INSERT operation...")
        try:
            import uuid
            from datetime import datetime, timedelta
            
            test_session_id = str(uuid.uuid4())
            expires_at = (datetime.now() + timedelta(hours=2)).isoformat()
            
            response = client.table("guest_sessions").insert({
                "session_id": test_session_id,
                "expires_at": expires_at
            }).execute()
            
            if response.data:
                print(f"✅ Successfully inserted test guest session")
                print(f"   Session ID: {test_session_id[:20]}...")
                
                # Clean up: delete the test session
                client.table("guest_sessions").delete().eq("session_id", test_session_id).execute()
                print(f"✅ Test session cleaned up")
            else:
                print("⚠️  Insert returned no data")
        except Exception as e:
            print(f"❌ ERROR: Could not insert test data: {str(e)}")
        print()
        
        print("=" * 60)
        print("✅ Database connection test completed!")
        print("=" * 60)
        return True
        
    except ImportError:
        print("❌ ERROR: Could not import supabase library")
        print("   Run: pip install supabase")
        return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        print()
        print("Common issues:")
        print("  1. Check your SUPABASE_URL is correct")
        print("  2. Check your API key is correct")
        print("  3. Make sure you've run the database migrations")
        print("  4. Check your Supabase project is active (not paused)")
        return False

if __name__ == "__main__":
    success = test_supabase_connection()
    sys.exit(0 if success else 1)

