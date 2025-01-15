/***************************************************
 * Global Variables & Configuration
 **************************************************/
let map;
let searchBox;
let userMarker;              // Single marker for user input
let markersOnMap = [];       // All markers (for filtering)
let priceData = [];          // Array storing all user data
let currentId = 1;           // Auto-increment ID
let lineChart, barChart, scatterChart;

let currentLanguage = "bangla"; // default language

// Commodity lists (English & Bangla, indexes line up)
// Commodity lists in English/Bangla
const commodities = {
  english: [
    "Potato (New)",
    "Potato (Old)",
    "Rice (Coarse)",
    "Rice (Medium)",
    "Rice (Fine)",
    "Onion (New, Local)",
    "Onion (Old, Local)",
    "Eggplant",
    "Bean",
    "Tomato",
    "Cauliflower",
    "Cabbage",
    "Broiler Chicken",
    "Sonali Chicken",
    "Beef",
    "Eggs (Brown)",
    "Eggs (White)",
    "Cultured Rohu Fish",
    "Green Chili",
    "Onion (Indian)",
    "Lentils",
    "Sugar",
    "Edible oil",
    "Garlic",
    "Ginger",
    "Cumin",
    "Turmeric",
    "Dry Chili",
  ],
  bangla: [
    "আলু (নতুন)",
    "আলু (পুরাতন)",
    "চাল (মোটা)",
    "চাল (মাঝারি)",
    "চাল (সুন্দর)",
    "পেঁয়াজ (নতুন, স্থানীয়)",
    "পেঁয়াজ (পুরাতন, স্থানীয়)",
    "বেগুন",
    "শিম",
    "টমেটো",
    "ফুলকপি",
    "বাঁধাকপি",
    "ব্রয়লার মুরগি",
    "সোনালি মুরগি",
    "গরুর মাংস",
    "ডিম (বাদামি)",
    "ডিম (সাদা)",
    "চাষকৃত রুই মাছ",
    "কাঁচা মরিচ",
    "পেঁয়াজ (ভারতীয়)",
    "মসুর ডাল",
    "চিনি",
    "ভোজ্য তেল",
    "রসুন",
    "আদা",
    "জিরা",
    "হলুদ",
    "শুকনো মরিচ",
  ],
};

// Map bounds for Bangladesh
const bangladeshBounds = {
  north: 26.637,
  south: 20.651,
  west: 88.001,
  east: 92.673,
};

/***************************************************
 * Window onLoad
 **************************************************/
window.onload = function () {
  initMap();
  populateDropdowns();
  attachEventListeners();

  // By default, select "Potato (New)" in the commodity-select
  document.getElementById("commodity-select").value = "Potato (New)";
  // By default, filter is "all"
  document.getElementById("commodity-filter").value = "all";
};

/***************************************************
 * Initialize Google Map (DEFAULT style)
 **************************************************/
function initMap() {
  // Create map centered on Bangladesh
  map = new google.maps.Map(document.getElementById("map-box"), {
    center: { lat: 23.685, lng: 90.3563 },
    zoom: 7,
    restriction: {
      latLngBounds: bangladeshBounds,
      strictBounds: false,
    },
  });

  // Setup search box
  const input = document.getElementById("map-search-box");
  searchBox = new google.maps.places.SearchBox(input);

  // Bias the SearchBox results towards current map's viewport
  map.addListener("bounds_changed", function () {
    searchBox.setBounds(map.getBounds());
  });

  // Listen for place selection
  searchBox.addListener("places_changed", function () {
    const places = searchBox.getPlaces();
    if (places.length === 0) return;
    const place = places[0];
    if (!place.geometry || !place.geometry.location) return;

    map.setCenter(place.geometry.location);
    map.setZoom(14);
    placeUserMarker(place.geometry.location);
  });

  // Map click -> place marker & open form
  map.addListener("click", (event) => {
    placeUserMarker(event.latLng);
  });
}

/***************************************************
 * Place a single user-marker for form input
 **************************************************/
