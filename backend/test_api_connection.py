"""
Test script to verify FastAPI backend connection.
Make sure the backend is running: python run.py
Then run: python test_api_connection.py
"""
import requests
import json
import sys

API_URL = "http://localhost:8000"

def test_api_connection():
    """Test FastAPI backend connection."""
    print("=" * 60)
    print("Testing FastAPI Backend Connection")
    print("=" * 60)
    print(f"API URL: {API_URL}")
    print()
    
    # Test 1: Health check
    print("Test 1: Health check endpoint...")
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: Status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ ERROR: Could not connect to {API_URL}")
        print("   Make sure the backend is running: python run.py")
        return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    print()
    
    # Test 2: Root endpoint
    print("Test 2: Root endpoint...")
    try:
        response = requests.get(f"{API_URL}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Root endpoint accessible")
            print(f"   Response: {json.dumps(data, indent=2)}")
        else:
            print(f"⚠️  Root endpoint returned status {response.status_code}")
    except Exception as e:
        print(f"⚠️  Warning: {str(e)}")
    print()
    
    # Test 3: Create guest session
    print("Test 3: Create guest session...")
    try:
        response = requests.post(f"{API_URL}/api/guest/session", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Guest session created")
            print(f"   Session ID: {data.get('session_id', 'N/A')[:20]}...")
            print(f"   Expires at: {data.get('expires_at', 'N/A')}")
            guest_session_id = data.get('session_id')
        else:
            print(f"❌ Failed to create guest session: Status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    print()
    
    # Test 4: Get subjects (with guest session)
    print("Test 4: Get subjects (with guest session)...")
    try:
        headers = {"X-Guest-Session-ID": guest_session_id}
        response = requests.get(f"{API_URL}/api/subjects", headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Successfully fetched subjects")
            print(f"   Found {len(data)} subject(s)")
        else:
            print(f"⚠️  Warning: Status {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"⚠️  Warning: {str(e)}")
    print()
    
    # Test 5: Create subject (with guest session)
    print("Test 5: Create subject (with guest session)...")
    try:
        headers = {"X-Guest-Session-ID": guest_session_id}
        payload = {"name": "Test Subject - Delete Me"}
        response = requests.post(
            f"{API_URL}/api/subjects",
            json=payload,
            headers=headers,
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Successfully created test subject")
            print(f"   Subject ID: {data.get('id', 'N/A')}")
            print(f"   Subject Name: {data.get('name', 'N/A')}")
            test_subject_id = data.get('id')
        else:
            print(f"⚠️  Warning: Status {response.status_code}")
            print(f"   Response: {response.text}")
            test_subject_id = None
    except Exception as e:
        print(f"⚠️  Warning: {str(e)}")
        test_subject_id = None
    print()
    
    # Test 6: Chat query (with guest session)
    print("Test 6: Chat query endpoint...")
    try:
        if test_subject_id:
            headers = {"X-Guest-Session-ID": guest_session_id}
            payload = {
                "query": "Hello, this is a test",
                "subject_id": test_subject_id,
                "chat_history": []
            }
            response = requests.post(
                f"{API_URL}/api/chat/query",
                json=payload,
                headers=headers,
                timeout=30  # Chat might take longer
            )
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Chat query successful")
                print(f"   Response preview: {data.get('text', '')[:50]}...")
                print(f"   Citations: {len(data.get('citations', []))}")
            else:
                print(f"⚠️  Warning: Status {response.status_code}")
                print(f"   Response: {response.text}")
        else:
            print("⚠️  Skipping chat test (no subject created)")
    except Exception as e:
        print(f"⚠️  Warning: {str(e)}")
    print()
    
    print("=" * 60)
    print("✅ API connection test completed!")
    print("=" * 60)
    print()
    print("Note: If any tests failed, check:")
    print("  1. Backend is running: python run.py")
    print("  2. Backend is accessible at http://localhost:8000")
    print("  3. Database connection is working (run test_db_connection.py)")
    print("  4. Environment variables are set correctly")
    return True

if __name__ == "__main__":
    success = test_api_connection()
    sys.exit(0 if success else 1)

