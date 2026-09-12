import sys
import os
import urllib.parse
import json

# Add parent directory to sys.path so root modules (server, approval_form_docx) can be imported
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
PUBLIC_DIR = os.path.join(PARENT_DIR, "public")

if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

import server
import approval_form_docx

class handler(server.SAPCloseHTTPHandler):
    """
    Vercel Serverless Function entrypoint handler.
    Inherits from server.SAPCloseHTTPHandler to support all API endpoints
    and gracefully serves static frontend files as fallback.
    """

    def list_directory(self, path):
        # Disable directory listing completely to prevent displaying folder contents
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "ok",
            "service": "PEA SAP Construction Closing Inspector API"
        }, ensure_ascii=False).encode("utf-8"))
        return None

    def _get_target_path(self):
        matched_path = self.headers.get("x-matched-path", "")
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if "/api/index.py" in path:
            if matched_path:
                path = matched_path
            else:
                path = path.replace("/api/index.py", "")

        return path, parsed.query

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        path, query = self._get_target_path()

        # 1. API Root info
        if path in ["/api", "/api/"]:
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "ok",
                "service": "PEA SAP Construction Closing Inspector API",
                "endpoints": [
                    "/api/projects",
                    "/api/sample-project",
                    "/api/upload-pdf",
                    "/api/export-approval-docx",
                    "/api/download-approval-docx"
                ]
            }, ensure_ascii=False).encode("utf-8"))
            return

        # 2. If index.html or root is routed to this function, serve index.html directly
        if path in ["", "/", "/index.html"]:
            candidate_index = [
                os.path.join(PUBLIC_DIR, "index.html"),
                os.path.join(PARENT_DIR, "index.html")
            ]
            for idx_path in candidate_index:
                if os.path.exists(idx_path):
                    with open(idx_path, "rb") as f:
                        data = f.read()
                    self.send_response(200)
                    self.send_header("Content-Type", "text/html; charset=utf-8")
                    self.send_header("Content-Length", str(len(data)))
                    self.end_headers()
                    self.wfile.write(data)
                    return

        # 3. If a static asset (.css, .js, etc.) is routed here, serve it directly
        static_types = {
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".ico": "image/x-icon"
        }
        for ext, ctype in static_types.items():
            if path.endswith(ext):
                fname = os.path.basename(path)
                candidate_asset = [
                    os.path.join(PUBLIC_DIR, fname),
                    os.path.join(PARENT_DIR, fname)
                ]
                for a_path in candidate_asset:
                    if os.path.exists(a_path):
                        with open(a_path, "rb") as f:
                            data = f.read()
                        self.send_response(200)
                        self.send_header("Content-Type", ctype)
                        self.send_header("Content-Length", str(len(data)))
                        self.end_headers()
                        self.wfile.write(data)
                        return

        # 4. API Endpoints: Normalize path to start with /api if needed
        api_path = path
        if not api_path.startswith("/api"):
            api_path = "/api" + (api_path if api_path.startswith("/") else "/" + api_path)
        self.path = f"{api_path}?{query}" if query else api_path

        return super().do_GET()

    def do_POST(self):
        path, query = self._get_target_path()
        api_path = path
        if not api_path.startswith("/api"):
            api_path = "/api" + (api_path if api_path.startswith("/") else "/" + api_path)
        self.path = f"{api_path}?{query}" if query else api_path
        return super().do_POST()

    def do_DELETE(self):
        path, query = self._get_target_path()
        api_path = path
        if not api_path.startswith("/api"):
            api_path = "/api" + (api_path if api_path.startswith("/") else "/" + api_path)
        self.path = f"{api_path}?{query}" if query else api_path
        return super().do_DELETE()
