document.addEventListener('DOMContentLoaded', async () => {
    const localesList = document.getElementById('localesList');
    const serviciosList = document.getElementById('publicacionesList');
    const modalElement = document.getElementById('publicacionesModal');
    
    if (!modalElement) {
        console.error('No se encontró el elemento modal');
        return;
    }
    
    const serviciosModal = new bootstrap.Modal(modalElement);
    const localNombreElement = document.getElementById('localNombre');

    try {
        // Cargar lista de locales
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales`);
        if (!response.ok) {
            throw new Error('Error al cargar los locales');
        }
        const locales = await response.json();

        if (locales.length === 0) {
            localesList.innerHTML = '<div class="col-12"><p class="text-center">No hay locales disponibles.</p></div>';
            return;
        }

        localesList.innerHTML = locales.map(local => `
            <div class="col-md-4 mb-4">
                <div class="card local-card" onclick="mostrarServicios(${local.id}, '${local.nombre}')">
                    <div class="card-body">
                        <h5 class="card-title">${local.nombre}</h5>
                        <p class="card-text">
                            <strong>Dirección:</strong> ${local.direccion}<br>
                            <strong>WhatsApp:</strong> ${local.whatsappurl ? `<a href="${local.whatsappurl}" target="_blank">Contactar</a>` : 'No disponible'}
                        </p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
        localesList.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error al cargar los locales. Por favor, intente más tarde.</p></div>';
    }

    // Función global para mostrar servicios
    window.mostrarServicios = async (localId, localNombre) => {
        try {
            if (localNombreElement) {
                localNombreElement.textContent = `Servicios de ${localNombre}`;
            }
            
            const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales/${localId}/servicios`);
            if (!response.ok) {
                throw new Error('Error al obtener los servicios');
            }
            const servicios = await response.json();

            if (servicios.length === 0) {
                serviciosList.innerHTML = '<div class="col-12"><p class="text-center">Este local no tiene servicios disponibles.</p></div>';
            } else {
                serviciosList.innerHTML = servicios.map(servicio => `
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h5 class="card-title">${servicio.nombre}</h5>
                                <p class="card-text">
                                    <strong>Precio:</strong> $${servicio.precio}<br>
                                    <strong>Descripción:</strong> ${servicio.descripcion || 'No disponible'}
                                </p>
                                <button onclick="agendarCita(${localId}, ${servicio.id})" 
                                        class="btn btn-primary">
                                    Agendar Cita
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            // serviciosModal.show();
        } catch (error) {
            console.error('Error:', error);
            serviciosList.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error al cargar los servicios. Por favor, intente más tarde.</p></div>';
        }
    };

    // Función global para agendar cita
    window.agendarCita = (localId, servicioId) => {
        localStorage.setItem('localId', localId);
        localStorage.setItem('servicioId', servicioId);
        window.location.href = 'agendarCita.html';
    };
});

async function abrirChat(localId) {
    try {
        // Verificar si el usuario está autenticado
        const userId = localStorage.getItem('userId');
        if (!userId) {
            showToast('error', 'Debes iniciar sesión para chatear');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }

        // Redirigir al chat
        window.location.href = `chat.html?localId=${localId}`;
    } catch (error) {
        console.error('Error:', error);
        showToast('error', error.message);
    }
}

// Función para mostrar notificaciones toast
function showToast(type, message) {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
                                       <div class="col-md-4 mb-4">
                    <div class="card local-card" onclick="mostrarServicios(${local.id})">
                        <div class="card-body">
                            <h5 class="card-title">${local.nombre}</h5>
                            <p class="card-text">
                                <strong>Dirección:</strong> ${local.direccion}<br>
                                <strong>Teléfono:</strong> ${local.telefono || 'No disponible'}<br>
                                <strong>Horario:</strong> ${local.horario || '8:00 AM - 6:00 PM'}
                            </p>
                        </div>
                    </div>
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

// Función para crear el contenedor de toasts
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
}
