// Initial buses (fake data with baseOffset and dwell time)
let buses = [
  { id:"BUS-101", name:"Route A - Chandigarh Sec 17", lat:30.7333, lng:76.7794, capacity:40, occupancy:5, arrivalTime: new Date(Date.now() + 15*60000) }, // 15 min from now
  { id:"BUS-202", name:"Route B - Mohali", lat:30.7046, lng:76.7179, capacity:30, occupancy:12, arrivalTime: new Date(Date.now() + 7*60000) },
  { id:"BUS-303", name:"Route C - Panchkula", lat:30.6915, lng:76.8537, capacity:25, occupancy:20, arrivalTime: new Date(Date.now() + 12*60000) }
];

let map, markers = {};
let selectedBus = null;

//login.html 
function handleLogin(event) {
  event.preventDefault();
  const mobile = document.getElementById("mobile").value.trim();

  if (!mobile || mobile.length < 10) {
    alert("Please enter a valid mobile number");
    return;
  }

  // For now just mock login success
  alert("Logged in successfully with " + mobile);

  // Hide login page and show main app
  document.getElementById("login-page").style.display = "none";
  document.getElementById("app").style.display = "block";
}


// Utility: get color
function crowdColor(bus) {
  const ratio = bus.occupancy / bus.capacity;
  if (ratio <= 0.4) return "green";
  if (ratio <= 0.8) return "orange";
  return "red";
}

// Calculate and update arrival/departure times
function updateArrivalDepartureTimes() {
  buses.forEach(bus => {
    const now = new Date();
    // Example: each bus arrives in 5-15 min randomly
    const arrivalOffset = bus.arrivalTime ? (bus.arrivalTime - now) : (5 + Math.floor(Math.random() * 10)) * 60000;
    const arrival = new Date(now.getTime() + arrivalOffset);
    // Dwell time 3-5 min
    const departure = new Date(arrival.getTime() + (3 + Math.floor(Math.random() * 3)) * 60000);
    bus.arrival = arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    bus.departure = departure.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });
}


// Render bus list
function renderBusList() {
  const container = document.getElementById("bus-list");
  if (!container) return;
  container.innerHTML = "";
  buses.forEach(bus => {
    const div = document.createElement("div");
    div.className = "bus-card";
    div.innerHTML = `
      <div class="bus-name">${bus.name}</div>
      <div>ID: ${bus.id}</div>
      <div class="occupancy">
        <span class="color-dot" style="background:${crowdColor(bus)}"></span>
        ${bus.occupancy}/${bus.capacity} passengers — <strong>${crowdColor(bus)}</strong>
      </div>
      <div>Arrival: <b>${bus.arrival}</b></div>
      <div>Departure: <b>${bus.departure}</b></div>
      <button class="primary" onclick="openModal('${bus.id}')">Book Ticket</button>
    `;
    container.appendChild(div);
  });
}


// Map init
function initMap() {
  map = L.map("map").setView([30.7333, 76.7794], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  buses.forEach(bus => {
    const marker = L.circleMarker([bus.lat, bus.lng], { color: crowdColor(bus), radius: 10 });
    marker.bindPopup(`
      <b>${bus.name}</b><br/>
      Occupancy: ${bus.occupancy}/${bus.capacity}<br/>
      Arrival: ${bus.arrival}<br/>
      Departure: ${bus.departure}
    `);
    marker.addTo(map);
    markers[bus.id] = marker;
  });
}
//update map
function updateMap() {
  buses.forEach(bus => {
    const marker = markers[bus.id];
    marker.setLatLng([bus.lat, bus.lng]);
    marker.setStyle({ color: crowdColor(bus) });
    marker.setPopupContent(`
      <b>${bus.name}</b><br/>
      Occupancy: ${bus.occupancy}/${bus.capacity}<br/>
      Arrival: ${bus.arrival}<br/>
      Departure: ${bus.departure}
    `);
  });
}


// Simulate bus movement & occupancy
setInterval(() => {
  buses = buses.map(b => {
    const latDelta = (Math.random() - 0.5) * 0.0012;
    const lngDelta = (Math.random() - 0.5) * 0.0012;
    if (Math.random() < 0.4) {
      const change = Math.floor(Math.random() * 3) - 1;
      b.occupancy = Math.max(0, Math.min(b.capacity, b.occupancy + change));
    }
    b.lat = +(b.lat + latDelta).toFixed(6);
    b.lng = +(b.lng + lngDelta).toFixed(6);
    return b;
  });

  updateArrivalDepartureTimes();
  renderBusList();
  updateMap();
}, 4000);


// Ticket modal
function openModal(busId) {
  selectedBus = buses.find(b => b.id === busId);
  document.getElementById("modal-title").innerText = "Book Ticket — " + selectedBus.name;
  document.getElementById("ticket-modal").classList.remove("hidden");
  document.getElementById("ticket-form").classList.remove("hidden");
  document.getElementById("ticket-result").classList.add("hidden");
  document.getElementById("passenger-name").value = "";
}
function closeModal() {
  document.getElementById("ticket-modal").classList.add("hidden");
}
function confirmBooking() {
  const name = document.getElementById("passenger-name").value.trim();
  if (!name) { alert("Enter passenger name"); return; }

  // Occupancy +1
  selectedBus.occupancy++;
  renderBusList();
  updateMap();

  // Show QR
  const ticketId = "TCK-" + Math.floor(Math.random() * 100000);
  const qrData = JSON.stringify({ ticketId, busId: selectedBus.id, passenger: name });
  QRCode.toDataURL(qrData, (err, url) => {
    const result = document.getElementById("ticket-result");
result.innerHTML = `
  <h4>Ticket Confirmed</h4>
  <div>ID: <code>${ticketId}</code></div>
  <div class="ticket-qr"><img src="${url}" /></div>
`;

    document.getElementById("ticket-form").classList.add("hidden");
    result.classList.remove("hidden");
  });
}

// Init
window.onload = () => {
  updateArrivalDepartureTimes();
  renderBusList();
  initMap();
  setInterval(updateArrivalDepartureTimes, 60000); // every minute refresh
};

