import json, os, shutil
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageEnhance, ImageFont

ROOT = "/tmp/claude-0/-home-claude/25db1ee1-33e1-57f0-b2c4-213057f29507/scratchpad/"
OUT, SPR, DES = ROOT + "bake/out/", ROOT + "web_sprites/", ROOT + "design3/"
C = json.load(open(ROOT + "bake/catalog.json"))
GEO_FOR = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 5, 7: 7, 8: 7, 9: 7, 10: 10}
SLOT_Z = {"wr": 0, "wl": 0, "r1": 1, "r2": 2, "l1": 1.5, "l2": 2.5, "c": 3}
INK = (74, 40, 40, 255)
INTER = "/usr/share/fonts/opentype/inter/Inter-%s.otf"


def F(sz, w="SemiBold"):
    return ImageFont.truetype(INTER % w, sz)


def sparkle(d, x, y, r=9):
    d.polygon([(x, y - r), (x + r * .25, y - r * .25), (x + r, y), (x + r * .25, y + r * .25), (x, y + r), (x - r * .25, y + r * .25), (x - r, y), (x - r * .25, y - r * .25)],
              fill=(246, 199, 68, 255), outline=INK)


def sparkles(im, n=4, r=10):
    d = ImageDraw.Draw(im)
    bb = im.getchannel("A").point(lambda v: 255 if v > 120 else 0).getbbox()
    if not bb:
        return im
    pts = [(bb[2] - 14, bb[1] + 16), (bb[0] + 16, bb[1] + 30), ((bb[0] + bb[2]) // 2, bb[1] + 4), (bb[2] - 6, (bb[1] + bb[3]) // 2)]
    for x, y in pts[:n]:
        sparkle(d, x, y, r)
    return im


def glow(im, gold=False):
    a = im.getchannel("A").point(lambda v: 255 if v > 120 else 0)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    halo = Image.new("RGBA", im.size, (255, 222, 110, 0))
    halo.putalpha(a.filter(ImageFilter.GaussianBlur(14)).point(lambda v: min(130, int(v * 1.2))))
    out.alpha_composite(halo)
    out.alpha_composite(im)
    if gold:
        ring = ImageChops.subtract(a.filter(ImageFilter.MaxFilter(5)), a)
        rim = Image.new("RGBA", im.size, (240, 186, 40, 0)); rim.putalpha(ring)
        out.alpha_composite(rim)
    return out


def pad(im, p):
    o = Image.new("RGBA", (im.width + 2 * p, im.height + 2 * p), (0, 0, 0, 0)); o.alpha_composite(im, (p, p)); return o


def bake_sprites():
    for t in C["rooms"]:
        for k in C["order"]:
            src, dst = "%st%s/%s/" % (OUT, t, k), "%stier%s/%s/" % (SPR, t, k)
            os.makedirs(dst, exist_ok=True)
            shell = Image.open(src + "shell.png").convert("RGBA")
            shell.save(dst + "shell.webp", "WEBP", quality=88, method=6)
            lay = {"tier": int(t), "room": k, "name": C["rooms"][t][k]["name"], "size": list(shell.size), "items": []}
            for it in C["rooms"][t][k]["items"]:
                os.makedirs(dst + it["id"], exist_ok=True)
                e = {"id": it["id"], "name": it["name"], "slot": it["slot"], "z": SLOT_Z[it["slot"]], "levels": []}
                for lv in range(1, 11):
                    im = Image.open(src + "%s_g%02d.png" % (it["id"], GEO_FOR[lv])).convert("RGBA")
                    bb = im.getchannel("A").getbbox()
                    im = pad(im.crop(bb), 14)
                    x, y = bb[0] - 14, bb[1] - 14
                    if lv >= 9:
                        im = sparkles(im, 2, 8)
                    fn = "%s/lv%02d.webp" % (it["id"], lv)
                    im.save(dst + fn, "WEBP", quality=90, method=6)
                    e["levels"].append({"level": lv, "file": fn, "x": x, "y": y, "w": im.width, "h": im.height})
                lay["items"].append(e)
            lay["items"].sort(key=lambda e: e["z"])
            json.dump(lay, open(dst + "layout.json", "w"), indent=1)


def compose_room(t, k, level):
    dst = "%stier%s/%s/" % (SPR, t, k)
    lay = json.load(open(dst + "layout.json"))
    c = Image.open(dst + "shell.webp").convert("RGBA")
    for e in lay["items"]:
        L = e["levels"][level - 1]
        c.alpha_composite(Image.open(dst + L["file"]).convert("RGBA"), (L["x"], L["y"]))
    return c


def card_image(t, k, item, lv):
    im = Image.open("%st%s/%s/%s_g%02d.png" % (OUT, t, k, item["id"], GEO_FOR[lv])).convert("RGBA")
    im = pad(im.crop(im.getchannel("A").getbbox()), 26)
    if lv >= 6:
        im = glow(im, gold=lv >= 8)
    if lv >= 9:
        im = sparkles(im, 4, 12)
    return im


def strip(t, k, item):
    cw, ch = 210, 250
    ims = [card_image(t, k, item, lv) for lv in range(1, 11)]
    sc = min((cw - 30) / max(i.width for i in ims), (ch - 24) / max(i.height for i in ims))
    s = Image.new("RGB", (cw * 10 + 60, ch + 190), (247, 245, 240))
    d = ImageDraw.Draw(s)
    d.text((30, 18), "%s  ·  %s" % (item["name"], C["rooms"][t][k]["name"]), font=F(36), fill=(34, 49, 58))
    d.text((30, 66), "id: %s   slot: %s   tier %s" % (item["id"], item["slot"], t), font=F(22, "Regular"), fill=(91, 107, 115))
    tags = {1: "STAGE 1", 2: "+ add-on A", 3: "+ add-on B", 4: "STAGE 2", 5: "+ add-on C", 6: "+ glow", 7: "STAGE 3", 8: "+ gold rim", 9: "+ sparkles", 10: "STAGE 4"}
    for lv in range(1, 11):
        x = 30 + (lv - 1) * cw
        card = Image.new("RGBA", (cw - 12, ch), (0, 0, 0, 0))
        cd = ImageDraw.Draw(card)
        cd.rounded_rectangle([0, 0, cw - 13, ch - 1], 18, fill=(230, 245, 238, 255) if lv in (1, 4, 7, 10) else (255, 255, 255, 255), outline=(207, 216, 220, 255), width=2)
        im = ims[lv - 1].resize((max(1, int(ims[lv - 1].width * sc)), max(1, int(ims[lv - 1].height * sc))), Image.LANCZOS)
        card.alpha_composite(im, ((cw - 12 - im.width) // 2, ch - 10 - im.height))
        s.paste(card, (x, 110), card)
        cx = x + (cw - 12) // 2
        for txt, yy, f, col in [("Lv %d" % lv, ch + 128, F(26), (34, 49, 58)),
                                ("free" if lv == 1 else "%d coins" % (20 * lv), ch + 160, F(20, "Regular"), (91, 107, 115))]:
            w = d.textlength(txt, font=f); d.text((cx - w / 2, yy - 14), txt, font=f, fill=col)
        tag = tags[lv] + ("  70%" if lv >= 8 else "")
        f = F(17, "Bold"); w = d.textlength(tag, font=f)
        d.text((cx - w / 2, ch + 168), tag, font=f, fill=(47, 143, 107) if "STAGE" in tag else (201, 96, 74))
    return s


def floor_tips(im):
    a = im.getchannel("A")
    W, H = im.size
    def col_bottom(x):
        for y in range(H - 1, -1, -1):
            if a.getpixel((x, y)) > 128:
                return y
        return None
    xl = next(x for x in range(W) if any(a.getpixel((x, y)) > 128 for y in range(0, H, 2)))
    xr = next(x for x in range(W - 1, -1, -1) if any(a.getpixel((x, y)) > 128 for y in range(0, H, 2)))
    return (xl, col_bottom(xl + 2)), (xr, col_bottom(xr - 2))


def house(t, level, rooms=None, gap=70, tips=None):
    rooms = rooms or [compose_room(t, k, level) for k in C["order"]]
    (lx, ly), (rx, ry) = tips or floor_tips(rooms[0])
    step = (rx - lx) + gap
    W = rooms[0].width + step * 4
    c = Image.new("RGBA", (W, rooms[0].height), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    places = []
    for i, r in enumerate(rooms):
        x = i * step
        places.append((x, r))
        if i:
            ax, bx, y = x - step + rx - 4, x + lx + 4, ry - 34
            d.polygon([(ax, y - 16), (bx, y - 16), (bx, y + 16), (ax, y + 16)], fill=(201, 147, 94, 255))
            for k in range(int(ax), int(bx), 12):
                d.line([(k, y - 15), (k, y + 15)], fill=(176, 122, 72, 255), width=2)
            d.rectangle([ax, y + 16, bx, y + 26], fill=(143, 208, 220, 255))
            d.line([(ax, y - 36), (bx, y - 36)], fill=(139, 90, 43, 255), width=5)
            for k in (ax + 8, (ax + bx) / 2, bx - 8):
                d.line([(k, y - 36), (k, y - 16)], fill=(139, 90, 43, 255), width=5)
    for x, r in places:
        c.alpha_composite(r, (x, 0))
    return c, [x + r.width // 2 for x, r in places]


def dim(im, amt):
    if amt <= 0:
        return im
    a = im.getchannel("A")
    g = ImageEnhance.Brightness(ImageEnhance.Color(im).enhance(1 - 0.8 * amt)).enhance(1 - 0.45 * amt)
    g.putalpha(a)
    return g


def on_bg(im, path, maxw=2400, bg=(196, 238, 246, 255)):
    b = Image.new("RGBA", im.size, bg); b.alpha_composite(im)
    b = b.convert("RGB"); b.thumbnail((maxw, maxw), Image.LANCZOS); b.save(path, quality=90)


if __name__ == "__main__":
    if os.path.exists(SPR):
        shutil.rmtree(SPR)
    os.makedirs(DES + "rooms", exist_ok=True); os.makedirs(DES + "strips", exist_ok=True)
    bake_sprites()
    for t in C["rooms"]:
        for lv in (1, 10):
            rooms = [compose_room(t, k, lv) for k in C["order"]]
            for k, r in zip(C["order"], rooms):
                on_bg(r, DES + "rooms/t%s_%s_L%d.jpg" % (t, k, lv), 1400)
            h, _ = house(t, lv, rooms)
            on_bg(h, DES + "house_t%s_L%d.jpg" % (t, lv))
        for k in C["order"]:
            for it in C["rooms"][t][k]["items"]:
                strip(t, k, it).save(DES + "strips/t%s_%s.jpg" % (t, it["id"]), quality=90)
    print("ok")
