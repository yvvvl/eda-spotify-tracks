"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  BarChart3,
  Database,
  Disc3,
  Flame,
  Gauge,
  Music2,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Zap,
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

const mockData = {
  metadata: {
    total_tracks: 12,
    total_genres: 5,
    avg_popularity: 72.8,
    explicit_rate: 33.3,
    top_genre: "pop",
    top_track: {
      track_name: "Midnight Signal",
      artist: "Neon Atlas",
      popularity: 94,
    },
  },
  tracks: [
    { track_name: "Midnight Signal", artist: "Neon Atlas", genre: "pop", popularity: 94, explicit: false, danceability: 0.78, energy: 0.86, valence: 0.72, tempo: 124, acousticness: 0.12, instrumentalness: 0.02, liveness: 0.1, speechiness: 0.04, duration_min: 3.4 },
    { track_name: "Golden Static", artist: "Data Bloom", genre: "electronic", popularity: 88, explicit: false, danceability: 0.71, energy: 0.91, valence: 0.63, tempo: 128, acousticness: 0.08, instrumentalness: 0.42, liveness: 0.12, speechiness: 0.05, duration_min: 4.1 },
    { track_name: "Glass Roads", artist: "Kairo", genre: "rock", popularity: 81, explicit: true, danceability: 0.52, energy: 0.82, valence: 0.55, tempo: 142, acousticness: 0.2, instrumentalness: 0.01, liveness: 0.19, speechiness: 0.06, duration_min: 3.8 },
    { track_name: "South Loop", artist: "Mina Code", genre: "hip-hop", popularity: 79, explicit: true, danceability: 0.84, energy: 0.7, valence: 0.61, tempo: 96, acousticness: 0.18, instrumentalness: 0, liveness: 0.09, speechiness: 0.18, duration_min: 2.9 },
    { track_name: "Low Light", artist: "Arden", genre: "indie", popularity: 76, explicit: false, danceability: 0.61, energy: 0.58, valence: 0.49, tempo: 116, acousticness: 0.36, instrumentalness: 0.08, liveness: 0.13, speechiness: 0.03, duration_min: 3.6 },
    { track_name: "Pulse Frame", artist: "Vanta", genre: "electronic", popularity: 74, explicit: false, danceability: 0.69, energy: 0.87, valence: 0.59, tempo: 130, acousticness: 0.05, instrumentalness: 0.31, liveness: 0.2, speechiness: 0.04, duration_min: 5.2 },
    { track_name: "After Hours", artist: "North Room", genre: "pop", popularity: 71, explicit: true, danceability: 0.75, energy: 0.66, valence: 0.7, tempo: 104, acousticness: 0.22, instrumentalness: 0.01, liveness: 0.11, speechiness: 0.08, duration_min: 3.2 },
    { track_name: "Quiet Machine", artist: "Elian", genre: "indie", popularity: 68, explicit: false, danceability: 0.56, energy: 0.5, valence: 0.41, tempo: 112, acousticness: 0.44, instrumentalness: 0.12, liveness: 0.15, speechiness: 0.03, duration_min: 4.0 },
    { track_name: "Circuit Love", artist: "Nova Path", genre: "electronic", popularity: 65, explicit: false, danceability: 0.73, energy: 0.8, valence: 0.66, tempo: 126, acousticness: 0.09, instrumentalness: 0.22, liveness: 0.14, speechiness: 0.04, duration_min: 3.9 },
    { track_name: "Rough Tape", artist: "Blue Gate", genre: "rock", popularity: 61, explicit: true, danceability: 0.49, energy: 0.78, valence: 0.52, tempo: 150, acousticness: 0.16, instrumentalness: 0.02, liveness: 0.22, speechiness: 0.07, duration_min: 3.5 },
    { track_name: "Paper City", artist: "Milo Flux", genre: "hip-hop", popularity: 59, explicit: false, danceability: 0.8, energy: 0.64, valence: 0.57, tempo: 92, acousticness: 0.25, instrumentalness: 0, liveness: 0.1, speechiness: 0.2, duration_min: 2.7 },
    { track_name: "Amber Sea", artist: "Rae Mont", genre: "pop", popularity: 58, explicit: false, danceability: 0.63, energy: 0.54, valence: 0.69, tempo: 118, acousticness: 0.31, instrumentalness: 0.01, liveness: 0.12, speechiness: 0.04, duration_min: 3.3 },
  ],
  genre_summary: [],
  correlation: {
    columns: ["popularity", "danceability", "energy", "valence", "tempo", "acousticness"],
    values: [
      [1, 0.42, 0.38, 0.22, 0.12, -0.31],
      [0.42, 1, 0.35, 0.48, -0.2, -0.26],
      [0.38, 0.35, 1, 0.31, 0.4, -0.55],
      [0.22, 0.48, 0.31, 1, -0.12, -0.18],
      [0.12, -0.2, 0.4, -0.12, 1, -0.2],
      [-0.31, -0.26, -0.55, -0.18, -0.2, 1],
    ],
  },
};

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

