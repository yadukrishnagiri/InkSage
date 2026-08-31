import uvicorn
import warnings
import os

# Suppress pypdf deprecation warnings
warnings.filterwarnings('ignore', category=DeprecationWarning, module='pypdf')

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"Starting InkSage server on port {port}...")
    uvicorn.run(
        "app.api.main:app",
        host="0.0.0.0",
        port=port,
        reload=False
    )
