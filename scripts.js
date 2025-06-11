// Função para inicializar o mapa
function initializeMap() {
    const map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 25,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Função para obter a localização do usuário
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(updatePosition, showError, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        } else {
            alert("Geolocalização não é suportada por este navegador.");
        }
    }

    // Variáveis para capturar os IDs e nomes dos usuários
    const your_id = document.getElementById('your_id');
    const peer_id = document.getElementById('peer_id');
    const your_name = document.getElementById('your_name');
    const peer_name = document.getElementById('peer_name');
    const userListItems = document.getElementById('user-list-items');
    const modalUserListItems = document.getElementById('modal-user-list-items');

    // Espelhar os campos de ID e nome
    your_name.addEventListener('input', () => {
        your_id.value = your_name.value;
    });

    peer_name.addEventListener('input', () => {
        peer_id.value = peer_name.value;
    });

    // Criar ícones personalizados
    const userIcon = L.divIcon({
        className: 'custom-marker blue pulse',
        iconSize: [10, 10],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
    });

    const peerIcon = L.divIcon({
        className: 'custom-marker red pulse',
        iconSize: [10, 10],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
    });

    // Inicializar o áudio de alerta
    const alertSound = new Audio('https://professorrogeriorodrigues.com/audio.mp3');

    // Atualizar a posição do usuário no mapa
    let userMarker;
    let peerMarker;
    let userCoords;
    let peerCoords;

    function updatePosition(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const coords = [lat, lon];

        userCoords = coords;

        if (!userMarker) {
            userMarker = L.marker(coords, { icon: userIcon }).addTo(map);
            userMarker.bindPopup(your_name.value);
        } else {
            userMarker.setLatLng(coords);
        }

        // Enviar localização para o servidor
        sendLocation(lat, lon);
        updateUserList(your_name.value, lat, lon);

        // Ajustar o mapa conforme os usuários se aproximam
        if (userCoords && peerCoords) {
            checkDistanceAndAdjustZoom();
            checkDistanceAndAlert();
        }
    }

    // Função para lidar com erros de geolocalização
    function showError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                alert("Usuário negou a solicitação de Geolocalização.");
                break;
            case error.POSITION_UNAVAILABLE:
                alert("Informações de localização não estão disponíveis.");
                break;
            case error.TIMEOUT:
                alert("A solicitação para obter a localização expirou.");
                break;
            case error.UNKNOWN_ERROR:
                alert("Ocorreu um erro desconhecido.");
                break;
        }
    }

    // Enviar localização para o servidor
    function sendLocation(lat, lon) {
        fetch(`https://ppng.io/${your_id.value}-${peer_id.value}`, {
            method: 'POST',
            body: JSON.stringify({ lat, lon, name: your_name.value }),
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Receber e atualizar a localização do peer
    window.receiveLoop = async function(btn) {
        your_id.disabled = peer_id.disabled = your_name.disabled = peer_name.disabled = btn.disabled = true;
        while (true) {
            try {
                const res = await fetch(`https://ppng.io/${peer_id.value}-${your_id.value}`);
                const data = await res.json();

                peerCoords = [data.lat, data.lon];

                // Atualizar a posição do peer no mapa
                if (!peerMarker) {
                    peerMarker = L.marker(peerCoords, { icon: peerIcon }).addTo(map);
                    peerMarker.bindPopup(peer_name.value);
                } else {
                    peerMarker.setLatLng(peerCoords);
                }

                updateUserList(peer_name.value, data.lat, data.lon);

                // Ajustar o mapa conforme os usuários se aproximam
                if (userCoords && peerCoords) {
                    checkDistanceAndAdjustZoom();
                    checkDistanceAndAlert();
                }
            } catch (err) {
                console.error(err);
            }
        }
    }

    // Função para ajustar o zoom do mapa conforme os usuários se aproximam
    function checkDistanceAndAdjustZoom() {
        const userLatLng = L.latLng(userCoords[0], userCoords[1]);
        const peerLatLng = L.latLng(peerCoords[0], peerCoords[1]);
        const distance = userLatLng.distanceTo(peerLatLng);

        if (distance < 200) {
            map.setView(userLatLng, 16);
        } else {
            const newZoom = Math.max(16, 16 - Math.floor(distance / 100));
            map.setView(userLatLng, newZoom);
        }
    }

    // Função para verificar a distância e emitir alerta sonoro
    function checkDistanceAndAlert() {
        const userLatLng = L.latLng(userCoords[0], userCoords[1]);
        const peerLatLng = L.latLng(peerCoords[0], peerCoords[1]);
        const distance = userLatLng.distanceTo(peerLatLng);

        if (distance < 100) {
            alertSound.play();
        }
    }

    // Atualizar a lista de usuários
    function updateUserList(name, lat, lon) {
        let userItem = document.getElementById(name);

        if (!userItem) {
            userItem = document.createElement('li');
            userItem.id = name;
            userListItems.appendChild(userItem);
            modalUserListItems.appendChild(userItem.cloneNode(true));
        }

        userItem.textContent = `${name} - Latitude: ${lat.toFixed(4)}, Longitude: ${lon.toFixed(4)}`;

        let modalUserItem = document.getElementById(`${name}-modal`);
        if (!modalUserItem) {
            modalUserItem = document.createElement('li');
            modalUserItem.id = `${name}-modal`;
            modalUserListItems.appendChild(modalUserItem);
        }
        modalUserItem.textContent = `${name} - Latitude: ${lat.toFixed(4)}, Longitude: ${lon.toFixed(4)}`;
    }

    // Inicializar geolocalização do usuário
    getLocation();

    // Script para o modal
    const usersModal = document.getElementById("users-modal");
    const showModalBtn = document.getElementById("show-users-btn");
    const closeModalBtn = document.getElementById("close-users-modal-btn");
    const closeModalSpan = document.getElementById("close-users-modal");

    // Abrir o modal
    showModalBtn.onclick = function () {
        usersModal.style.display = "block";
    };

    // Fechar o modal
    closeModalBtn.onclick = function () {
        usersModal.style.display = "none";
    };
    closeModalSpan.onclick = function () {
        usersModal.style.display = "none";
    };

    // Fechar o modal clicando fora dele
    window.onclick = function (event) {
        if (event.target === usersModal) {
            usersModal.style.display = "none";
        }
    }
}
