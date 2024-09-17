const apiKey = 'b89f80c21be54de4c56c5c90c3f28e76';
const apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
const forecastApiUrl = 'https://api.openweathermap.org/data/2.5/forecast';

// DOM Elements
const locationInput = document.getElementById('locationInput');
const searchButton = document.getElementById('searchButton');
const locationElement = document.getElementById('location');
const temperatureElement = document.getElementById('temperature');
const humidityElement = document.getElementById('humidity');
const descriptionElement = document.getElementById('description');
const soilMoistureElement = document.getElementById('soilMoisture');
const irrigationStatusElement = document.getElementById('irrigationStatus');
const waterRequirementElement = document.getElementById('waterRequirement');
const acresInput = document.getElementById('acresInput');
const recommendButton = document.getElementById('recommendButton');
const soilTypeSelect = document.getElementById('soilType');
const forecastElement = document.getElementById('forecast');
const precautionButton = document.getElementById('precautionButton');
const precautionsElement = document.getElementById('precautions');
const cropTypeSelect = document.getElementById('cropType');

let estimatedSoilMoisture = null;
let liveHumidity = null;

// Soil type moisture requirements and water amount per acre
const soilTypeFactors = {
    sandy: { moistureThreshold: 20, moistureAdjustment: 10, waterPerAcre: 600 },
    loamy: { moistureThreshold: 30, moistureAdjustment: 5, waterPerAcre: 500 },
    clay: { moistureThreshold: 40, moistureAdjustment: 0, waterPerAcre: 700 },
    silt: { moistureThreshold: 25, moistureAdjustment: 5, waterPerAcre: 550 },
    peaty: { moistureThreshold: 35, moistureAdjustment: 8, waterPerAcre: 650 },
    saline: { moistureThreshold: 15, moistureAdjustment: 12, waterPerAcre: 700 },
    siltyClay: { moistureThreshold: 45, moistureAdjustment: 3, waterPerAcre: 650 },
    sandyLoam: { moistureThreshold: 25, moistureAdjustment: 6, waterPerAcre: 600 },
    clayLoam: { moistureThreshold: 35, moistureAdjustment: 4, waterPerAcre: 650 },
    loam: { moistureThreshold: 30, moistureAdjustment: 5, waterPerAcre: 500 },
    siltyLoam: { moistureThreshold: 30, moistureAdjustment: 6, waterPerAcre: 550 },
    sandyClayLoam: { moistureThreshold: 30, moistureAdjustment: 7, waterPerAcre: 600 },
    siltyClayLoam: { moistureThreshold: 40, moistureAdjustment: 5, waterPerAcre: 650 },
    peatyClay: { moistureThreshold: 40, moistureAdjustment: 7, waterPerAcre: 700 },
    siltyPeat: { moistureThreshold: 35, moistureAdjustment: 6, waterPerAcre: 650 },
    sandyPeat: { moistureThreshold: 30, moistureAdjustment: 7, waterPerAcre: 600 },
    salineAlkali: { moistureThreshold: 20, moistureAdjustment: 15, waterPerAcre: 700 },
    alluvial: { moistureThreshold: 30, moistureAdjustment: 5, waterPerAcre: 500 },
    brownEarth: { moistureThreshold: 35, moistureAdjustment: 5, waterPerAcre: 550 },
    chernozem: { moistureThreshold: 40, moistureAdjustment: 4, waterPerAcre: 600 },
    podzol: { moistureThreshold: 25, moistureAdjustment: 6, waterPerAcre: 550 },
    laterite: { moistureThreshold: 30, moistureAdjustment: 7, waterPerAcre: 600 },
    andosol: { moistureThreshold: 35, moistureAdjustment: 6, waterPerAcre: 650 },
    desertSoil: { moistureThreshold: 15, moistureAdjustment: 12, waterPerAcre: 700 },
    marshySoil: { moistureThreshold: 50, moistureAdjustment: 4, waterPerAcre: 600 }
};

// Advanced irrigation prediction based on soil type, humidity, and soil moisture
function analyzeIrrigationNeed(soilMoisture, humidity, soilType) {
    const { moistureThreshold, moistureAdjustment } = soilTypeFactors[soilType] || soilTypeFactors.loamy;
    const adjustedMoistureThreshold = moistureThreshold + moistureAdjustment;

    // Provide a recommendation based on analysis
    if (soilMoisture < adjustedMoistureThreshold || humidity < 40) {
        return {
            needIrrigation: true,
            message: 'Irrigation is needed based on soil moisture and/or humidity levels.'
        };
    } else {
        return {
            needIrrigation: false,
            message: 'Irrigation is not needed at this time based on soil moisture and humidity levels.'
        };
    }
}

