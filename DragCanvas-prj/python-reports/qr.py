"""QR module - generates a QR code PNG for a given URL."""
import io
import qrcode


def generate_qr(url):
    """Build a QR code image for the URL and return it as a PNG in memory (BytesIO)."""
    qr = qrcode.QRCode(box_size=8, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return buffer


if __name__ == "__main__":
    # Quick manual test: python qr.py -> saves qr_test.png
    png = generate_qr("https://dragcanvas.netlify.app")
    with open("qr_test.png", "wb") as f:
        f.write(png.read())
    print("Saved qr_test.png")
