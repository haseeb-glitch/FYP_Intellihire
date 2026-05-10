import uvicorn
from dotenv import load_dotenv
load_dotenv()
from backend.main import app

if __name__ == '__main__':
    # Use uvicorn to run the FastAPI app
    uvicorn.run("backend.main:app", host="127.0.0.1", port=5000, reload=True)

