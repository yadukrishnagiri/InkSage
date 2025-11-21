import uvicorn
import warnings

# Suppress pypdf deprecation warnings
warnings.filterwarnings('ignore', category=DeprecationWarning, module='pypdf')

from app.api.main import app

if __name__ == "__main__":
    uvicorn.run(
        "app.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

