"""
Run all connection tests.
Usage: python run_tests.py
"""
import subprocess
import sys
import os

def run_test(script_name, description):
    """Run a test script and report results."""
    print("\n" + "=" * 60)
    print(f"Running: {description}")
    print("=" * 60)
    
    try:
        result = subprocess.run(
            [sys.executable, script_name],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print(f"❌ Test timed out after 30 seconds")
        return False
    except Exception as e:
        print(f"❌ Error running test: {str(e)}")
        return False

def main():
    """Run all tests."""
    print("=" * 60)
    print("InkSage Connection Tests")
    print("=" * 60)
    
    # Check if .env exists
    if not os.path.exists(".env"):
        print("\n⚠️  Warning: .env file not found")
        print("   Create a .env file with your Supabase credentials")
        print("   See .env.example for reference")
    
    tests = [
        ("test_db_connection.py", "Database Connection Test"),
        ("test_api_connection.py", "API Connection Test"),
    ]
    
    results = []
    for script, description in tests:
        if os.path.exists(script):
            success = run_test(script, description)
            results.append((description, success))
        else:
            print(f"\n⚠️  Test file not found: {script}")
            results.append((description, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for description, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status}: {description}")
    
    all_passed = all(success for _, success in results)
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed. Check the output above for details.")
    print("=" * 60)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())

