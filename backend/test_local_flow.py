"""Small end-to-end smoke test for the local API."""
import importlib
import io
import os
import tempfile

from fastapi.testclient import TestClient
from reportlab.pdfgen import canvas


def pdf_with_text(text: str) -> bytes:
    output = io.BytesIO()
    page = canvas.Canvas(output)
    page.drawString(50, 750, text)
    page.save()
    return output.getvalue()


def test_subject_pdf_chat_lifecycle():
    with tempfile.TemporaryDirectory() as directory:
        os.environ["INKSAGE_DATA_DIR"] = directory
        os.environ.pop("GROQ_API_KEY", None)
        from app.api import main
        importlib.reload(main)
        client = TestClient(main.app)

        chemistry = client.post("/api/subjects", json={"name": "Chemistry"}).json()
        maths = client.post("/api/subjects", json={"name": "Maths"}).json()
        assert len(client.get("/api/subjects").json()) == 2
        upload = client.post(f"/api/subjects/{chemistry['id']}/files", files={"file": ("atoms.pdf", pdf_with_text("Sodium has atomic number eleven."), "application/pdf")})
        assert upload.status_code == 201, upload.text
        file_id = upload.json()["id"]
        assert client.post(f"/api/subjects/{chemistry['id']}/files", files={"file": ("atoms.pdf", pdf_with_text("Sodium has atomic number eleven."), "application/pdf")}).status_code == 409

        answer = client.post("/api/chat/query", json={"subject_id": chemistry["id"], "query": "What is the atomic number of sodium?"}).json()
        assert "eleven" in answer["text"]
        assert "atoms.pdf, page 1" in answer["citations"]
        other = client.post("/api/chat/query", json={"subject_id": maths["id"], "query": "What is the atomic number of sodium?"}).json()
        assert not other["citations"]

        assert client.delete(f"/api/subjects/{chemistry['id']}/files/{file_id}").status_code == 200
        assert not client.post("/api/chat/query", json={"subject_id": chemistry["id"], "query": "sodium"}).json()["citations"]
        assert client.delete(f"/api/subjects/{chemistry['id']}").status_code == 200
        assert len(client.get("/api/subjects").json()) == 1


if __name__ == "__main__":
    test_subject_pdf_chat_lifecycle()
    print("Local flow passed")
