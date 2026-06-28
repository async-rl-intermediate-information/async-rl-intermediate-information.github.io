"""Export paper PDF figures to PNG for the project website."""

from pathlib import Path

import fitz

SRC_DIR = Path(__file__).resolve().parents[1] / "figures"
OUT_DIR = Path(__file__).resolve().parents[1] / "static" / "images" / "figures"

FIGURES = [
    "Teaser.pdf",
    "Overview.pdf",
    "IntermediateState.pdf",
    "SimResults.pdf",
    "RealWorldResults.pdf",
    "AblationVariantsNoRtc.pdf",
    "AblationVariantsRtc.pdf",
    "AblationNoRtcSwimmer.pdf",
    "AblationRtcSwimmer.pdf",
    "DelaySensitivityNoRtc.pdf",
    "DelaySensitivitySwimmer.pdf",
    "NoiseDistribution.pdf",
]


def export_figure(pdf_path: Path, png_path: Path, zoom: float = 2.0) -> None:
    doc = fitz.open(pdf_path)
    page = doc[0]
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    png_path.parent.mkdir(parents=True, exist_ok=True)
    pix.save(png_path)
    doc.close()
    print(f"Wrote {png_path.name} ({pix.width}x{pix.height})")


def main() -> None:
    missing = []
    for name in FIGURES:
        src = SRC_DIR / name
        if not src.exists():
            missing.append(name)
            continue
        export_figure(src, OUT_DIR / name.replace(".pdf", ".png"))

    if missing:
        print("Missing source PDFs (place in figures/):")
        for name in missing:
            print(f"  - {name}")


if __name__ == "__main__":
    main()
