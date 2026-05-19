"""
Demo dataset provider — downloads public datasets on demand and caches them locally.
Never stores data permanently per-user; cache is server-side only.
"""
import os
import logging
import requests
from pathlib import Path

logger = logging.getLogger(__name__)

CACHE_DIR = Path(__file__).parent / "workspace" / "demos"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

DEMO_DATASETS = {
    "titanic": {
        "filename": "titanic.csv",
        "url": "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv",
        "description": "Titanic survival dataset — Binary Classification (891 rows, 12 cols)",
    },
    "boston": {
        "filename": "boston_housing.csv",
        "url": "https://raw.githubusercontent.com/selva86/datasets/master/BostonHousing.csv",
        "description": "Boston Housing dataset — Regression (506 rows, 14 cols)",
    },
    "mall": {
        "filename": "mall_customers.csv",
        "url": "https://raw.githubusercontent.com/SteffiPeTaffy/machineLearningAZ/master/Machine%20Learning%20A-Z%20Template%20Folder/Part%204%20-%20Clustering/Section%2025%20-%20Hierarchical%20Clustering/Mall_Customers.csv",
        "description": "Mall Customers dataset — Clustering (200 rows, 5 cols)",
    },
    "iris": {
        "filename": "iris.csv",
        "url": "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv",
        "description": "Iris flower dataset — Multi-class Classification (150 rows, 5 cols)",
    },
}


def get_demo_path(demo_id: str) -> Path:
    """
    Returns local path to cached demo dataset, downloading it if needed.
    Raises ValueError for unknown demo IDs.
    Raises RuntimeError if download fails.
    """
    if demo_id not in DEMO_DATASETS:
        raise ValueError(f"Unknown demo dataset: '{demo_id}'. Valid IDs: {list(DEMO_DATASETS.keys())}")

    info = DEMO_DATASETS[demo_id]
    cached_path = CACHE_DIR / info["filename"]

    if cached_path.exists():
        logger.info(f"Demo '{demo_id}' loaded from cache: {cached_path}")
        return cached_path

    logger.info(f"Downloading demo '{demo_id}' from {info['url']}")
    try:
        response = requests.get(info["url"], timeout=30)
        response.raise_for_status()
        cached_path.write_bytes(response.content)
        logger.info(f"Demo '{demo_id}' cached at {cached_path}")
        return cached_path
    except Exception as e:
        raise RuntimeError(f"Failed to download demo dataset '{demo_id}': {e}")


def list_demos() -> list[dict]:
    """Return metadata for all available demo datasets."""
    return [
        {
            "id": demo_id,
            "filename": info["filename"],
            "description": info["description"],
            "cached": (CACHE_DIR / info["filename"]).exists(),
        }
        for demo_id, info in DEMO_DATASETS.items()
    ]
