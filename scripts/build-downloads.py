#!/usr/bin/env python3
"""Rebuilds the download archives in dist/downloads from what the page shows.

Needs: fonttools + brotli (pip install fonttools brotli). The colour sheet PNG is rendered separately
(source-assets/colors/RSK_Colors.png, from RSK_Colors.svg). Run from the repository root.

Archives: RSK_Colors.zip, RSK_Map.zip, RSK_Projects.zip and RSK_Brand_Kit.zip (everything above plus logos and fonts).
RSK_Logos.zip and RSK_Fonts.zip are kept as they are; the kit reuses their files.
"""
import struct, zipfile, io, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = os.getcwd()
P = lambda *a: os.path.join(ROOT, *a)
COLORS = [
    dict(name='Голубой', hex='#72C6EF', rgb=(114, 198, 239), cmyk=(52, 17, 0, 6), pantone='Pantone 297 C'),
    dict(name='Светлый фон', hex='#F6F6F6', rgb=(246, 246, 246), cmyk=(0, 0, 0, 4), pantone='Pantone 663 C'),
    dict(name='Белый', hex='#FFFFFF', rgb=(255, 255, 255), cmyk=(0, 0, 0, 0), pantone='Pantone White'),
]
INK = '#0b1b26'

fonts = {w: TTFont(P('dist/assets/fonts/GolosText-%s.woff2' % w)) for w in ('Regular', 'Medium')}

def text_path(text, weight, size, x, y, tracking=0.0):
    f = fonts[weight]; gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f['head'].unitsPerEm
    s = size / upm; d = []; cx = x
    for ch in text:
        g = cmap.get(ord(ch))
        if g is None: continue
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, cx, y)))
        d.append(pen.getCommands())
        cx += gs[g].width * s + tracking * size
    return ' '.join(x for x in d if x)

def colors_svg():
    W, H, G, R = 1328, 340, 12, 17
    widths = [560, 372, 372]
    out = ['<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d" fill="none">' % (W, H, W, H)]
    x0 = 0
    for c, w in zip(COLORS, widths):
        main = c['hex'] == '#72C6EF'
        fg = '#FFFFFF' if main else INK
        out.append('<rect x="%d" y="0" width="%d" height="%d" rx="%d" fill="%s"%s/>' % (x0, w, H, R, c['hex'], '' if main else ' stroke="#E7E9EA" stroke-width="1"'))
        px = x0 + 28
        out.append('<path d="%s" fill="%s" fill-opacity="%s"/>' % (text_path(c['name'], 'Medium', 14, px, 44), fg, '.92' if main else '.72'))
        size = 72 if main else 32
        base = 130 if main else 102
        out.append('<path d="%s" fill="%s"/>' % (text_path(c['hex'], 'Medium', size, px, base, -.04), fg))
        vals = ['RGB ' + ', '.join(map(str, c['rgb'])), 'CMYK ' + ', '.join(map(str, c['cmyk'])), c['pantone']]
        for i, v in enumerate(vals):
            out.append('<path d="%s" fill="%s"/>' % (text_path(v, 'Regular', 14, px, H - 28 - 18 - (2 - i) * 28, .012), fg))
        x0 += w + G
    out.append('</svg>')
    return '\n'.join(out)

def colors_ase():
    blocks = b''
    for c in COLORS:
        name = ('%s %s' % (c['name'], c['hex'])).encode('utf-16-be') + b'\x00\x00'
        body = struct.pack('>H', len(name) // 2) + name + b'RGB ' + struct.pack('>fff', *[v / 255 for v in c['rgb']]) + struct.pack('>H', 2)
        blocks += struct.pack('>HI', 1, len(body)) + body
    return b'ASEF' + struct.pack('>HHI', 1, 0, len(COLORS)) + blocks

def colors_txt():
    lines = ['РСК: фирменные цвета', '']
    for c in COLORS:
        lines += [c['name'], '  HEX    ' + c['hex'], '  RGB    ' + ', '.join(map(str, c['rgb'])), '  CMYK   ' + ', '.join(map(str, c['cmyk'])), '  ' + c['pantone'], '']
    lines.append('CMYK рассчитан из RGB, Pantone ближайший. Для печати сверяйте значения с брендбуком.')
    return '\n'.join(lines) + '\n'

def zip_bytes(entries):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name, data in entries: z.writestr(name, data)
    return buf.getvalue()

def read(p):
    with open(p, 'rb') as f: return f.read()

# --- inputs
os.makedirs(P('source-assets/colors'), exist_ok=True); os.makedirs(P('source-assets/projects'), exist_ok=True)
kit_path = P('dist/downloads/RSK_Brand_Kit.zip')
old_kit = zipfile.ZipFile(io.BytesIO(read(kit_path))) if os.path.exists(kit_path) else None
if not os.listdir(P('source-assets/projects')) and old_kit:
    for n in old_kit.namelist():
        if n.startswith('Projects/') and not n.endswith('/'):
            open(P('source-assets/projects', os.path.basename(n)), 'wb').write(old_kit.read(n))
open(P('source-assets/colors/RSK_Colors.svg'), 'w', encoding='utf8').write(colors_svg())
open(P('source-assets/colors/RSK_Colors.ase'), 'wb').write(colors_ase())
open(P('source-assets/colors/RSK_Colors.txt'), 'w', encoding='utf8').write(colors_txt())
colors = [(n, read(P('source-assets/colors', n))) for n in ('RSK_Colors.ase', 'RSK_Colors.svg', 'RSK_Colors.png', 'RSK_Colors.txt')]
map_files = [('RSK_Map.svg', read(P('dist/assets/rsk-map.svg'))), ('RSK_Map.png', read(P('dist/assets/rsk-map.png')))]
projects = [(n, read(P('source-assets/projects', n))) for n in sorted(os.listdir(P('source-assets/projects')))]
logos_zip = zipfile.ZipFile(P('dist/downloads/RSK_Logos.zip'))
logos = [(n, logos_zip.read(n)) for n in logos_zip.namelist()]
fonts_zip = zipfile.ZipFile(P('dist/downloads/RSK_Fonts.zip'))
kit_fonts = [(n, fonts_zip.read(n)) for n in ('GolosText-Regular.woff2', 'GolosText-Medium.woff2', 'GolosText-Variable.ttf', 'OFL.txt')]

archives = {
    'RSK_Colors.zip': colors,
    'RSK_Map.zip': map_files,
    'RSK_Projects.zip': projects,
    'RSK_Brand_Kit.zip': [('Logos/' + n, d) for n, d in logos] + [('Colors/' + n, d) for n, d in colors] + [('Fonts/' + n, d) for n, d in kit_fonts]
                         + [('Map/' + n, d) for n, d in map_files] + [('Projects/' + n, d) for n, d in projects],
}
for name, entries in archives.items():
    data = zip_bytes(entries)
    open(P('dist/downloads', name), 'wb').write(data)
    print(name, len(data), 'bytes,', len(entries), 'files')
