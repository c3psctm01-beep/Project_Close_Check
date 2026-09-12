import sys
import os
import urllib.parse
import json

# Add parent directory to sys.path so root modules (server, approval_form_docx) can be imported
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

import server
import approval_form_docx

class handler(server.SAPCloseHTTPHandler):
    """
    Vercel Serverless Function entrypoint handler.
    Inherits from server.SAPCloseHTTPHandler to support all API endpoints.
    """

    def _normalize_request_path(self):
        # Handle Vercel header rewrites if present
        matched_path = self.headers.get("x-matched-path", "")
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if "/api/index.py" in path:
            if matched_path:
                path = matched_path
            else:
                path = path.replace("/api/index.py", "")

        if not path.startswith("/api"):
            path = "/api" + (path if path.startswith("/") else "/" + path)

        # Reconstruct self.path with query string if any
        if parsed.query:
            self.path = f"{path}?{parsed.query}"
        else:
            self.path = path

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        self._normalize_request_path()
        return super().do_GET()

    def do_POST(self):
        self._normalize_request_path()
        return super().do_POST()

    def do_DELETE(self):
        self._normalize_request_path()
        return super().do_DELETE()