// Weather-based soil moisture estimation
function estimateSoilMoisture(precipitation, temperature, humidity) {
    const baseMoisture = 50; // Base soil moisture in percentage
    const moistureIncrease = precipitation * 2; // Example factor for precipitation impact
    const moistureDecrease = temperature * 0.5; // Example factor for temperature impact
    const humidityEffect = humidity * 0.1; // Example factor for humidity impact

    let estimatedMoisture = baseMoisture + moistureIncrease - moistureDecrease + humidityEffect;
    estimatedMoisture = Math.max(0, Math.min(100, estimatedMoisture)); // Clamp between 0 and 100
    return estimatedMoisture;
}

function fetchWeather(location) {
    const url = `${apiUrl}?q=${location}&appid=${apiKey}&units=metric`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(data); // Log weather data to verify

            if (data && data.main && data.weather && data.weather.length > 0) {
                // Extract necessary data
                const temperature = data.main.temp;
                const humidity = data.main.humidity;
                const precipitation = data.rain ? data.rain['1h'] : 0; // Assuming 1-hour rainfall data
                const description = data.weather[0].description; // Weather description

                // Estimate soil moisture
                estimatedSoilMoisture = estimateSoilMoisture(precipitation, temperature, humidity);
                liveHumidity = humidity;

                // Update UI with weather data
                locationElement.textContent = `Location: ${data.name}`;
                temperatureElement.textContent = `Temperature: ${temperature}°C`;
                humidityElement.textContent = `Humidity: ${humidity}%`;
                descriptionElement.textContent = `Description: ${description}`;
                soilMoistureElement.textContent = `Estimated Soil Moisture: ${estimatedSoilMoisture.toFixed(2)}%`;

                // Fetch and display 5-day weather forecast
                fetchForecast(location);
            }
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
        });
}

function fetchForecast(location) {
    const url = `${forecastApiUrl}?q=${location}&appid=${apiKey}&units=metric`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(data); // Log forecast data to verify

            if (data && data.list) {
                let forecastHtml = '<h2>5-Day Weather Forecast</h2><ul>';
                let heavyRainDays = [];
                const heavyRainThreshold = 20; // Heavy rain threshold in mm

                data.list.forEach((entry, index) => {
                    if (index % 8 === 0) { // Every 8th entry is roughly 24 hours apart
                        const date = new Date(entry.dt * 1000);
                        const temperature = entry.main.temp;
                        const description = entry.weather[0].description;
                        const humidity = entry.main.humidity;
                        const precipitation = entry.rain ? entry.rain['3h'] || 0 : 0;

                        if (precipitation >= heavyRainThreshold) {
                            heavyRainDays.push(date.toDateString());
                        }

                        forecastHtml += `
                            <li>
                                <strong>${date.toDateString()}:</strong>
                                Temperature: ${temperature}°C,
                                Description: ${description},
                                Humidity: ${humidity}%,
                                Precipitation: ${precipitation} mm
                            </li>
                        `;
                    }
                });

                forecastHtml += '</ul>';
                forecastElement.innerHTML = forecastHtml;

                if (heavyRainDays.length > 0) {
                    forecastElement.innerHTML += `<p><strong>Heavy rain is predicted on the following days: ${heavyRainDays.join(', ')}</strong></p>`;
                } else {
                    forecastElement.innerHTML += `<p><strong>No heavy rain is predicted in the next 5 days.</strong></p>`;
                }
            }
        })
        .catch(error => {
            console.error('Error fetching forecast data:', error);
        });
}

function handleRecommendation() {
    const soilType = soilTypeSelect.value;
    const acres = parseFloat(acresInput.value);

    if (isNaN(acres) || acres <= 0) {
        alert('Please enter a valid number of acres.');
        return;
    }

    const irrigationNeed = analyzeIrrigationNeed(estimatedSoilMoisture, liveHumidity, soilType);

    irrigationStatusElement.textContent = irrigationNeed.message;

    if (irrigationNeed.needIrrigation) {
        const waterAmount = soilTypeFactors[soilType].waterPerAcre * acres;
        waterRequirementElement.textContent = `Total Water Required: ${waterAmount} liters`;
    } else {
        waterRequirementElement.textContent = '';
    }
}

searchButton.addEventListener('click', () => {
    const location = locationInput.value.trim();
    if (location) {
        fetchWeather(location);
    } else {
        alert('Please enter a location.');
    }
});

recommendButton.addEventListener('click', handleRecommendation);



