import { useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

const API_KEY = "8c031696f3a272342daeb4a69c921880"; // 🔑 Your real API key

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [trend, setTrend] = useState([]);
  const [insight, setInsight] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // <--- Double check this line!
  
  // ... rest of your code

 const fetchWeather = async () => {
  if (!city.trim()) {
    setError("Please enter a city name");
    return;
  }

  try {
    setError("");
    setLoading(true); // 1. Start loading immediately
    setWeather(null);
    setTrend([]);
    setInsight("");

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
    setLoading(false); // 2. Stop loading whether it worked or failed
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
        borderColor: "blue",
        backgroundColor: "lightblue",
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h1>Weather Trend Planner</h1>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Enter city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button onClick={fetchWeather} style={{ marginLeft: "10px" }}>
          Search
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {weather && (
        <div>
          <h2>{weather.name}</h2>
          <p>Temperature: {weather.temp.toFixed(1)}°C</p>
          <p>Condition: {weather.condition}</p>
        </div>
      )}

      {trend.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <Line data={chartData} />
        </div>
      )}

      {insight && (
        <div style={{ marginTop: "20px" }}>
          <strong>Insight:</strong> {insight}
        </div>
      )}
    </div>
  );
}

export default App;