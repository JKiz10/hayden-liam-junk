"""Send the pages changed by the last push to IndexNow (see indexnow.yml)."""
import json
import os
import re
import subprocess
import urllib.request

HOST = 'hljunkremovalandhauling.com'
KEY = '2d47f1890b2521c7e1e9f2334c05550e'
SITE = 'https://' + HOST
# Files outside the sitemap that answer engines read directly.
EXTRA = {'llms.txt': SITE + '/llms.txt'}


def sitemap_urls():
    with open('sitemap.xml', encoding='utf-8') as f:
        return re.findall(r'<loc>([^<]+)</loc>', f.read())


def changed_files():
    before = os.environ.get('BEFORE', '')
    if not before or set(before) == {'0'}:
        return None
    try:
        out = subprocess.run(['git', 'diff', '--name-only', before, 'HEAD'],
                             check=True, capture_output=True, text=True).stdout
    except subprocess.CalledProcessError:
        return None  # commit not in the shallow history: resubmit everything
    return [line for line in out.splitlines() if line]


def file_to_url(path):
    if path in EXTRA:
        return EXTRA[path]
    if path == 'index.html':
        return SITE + '/'
    if path.endswith('/index.html'):
        return SITE + '/' + path[:-len('index.html')]
    if path.endswith('.html'):
        return SITE + '/' + path
    return None


def main():
    listed = sitemap_urls()
    files = None if os.environ.get('ALL') == 'true' else changed_files()
    if files is None:
        urls = listed + list(EXTRA.values())
    else:
        allowed = set(listed) | set(EXTRA.values())
        urls = sorted({u for u in map(file_to_url, files) if u in allowed})
    if not urls:
        print('No indexable pages changed; nothing to send.')
        return
    body = json.dumps({'host': HOST, 'key': KEY,
                       'keyLocation': f'{SITE}/{KEY}.txt',
                       'urlList': urls[:10000]}).encode()
    req = urllib.request.Request('https://api.indexnow.org/indexnow', data=body,
                                 headers={'Content-Type': 'application/json; charset=utf-8'})
    print(f'Sending {len(urls)} URL(s):', *urls, sep='\n  ')
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            print('IndexNow answered', resp.status)
    except urllib.error.HTTPError as err:
        # 429 means too many pings today; the pages still get crawled normally.
        print('IndexNow answered', err.code, err.read().decode(errors='replace')[:300])
        if err.code not in (429,):
            raise


if __name__ == '__main__':
    main()
