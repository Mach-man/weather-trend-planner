import { useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import "./App.css";

const API_KEY = "8c031696f3a272342daeb4a69c921880"; // 🔑 Your real API key

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [trend, setTrend] = useState([]);
  const [insight, setInsight] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHome, setShowHome] = useState(true);

  const resetApp = () => {
    setShowHome(true);
    setCity("");
    setWeather(null);
    setTrend([]);
    setInsight("");
    setError("");
    setLoading(false);
  };

  const fetchWeather = async () => {
    if (!city.trim()) {
      setError("Please enter a city name");
      return;
    }

    setShowHome(false);
    setError("");
    setLoading(true);
    setWeather(null);
    setTrend([]);
    setInsight("");

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
      );
      const data = await response.json();

      if (data.cod !== "200") {
        throw new Error(data.message || "City not found");
      }

      setWeather({
        name: data.city.name,
        temp: data.list[0].main.temp,
        condition: data.list[0].weather[0].main,
      });

      const processed = processForecast(data);
      setTrend(processed);
      setInsight(generateInsight(processed, data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processForecast = (data) => {
    const daily = {};
    data.list.forEach((item) => {
      const date = item.dt_txt.split(" ")[0];
      if (!daily[date]) daily[date] = [];
      daily[date].push(item.main.temp);
    });

    return Object.keys(daily).map((date) => {
      const temps = daily[date];
      const avg = temps.reduce((sum, t) => sum + t, 0) / temps.length;
      return { date, temp: avg };
    });
  };

  const generateInsight = (trend, data) => {
    if (!trend || trend.length === 0) return "";

    let hottest = trend[0];
    let coldest = trend[0];

    trend.forEach((day) => {
      if (day.temp > hottest.temp) hottest = day;
      if (day.temp < coldest.temp) coldest = day;
    });

    if (hottest.temp > 35) return `🔥 Very hot day on ${hottest.date}`;
    if (coldest.temp < 5) return `❄️ Cold warning on ${coldest.date}`;

    const rain = data.list.find((item) =>
      item.weather[0].main.toLowerCase().includes("rain")
    );
    if (rain) return `🌧 Rain expected on ${rain.dt_txt.split(" ")[0]}`;

    return `✅ Best day: ${hottest.date} (${hottest.temp.toFixed(1)}°C)`;
  };

  const chartData = {
    labels: trend.map((d) => d.date),
    datasets: [
      {
        label: "Temperature (°C)",
        data: trend.map((d) => d.temp),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.2)",
        borderWidth: 3,
        pointRadius: 3,
        tension: 0.35,
      },
    ],
  };

  return (
    <div className="app-shell">
      <div className="app-card">
        {showHome ? (
          <div className="home-page">
            <div className="hero-panel">
              <span className="hero-eyebrow">Weather Trend Planner</span>
              <h1 className="hero-title">Plan your week with better weather insight</h1>
              <p className="hero-copy">
                Search any city to see the next few days of temperature trends,
                local conditions, and a quick planning recommendation.
              </p>
              <div className="hero-actions">
                <button className="button button--primary" onClick={() => setShowHome(false)}>
                  Start planning
                </button>
              </div>
            </div>

            <div className="home-features">
              <div className="feature-card">
                <h2>Fast forecast</h2>
                <p>Get a city forecast with temperature trends and weather context.</p>
              </div>
              <div className="feature-card">
                <h2>Clear visuals</h2>
                <p>See your next days on a responsive line chart for easy comparison.</p>
              </div>
              <div className="feature-card">
                <h2>Smart insight</h2>
                <p>Receive an automated suggestion to help you choose the best day.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="weather-page">
            <div className="page-header">
              <div>
                <p className="eyebrow">Weather Trend Planner</p>
                <h1 className="page-title">City forecast</h1>
              </div>
              <button className="button button--secondary" onClick={resetApp}>
                Back home
              </button>
            </div>

            <div className="search-panel">
              <input
                type="text"
                placeholder="Enter city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="text-input"
              />
              <button className="button button--primary" onClick={fetchWeather} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            {error && <div className="error-banner">{error}</div>}

            {weather && (
              <div className="weather-card">
                <div>
                  <p className="eyebrow">Current conditions</p>
                  <h2>{weather.name}</h2>
                </div>
                <div className="weather-details">
                  <div>
                    <p className="detail-label">Temperature</p>
                    <p className="detail-value">{weather.temp.toFixed(1)}°C</p>
                  </div>
                  <div>
                    <p className="detail-label">Condition</p>
                    <p className="detail-value">{weather.condition}</p>
                  </div>
                </div>
              </div>
            )}

            {trend.length > 0 && (
              <div className="chart-card">
                <h3>Temperature trend</h3>
                <Line data={chartData} />
              </div>
            )}

            {insight && (
              <div className="insight-card">
                <strong>Insight:</strong> {insight}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
