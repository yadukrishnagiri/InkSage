import uvicorn
import warnings
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_dir))

warnings.filterwarnings('ignore', category=DeprecationWarning, module='pypdf')

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"Starting InkSage server on port {port}...")
    uvicorn.run(
        "app.api.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        timeout_keep_alive=60
    )