function placeUserMarker(location) {
  if (userMarker) {
    userMarker.setPosition(location);
  } else {
    userMarker = new google.maps.Marker({
      position: location,
      map: map,
      draggable: false,
    });
  }
  // Show the popup form
  document.getElementById("form-popup").style.display = "block";
}

/***************************************************
 * Populate Commodity Dropdowns
 **************************************************/
function populateDropdowns() {
  const selectList = document.getElementById("commodity-select");
  const filterList = document.getElementById("commodity-filter");
  const formList = document.getElementById("commodity-input");

  // Clear out old options
  selectList.innerHTML = "";
  filterList.innerHTML = '<option value="all">Show All</option>';
  formList.innerHTML = "";

  const langArr = commodities[currentLanguage];
  for (let i = 0; i < langArr.length; i++) {
    // Keep 'value' in English for backend consistency
    const engVal = commodities.english[i];
    const langText = langArr[i];

    // For the top "Select Commodity" (dashboard)
    let opt1 = document.createElement("option");
    opt1.value = engVal;
    opt1.text = langText;
    selectList.appendChild(opt1);

    // For the "Filter Commodity"
    let opt2 = document.createElement("option");
    opt2.value = engVal;
    opt2.text = langText;
    filterList.appendChild(opt2);

    // For the popup form
    let opt3 = document.createElement("option");
    opt3.value = engVal;
    opt3.text = langText;
    formList.appendChild(opt3);
  }

  // Update total commodities
  document.getElementById("total-commodities").innerText =
    currentLanguage === "bangla"
      ? `মোট পণ্য: ${langArr.length}`
      : `Total Commodities: ${langArr.length}`;
}

/***************************************************
 * Attach Event Listeners
 **************************************************/
function attachEventListeners() {
  // Cancel popup
  document.getElementById("cancel-btn").addEventListener("click", () => {
    document.getElementById("form-popup").style.display = "none";
  });

  // Form submission
  document
    .getElementById("commodityForm")
    .addEventListener("submit", handleFormSubmit);

  // Language switch
  document.getElementById("btn-bangla").addEventListener("click", () => {
    currentLanguage = "bangla";
    populateDropdowns();
    // Refresh dashboard with currently selected commodity
    updateDashboard(
      document.getElementById("commodity-select").value
    );
  });
  document.getElementById("btn-english").addEventListener("click", () => {
    currentLanguage = "english";
    populateDropdowns();
    // Refresh dashboard
    updateDashboard(
      document.getElementById("commodity-select").value
    );
  });

  // Commodity selection (dashboard)
  document
    .getElementById("commodity-select")
    .addEventListener("change", (event) => {
      updateDashboard(event.target.value);
    });

  // Commodity filter
  document
    .getElementById("commodity-filter")
    .addEventListener("change", (event) => {
      const selected = event.target.value;
      filterMarkersOnMap(selected);
      updateCharts(selected);
    });
}

/***************************************************
 * Handle Form Submission
 **************************************************/
function handleFormSubmit(e) {
  e.preventDefault();

  if (!userMarker) {
    alert("Please select a location on the map first!");
    return;
  }
  const commodity = document.getElementById("commodity-input").value;
  const priceVal = parseFloat(
    document.getElementById("price-input").value
  );
  if (isNaN(priceVal) || priceVal <= 0) {
    alert("Price must be a positive number!");
    return;
  }
  const unit = document.getElementById("unit-input").value;
  const market = document.getElementById("market-input").value;
  const retailWholesale = document.getElementById("retail-wholesale").value;
  const priceSetType = document.getElementById("price-set-type").value;
  const lat = userMarker.getPosition().lat();
  const lng = userMarker.getPosition().lng();

  // Construct data object
  // Using "new Date()" for 'date' to store as an actual Date object
  const newData = {
    id: currentId++,
    date: new Date(),
    commodity_name: commodity,
    commodity_price_bdt: priceVal,
    unit: unit,
    location_district: "",
    location_sub_district: "",
    exact_bazar_name: "",
    retail_or_wholesale: retailWholesale,
    shop_type_supershop_or_market_or_main: market,
    price_set_type: priceSetType,
    source: "User Input",
    article_type: "",
    lat,
    lng,
  };

  // Store
  priceData.push(newData);

  // Add marker to visualization
  addMarkerToMap(newData);

  // Hide form
  document.getElementById("form-popup").style.display = "none";
  e.target.reset();

  // Update the dashboard for that commodity
  updateDashboard(commodity);

  // Reset filter to show "all"
  document.getElementById("commodity-filter").value = "all";
  filterMarkersOnMap("all");
  updateCharts("all");
}

