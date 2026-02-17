const historyContainer = document.querySelector('#history-container');

const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');

const loader = document.querySelector('#loader');
const errorContainer = document.querySelector('#error-container');

const cityName = document.querySelector('#city');
const temperature = document.querySelector('#temp');
const humidity = document.querySelector('#hum');
const windSpeed = document.querySelector('#wind');
const forecastContainer = document.querySelector('#forecast');


historyContainer.addEventListener('click', (event) => {
    if (event.target.matches('.history-btn')) {
        const city = event.target.dataset.city;
        fetchWeather(city);
    }
});

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const city = searchInput.value.trim();
    if (city) {
        fetchWeather(city);
        searchInput.value = '';
  }
});

function displayCurrentWeather(data){
    const currentDate = new Date().toLocaleDateString();
    cityName.textContent = `${"City : "} ${data.name} (${currentDate})`;
    temperature.textContent = `${"Temperature : "} ${Math.round(data.main.temp)}°C`;
    humidity.textContent = `${"Humidity : "} ${data.main.humidity}%`;
    windSpeed.textContent = `${"Wind Speed : "} ${data.wind.speed}m/s`;
}


function displayForecast(forecastList){
    for (let i = 0; i < forecastList.length; i += 8) {
        const dailyForecast = forecastList[i];
        const card = document.createElement('div');
        card.classList.add('forecast-card');
        const date = new Date(dailyForecast.dt_txt);
        const dateEl = document.createElement('h3');
        dateEl.textContent = date.toLocaleDateString();
        const iconCode = dailyForecast.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        const icon = document.createElement('img');
        icon.setAttribute('src', iconUrl);
        icon.setAttribute('alt', dailyForecast.weather[0].description);
        const temp = document.createElement('p');
        temp.textContent = `Temp: ${Math.round(dailyForecast.main.temp)} °C`;
        const humidity = document.createElement('p');
        humidity.textContent = `Humidity: ${dailyForecast.main.humidity}%`;
        card.append(dateEl, icon, temp, humidity);
        forecastContainer.append(card);
    }
}

const API_key="b83c0a8401fd741bd6ba6ea1e26f632f";

function renderHistory() {
  const history = JSON.parse(localStorage.getItem('weatherHistory') || '[]');
  historyContainer.innerHTML = '';
  for (const city of history) {
    const historyBtn = document.createElement('button');
    historyBtn.textContent = city;
    historyBtn.classList.add('history-btn');
    historyBtn.setAttribute('data-city', city);
    historyContainer.append(historyBtn);
  }
}
function saveCityToHistory(city) {
  const historyString = localStorage.getItem('weatherHistory') || '[]';
  let history = JSON.parse(historyString);
  history = history.filter(existingCity => existingCity.toLowerCase() !== city.toLowerCase());
  history.unshift(city);
  if (history.length > 10) {
    history = history.slice(0, 10);
  }
  localStorage.setItem('weatherHistory', JSON.stringify(history));
  renderHistory();
}

async function fetchWeather(city){

    try{

        errorContainer.classList.add('hidden');
    
        cityName.textContent = '';
        temperature.textContent = '';
        humidity.textContent = '';
        windSpeed.textContent = '';
        forecastContainer.innerHTML = ''; 

        loader.classList.remove('hidden');

        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_key}&units=metric`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_key}&units=metric`;

        const responses = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(forecastUrl)
        ]);

        for(const response of responses){
            if(!response.ok){
                throw new Error('City not found or API error.');
            }
        }
        const [currentWeather, forecast] = await Promise.all(
            responses.map(response => response.json())
        );
        displayCurrentWeather(currentWeather);
        displayForecast(forecast.list);
        saveCityToHistory(currentWeather.name);

    }
    catch(error){
        console.error('Failed to fetch weather data:', error);
        errorContainer.textContent = 'Sorry, the city could not be found. Please check your spelling and try again.';
        errorContainer.classList.remove('hidden');
    }
    finally{
        loader.classList.add('hidden');
    }
}
fetchWeather('Delhi');
renderHistory();

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      console.log('User location found:', { latitude, longitude });
      fetchWeatherByCoords(latitude, longitude);
    },
    (error) => {
      console.error('Error getting user location:', error.message);
    }
  );
} else {
  console.log('Geolocation is not available on this browser.');
}
async function fetchWeatherByCoords(lat, lon) {
  try {
    errorContainer.classList.add('hidden');
    cityName.textContent = '';
    temperature.textContent = '';
    humidity.textContent = '';
    windSpeed.textContent = '';
    forecastContainer.innerHTML = '';
    loader.classList.remove('hidden');

    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

    const responses = await Promise.all([
      fetch(currentWeatherUrl),
      fetch(forecastUrl),
    ]);

    for (const response of responses) {
      if (!response.ok) throw new Error('Failed to fetch weather data by coordinates.');
    }

    const [currentWeather, forecast] = await Promise.all(responses.map(r => r.json()));

    displayCurrentWeather(currentWeather);
    displayForecast(forecast.list);
    saveCityToHistory(currentWeather.name);
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    errorContainer.textContent = 'Could not fetch weather for your location. Please try searching for a city manually.';
    errorContainer.classList.remove('hidden');
  } finally {
    loader.classList.add('hidden');
  }
}
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    fetchWeatherByCoords(latitude, longitude);
  },
  (error) => {
    console.warn('Geolocation failed or denied, fallback to manual search.');
    errorContainer.textContent = 'Location permission denied. Please search for a city.';
    errorContainer.classList.remove('hidden');
  }
);