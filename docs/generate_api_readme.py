"""
Generate API_README.md files for TypeDoc by stripping the customer reference section
from each package's README.md and the root README.md.

Registered as an mkdocs on_pre_build hook so it runs automatically during `mkdocs build`.
Can also be run standalone: python3 docs/generate_api_readme.py
"""

import re
from pathlib import Path


# Removes the full section body (heading through the last sub-section before ## License)
SECTION_PATTERN = re.compile(
    r"\n## How to support Powertools for AWS Lambda \(TypeScript\)\?.*?(?=\n## )",
    re.DOTALL,
)

# Removes the TOC entry and its indented children
TOC_ENTRY_PATTERN = re.compile(
    r"\n- \[How to support Powertools for AWS Lambda \(TypeScript\)\?[^\n]*"
    r"(?:\n    - \[[^\n]*)*",
)


def generate(root: Path = Path(".")) -> None:
    targets = [root] + sorted((root / "packages").iterdir())
    for pkg in targets:
        readme = pkg / "README.md"
        if not readme.exists():
            continue
        content = readme.read_text(encoding="utf-8")
        clean = SECTION_PATTERN.sub("", content)
        clean = TOC_ENTRY_PATTERN.sub("", clean)
        (pkg / "API_README.md").write_text(clean, encoding="utf-8")


# mkdocs hook entry point
def on_pre_build(config) -> None:  # noqa: ANN001
    generate()


if __name__ == "__main__":
    generate()
