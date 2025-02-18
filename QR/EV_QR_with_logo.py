import qrcode
from PIL import Image

# Station information
stationID = 1
web_Url = f"http://192.168.3.5:5501/login.html?stationID={stationID}"

# Generate the QR code
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=10,
    border=4,
)
qr.add_data(web_Url)
qr.make(fit=True)

# Create the QR code image and convert it to RGBA mode
qr_code_img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")

# Add an image in the middle of the QR code
logo_path = "./logo.jpg"  # Path to your logo image
logo_size = 150  # Desired size of the logo

# Open the logo image
logo = Image.open(logo_path)

# Convert the logo to RGBA if it doesn't have an alpha channel
if logo.mode != "RGBA":
    logo = logo.convert("RGBA")

# Resize the logo
logo = logo.resize((logo_size, logo_size), Image.LANCZOS)

# Create a mask from the logo's alpha channel
logo_mask = logo.split()[3]  # Extract the alpha channel

# Calculate the position to paste the logo
qr_width, qr_height = qr_code_img.size
logo_pos = (
    (qr_width - logo_size) // 2,
    (qr_height - logo_size) // 2,
)

# Paste the logo onto the QR code with the mask
qr_code_img.paste(logo, logo_pos, mask=logo_mask)

# Save the final QR code with the logo
qr_code_path = f"./station{stationID}_qr_code.png"
qr_code_img.save(qr_code_path)

print(f"QR code saved at: {qr_code_path}")