/***************************************************
 * Add Marker with color-coded icon
 **************************************************/
function addMarkerToMap(dataObj) {
  const markerColor = getMarkerColor(dataObj.commodity_name);

  const marker = new google.maps.Marker({
    position: { lat: dataObj.lat, lng: dataObj.lng },
    map: map,
    title: `${dataObj.commodity_name}: ${dataObj.commodity_price_bdt} ${dataObj.unit}`,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: markerColor,
      fillOpacity: 1,
      strokeColor: "black",
      strokeWeight: 2,
    },
  });

  // Info Window
  const infoWindow = new google.maps.InfoWindow({
    content: `
      <b>Commodity:</b> ${dataObj.commodity_name}<br/>
      <b>Price:</b> ${dataObj.commodity_price_bdt} ${dataObj.unit}<br/>
      <b>Market:</b> ${dataObj.shop_type_supershop_or_market_or_main}<br/>
      <b>Retail/Wholesale:</b> ${dataObj.retail_or_wholesale}
    `,
  });
  marker.addListener("click", () => infoWindow.open(map, marker));

  markersOnMap.push({
    marker,
    commodity: dataObj.commodity_name,
  });
}

/***************************************************
 * Color-coded Markers by Commodity
 **************************************************/
function getMarkerColor(commodity) {
  // Example mapping
  const colorMap = {
    "Potato (New)": "blue",
    "Potato (Old)": "green",
    "Onion (Local)": "red",
    "Onion (Imported)": "purple",
    "Rice (Coarse)": "orange",
    "Rice (Medium)": "brown",
    "Rice (Fine)": "pink",
    "Garlic": "#f5b401",
    "Ginger": "#21e6c1",
    "Tomato": "#f54242",
    "Egg": "#f5429e",
    "Chicken (Broiler)": "#8f42f5",
    "Chicken (Local)": "#42f57b",
    "Beef": "#f59e42",
    "Edible Oil": "#f0e68c",
  };
  return colorMap[commodity] || "gray";
}

/***************************************************
 * Filter Markers On Map
 **************************************************/
function filterMarkersOnMap(selectedCommodity) {
  // Clear them from map
  markersOnMap.forEach((item) => item.marker.setMap(null));

  if (selectedCommodity === "all") {
    // Show all
    markersOnMap.forEach((item) => item.marker.setMap(map));
  } else {
    // Show only matching
    markersOnMap
      .filter((m) => m.commodity === selectedCommodity)
      .forEach((item) => item.marker.setMap(map));
  }
}

/***************************************************
 * Update Dashboard (Highest, Lowest, etc.)
 **************************************************/
function updateDashboard(commodity) {
  const filtered = priceData.filter((d) => d.commodity_name === commodity);
  if (!filtered.length) {
    setDashboardMetrics("No data", "No data", "No data", "No data", "No data", "No data");
    return;
  }

  const prices = filtered.map((f) => f.commodity_price_bdt);
  const highest = Math.max(...prices).toFixed(2);
  const lowest = Math.min(...prices).toFixed(2);
  const total = prices.reduce((s, p) => s + p, 0);
  const avg = (total / prices.length).toFixed(2);
  const priceDiff = (highest - lowest).toFixed(2);

  // Monthly & Yearly average
  const monthlyAvg = calculateMonthlyAverage(filtered);
  const yearlyAvg = calculateYearlyAverage(filtered);

  setDashboardMetrics(
    highest,
    lowest,
    priceDiff,
    avg,
    monthlyAvg,
    yearlyAvg
  );

  // Also update charts to show only that commodity
  updateCharts(commodity);
}

