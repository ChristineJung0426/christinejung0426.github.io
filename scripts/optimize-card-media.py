"""Build homepage-only previews; preserve project detail media."""
from pathlib import Path
from PIL import Image
import re, subprocess, sys, hashlib
from urllib.parse import unquote

ffmpeg = sys.argv[1]
root = Path(__file__).resolve().parents[1]
page = root / 'index.html'
html = page.read_text(encoding='utf-8')
out = root / 'images' / 'card-previews'
out.mkdir(parents=True, exist_ok=True)
cache = {}
before = after = 0

def preview(src, video=False):
    global before, after
    if src in cache:
        return cache[src]
    file = root / unquote(src)
    key = file.stem.replace(' ', '-') + '-' + hashlib.sha256(src.encode()).hexdigest()[:8]
    prefix = 'images/card-previews/' + key
    poster = prefix + '.webp'
    if video:
        subprocess.run([ffmpeg, '-y', '-v', 'error', '-i', str(file), '-frames:v', '1', '-vf', r'scale=min(1000\,iw):-2', str(root / poster)], check=True)
        result = (src, poster)
    elif file.suffix.lower() == '.gif':
        target = prefix + '.mp4'
        subprocess.run([ffmpeg, '-y', '-v', 'error', '-i', str(file), '-vf', r'fps=20,scale=min(800\,iw):-2', '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(root / target)], check=True)
        im = Image.open(file).convert('RGB')
        im.thumbnail((800, 800))
        im.save(root / poster, quality=82)
        result = (target, poster)
    else:
        im = Image.open(file).convert('RGB')
        im.thumbnail((1200, 1200))
        im.save(root / poster, quality=83)
        result = (poster, None) if (root / poster).stat().st_size < file.stat().st_size else (src, None)
    before += file.stat().st_size
    after += (root / result[0]).stat().st_size
    if result[1]: after += (root / result[1]).stat().st_size
    cache[src] = result
    return result

def replace(m):
    tag = m.group(0)
    src = re.search(r' src="([^"]+)"', tag).group(1)
    if src.startswith('images/card-previews/'):
        return tag
    is_video = tag.startswith('<video')
    path, poster = preview(src, is_video)
    if poster:
        tag = re.sub(r'\s(?:autoplay|loading="[^"]*"|preload="[^"]*")', '', tag)
        tag = tag.replace('<img ', '<video ').replace(' alt=', ' aria-label=')
        tag = tag.replace('src="'+src+'"', 'data-src="'+path+'"')
        tag = tag[:-1] + ' preload="none"' + ('' if ' muted' in tag else ' muted loop playsinline') + '>'
        if 'card-img-hover' not in tag:
            tag = tag[:-1] + ' poster="'+poster+'">'
        if not is_video: tag += '</video>'
    else:
        tag = tag.replace('src="'+src+'"', 'src="'+path+'"')
        if 'loading=' not in tag: tag = tag[:-1] + ' loading="lazy">'
        if 'decoding=' not in tag: tag = tag[:-1] + ' decoding="async">'
    return tag

html = re.sub(r'<(?:img|video)\b[^>]*\ssrc="[^"]+"[^>]*>', replace, html)
page.write_text(html, encoding='utf-8')
print(f'Referenced unique media: {before/1048576:.1f} MiB -> {after/1048576:.1f} MiB (including video posters)')
