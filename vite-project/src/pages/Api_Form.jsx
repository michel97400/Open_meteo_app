import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

function Formulaire_Api() {
  const [formData, setFormData] = useState({
    latitude: '-21.1151',
    longitude: '55.5364',
    forecast_days: '7',
    timezone: 'auto',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);
  // State pour le modal
  const [isCoordModalOpen, setIsCoordModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [editLat, setEditLat] = useState("");
  const [editLon, setEditLon] = useState("");

  // Ouvrir le modal
  const openCoordModal = () => setIsCoordModalOpen(true);
  const closeCoordModal = () => {
    setIsCoordModalOpen(false);
    setEditIndex(null);
  };
  const handleEditCoord = (index) => {
    setEditIndex(index);
    setEditLat(savedLocations[index].latitude);
    setEditLon(savedLocations[index].longitude);
  };
  const saveEditCoord = () => {
  if (editIndex !== null) {
    const updated = [...savedLocations];
    updated[editIndex] = { latitude: editLat, longitude: editLon };
    setSavedLocations(updated);
    closeCoordModal();
  }
};



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const buildApiUrl = () => {
    const hourlyParams = [
      'temperature_2m',
      'relative_humidity_2m',
      'dew_point_2m',
      'pressure_msl',
      'surface_pressure',
      'cloud_cover',
      'wind_speed_10m',
      'wind_speed_80m',
      'wind_speed_120m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'precipitation',
      'rain',
      'weather_code',
      'cape'
    ].join(',');

    const dailyParams = [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'rain_sum',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'wind_direction_10m_dominant'
    ].join(',');

    const params = new URLSearchParams({
      latitude: formData.latitude,
      longitude: formData.longitude,
      hourly: hourlyParams,
      daily: dailyParams,
      timezone: formData.timezone,
      forecast_days: formData.forecast_days,
      temperature_unit: formData.temperature_unit,
      wind_speed_unit: formData.wind_speed_unit,
      precipitation_unit: formData.precipitation_unit
    });

    return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  };

  const analyzeCycloneRisk = (data) => {
    const hourly = data.hourly;
    let maxRisk = 'NORMAL';
    let alerts = [];

    const WIND_THRESHOLD_HURRICANE = 119;
    const PRESSURE_THRESHOLD = 980;
    const GUST_THRESHOLD = 150;

    for (let i = 0; i < hourly.time.length; i++) {
      const windSpeed = hourly.wind_speed_10m[i];
      const pressure = hourly.pressure_msl[i];
      const windGusts = hourly.wind_gusts_10m[i];

      let riskScore = 0;
      let indicators = [];

      if (windSpeed > WIND_THRESHOLD_HURRICANE) {
        riskScore += 3;
        maxRisk = 'CYCLONE_DETECTE';
        indicators.push(`⚠️ Vent ouragan: ${windSpeed.toFixed(1)} km/h`);
      } else if (windSpeed > 63) {
        riskScore += 2;
        if (maxRisk === 'NORMAL') maxRisk = 'RISQUE_ELEVE';
        indicators.push(`Vent fort: ${windSpeed.toFixed(1)} km/h`);
      }

      if (pressure < PRESSURE_THRESHOLD) {
        riskScore += 2;
        indicators.push(`Pression basse: ${pressure.toFixed(1)} hPa`);
      }

      if (windGusts > GUST_THRESHOLD) {
        riskScore += 2;
        indicators.push(`Rafales: ${windGusts.toFixed(1)} km/h`);
      }

      if (riskScore > 0) {
        alerts.push({
          timestamp: hourly.time[i],
          riskScore,
          indicators,
          windSpeed: windSpeed?.toFixed(1),
          pressure: pressure?.toFixed(1),
          windGusts: windGusts?.toFixed(1)
        });
      }
    }

    return {
      maxRisk,
      alertCount: alerts.length,
      alerts: alerts.slice(0, 10)
    };
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const url = buildApiUrl();
      const response = await fetch(url);

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      const data = await response.json();
      const analysis = analyzeCycloneRisk(data);

      // Génération des données pour le graphique
      const chartData = data.hourly.time.map((t, i) => ({
        time: new Date(t).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit"
        }),
        wind: data.hourly.wind_speed_10m[i],
        gust: data.hourly.wind_gusts_10m[i]
      }));

      setResult({
        rawData: data,
        analysis,
        chartData
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskClass = (risk) => {
    switch (risk) {
      case 'CYCLONE_DETECTE': return 'risk-cyclone';
      case 'RISQUE_ELEVE': return 'risk-eleve';
      case 'RISQUE_MOYEN': return 'risk-moyen';
      default: return 'risk-normal';
    }
  };

  const getRiskEmoji = (risk) => {
    switch (risk) {
      case 'CYCLONE_DETECTE': return '🔴';
      case 'RISQUE_ELEVE': return '🟠';
      case 'RISQUE_MOYEN': return '🟡';
      default: return '🟢';
    }
  };


  return (
    <>
      <div className="cyclone-container">
        <div className="cyclone-layout">
          {/* Colonne formulaire */}
          <div className="cyclone-form-col">
            <div className="cyclone-card">
              <h1 className="cyclone-title">
                🌀 Détecteur de Cyclone
              </h1>
              <p className="cyclone-subtitle">API Open-Meteo - Analyse météorologique</p>

              <div className="cyclone-form">
                {/* Menu déroulant régions + coordonnées sauvegardées */}
                <div className="form-field" style={{marginBottom: '1rem'}}>
                <label className="form-label">Choisir une région</label>
                <select
                    className="form-select"
                    onChange={(e) => {
                    const [lat, lon] = e.target.value.split(',');
                    setFormData(prev => ({
                        ...prev,
                        latitude: lat,
                        longitude: lon
                    }));
                    }}
                    value={`${formData.latitude},${formData.longitude}`}
                >
                    {/* Régions prédéfinies */}
                    <option value="-21.1151,55.5364">Réunion</option>
                    <option value="-20.3484,57.5522">Maurice</option>
                    <option value="-18.8792,47.5079">Madagascar (Antananarivo)</option>
                    <option value="-17.7134,178.0650">Fidji</option>
                    <option value="21.3069,-157.8583">Hawaï (Honolulu)</option>
                    <option value="16.2650,-61.5510">Guadeloupe</option>
                    <option value="14.5995,120.9842">Philippines (Manille)</option>

                    {/* Coordonnées sauvegardées */}
                    {savedLocations?.map((loc, idx) => (
                    <option key={idx} value={`${loc.latitude},${loc.longitude}`}>
                        {loc.latitude},{loc.longitude} (sauvegardé)
                    </option>
                    ))}
                </select>
                </div>

                
                {/* Coordonnées */}
                <div className="grid-2">
                  <div className="form-field">
                    <label className="form-label">Latitude</label>
                    <input
                      type="text"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="-21.1151"
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">Longitude</label>
                    <input
                      type="text"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="55.5364"
                    />
                  </div>
                </div>

                {/* Paramètres */}
                <div className="grid-2">
                  <div className="form-field">
                    <label className="form-label">Jours de prévision</label>
                    <select
                      name="forecast_days"
                      value={formData.forecast_days}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="1">1 jour</option>
                      <option value="3">3 jours</option>
                      <option value="7">7 jours</option>
                      <option value="14">14 jours</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="form-label">Fuseau horaire</label>
                    <select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="auto">Auto</option>
                      <option value="Europe/Paris">Europe/Paris</option>
                      <option value="Indian/Reunion">Indian/Reunion</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>

                {/* Unités */}
                <div className="grid-3">
                  <div className="form-field">
                    <label className="form-label">Unité température</label>
                    <select
                      name="temperature_unit"
                      value={formData.temperature_unit}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="celsius">Celsius (°C)</option>
                      <option value="fahrenheit">Fahrenheit (°F)</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="form-label">Unité vitesse vent</label>
                    <select
                      name="wind_speed_unit"
                      value={formData.wind_speed_unit}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="kmh">km/h</option>
                      <option value="ms">m/s</option>
                      <option value="mph">mph</option>
                      <option value="kn">knots</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="form-label">Unité précipitation</label>
                    <select
                      name="precipitation_unit"
                      value={formData.precipitation_unit}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="mm">mm</option>
                      <option value="inch">inch</option>
                    </select>
                  </div>
                </div>

                {/* Bouton */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-submit"
                >
                  {loading ? (
                    <>
                      <svg className="spinner" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyse en cours...
                    </>
                  ) : (
                    <>🔍 Analyser la météo</>
                  )}
                </button>
                {/* Bouton sauvegarder coordonnée */}
                <button
                className="btn-submit"
                style={{marginBottom: '1rem'}}
                onClick={() => {
                    const exists = savedLocations.some(
                    loc => loc.latitude === formData.latitude && loc.longitude === formData.longitude
                    );
                    if (!exists) {
                    setSavedLocations(prev => [
                        ...prev,
                        { latitude: formData.latitude, longitude: formData.longitude }
                    ]);
                    }
                }}
                >
                💾 Sauvegarder la coordonnée
                </button>
                {/* Bouton gérer les coordonnées */}
                <button
                className="btn-submit"
                style={{marginBottom: '1rem'}}
                onClick={openCoordModal}
                >
                ⚙️ Gérer les coordonnées
                </button>
                {/* Modal de gestion */}
                {isCoordModalOpen && (
                <div
                    style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 999
                    }}
                >
                    <div
                    style={{
                        background: "white",
                        padding: "50px",
                        borderRadius: "0.5rem",
                        width: "600px",
                        maxHeight: "100vh",
                        zIndex: 999
                    }}
                    >
                    <h3>Coordonnées sauvegardées</h3>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {savedLocations.map((loc, idx) => (
                        <li key={idx} style={{ marginBottom: "0.5rem" }}>
                            {editIndex === idx ? (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <input
                                type="text"
                                value={editLat}
                                onChange={(e) => setEditLat(e.target.value)}
                                placeholder="Latitude"
                                />
                                <input
                                type="text"
                                value={editLon}
                                onChange={(e) => setEditLon(e.target.value)}
                                placeholder="Longitude"
                                />
                                <button onClick={saveEditCoord}>💾</button>
                                <button onClick={closeCoordModal}>❌</button>
                            </div>
                            ) : (
                            <div style={{ display: "flex", justifyContent: "space-between"}}>
                                <span
                                onClick={() => setFormData({ latitude: loc.latitude, longitude: loc.longitude })}
                                style={{ cursor: "pointer" }}
                                >
                                {loc.latitude}, {loc.longitude}
                                </span>
                                <button onClick={() => handleEditCoord(idx)}>✏️ Modifier</button>
                            </div>
                            )}
                        </li>
                        ))}
                    </ul>
                    <button onClick={closeCoordModal} style={{ marginTop: "1rem" }}>
                        Fermer
                    </button>
                    </div>
                </div>
                )}

              </div>

              {/* Erreur */}
              {error && (
                <div className="error-box">
                  <p className="error-text">❌ Erreur: {error}</p>
                </div>
              )}

              {/* Résultats */}
              {result && (
                <div className="results-container">
                  {/* Résumé */}
                  <div className="summary-card">
                    <h2 className="summary-title">📊 Analyse</h2>
                    <div className="summary-grid">
                      <div className="stat-card">
                        <p className="stat-label">Niveau de risque</p>
                        <p className={`stat-value ${getRiskClass(result.analysis.maxRisk)}`}>
                          {getRiskEmoji(result.analysis.maxRisk)} {result.analysis.maxRisk}
                        </p>
                      </div>
                      <div className="stat-card">
                        <p className="stat-label">Alertes détectées</p>
                        <p className="stat-value">{result.analysis.alertCount} période(s)</p>
                      </div>
                    </div>
                  </div>

                  {/* Alertes */}
                  {result.analysis.alerts.length > 0 && (
                    <div className="alerts-container">
                      <div className="alerts-header">
                        <h3>⚠️ Alertes météorologiques</h3>
                      </div>
                      <div className="alerts-list">
                        {result.analysis.alerts.map((alert, index) => (
                          <div key={index} className="alert-item">
                            <div className="alert-header">
                              <p className="alert-time">
                                {new Date(alert.timestamp).toLocaleString('fr-FR')}
                              </p>
                              <span className="alert-badge">Score: {alert.riskScore}</span>
                            </div>
                            <div className="alert-indicators">
                              {alert.indicators.map((indicator, i) => (
                                <p key={i}>• {indicator}</p>
                              ))}
                            </div>
                            <div className="alert-data">
                              <div className="alert-data-item">Vent: {alert.windSpeed} km/h</div>
                              <div className="alert-data-item">Pression: {alert.pressure} hPa</div>
                              <div className="alert-data-item">Rafales: {alert.windGusts} km/h</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* URL API */}
                  <div className="url-box">
                    <span className="url-label">URL API utilisée:</span>
                    <code className="url-code">{buildApiUrl()}</code>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Fin colonne formulaire */}
        </div>
        {/* Colonne carte + graphique */}
        <div className="cyclone-map-col">
          <div className="cyclone-card" style={{minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
            <iframe
              title="Carte OpenStreetMap"
              width="100%"
              height="100%"
              style={{border: 0, borderRadius: '0.5rem', minHeight: '400px'}}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(formData.longitude)-0.1}%2C${parseFloat(formData.latitude)-0.1}%2C${parseFloat(formData.longitude)+0.1}%2C${parseFloat(formData.latitude)+0.1}&layer=sat&marker=${formData.latitude}%2C${formData.longitude}`}
              allowFullScreen
            ></iframe>
            <a
              href={`https://www.openstreetmap.org/?mlat=${formData.latitude}&mlon=${formData.longitude}#map=12/${formData.latitude}/${formData.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{position: 'absolute', bottom: 8, right: 16, fontSize: '0.9em', color: '#2563eb', textDecoration: 'underline'}}
            >Voir sur OpenStreetMap</a>
          </div>
          {/* ===== CARD GRAPHIQUE SOUS LA MAP ===== */}
          <div className="stat-card" style={{marginTop: 0, padding: "1rem", background: "white", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb"}}>
            <h3 style={{marginBottom: "1rem"}}>📈 Évolution du vent (12 prochaines heures)</h3>
            <div style={{width: "100%", height: "250px"}}>
              <ResponsiveContainer>
                <LineChart data={result?.chartData?.slice(0, 12) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" hide />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="wind" stroke="#2563eb" strokeWidth={2} name="Vent (km/h)" />
                  <Line type="monotone" dataKey="gust" stroke="#dc2626" strokeWidth={2} name="Rafales (km/h)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {!result && <p style={{textAlign: 'center', marginTop: '1rem', color: '#888'}}>Aucune donnée à afficher pour le moment.</p>}
          </div>
        </div>
      </div>
</>
  );
}

export default Formulaire_Api;

