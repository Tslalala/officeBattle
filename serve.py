# -*- coding: utf-8 -*-
"""
职场神话 - 本地服务器
静态托管本目录 + 把 /v1/* 反代到大模型服务，绕开浏览器跨域限制。

用法:
    python serve.py            # 默认端口 8787
    python serve.py 9000       # 自定义端口

然后浏览器打开 http://127.0.0.1:8787/game.html
"""
import os
import sys
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

try:
    PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8787
except ValueError:
    sys.exit("用法: python serve.py [端口号]")
UPSTREAM = "http://10.133.72.161:20133"
MIMO_UPSTREAM = "https://api.xiaomimimo.com/anthropic"
ROOT = Path(__file__).parent


def mimo_api_key():
    # 密钥不进 git：优先读环境变量，其次读同目录 mimo_key.txt（已在 .gitignore 中）
    key = os.environ.get("MIMO_API_KEY")
    if key:
        return key.strip()
    key_file = ROOT / "mimo_key.txt"
    if key_file.exists():
        return key_file.read_text(encoding="utf-8").strip()
    return ""


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        if self.path.startswith("/mimo/"):
            return self.proxy_mimo()
        if self.path != "/v1/chat/completions":
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", 0) or 0)
        except ValueError:
            self.send_error(400, "invalid Content-Length")
            return
        if length <= 0 or length > 1024 * 1024:
            self.send_error(413, "invalid request size")
            return
        body = self.rfile.read(length)
        headers = {
            "Content-Type": "application/json",
            "Authorization": self.headers.get("Authorization", "Bearer callmemaybe"),
        }
        req = urllib.request.Request(UPSTREAM + self.path, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                data, status = r.read(), r.status
        except urllib.error.HTTPError as e:
            data, status = e.read(), e.code
        except Exception as e:  # upstream unreachable
            data = ('{"error":{"message":"upstream unreachable: %s"}}' % e).encode("utf-8")
            status = 502
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def proxy_mimo(self):
        # 反代小米 MiMo（Anthropic 格式）：/mimo/v1/messages -> MIMO_UPSTREAM/v1/messages
        try:
            length = int(self.headers.get("Content-Length", 0) or 0)
        except ValueError:
            self.send_error(400, "invalid Content-Length")
            return
        if length <= 0 or length > 1024 * 1024:
            self.send_error(413, "invalid request size")
            return
        body = self.rfile.read(length)
        headers = {
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
        }
        key = mimo_api_key()
        if key:
            headers["x-api-key"] = key
        req = urllib.request.Request(MIMO_UPSTREAM + self.path[len("/mimo"):], data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                data, status = r.read(), r.status
        except urllib.error.HTTPError as e:
            data, status = e.read(), e.code
        except Exception as e:
            data = ('{"error":{"type":"upstream_unreachable","message":"%s"}}' % e).encode("utf-8")
            status = 502
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    print(f"职场神话服务器已启动: http://127.0.0.1:{PORT}/game.html")
    print(f"大模型反代: {MIMO_UPSTREAM}/v1/messages（密钥: 环境变量 MIMO_API_KEY 或 mimo_key.txt）")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