/***************************************************
 * Set Dashboard Metrics
 **************************************************/
function setDashboardMetrics(high, low, diff, dailyAvg, monthlyAvg, yearlyAvg) {
  if (currentLanguage === "bangla") {
    document.getElementById("highest-price").innerText = `সর্বোচ্চ মূল্য: ${high}`;
    document.getElementById("lowest-price").innerText = `সর্বনিম্ন মূল্য: ${low}`;
    document.getElementById("price-difference").innerText = `মূল্য পার্থক্য: ${diff}`;
    document.getElementById("average-price").innerText = `দৈনিক গড় মূল্য: ${dailyAvg}`;
    document.getElementById("monthly-average").innerText = `মাসিক গড় মূল্য: ${monthlyAvg}`;
    document.getElementById("yearly-average").innerText = `বার্ষিক গড় মূল্য: ${yearlyAvg}`;
  } else {
    document.getElementById("highest-price").innerText = `Highest Price: ${high}`;
    document.getElementById("lowest-price").innerText = `Lowest Price: ${low}`;
    document.getElementById("price-difference").innerText = `Price Difference: ${diff}`;
    document.getElementById("average-price").innerText = `Daily Average Price: ${dailyAvg}`;
    document.getElementById("monthly-average").innerText = `Monthly Average: ${monthlyAvg}`;
    document.getElementById("yearly-average").innerText = `Yearly Average: ${yearlyAvg}`;
  }
}

/***************************************************
 * Calculate Monthly Average
 **************************************************/
function calculateMonthlyAverage(list) {
  const months = {};
  list.forEach((item) => {
    const d = new Date(item.date);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const key = `${y}-${m}`;
    if (!months[key]) months[key] = { sum: 0, count: 0 };
    months[key].sum += item.commodity_price_bdt;
    months[key].count++;
  });

  let totalAvg = 0;
  let groupCount = 0;
  for (let key in months) {
    const { sum, count } = months[key];
    const avg = sum / count;
    totalAvg += avg;
    groupCount++;
  }
  return groupCount > 0 ? (totalAvg / groupCount).toFixed(2) : "No data";
}

/***************************************************
 * Calculate Yearly Average
 **************************************************/
function calculateYearlyAverage(list) {
  const years = {};
  list.forEach((item) => {
    const d = new Date(item.date);
    const y = d.getFullYear();
    if (!years[y]) years[y] = { sum: 0, count: 0 };
    years[y].sum += item.commodity_price_bdt;
    years[y].count++;
  });

  let totalAvg = 0;
  let groupCount = 0;
  for (let year in years) {
    const { sum, count } = years[year];
    totalAvg += sum / count;
    groupCount++;
  }
  return groupCount > 0 ? (totalAvg / groupCount).toFixed(2) : "No data";
}

/***************************************************
 * Update Charts
 **************************************************/
