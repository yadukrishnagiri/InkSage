"""Cut the screen recording into a full-frame, silent 25-second app demo."""

from pathlib import Path
import argparse
import subprocess

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
WORK = OUT.parent / "video_edit_work"
WORK.mkdir(exist_ok=True)
parser = argparse.ArgumentParser(description="Create a 25-second InkSage demo from a screen recording.")
parser.add_argument("source", type=Path, help="Path to the original screen recording")
SOURCE = parser.parse_args().source.resolve()
if not SOURCE.is_file():
    parser.error(f"Recording not found: {SOURCE}")
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 30
W, H = 1910, 1006
FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf"

# Source start, source duration, output duration, title, explanation.
SHOTS = [
    (0.0, 1.5, 1.5, "Study by subject", "Keep course PDFs together."),
    (3.4, 2.8, 2.8, "Create a subject", "Name this space Biology."),
    (17.2, 3.2, 3.2, "Add a PDF", "InkSage reads its pages locally."),
    (56.0, 3.2, 3.2, "PDF ready", "The source is available for questions."),
    (86.8, 7.8, 4.6, "Ask your notes", "Type a question in the subject chat."),
    (94.6, 4.5, 4.5, "Get a grounded answer", "The response uses this subject's PDFs."),
    (109.6, 5.4, 5.2, "Check the citation", "Open the highlighted passage in the PDF."),
]


def run(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL)


def popup(title, detail, number):
    """Transparent overlay: footage remains at its original full size."""
    image = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    x0, y0, x1, y1 = 565, 19, 1345, 145
    draw.rounded_rectangle((x0 + 7, y0 + 9, x1 + 7, y1 + 9), radius=30, fill=(26, 19, 49, 92))
    draw.polygon([(673, y1 + 9), (714, y1 + 9), (688, y1 + 32)], fill=(26, 19, 49, 92))
    draw.rounded_rectangle((x0, y0, x1, y1), radius=30, fill=(44, 29, 86, 243))
    draw.polygon([(669, y1 - 2), (711, y1 - 2), (685, y1 + 24)], fill=(44, 29, 86, 243))
    draw.ellipse((590, 52, 655, 117), fill=(253, 205, 103, 255))
    nfont = ImageFont.truetype(FONT_BOLD, 29)
    nbox = draw.textbbox((0, 0), str(number), font=nfont)
    draw.text((622 - (nbox[2] - nbox[0]) / 2, 62), str(number), font=nfont, fill="#261d43")
    draw.text((680, 37), title, font=ImageFont.truetype(FONT_BOLD, 32), fill="#ffffff")
    draw.text((680, 86), detail, font=ImageFont.truetype(FONT_REG, 23), fill="#e6dcff")
    return image


for index, (start, source_length, duration, title, detail) in enumerate(SHOTS):
    overlay = WORK / f"popup_{index:02d}.png"
    popup(title, detail, index + 1).save(overlay)
    speed = source_length / duration
    target = WORK / f"shot_{index:02d}.mp4"
    filters = (
        f"[0:v]setpts=(PTS-STARTPTS)/{speed:.8f},fps={FPS},setsar=1[screen];"
        "[1:v]format=rgba,fade=t=in:st=0:d=0.20:alpha=1[pop];"
        "[screen][pop]overlay=0:0:shortest=1,format=yuv420p[out]"
    )
    run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y",
         "-ss", str(start), "-t", str(source_length), "-i", str(SOURCE),
         "-loop", "1", "-framerate", str(FPS), "-i", str(overlay),
         "-filter_complex", filters, "-map", "[out]", "-an",
         "-frames:v", str(round(duration * FPS)), "-c:v", "libx264",
         "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", str(target)])

concat_file = WORK / "concat.txt"
concat_file.write_text("".join(f"file '{(WORK / f'shot_{i:02d}.mp4').as_posix()}'\n" for i in range(len(SHOTS))), encoding="utf-8")
output = OUT / "InkSage_Portfolio_Demo_25s.mp4"
run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0",
     "-i", str(concat_file), "-map", "0:v:0", "-an", "-c", "copy",
     "-movflags", "+faststart", str(output)])

poster = OUT / "InkSage_Portfolio_Demo_Poster.jpg"
run([FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-ss", "21",
     "-i", str(output), "-frames:v", "1", str(poster)])
print(output)
