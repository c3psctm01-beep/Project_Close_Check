import sys
import os
import urllib.parse
import json

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
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "ok",
            "service": "PEA SAP Construction Closing Inspector API"
        }, ensure_ascii=False).encode("utf-8"))
        return None

    def _resolve_path_and_query(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query, keep_blank_values=True)

        # Check if Vercel passed __path parameter from rewrites
        if "__path" in qs:
            raw_subpath = qs.pop("__path")[0]
            clean_sub = raw_subpath.strip("/")
            api_path = f"/api/{clean_sub}" if clean_sub else "/api"
            new_query = urllib.parse.urlencode(qs, doseq=True)
            return api_path, new_query

        # Fallback to headers or path inspection
        matched = self.headers.get("x-matched-path", "")
        if matched and matched != "/api/index.py":
            return matched, parsed.query

        path = parsed.path
        if "/api/index.py" in path:
            path = path.replace("/api/index.py", "").strip()

        return path, parsed.query

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        api_path, query = self._resolve_path_and_query()

        # 1. API Root info
        if api_path in ["/api", "/api/"]:
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
                    "/api/projects/update-name",
                    "/api/projects/update-target",
                    "/api/projects/delete",
                    "/api/export-approval-docx",
                    "/api/download-approval-docx"
                ]
            }, ensure_ascii=False).encode("utf-8"))
            return

        # 2. If index.html or root
        if api_path in ["", "/", "/index.html"]:
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

        # 3. Static assets fallback
        for ext, ctype in [(".css", "text/css; charset=utf-8"), (".js", "application/javascript; charset=utf-8"), (".json", "application/json; charset=utf-8")]:
            if api_path.endswith(ext):
                fname = os.path.basename(api_path)
                for a_path in [os.path.join(PUBLIC_DIR, fname), os.path.join(PARENT_DIR, fname)]:
                    if os.path.exists(a_path):
                        with open(a_path, "rb") as f:
                            data = f.read()
                        self.send_response(200)
                        self.send_header("Content-Type", ctype)
                        self.send_header("Content-Length", str(len(data)))
                        self.end_headers()
                        self.wfile.write(data)
                        return

        # 4. Standard API Dispatch
        if not api_path.startswith("/api"):
            api_path = "/api" + (api_path if api_path.startswith("/") else "/" + api_path)
        self.path = f"{api_path}?{query}" if query else api_path

        return super().do_GET()

    def do_POST(self):
        api_path, query = self._resolve_path_and_query()
        if not api_path.startswith("/api"):
            api_path = "/api" + (api_path if api_path.startswith("/") else "/" + api_path)
        self.path = f"{api_path}?{query}" if query else api_path
        return super().do_POST()

    def do_DELETE(self):
        api_path, query = self._resolve_path_and_query()
        if not api_path.startswith("/api"):
            api_path = "/api" + (api_path if api_path.startswith("/") else "/" + api_path)
        self.path = f"{api_path}?{query}" if query else api_path
        return super().do_DELETE()
