"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  BarChart3,
  Disc3,
  Flame,
  Music2,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const Plot = dynamic(
  async () => {
    const Plotly = await import("plotly.js-dist-min");
    const createPlotlyComponent = (
      await import("react-plotly.js/factory")
    ).default;

    return createPlotlyComponent(Plotly);
  },
  { ssr: false }
);

const metricOptions = [
  { value: "popularity", label: "Popularidad" },
  { value: "danceability", label: "Danceability" },
  { value: "energy", label: "Energy" },
  { value: "valence", label: "Valence" },
  { value: "tempo", label: "Tempo" },
  { value: "duration_min", label: "Duración" },
];

function formatNumber(value) {
  return new Intl.NumberFormat("es-CL").format(value ?? 0);
}

function KpiCard({ title, value, subtitle, icon }) {
  return (
    <article className="kpi-card">
      <div className="kpi-icon">{icon}</div>
      <div>
        <p className="kpi-title">{title}</p>
        <h3 className="kpi-value">{value}</h3>
        <p className="kpi-subtitle">{subtitle}</p>
      </div>
    </article>
  );
}

function EmptyState({ message, onReset }) {
  return (
    <div className="empty-state">
      <AlertTriangle size={28} />
      <p>{message}</p>
      {onReset && (
        <button className="reset-button small" onClick={onReset}>
          <RotateCcw size={15} />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

function getPlotLayout({ height = 460, xTitle = "", yTitle = "", bottom = 70 }) {
  return {
    height,
    autosize: true,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: {
      color: "#f5efe7",
      family: "Inter, system-ui, sans-serif",
      size: 12,
    },
    margin: {
      l: 70,
      r: 28,
      t: 24,
      b: bottom,
    },
    xaxis: {
      title: xTitle,
      automargin: true,
      gridcolor: "rgba(255,255,255,0.08)",
      zerolinecolor: "rgba(255,255,255,0.12)",
      tickfont: { color: "#f5efe7" },
    },
    yaxis: {
      title: yTitle,
      automargin: true,
      gridcolor: "rgba(255,255,255,0.08)",
      zerolinecolor: "rgba(255,255,255,0.12)",
      tickfont: { color: "#f5efe7" },
    },
  };
}

export default function Home() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [explicitFilter, setExplicitFilter] = useState("Todos");
  const [selectedMetric, setSelectedMetric] = useState("popularity");
  const [minPopularity, setMinPopularity] = useState(0);

  useEffect(() => {
    fetch("/spotify_dashboard_data.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "No se encontró spotify_dashboard_data.json. Ejecuta python scripts/prepare_data.py"
          );
        }

        return response.json();
      })
      .then((data) => {
        if (!data.tracks || !Array.isArray(data.tracks)) {
          throw new Error("El JSON no tiene la estructura esperada.");
        }

        setDashboardData(data);
      })
      .catch((error) => setLoadError(error.message));
  }, []);

  const allTracks = useMemo(() => {
    return dashboardData?.tracks ?? [];
  }, [dashboardData]);

  const genres = useMemo(() => {
    if (!allTracks.length) return ["Todos"];

    const genreCounts = new Map();

    allTracks.forEach((track) => {
      const genre = track.genre || "Unknown";
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
    });

    const sortedGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre);

    return ["Todos", ...sortedGenres];
  }, [allTracks]);

  const tracksByGenre = useMemo(() => {
    if (selectedGenre === "Todos") return allTracks;
    return allTracks.filter((track) => track.genre === selectedGenre);
  }, [allTracks, selectedGenre]);

  const tracksByGenreAndExplicit = useMemo(() => {
    if (explicitFilter === "Todos") return tracksByGenre;

    return tracksByGenre.filter((track) => {
      if (explicitFilter === "Explícitas") return track.explicit === true;
      if (explicitFilter === "No explícitas") return track.explicit === false;
      return true;
    });
  }, [tracksByGenre, explicitFilter]);

  const filteredTracks = useMemo(() => {
    return tracksByGenreAndExplicit.filter(
      (track) => Number(track.popularity ?? 0) >= Number(minPopularity)
    );
  }, [tracksByGenreAndExplicit, minPopularity]);

  const genreChartData = useMemo(() => {
    const summary = new Map();

    filteredTracks.forEach((track) => {
      const genre = track.genre || "Unknown";

      if (!summary.has(genre)) {
        summary.set(genre, {
          genre,
          tracks: 0,
          popularity: 0,
        });
      }

      const item = summary.get(genre);
      item.tracks += 1;
      item.popularity += Number(track.popularity ?? 0);
    });

    return Array.from(summary.values())
      .map((item) => ({
        genre: item.genre,
        tracks: item.tracks,
        avg_popularity: item.popularity / item.tracks,
      }))
      .sort((a, b) => b.tracks - a.tracks)
      .slice(0, 15);
  }, [filteredTracks]);

  const topTracks = useMemo(() => {
    return filteredTracks
      .slice()
      .sort(
        (a, b) =>
          Number(b[selectedMetric] ?? 0) - Number(a[selectedMetric] ?? 0)
      )
      .slice(0, 10)
      .reverse();
  }, [filteredTracks, selectedMetric]);

  const scatterTracks = useMemo(() => {
    const limit = 1600;

    if (filteredTracks.length <= limit) return filteredTracks;

    const step = Math.ceil(filteredTracks.length / limit);
    return filteredTracks.filter((_, index) => index % step === 0).slice(0, limit);
  }, [filteredTracks]);

  const currentStats = useMemo(() => {
    if (!filteredTracks.length) {
      return {
        total: 0,
        avgPopularity: 0,
        avgEnergy: 0,
        avgDanceability: 0,
      };
    }

    const total = filteredTracks.length;

    const avg = (field) =>
      (
        filteredTracks.reduce(
          (acc, item) => acc + Number(item[field] ?? 0),
          0
        ) / total
      ).toFixed(2);

    return {
      total,
      avgPopularity: avg("popularity"),
      avgEnergy: avg("energy"),
      avgDanceability: avg("danceability"),
    };
  }, [filteredTracks]);

  const explicitOptions = useMemo(() => {
    const explicitCount = tracksByGenre.filter((track) => track.explicit).length;
    const nonExplicitCount = tracksByGenre.filter((track) => !track.explicit).length;

    return {
      explicitCount,
      nonExplicitCount,
    };
  }, [tracksByGenre]);

  function resetFilters() {
    setSelectedGenre("Todos");
    setExplicitFilter("Todos");
    setSelectedMetric("popularity");
    setMinPopularity(0);
  }

  function handleGenreChange(value) {
    setSelectedGenre(value);
    setExplicitFilter("Todos");
    setMinPopularity(0);
  }

  function handleExplicitChange(value) {
    setExplicitFilter(value);
    setMinPopularity(0);
  }

  if (loadError) {
    return (
      <main className="loading-screen">
        <div className="loader-card error-card">
          <AlertTriangle size={44} />
          <h1>No se pudieron cargar los datos</h1>
          <p>{loadError}</p>
          <code>python scripts/prepare_data.py</code>
        </div>
      </main>
    );
  }

  if (!dashboardData) {
    return (
      <main className="loading-screen">
        <div className="loader-card">
          <Disc3 className="loader-icon" size={44} />
          <h1>Cargando Spotify Intelligence Dashboard...</h1>
          <p>Preparando métricas, géneros y patrones musicales.</p>
        </div>
      </main>
    );
  }

  const metadata = dashboardData.metadata;
  const hasData = filteredTracks.length > 0;

  return (
    <main className="dashboard">
      <section className="hero">
        <div>
          <div className="eyebrow">
            <Sparkles size={16} />
            Data Science
          </div>

          <h1>Spotify Tracks Intelligence Dashboard</h1>

          <p>
            Dashboard interactivo construido con Python, Pandas, Next.js y
            Plotly para transformar un EDA musical en una experiencia visual de
            análisis de datos.
          </p>
        </div>

        <div className="hero-badge">
          <Disc3 size={48} />
          <span>Live Analytics</span>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard
          title="Tracks procesados"
          value={formatNumber(metadata.total_tracks)}
          subtitle="Canciones únicas del dataset"
          icon={<Music2 size={24} />}
        />

        <KpiCard
          title="Popularidad promedio"
          value={metadata.avg_popularity}
          subtitle="Promedio global, escala 0 a 100"
          icon={<TrendingUp size={24} />}
        />

        <KpiCard
          title="Géneros detectados"
          value={metadata.total_genres}
          subtitle={`Principal: ${metadata.top_genre}`}
          icon={<BarChart3 size={24} />}
        />

        <KpiCard
          title="Contenido explícito"
          value={`${metadata.explicit_rate}%`}
          subtitle="Proporción global del dataset"
          icon={<Flame size={24} />}
        />
      </section>

      <section className="filters-card">
        <div className="filters-header">
          <div>
            <div className="filters-title">
              <SlidersHorizontal size={20} />
              <h2>Filtros dinámicos</h2>
            </div>

            <p>
              Tracks visibles: <strong>{formatNumber(currentStats.total)}</strong>{" "}
              · Popularidad filtrada: <strong>{currentStats.avgPopularity}</strong>
            </p>
          </div>

          <button className="reset-button" onClick={resetFilters}>
            <RotateCcw size={16} />
            Limpiar filtros
          </button>
        </div>

        <div className="filters-grid">
          <label>
            Género
            <select
              value={selectedGenre}
              onChange={(event) => handleGenreChange(event.target.value)}
            >
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tipo de contenido
            <select
              value={explicitFilter}
              onChange={(event) => handleExplicitChange(event.target.value)}
            >
              <option value="Todos">Todos</option>
              <option value="Explícitas">
                Explícitas ({formatNumber(explicitOptions.explicitCount)})
              </option>
              <option value="No explícitas">
                No explícitas ({formatNumber(explicitOptions.nonExplicitCount)})
              </option>
            </select>
          </label>

          <label>
            KPI para ranking
            <select
              value={selectedMetric}
              onChange={(event) => setSelectedMetric(event.target.value)}
            >
              {metricOptions.map((metric) => (
                <option key={metric.value} value={metric.value}>
                  {metric.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Popularidad mínima: {minPopularity}
            <input
              type="range"
              min="0"
              max="100"
              value={minPopularity}
              onChange={(event) => setMinPopularity(event.target.value)}
            />
          </label>
        </div>

        {!hasData && (
          <div className="filter-warning">
            <AlertTriangle size={18} />
            Esta combinación no tiene canciones. Limpia los filtros o baja la
            popularidad mínima.
          </div>
        )}
      </section>

      <section className="insight-card">
        <div>
          <p className="insight-label">Track más popular del dataset</p>
          <h2>{metadata.top_track.track_name}</h2>
          <p>
            {metadata.top_track.artist} · Popularidad{" "}
            {metadata.top_track.popularity}/100
          </p>
        </div>

        <div className="mini-stats">
          <span>Energy filtrada: {currentStats.avgEnergy}</span>
          <span>Danceability filtrada: {currentStats.avgDanceability}</span>
        </div>
      </section>

      <section className="charts-grid">
        <article className="chart-card">
          <h2>Top 10 canciones por KPI seleccionado</h2>

          {topTracks.length ? (
            <Plot
              data={[
                {
                  type: "bar",
                  orientation: "h",
                  x: topTracks.map((track) =>
                    Number(track[selectedMetric] ?? 0)
                  ),
                  y: topTracks.map(
                    (track) => `${track.track_name} · ${track.artist}`
                  ),
                  marker: {
                    color: topTracks.map((track) =>
                      Number(track[selectedMetric] ?? 0)
                    ),
                    colorscale: "YlOrBr",
                  },
                  hovertemplate:
                    "<b>%{y}</b><br>Valor: %{x}<extra></extra>",
                },
              ]}
              layout={getPlotLayout({
                height: 520,
                xTitle:
                  metricOptions.find((item) => item.value === selectedMetric)
                    ?.label ?? selectedMetric,
                bottom: 50,
              })}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <EmptyState
              message="No hay canciones para los filtros seleccionados."
              onReset={resetFilters}
            />
          )}
        </article>

        <article className="chart-card">
          <h2>Distribución por género</h2>

          {genreChartData.length ? (
            <Plot
              data={[
                {
                  type: "bar",
                  x: genreChartData.map((item) => item.genre),
                  y: genreChartData.map((item) => Number(item.tracks ?? 0)),
                  marker: {
                    color: genreChartData.map((item) =>
                      Number(item.avg_popularity ?? 0)
                    ),
                    colorscale: "YlOrBr",
                  },
                  hovertemplate:
                    "<b>%{x}</b><br>Tracks: %{y}<extra></extra>",
                },
              ]}
              layout={getPlotLayout({
                height: 460,
                xTitle: "Género",
                yTitle: "Cantidad de canciones",
                bottom: 100,
              })}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <EmptyState
              message="No hay géneros disponibles con los filtros actuales."
              onReset={resetFilters}
            />
          )}
        </article>

        <article className="chart-card">
          <h2>Energy vs Danceability</h2>

          {scatterTracks.length ? (
            <Plot
              data={[
                {
                  type: "scattergl",
                  mode: "markers",
                  x: scatterTracks.map((track) => Number(track.energy ?? 0)),
                  y: scatterTracks.map((track) =>
                    Number(track.danceability ?? 0)
                  ),
                  text: scatterTracks.map(
                    (track) => `${track.track_name} · ${track.artist}`
                  ),
                  marker: {
                    size: scatterTracks.map((track) =>
                      Math.max(6, Number(track.popularity ?? 0) / 8)
                    ),
                    color: scatterTracks.map((track) =>
                      Number(track.popularity ?? 0)
                    ),
                    colorscale: "YlOrBr",
                    opacity: 0.78,
                  },
                  hovertemplate:
                    "<b>%{text}</b><br>Energy: %{x}<br>Danceability: %{y}<extra></extra>",
                },
              ]}
              layout={getPlotLayout({
                height: 460,
                xTitle: "Energy",
                yTitle: "Danceability",
                bottom: 60,
              })}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <EmptyState
              message="No hay puntos para graficar con estos filtros."
              onReset={resetFilters}
            />
          )}
        </article>

        <article className="chart-card">
          <h2>Mapa de calor de correlación musical</h2>

          <Plot
            data={[
              {
                type: "heatmap",
                z: dashboardData.correlation.values,
                x: dashboardData.correlation.columns,
                y: dashboardData.correlation.columns,
                colorscale: "YlOrBr",
                zmin: -1,
                zmax: 1,
                hovertemplate:
                  "<b>%{x}</b> vs <b>%{y}</b><br>Correlación: %{z}<extra></extra>",
              },
            ]}
            layout={{
              ...getPlotLayout({
                height: 520,
                bottom: 90,
              }),
              xaxis: {
                automargin: true,
                tickangle: -35,
                tickfont: { color: "#f5efe7" },
              },
              yaxis: {
                automargin: true,
                tickfont: { color: "#f5efe7" },
              },
            }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%", height: "100%" }}
          />
        </article>
      </section>
    </main>
  );
}