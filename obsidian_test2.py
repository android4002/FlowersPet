import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(
    'https://localhost:27124/vault/web_project_status.md',
    headers={'Authorization': 'Bearer 4cf1fc57ec1f72876cf14d5e2755ba7b8f7cc505b5aa4cc3caa8dab960d899d7'}
)

try:
    with urllib.request.urlopen(req, context=ctx) as response:
        print(response.read().decode('utf-8'))
except Exception as e:
    print(f"Error localhost: {e}")

try:
    req = urllib.request.Request(
        'https://172.17.0.1:27124/vault/web_project_status.md',
        headers={'Authorization': 'Bearer 4cf1fc57ec1f72876cf14d5e2755ba7b8f7cc505b5aa4cc3caa8dab960d899d7'}
    )
    with urllib.request.urlopen(req, context=ctx, timeout=2) as response:
        print(response.read().decode('utf-8'))
except Exception as e:
    print(f"Error 172.17.0.1: {e}")
