# Learning to Act While Waiting — Project Website

Project page for **Asynchronous RL with Intermediate Information (ARLI)**, submitted to CoRL 2026.

Live site (after push to `main`): https://async-rl-intermediate-information.github.io/

## Local preview

```bash
python serve.py
```

Then open http://localhost:8000/

## Repository layout

```
index.html                 # main project page
static/
  paper.pdf                # linked from the hero "Paper" button
  css/                     # Bulma + site styles
  js/                      # table-of-contents + figure placeholders
  images/
    figures/               # PNGs consumed by index.html
  videos/                  # optional rollout clips
figures/                   # LaTeX-exported source PDFs for export script
scripts/
  export_figures.py        # figures/*.pdf -> static/images/figures/*.png
```

## Adding figures

1. Export individual figure PDFs from your LaTeX project into a top-level `figures/` directory.
2. Install PyMuPDF: `pip install pymupdf`
3. Run: `python scripts/export_figures.py`

Expected source filenames:

| Source PDF | Output PNG | Paper figure |
|------------|------------|--------------|
| `Teaser.pdf` | `Teaser.png` | Figure 1 |
| `Overview.pdf` | `Overview.png` | Figure 2 |
| `IntermediateState.pdf` | `IntermediateState.png` | Figure 3 |
| `SimResults.pdf` | `SimResults.png` | Figure 4 |
| `RealWorldResults.pdf` | `RealWorldResults.png` | Figure 5 |
| `AblationVariantsNoRtc.pdf` | `AblationVariantsNoRtc.png` | Figure 6 |
| `AblationVariantsRtc.pdf` | `AblationVariantsRtc.png` | Figure 7 |
| `AblationNoRtcSwimmer.pdf` | `AblationNoRtcSwimmer.png` | Figure 9 |
| `AblationRtcSwimmer.pdf` | `AblationRtcSwimmer.png` | Figure 10 |
| `DelaySensitivityNoRtc.pdf` | `DelaySensitivityNoRtc.png` | Figure 8 |
| `DelaySensitivitySwimmer.pdf` | `DelaySensitivitySwimmer.png` | Figure 11 |
| `NoiseDistribution.pdf` | `NoiseDistribution.png` | Figure 12 |

Until PNGs are present, the site shows dashed placeholders with the expected filename.

## Adding videos (optional)

Place `.mp4` files in `static/videos/` and reference them from `index.html`.
Replace the real-world video placeholder block when clips are ready.

## Website license

This website template is borrowed from [NeRFies](https://nerfies.github.io) under a [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).

## Citation

```bibtex
@inproceedings{anonymous2026arli,
  title     = {Learning to Act While Waiting: RL Finetuning of Generalist Robot Policies Under Inference Latency},
  author    = {Zhu, Brian and Khalil, Momen and Harrison, E. H. and Poggi, Emanuele and Schmitt, Philipp Sebastian and Kast, Bernd and Meister, Philine and Atreya, Pranav and Li, Qiyang and Ferchau, Finn and Colmenero, Cesar and Shahapurkar, Yash and Narayanan, Gokul and Erdogan, Melih and Mees, Oier and Wurm, Kai M. and von Wichert, Georg and Solowjow, Eugen and Wagenmaker, Andrew and Levine, Sergey},
  booktitle = {Submitted to CoRL 2026},
  year      = {2026},
}
```