function average(items, field) {
  if (!items.length) return 0;
  return items.reduce((acc, item) => acc + Number(item[field] ?? 0), 0) / items.length;
}

function KpiCard({ title, value, subtitle, icon, delay = 0 }) {
  return (
    <article className="kpi-card reveal" style={{ animationDelay: `${delay}ms` }}>
      <div className="kpi-topline">
        <span>{title}</span>
        <div className="kpi-icon">{icon}</div>
      </div>
      <strong>{value}</strong>
      <p>{subtitle}</p>
    </article>
  );
}

function EmptyState({ message, onReset }) {
  return (
    <div className="empty-state">
      <AlertTriangle size={28} />
      <p>{message}</p>
      {onReset && (
        <button className="ghost-button compact" onClick={onReset}>
          <RotateCcw size={15} />
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

function AudioVisualizer() {
  return (
    <div className="visualizer-card" aria-hidden="true">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="record">
        <div className="record-ring" />
        <Disc3 size={72} />
        <div className="record-core" />
      </div>
      <div className="equalizer">
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} style={{ animationDelay: `${index * 75}ms` }} />
        ))}
      </div>
    </div>
  );
}

function ProgressRow({ label, value, accent = "primary" }) {
  const normalized = Math.max(0, Math.min(100, Number(value) * (Number(value) <= 1 ? 100 : 1)));

  return (
    <div className="progress-row">
      <div>
        <span>{label}</span>
        <strong>{normalized.toFixed(0)}/100</strong>
      </div>
      <div className="progress-track">
        <span className={accent === "gold" ? "gold" : ""} style={{ width: `${normalized}%` }} />
      </div>
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
      color: "#e5e2e1",
      family: "Geist, Inter, system-ui, sans-serif",
      size: 12,
    },
    margin: { l: 70, r: 28, t: 24, b: bottom },
    xaxis: {
      title: xTitle,
      automargin: true,
      gridcolor: "rgba(255,255,255,0.08)",
      zerolinecolor: "rgba(255,255,255,0.12)",
      tickfont: { color: "#bccbb9" },
    },
    yaxis: {
      title: yTitle,
      automargin: true,
      gridcolor: "rgba(255,255,255,0.08)",
      zerolinecolor: "rgba(255,255,255,0.12)",
      tickfont: { color: "#bccbb9" },
    },
  };
}

