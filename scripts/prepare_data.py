from pathlib import Path
import json
import pandas as pd
import numpy as np


ROOT_DIR = Path(__file__).resolve().parents[1]
DATASET_DIR = ROOT_DIR / "Dataset"
PUBLIC_DIR = ROOT_DIR / "public"
OUTPUT_FILE = PUBLIC_DIR / "spotify_dashboard_data.json"


def find_csv_file() -> Path:
    csv_files = list(DATASET_DIR.glob("*.csv"))

    if not csv_files:
        raise FileNotFoundError("No se encontró ningún CSV dentro de Dataset/.")

    return csv_files[0]


def read_csv_safely(csv_path: Path) -> pd.DataFrame:
    encodings = ["utf-8", "utf-8-sig", "latin1", "ISO-8859-1"]
    separators = [",", ";", "\t"]

    for encoding in encodings:
        for sep in separators:
            try:
                df = pd.read_csv(csv_path, encoding=encoding, sep=sep)
                if df.shape[1] > 1:
                    return df
            except Exception:
                pass

    raise RuntimeError("No se pudo leer el CSV correctamente.")


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df.columns = (
        df.columns.astype(str)
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("-", "_")
        .str.replace(".", "_")
    )

    rename_map = {
        "track_name": "track_name",
        "song_name": "track_name",
        "name": "track_name",
        "title": "track_name",
        "artist_name": "artist",
        "artists": "artist",
        "artist": "artist",
        "track_artist": "artist",
        "track_genre": "genre",
        "playlist_genre": "genre",
        "genre": "genre",
        "genres": "genre",
        "popularity": "popularity",
        "track_popularity": "popularity",
        "explicit": "explicit",
        "danceability": "danceability",
        "energy": "energy",
        "valence": "valence",
        "tempo": "tempo",
        "acousticness": "acousticness",
        "instrumentalness": "instrumentalness",
        "liveness": "liveness",
        "speechiness": "speechiness",
        "duration_ms": "duration_ms",
    }

    return df.rename(
        columns={column: rename_map[column] for column in df.columns if column in rename_map}
    )


def ensure_required_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    defaults = {
        "track_name": "Unknown Track",
        "artist": "Unknown Artist",
        "genre": "Unknown",
        "popularity": 0,
        "explicit": False,
        "danceability": np.nan,
        "energy": np.nan,
        "valence": np.nan,
        "tempo": np.nan,
        "acousticness": np.nan,
        "instrumentalness": np.nan,
        "liveness": np.nan,
        "speechiness": np.nan,
        "duration_ms": np.nan,
    }

    for column, value in defaults.items():
        if column not in df.columns:
            df[column] = value

    return df


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    for column in ["track_name", "artist", "genre"]:
        df[column] = (
            df[column]
            .fillna("Unknown")
            .astype(str)
            .str.strip()
            .replace("", "Unknown")
        )

    numeric_columns = [
        "popularity",
        "danceability",
        "energy",
        "valence",
        "tempo",
        "acousticness",
        "instrumentalness",
        "liveness",
        "speechiness",
        "duration_ms",
    ]

    for column in numeric_columns:
        df[column] = pd.to_numeric(df[column], errors="coerce")

    df["popularity"] = df["popularity"].fillna(0).clip(0, 100)

    audio_features = [
        "danceability",
        "energy",
        "valence",
        "acousticness",
        "instrumentalness",
        "liveness",
        "speechiness",
    ]

    for column in audio_features:
        median = df[column].median()
        if pd.isna(median):
            median = 0
        df[column] = df[column].fillna(median).clip(0, 1)

    df["tempo"] = df["tempo"].fillna(df["tempo"].median() if not pd.isna(df["tempo"].median()) else 120)
    df["duration_ms"] = df["duration_ms"].fillna(
        df["duration_ms"].median() if not pd.isna(df["duration_ms"].median()) else 210000
    )

    df["duration_min"] = (df["duration_ms"] / 60000).round(2)

    df["explicit"] = (
        df["explicit"]
        .astype(str)
        .str.lower()
        .isin(["true", "1", "yes", "si", "sí", "explicit"])
    )

    df = df.drop_duplicates(subset=["track_name", "artist"], keep="first")
    df = df.reset_index(drop=True)

    return df


def build_payload(df: pd.DataFrame) -> dict:
    track_columns = [
        "track_name",
        "artist",
        "genre",
        "popularity",
        "explicit",
        "danceability",
        "energy",
        "valence",
        "tempo",
        "acousticness",
        "instrumentalness",
        "liveness",
        "speechiness",
        "duration_min",
    ]

    tracks = df[track_columns].round(3)

    genre_summary = (
        df.groupby("genre", as_index=False)
        .agg(
            tracks=("track_name", "count"),
            avg_popularity=("popularity", "mean"),
            avg_danceability=("danceability", "mean"),
            avg_energy=("energy", "mean"),
            avg_valence=("valence", "mean"),
            explicit_rate=("explicit", "mean"),
        )
        .sort_values("tracks", ascending=False)
        .round(3)
    )

    correlation_columns = [
        "popularity",
        "danceability",
        "energy",
        "valence",
        "tempo",
        "acousticness",
        "instrumentalness",
        "liveness",
        "speechiness",
        "duration_min",
    ]

    correlation = df[correlation_columns].corr(numeric_only=True).fillna(0).round(3)

    top_track = df.sort_values("popularity", ascending=False).iloc[0]

    return {
        "metadata": {
            "total_tracks": int(len(df)),
            "total_genres": int(df["genre"].nunique()),
            "avg_popularity": round(float(df["popularity"].mean()), 2),
            "explicit_rate": round(float(df["explicit"].mean() * 100), 2),
            "top_genre": str(df["genre"].value_counts().index[0]),
            "top_track": {
                "track_name": str(top_track["track_name"]),
                "artist": str(top_track["artist"]),
                "popularity": int(top_track["popularity"]),
            },
        },
        "tracks": tracks.to_dict(orient="records"),
        "genre_summary": genre_summary.to_dict(orient="records"),
        "correlation": {
            "columns": correlation.columns.tolist(),
            "values": correlation.values.tolist(),
        },
    }


def main() -> None:
    csv_path = find_csv_file()
    print(f"CSV encontrado: {csv_path}")

    df = read_csv_safely(csv_path)
    print(f"Filas originales: {len(df)}")
    print(f"Columnas originales: {list(df.columns)}")

    df = normalize_columns(df)
    df = ensure_required_columns(df)
    df = clean_data(df)

    payload = build_payload(df)

    PUBLIC_DIR.mkdir(exist_ok=True)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False)

    print("JSON generado correctamente.")
    print(f"Ruta: {OUTPUT_FILE}")
    print(f"Tracks enviados al front: {len(payload['tracks'])}")
    print(f"Géneros detectados: {payload['metadata']['total_genres']}")


if __name__ == "__main__":
    main()