function updateCharts(selectedCommodity) {
  let filtered;
  if (selectedCommodity === "all") {
    filtered = priceData;
  } else {
    filtered = priceData.filter((d) => d.commodity_name === selectedCommodity);
  }

  // If no data, destroy charts
  if (!filtered.length) {
    if (lineChart) lineChart.destroy();
    if (barChart) barChart.destroy();
    if (scatterChart) scatterChart.destroy();
    return;
  }

  // Sort by date for better timeline
  filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

  const labels = filtered.map((d) => new Date(d.date).toLocaleDateString());
  const dataVals = filtered.map((d) => d.commodity_price_bdt);

  // Destroy old charts
  if (lineChart) lineChart.destroy();
  if (barChart) barChart.destroy();
  if (scatterChart) scatterChart.destroy();

  // Line Chart
  const lineCtx = document.getElementById("line-chart").getContext("2d");
  lineChart = new Chart(lineCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label:
            currentLanguage === "bangla"
              ? "মূল্য প্রবণতা (BDT)"
              : "Price Trend (BDT)",
          data: dataVals,
          borderColor: "#f54242",
          borderWidth: 2,
          fill: false,
        },
      ],
    },
    options: {
      scales: {
        x: { title: { display: true, text: "Date" } },
        y: { title: { display: true, text: "Price (BDT)" } },
      },
    },
  });

  // Bar Chart
  const barCtx = document.getElementById("bar-chart").getContext("2d");
  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label:
            currentLanguage === "bangla"
              ? "মূল্য বন্টন (BDT)"
              : "Price Distribution (BDT)",
          data: dataVals,
          backgroundColor: "#21e6c1",
        },
      ],
    },
    options: {
      scales: {
        x: { title: { display: true, text: "Date" } },
        y: { title: { display: true, text: "Price (BDT)" } },
      },
    },
  });

  // Scatter Chart
  const scatterCtx = document.getElementById("scatter-chart").getContext("2d");
  scatterChart = new Chart(scatterCtx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label:
            currentLanguage === "bangla"
              ? "মূল্য বিচ্ছুরণ (BDT)"
              : "Price Scatter (BDT)",
          data: filtered.map((item) => ({
            // Convert date to JS date object
            x: new Date(item.date),
            y: item.commodity_price_bdt,
          })),
          backgroundColor: "#f5b401",
        },
      ],
    },
    options: {
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
            // You can also set a parser or displayFormats if needed
          },
          title: { display: true, text: "Date" },
        },
        y: {
          title: { display: true, text: "Price (BDT)" },
        },
      },
    },
  });
}

/***************************************************
 * Loading Additional Data (LLM / External)
 **************************************************/
/**
 * Call this function with an array of objects that match your columns,
 * for example, from your LLM extractions:
 * [
 *   {
 *     id: 1,
 *     date: "12/28/2023 0:00:00",
 *     commodity_name: "Potato (New)",
 *     commodity_price_bdt: 75,
 *     unit: "kg",
 *     location_district: "Dhaka",
 *     location_sub_district: "Malibag, Mogbazar, Rampura",
 *     exact_bazar_name: "",
 *     retail_or_wholesale: "retail",
 *     shop_type_supershop_or_market_or_main: "market",
 *     price_set_type: "local_price",
 *     source: "https://www.prothomalo.com/business/j09ptt1czw",
 *     article_type: "related"
 *   },
 *   ... etc
 * ]
 */
function loadLLMData(llmRecords) {
  llmRecords.forEach((rec) => {
    // Convert date string to actual JS Date
    const parsedDate = new Date(rec.date);
    // If invalid, handle as needed

    // Convert to the object shape we use (with lat/lng optional or set 0 if unknown)
    const newData = {
      id: rec.id || currentId++,
      date: parsedDate,
      commodity_name: rec.commodity_name,
      commodity_price_bdt: rec.commodity_price_bdt,
      unit: rec.unit || "",
      location_district: rec.location_district || "",
      location_sub_district: rec.location_sub_district || "",
      exact_bazar_name: rec.exact_bazar_name || "",
      retail_or_wholesale: rec.retail_or_wholesale || "",
      shop_type_supershop_or_market_or_main: rec.shop_type_supershop_or_market_or_main || "",
      price_set_type: rec.price_set_type || "local_price",
      source: rec.source || "LLM",
      article_type: rec.article_type || "",
      lat: rec.lat || 23.7808875, // fallback lat
      lng: rec.lng || 90.2792371, // fallback lng
    };
    priceData.push(newData);

    // Add marker if lat/lng is valid
    if (newData.lat && newData.lng) {
      addMarkerToMap(newData);
    }
  });

  // Optionally, you can update the dashboard or charts after loading
  updateDashboard(document.getElementById("commodity-select").value);
  document.getElementById("commodity-filter").value = "all";
  filterMarkersOnMap("all");
  updateCharts("all");
}
