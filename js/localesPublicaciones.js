document.addEventListener('DOMContentLoaded', async () => {
    const usuarioId = localStorage.getItem("usuarioId");
    const localesListContent = document.getElementById('localesListContent');
    const botonesLocal = document.getElementById('botonesLocal');

    // Agregar botón de nuevo local si el usuario es un local
    if (localStorage.getItem("tipoUsuario") === "local") {
        const btnNuevo = document.createElement('button');
        btnNuevo.className = 'btn btn-primary';
        btnNuevo.innerHTML = '<i class="fas fa-plus me-2"></i>Nuevo Local';
        btnNuevo.onclick = () => window.location.href = 'crearLocal.html';
        botonesLocal.appendChild(btnNuevo);
    }

    try {
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales`);
        if (!response.ok) {
            throw new Error(`Error al obtener los locales: ${response.status}`);
        }

        const locales = await response.json();

        if (locales.length === 0) {
            localesListContent.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-building fa-3x mb-3" style="color: var(--text-light)"></i>
                    <h3>No hay locales disponibles</h3>
                    <p class="text-muted">Sé el primero en registrar un local</p>
                </div>
            `;
            return;
        }

        locales.forEach(local => {
            const localDiv = document.createElement('div');
            localDiv.className = 'feature'; // Reutilizar la clase feature para el estilo de tarjeta
            
            // Determinar qué tipo de botón de chat mostrar
            const chatButton = local.whatsappurl 
                ? `<a href="${local.whatsappurl}" target="_blank" class="btn btn-success btn-sm">
                    <i class="fab fa-whatsapp me-1"></i>WhatsApp
                   </a>`
                : `<button class="btn btn-secondary btn-sm" onclick="abrirChat(${local.id})">
                    <i class="fas fa-comments me-1"></i>Chat
                   </button>`;

            // Crear el selector de servicios
            const serviciosSelect = document.createElement('select');
            serviciosSelect.className = 'form-select form-select-sm mb-2';
            serviciosSelect.id = `servicios-${local.id}`;
            serviciosSelect.innerHTML = '<option value="">Selecciona un servicio</option>';

            // Cargar los servicios del local
            fetch(`${API_CONFIG.BASE_URL}/locales/${local.id}/servicios`, {
                headers: {
                    'X-API-Key': API_CONFIG.API_KEY
                }
            })
            .then(response => response.json())
            .then(servicios => {
                servicios.forEach(servicio => {
                    const option = document.createElement('option');
                    option.value = servicio.id;
                    option.textContent = `${servicio.nombre} - $${servicio.precio}`;
                    serviciosSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error al cargar servicios:', error);
                serviciosSelect.innerHTML = '<option value="">Error al cargar servicios</option>';
            });

            localDiv.innerHTML = `
                <div class="position-relative">
                    <img src="${local.imagen || 'https://via.placeholder.com/300x200?text=Local+Tecnologico'}" 
                         class="img-fluid w-100 mb-3" 
                         style="border-radius: 8px; object-fit: cover; height: 200px;"
                         alt="${local.nombre}">
                </div>
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title mb-0">${local.nombre}</h5>
                </div>
                <p class="text-muted mb-2">
                    <i class="fas fa-map-marker-alt me-1"></i>
                    ${local.direccion || 'Dirección no especificada'}
                </p>
                <div class="mb-2">
                    <select class="form-select form-select-sm" id="servicios-${local.id}">
                        <option value="">Selecciona un servicio</option>
                    </select>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <button class="btn btn-primary btn-sm" onclick="agendarCita(${local.id}, 'servicios-${local.id}')">
                        <i class="fas fa-calendar-plus me-1"></i>Agendar
                    </button>
                    ${chatButton}
                </div>
            `;
            localesListContent.appendChild(localDiv);

            // Cargar los servicios después de agregar el div al DOM
            const selectElement = document.getElementById(`servicios-${local.id}`);
            fetch(`${API_CONFIG.BASE_URL}/locales/${local.id}/servicios`, {
                headers: {
                    'X-API-Key': API_CONFIG.API_KEY
                }
            })
            .then(response => response.json())
            .then(servicios => {
                servicios.forEach(servicio => {
                    const option = document.createElement('option');
                    option.value = servicio.id;
                    option.textContent = `${servicio.nombre} - $${servicio.precio}`;
                    selectElement.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error al cargar servicios:', error);
                selectElement.innerHTML = '<option value="">Error al cargar servicios</option>';
            });
        });
    } catch (error) {
        console.error('Error:', error);
        localesListContent.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x mb-3" style="color: var(--text-light)"></i>
                <h3>Error al cargar los locales</h3>
                <p class="text-muted">${error.message || 'Por favor, intenta más tarde'}</p>
            </div>
        `;
    }
});

// Función para agendar cita (ahora con localId y servicioId)
function agendarCita(localId, serviciosSelectId) {
    const selectElement = document.getElementById(serviciosSelectId);
    const servicioId = selectElement.value;

    if (!servicioId) {
        showToast('error', 'Por favor, selecciona un servicio primero');
        return;
    }

    localStorage.setItem('localId', localId);
    localStorage.setItem('servicioId', servicioId);
    window.location.href = 'agendarCita.html';
}

// Función para abrir chat con el local
async function abrirChat(localId) {
    const usuarioId = localStorage.getItem("usuarioId");
    localStorage.setItem('localID', localId);
    
    if (!usuarioId) {
        showToast('error', 'Debes iniciar sesión para chatear');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    const salaId = `${usuarioId}-${localId}`;
    const fechaActual = new Date();
    const fechaFormateada = fechaActual.toISOString();

    const mensajeInicial = {
        mensaje: "¡Hola! Me interesa saber más sobre sus servicios.", 
        urlImagen: null,
        sala: salaId,
        usuarioId: usuarioId,
        localId: localId,
        enviadoPor: 1,
        fecha: fechaFormateada
    };

    try {
        const checkResponse = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/chats/sala/${salaId}`);
        if (!checkResponse.ok) {
            throw new Error('Error al verificar la sala de chat');
        }
        const existingChats = await checkResponse.json();

        if (existingChats.length === 0) {
            const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/chats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mensajeInicial)
            });

            if (!response.ok) {
                throw new Error('Error al crear la sala de chat');
            }
        }

        window.location.href = 'chat.html';
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Error al crear la sala de chat');
    }
}

// Función para mostrar notificaciones toast (reutilizada de publicaciones.js)
function showToast(type, message) {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'info' ? 'info' : 'danger'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'info' ? 'info-circle' : 'exclamation-circle'} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remover el toast después de que se oculte
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Función para crear el contenedor de toasts (reutilizada de publicaciones.js)
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
} 