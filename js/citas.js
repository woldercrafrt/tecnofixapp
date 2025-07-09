document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación usando el nuevo sistema JWT
    let userId = null;
    
    // Intentar obtener el ID del usuario del nuevo sistema JWT
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            userId = user.id;
        } catch (e) {
            console.error('Error al parsear información del usuario:', e);
        }
    }
    
    // Fallback al sistema anterior si no hay user_info
    if (!userId) {
        userId = localStorage.getItem('usuarioId');
    }
    
    console.log('ID del usuario:', userId);
    
    if (!userId) {
        showToast('error', 'Debes iniciar sesión para ver tus citas');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    try {
        // Verificar que API_CONFIG esté disponible
        if (typeof API_CONFIG === 'undefined') {
            throw new Error('Error de configuración de la API');
        }

        // Cargar citas del usuario
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/citas/usuario/${userId}`);
        if (!response) {
            throw new Error('Error de autenticación');
        }
        if (!response.ok) {
            throw new Error('Error al cargar las citas');
        }
        const citas = await response.json();
        console.log('Citas recibidas del backend:', citas);

        // Ordenar citas por fecha
        citas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        const citasContainer = document.getElementById('citasList');
        if (!citasContainer) {
            console.error('Contenedor de citas no encontrado');
            return;
        }
        
        citasContainer.innerHTML = '';

        if (citas.length === 0) {
            citasContainer.innerHTML = `
                <div class="text-center text-muted my-5">
                    <i class="fas fa-calendar-times fa-3x mb-3"></i>
                    <h4>No tienes citas agendadas</h4>
                    <p>¡Agenda una cita con alguno de nuestros locales!</p>
                    <a href="locales.html" class="btn btn-primary mt-3">
                        <i class="fas fa-store me-2"></i>
                        Ver locales
                    </a>
                </div>
            `;
            return;
        }

        // Agrupar citas por estado
        const citasPorEstado = {
            PENDIENTE: [],
            CONFIRMADA: [],
            COMPLETADA: [],
            CANCELADA: []
        };

        citas.forEach(cita => {
            if (citasPorEstado[cita.estado]) {
                citasPorEstado[cita.estado].push(cita);
            }
        });

        // Crear pestañas para cada estado
        const tabContainer = document.createElement('div');
        tabContainer.className = 'nav nav-tabs mb-4';
        tabContainer.setAttribute('role', 'tablist');

        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';

        Object.entries(citasPorEstado).forEach(([estado, citasDelEstado], index) => {
            if (citasDelEstado.length === 0) return;

            // Crear pestaña
            const tab = document.createElement('button');
            tab.className = `nav-link ${index === 0 ? 'active' : ''}`;
            tab.setAttribute('data-bs-toggle', 'tab');
            tab.setAttribute('data-bs-target', `#${estado.toLowerCase()}`);
            tab.setAttribute('role', 'tab');
            tab.innerHTML = `
                ${estado}
                <span class="badge bg-primary ms-2">${citasDelEstado.length}</span>
            `;
            tabContainer.appendChild(tab);

            // Crear contenido de la pestaña
            const tabPane = document.createElement('div');
            tabPane.className = `tab-pane fade ${index === 0 ? 'show active' : ''}`;
            tabPane.id = estado.toLowerCase();

            // Agregar citas a la pestaña
            citasDelEstado.forEach(cita => {
                const citaCard = document.createElement('div');
                citaCard.className = 'card mb-3';
                citaCard.innerHTML = `
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h5 class="card-title">${cita.servicio?.nombre || 'Servicio N/A'}</h5>
                                <h6 class="card-subtitle mb-2 text-muted">${cita.local?.nombre || 'Local N/A'}</h6>
                            </div>
                            <span class="badge bg-${getEstadoColor(cita.estado)}">${cita.estado}</span>
                        </div>
                        <p class="card-text">
                            <i class="fas fa-calendar-alt text-primary me-2"></i>
                            ${new Date(cita.fecha).toLocaleDateString()}
                        </p>
                        <p class="card-text">
                            <i class="fas fa-clock text-success me-2"></i>
                            ${cita.hora}
                        </p>
                        <p class="card-text">
                            <i class="fas fa-map-marker-alt text-danger me-2"></i>
                            ${cita.local?.direccion || 'Dirección N/A'}
                        </p>
                        ${cita.notas ? `
                            <p class="card-text">
                                <i class="fas fa-sticky-note text-info me-2"></i>
                                ${cita.notas}
                            </p>
                        ` : ''}
                        <div class="d-flex gap-2 mt-3">
                            ${cita.estado === 'COMPLETADA' ? `
                                <a class="btn btn-success btn-sm" href="calificarLocal.html?citaId=${cita.id}&localId=${cita.local?.id || ''}&servicioId=${cita.servicio?.id || ''}">
                                    <i class="fas fa-star me-2"></i>
                                    Calificar local
                                </a>
                            ` : `
                                <button class="btn btn-danger btn-sm" onclick="cancelarCita(${cita.id})">
                                    <i class="fas fa-times me-2"></i>
                                    Cancelar
                                </button>
                                <button class="btn btn-primary btn-sm" onclick="reprogramarCita(${cita.id}, ${cita.local?.id}, ${cita.servicio?.id})">
                                    <i class="fas fa-calendar-alt me-2"></i>
                                    Reprogramar
                                </button>
                            `}
                            ${cita.local?.id ? `
                                <button class="btn btn-outline-primary btn-sm" onclick="abrirChat(${cita.local.id})">
                                    <i class="fas fa-comments me-2"></i>
                                    Chatear
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
                tabPane.appendChild(citaCard);
            });

            tabContent.appendChild(tabPane);
        });

        citasContainer.appendChild(tabContainer);
        citasContainer.appendChild(tabContent);

    } catch (error) {
        console.error('Error:', error);
        showToast('error', error.message || 'Error al cargar las citas');
    }
});

function getEstadoColor(estado) {
    switch (estado) {
        case 'PENDIENTE': return 'warning';
        case 'CONFIRMADA': return 'info';
        case 'COMPLETADA': return 'success';
        case 'CANCELADA': return 'danger';
        default: return 'secondary';
    }
}

async function cancelarCita(citaId) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
        return;
    }

    try {
        if (typeof API_CONFIG === 'undefined') {
            throw new Error('Error de configuración de la API');
        }

        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/citas/${citaId}/cancelar`, {
            method: 'PUT'
        });

        if (!response) {
            throw new Error('Error de autenticación');
        }
        if (!response.ok) {
            throw new Error('Error al cancelar la cita');
        }

        showToast('success', 'Cita cancelada con éxito');
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    } catch (error) {
        console.error('Error:', error);
        showToast('error', error.message || 'Error al cancelar la cita');
    }
}

function reprogramarCita(citaId, localId, servicioId) {
    localStorage.setItem('citaIdAReprogramar', citaId);
    localStorage.setItem('localId', localId);
    localStorage.setItem('servicioId', servicioId);
    window.location.href = 'reprogramarCita.html';
}

async function abrirChat(localId) {
    try {
        window.location.href = `chat.html?localId=${localId}`;
    } catch (error) {
        console.error('Error:', error);
        showToast('error', error.message || 'Error al abrir el chat');
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
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
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

// Función para crear el contenedor de toasts si no existe
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
}
