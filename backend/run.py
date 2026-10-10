import uvicorn
import warnings
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

# Suppress pypdf deprecation warnings
warnings.filterwarnings('ignore', category=DeprecationWarning, module='pypdf')

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"Starting InkSage server on port {port}...")
    uvicorn.run(
        "app.api.main:app",
        host="127.0.0.1",
        port=port,
        reload=False
    )