export default function Home() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  const [selectedGenre, setSelectedGenre] = useState("Todos");
  const [explicitFilter, setExplicitFilter] = useState("Todos");
  const [selectedMetric, setSelectedMetric] = useState("popularity");
  const [minPopularity, setMinPopularity] = useState(0);

  useEffect(() => {
    fetch("/spotify_dashboard_data.json")
      .then((response) => {
        if (!response.ok) throw new Error("JSON no encontrado");
        return response.json();
      })
      .then((data) => {
        if (!data.tracks || !Array.isArray(data.tracks)) {
          throw new Error("El JSON no tiene la estructura esperada.");
        }
        setDashboardData(data);
      })
      .catch(() => {
        setDashboardData(mockData);
        setUsingMock(true);
        setLoadError(null);
      });
  }, []);

  const allTracks = useMemo(() => dashboardData?.tracks ?? [], [dashboardData]);

  const genres = useMemo(() => {
    if (!allTracks.length) return ["Todos"];
    const counts = new Map();
    allTracks.forEach((track) => counts.set(track.genre || "Unknown", (counts.get(track.genre || "Unknown") || 0) + 1));
    return ["Todos", ...Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([genre]) => genre)];
  }, [allTracks]);

  const tracksByGenre = useMemo(() => {
    if (selectedGenre === "Todos") return allTracks;
    return allTracks.filter((track) => track.genre === selectedGenre);
  }, [allTracks, selectedGenre]);

  const tracksByGenreAndExplicit = useMemo(() => {
    if (explicitFilter === "Todos") return tracksByGenre;
    return tracksByGenre.filter((track) =>
      explicitFilter === "Explícitas" ? track.explicit === true : track.explicit === false
    );
  }, [tracksByGenre, explicitFilter]);

  const filteredTracks = useMemo(() => {
    return tracksByGenreAndExplicit.filter((track) => Number(track.popularity ?? 0) >= Number(minPopularity));
  }, [tracksByGenreAndExplicit, minPopularity]);

  const genreChartData = useMemo(() => {
    const summary = new Map();
    filteredTracks.forEach((track) => {
      const genre = track.genre || "Unknown";
      if (!summary.has(genre)) summary.set(genre, { genre, tracks: 0, popularity: 0 });
      const item = summary.get(genre);
      item.tracks += 1;
      item.popularity += Number(track.popularity ?? 0);
    });

    return Array.from(summary.values())
      .map((item) => ({ ...item, avg_popularity: item.popularity / item.tracks }))
      .sort((a, b) => b.tracks - a.tracks)
      .slice(0, 15);
  }, [filteredTracks]);

  const topTracks = useMemo(() => {
    return filteredTracks
      .slice()
      .sort((a, b) => Number(b[selectedMetric] ?? 0) - Number(a[selectedMetric] ?? 0))
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
      return { total: 0, avgPopularity: 0, avgEnergy: 0, avgDanceability: 0 };
    }
    return {
      total: filteredTracks.length,
      avgPopularity: average(filteredTracks, "popularity").toFixed(2),
      avgEnergy: average(filteredTracks, "energy").toFixed(2),
      avgDanceability: average(filteredTracks, "danceability").toFixed(2),
    };
  }, [filteredTracks]);

  const explicitOptions = useMemo(() => {
    return {
      explicitCount: tracksByGenre.filter((track) => track.explicit).length,
      nonExplicitCount: tracksByGenre.filter((track) => !track.explicit).length,
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

  if (!dashboardData && !loadError) {
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

  const metadata = dashboardData.metadata;
  const metricLabel = metricOptions.find((item) => item.value === selectedMetric)?.label ?? selectedMetric;
  const hasData = filteredTracks.length > 0;

  return (
    <main className="app-shell">
      <div className="background-grid" />
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><BarChart3 size={22} /></div>
          <div>
            <strong>Track Intelligence</strong>
            <span>Spotify analytics workspace</span>
          </div>
        </div>
        <nav>
          <a href="#dashboard">Dashboard</a>
          <a href="#insights">Insights</a>
          <a href="#charts">Visualizaciones</a>
        </nav>
        <div className="science-pill"><Sparkles size={15} /> Data Science</div>
      </header>

      <section id="dashboard" className="hero-section reveal">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={16} /> Data Science</div>
          <h1>Spotify Tracks Intelligence Dashboard</h1>
          <p>Explora patrones de popularidad, energía, danceability y géneros musicales a partir de un dataset de Spotify.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={resetFilters}><RotateCcw size={16} /> Reiniciar análisis</button>
            <span className="live-chip"><span /> Live analytics</span>
          </div>
          {usingMock && <div className="mock-alert">Usando datos demo. Cuando exista <code>public/spotify_dashboard_data.json</code>, se cargarán tus datos reales.</div>}
        </div>
        <AudioVisualizer />
      </section>

      <section className="kpi-grid">
        <KpiCard title="Tracks procesados" value={formatNumber(metadata.total_tracks)} subtitle="Canciones únicas del dataset" icon={<Database size={22} />} delay={80} />
        <KpiCard title="Popularidad promedio" value={metadata.avg_popularity} subtitle="Promedio global, escala 0 a 100" icon={<Star size={22} />} delay={160} />
        <KpiCard title="Géneros detectados" value={metadata.total_genres} subtitle={`Principal: ${metadata.top_genre}`} icon={<Music2 size={22} />} delay={240} />
        <KpiCard title="Contenido explícito" value={`${metadata.explicit_rate}%`} subtitle="Proporción global del dataset" icon={<Flame size={22} />} delay={320} />
      </section>

      <section className="filters-panel reveal">
        <div className="filters-header">
          <div>
            <div className="section-title"><SlidersHorizontal size={20} /><h2>Filtros dinámicos</h2></div>
            <p>Tracks visibles: <strong>{formatNumber(currentStats.total)}</strong> · Popularidad filtrada: <strong>{currentStats.avgPopularity}</strong></p>
          </div>
          <button className="ghost-button" onClick={resetFilters}><RotateCcw size={16} /> Limpiar filtros</button>
        </div>

        <div className="filters-grid">
          <label>Género
            <select value={selectedGenre} onChange={(event) => handleGenreChange(event.target.value)}>
              {genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
            </select>
          </label>
          <label>Tipo de contenido
            <select value={explicitFilter} onChange={(event) => handleExplicitChange(event.target.value)}>
              <option value="Todos">Todos</option>
              <option value="Explícitas">Explícitas ({formatNumber(explicitOptions.explicitCount)})</option>
              <option value="No explícitas">No explícitas ({formatNumber(explicitOptions.nonExplicitCount)})</option>
            </select>
          </label>
          <label>KPI para ranking
            <select value={selectedMetric} onChange={(event) => setSelectedMetric(event.target.value)}>
              {metricOptions.map((metric) => <option key={metric.value} value={metric.value}>{metric.label}</option>)}
            </select>
          </label>
          <label>Popularidad mínima: {minPopularity}
            <input type="range" min="0" max="100" value={minPopularity} onChange={(event) => setMinPopularity(event.target.value)} />
          </label>
        </div>

        <div className="filter-stats">
          <span><Gauge size={15} /> Energy filtrada: <strong>{currentStats.avgEnergy}</strong></span>
          <span><Zap size={15} /> Danceability filtrada: <strong>{currentStats.avgDanceability}</strong></span>
          <span><TrendingUp size={15} /> Popularidad filtrada: <strong>{currentStats.avgPopularity}</strong></span>
        </div>

        {!hasData && <div className="filter-warning"><AlertTriangle size={18} /> Esta combinación no tiene canciones. Limpia los filtros o baja la popularidad mínima.</div>}
      </section>

      <section id="insights" className="insight-layout">
        <article className="featured-card reveal">
          <div className="featured-glow" />
          <div className="featured-label"><Trophy size={18} /> Track más popular</div>
          <h2>{metadata.top_track.track_name}</h2>
          <p>{metadata.top_track.artist}</p>
          <ProgressRow label="Popularidad" value={metadata.top_track.popularity} accent="gold" />
          <ProgressRow label="Energy filtrada" value={currentStats.avgEnergy} />
          <ProgressRow label="Danceability filtrada" value={currentStats.avgDanceability} />
        </article>

        <article className="chart-card wide reveal" id="charts">
          <div className="chart-heading"><h2>Top 10 canciones por {metricLabel}</h2><span>{formatNumber(topTracks.length)} resultados</span></div>
          {topTracks.length ? (
            <Plot
              data={[{
                type: "bar",
                orientation: "h",
                x: topTracks.map((track) => Number(track[selectedMetric] ?? 0)),
                y: topTracks.map((track) => `${track.track_name} · ${track.artist}`),
                marker: { color: topTracks.map((track) => Number(track[selectedMetric] ?? 0)), colorscale: [[0, "#2a2a2a"], [0.55, "#1db954"], [1, "#e9c349"]] },
                hovertemplate: "<b>%{y}</b><br>Valor: %{x}<extra></extra>",
              }]}
              layout={getPlotLayout({ height: 500, xTitle: metricLabel, bottom: 50 })}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: "100%", height: "100%" }}
            />
          ) : <EmptyState message="No hay canciones para los filtros seleccionados." onReset={resetFilters} />}
        </article>
      </section>

      <section className="charts-grid">
        <article className="chart-card reveal">
          <div className="chart-heading"><h2>Distribución por género</h2><span>Datos filtrados</span></div>
          {genreChartData.length ? (
            <Plot
              data={[{
                type: "bar",
                x: genreChartData.map((item) => item.genre),
                y: genreChartData.map((item) => Number(item.tracks ?? 0)),
                marker: { color: genreChartData.map((item) => Number(item.avg_popularity ?? 0)), colorscale: [[0, "#2a2a2a"], [0.55, "#1db954"], [1, "#e9c349"]] },
                hovertemplate: "<b>%{x}</b><br>Tracks: %{y}<br>Popularidad promedio: %{marker.color:.2f}<extra></extra>",
              }]}
              layout={getPlotLayout({ height: 450, xTitle: "Género", yTitle: "Tracks", bottom: 105 })}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: "100%", height: "100%" }}
            />
          ) : <EmptyState message="No hay géneros disponibles con los filtros actuales." onReset={resetFilters} />}
        </article>

        <article className="chart-card reveal">
          <div className="chart-heading"><h2>Energy vs Danceability</h2><span>{formatNumber(scatterTracks.length)} puntos</span></div>
          {scatterTracks.length ? (
            <Plot
              data={[{
                type: "scattergl",
                mode: "markers",
                x: scatterTracks.map((track) => Number(track.energy ?? 0)),
                y: scatterTracks.map((track) => Number(track.danceability ?? 0)),
                text: scatterTracks.map((track) => `${track.track_name} · ${track.artist}`),
                marker: { size: scatterTracks.map((track) => Math.max(6, Number(track.popularity ?? 0) / 8)), color: scatterTracks.map((track) => Number(track.popularity ?? 0)), colorscale: [[0, "#38413a"], [0.55, "#1db954"], [1, "#e9c349"]], opacity: 0.8 },
                hovertemplate: "<b>%{text}</b><br>Energy: %{x}<br>Danceability: %{y}<extra></extra>",
              }]}
              layout={getPlotLayout({ height: 450, xTitle: "Energy", yTitle: "Danceability", bottom: 60 })}
              config={{ responsive: true, displayModeBar: false }}
              style={{ width: "100%", height: "100%" }}
            />
          ) : <EmptyState message="No hay puntos para graficar con estos filtros." onReset={resetFilters} />}
        </article>

        <article className="chart-card full reveal">
          <div className="chart-heading"><h2>Mapa de calor de correlación musical</h2><span>Audio features</span></div>
          <Plot
            data={[{
              type: "heatmap",
              z: dashboardData.correlation.values,
              x: dashboardData.correlation.columns,
              y: dashboardData.correlation.columns,
              colorscale: [[0, "#261a1a"], [0.5, "#1c1b1b"], [0.75, "#1db954"], [1, "#e9c349"]],
              zmin: -1,
              zmax: 1,
              hovertemplate: "<b>%{x}</b> vs <b>%{y}</b><br>Correlación: %{z}<extra></extra>",
            }]}
            layout={{ ...getPlotLayout({ height: 520, bottom: 90 }), xaxis: { automargin: true, tickangle: -35, tickfont: { color: "#bccbb9" } }, yaxis: { automargin: true, tickfont: { color: "#bccbb9" } } }}
            config={{ responsive: true, displayModeBar: false }}
            style={{ width: "100%", height: "100%" }}
          />
        </article>
      </section>
    </main>
  );
}
