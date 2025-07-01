const SHEET_URL = 'https://opensheet.elk.sh/1q0ozUONaq_6-tbAc8sRx9Lvk2qLqdmwKzmHW6QI77JI/Sheet1';
let originalData = [];

// 🚀 Initialize everything
async function init() {
  try {
    originalData = await fetchJSON(SHEET_URL);
    renderTable(originalData);
    populateFilterOptions(originalData);
    await addMissingCountriesFromAPI();
    attachEventListeners();
  } catch (err) {
    console.error('Initialization error:', err);
  }
}

// 📦 Fetch utility
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

// 📋 Render table
function renderTable(data) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  data.forEach(row => {
    const linkText = row['Website URL'] ? getDisplayName(row['Website URL']) : '';
    const websiteCell = row['Website URL']
      ? `<a href="${row['Website URL']}" target="_blank" class="text-blue-600 hover:underline">${linkText}</a>`
      : '';

    const html = `
      <td class="p-2 border">${row['Institution Name'] || ''}</td>
      <td class="p-2 border">${row['Overview'] || ''}</td>
      <td class="p-2 border">${row['Institution Country (HQ)'] || ''}</td>
      <td class="p-2 border">${row['Data Coverage'] || ''}</td>
      <td class="p-2 border">${row['Data Strengths'] || ''}</td>
      <td class="p-2 border">${row['Theme'] || ''}</td>
      <td class="p-2 border">${row['Data Depth'] || ''}</td>
      <td class="p-2 border">${row['Updates'] || ''}</td>
      <td class="p-2 border">${row['Use Case'] || ''}</td>
      <td class="p-2 border">${websiteCell}</td>
      <td class="p-2 border">${row['Data Security Level'] || ''}</td>
      <td class="p-2 border">${row['Access Type'] || ''}</td>
    `;

    const tr = document.createElement('tr');
    tr.classList.add('text-sm');
    tr.innerHTML = html;
    tbody.appendChild(tr);
  });
}

// Access Type
function normalizeAccessType(raw) {
  if (!raw) return "";

  const text = raw.toLowerCase();

  if (text.includes("subscription") || text.includes("login") || text.includes("paid")) {
    return "Subscription";
  }

  if (text.includes("register") || text.includes("free")) {
    return "Semi-open Access";
  }

  if (
    text.includes("direct online access") ||
    text.includes("download") ||
    text.includes("google drive") ||
    text.includes("query")
  ) {
    return "Open Access";
  }

  return "Open Access"; // Default fallback
}


// 🔠 Friendly website name
function getDisplayName(url) {
  const nameMap = {
    'psdonline': 'PSD', 'gats': 'GATS', 'ers.usda': 'OCO',
    'bps.go.id': 'BPS', 'oilworld.biz': 'Oil World',
    'fao.org': 'FAOSTAT', 'mpob.gov.my': 'MPOB',
    'bpdp.or.id': 'BPDPKS', 'kemendag': 'Kemendag',
    'ditjenbun.pertanian.go.id': 'Ditjen Perkebunan',
    'comtradeplus.un.org': 'UN Comtrade', 'data360': 'World Bank'
  };

  for (const key in nameMap) {
    if (url.includes(key)) return nameMap[key];
  }

  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// 🧩 Populate filter dropdowns
function populateFilterOptions(data) {
  populateUniqueOptions('countryFilter', data.map(r => r['Institution Country (HQ)']));
}

// 🌍 Add full country list from RESTCountries API
async function addMissingCountriesFromAPI() {
  try {
    const response = await fetchJSON('https://restcountries.com/v3.1/all?fields=name');
    const sheetCountries = [...document.getElementById('countryFilter').options].map(opt => opt.value);
    const apiCountries = response.map(c => c.name.common).filter(Boolean).sort();

    apiCountries.forEach(country => {
      if (!sheetCountries.includes(country)) {
        document.getElementById('countryFilter').append(new Option(country, country));
      }
    });
  } catch (err) {
    console.warn('Could not load full country list:', err);
  }
}

// 🏷️ Populate unique values into a <select>
function populateUniqueOptions(selectId, values) {
  const select = document.getElementById(selectId);
  const uniqueSorted = [...new Set(values.filter(Boolean))].sort();

  uniqueSorted.forEach(val => {
    select.appendChild(new Option(val, val));
  });
}

// 🎛️ Add listeners for search + filters
function attachEventListeners() {
  document.getElementById('searchInput').addEventListener('input', applyFilters);

  ['depthFilter', 'securityFilter', 'accessTypeFilter', 'countryFilter'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', applyFilters);
  });

  document.querySelector('button[onclick="exportToCSV()"]')?.addEventListener('click', exportToCSV);
}

// 🧠 Apply filters
function applyFilters() {
  const keyword = document.getElementById('searchInput').value.toLowerCase().trim();
  const selectedDepth = document.getElementById('depthFilter').value;
  const selectedSecurity = document.getElementById('securityFilter').value;
  const selectedAccess = document.getElementById('accessTypeFilter').value;
  const selectedCountry = document.getElementById('countryFilter').value;

  const filtered = originalData.filter(row => {
    return (
      (!selectedDepth || row['Data Depth'] === selectedDepth) &&
      (!selectedSecurity || row['Data Security Level'] === selectedSecurity) &&
      (!selectedAccess || normalizeAccessType(row['Access Type']) === selectedAccess) &&
      (!selectedCountry || row['Institution Country (HQ)'] === selectedCountry) &&
      Object.values(row).some(val => val?.toString().toLowerCase().includes(keyword))
    );
  });

  renderTable(filtered);
}

// 📤 Export to CSV (optional enhancement)
function exportToCSV() {
  alert("Export to CSV feature is not implemented yet.");
}

// 🚀 Launch
init();
