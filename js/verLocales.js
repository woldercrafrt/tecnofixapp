document.addEventListener('DOMContentLoaded', async () => {
    const localesList = document.getElementById('localesList');
    const publicacionesModal = new bootstrap.Modal(document.getElementById('publicacionesModal'));
    const searchBar = document.querySelector('.search-bar');

    // Función para filtrar locales
    function filtrarLocales(locales, searchTerm) {
        if (!searchTerm) return locales;
        searchTerm = searchTerm.toLowerCase();
        return locales.filter(local => 
            local.nombre.toLowerCase().includes(searchTerm) ||
            local.direccion.toLowerCase().includes(searchTerm) ||
            (local.descripcion && local.descripcion.toLowerCase().includes(searchTerm))
        );
    }

    // Función para cargar los locales
    async function cargarLocales(searchTerm = '') {
        try {
            const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales`);
            if (!response.ok) {
                throw new Error('Error al obtener los locales');
            }
            const locales = await response.json();
            const localesFiltrados = filtrarLocales(locales, searchTerm);

            if (localesFiltrados.length === 0) {
                localesList.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-store fa-3x mb-3" style="color: var(--text-light)"></i>
                        <h3>No se encontraron locales</h3>
                        <p class="text-muted">Intenta con otros términos de búsqueda</p>
                    </div>`;
                return;
            }

            localesList.innerHTML = localesFiltrados.map(local => `
                <div class="card local-card mb-4 shadow-sm" style="width: 20rem;">
                    <div class="card-body">
                        <h5 class="card-title mb-2">${local.nombre}</h5>
                        <p class="card-text mb-2"><i class='fas fa-map-marker-alt me-2'></i>${local.direccion || ''}</p>
                        <div class="mb-3">
                            <span class="badge bg-warning text-dark">
                                <i class="fas fa-star me-1"></i>
                                ${local.calificacion && Number(local.calificacion) > 0 ? Number(local.calificacion).toFixed(1) : 'Sin calificar'}
                            </span>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-primary btn-sm flex-fill" onclick="mostrarServicios(${local.id})">
                                <i class="fas fa-tools me-1"></i>Ver Servicios
                            </button>
                            ${local.whatsappURL && local.whatsappURL !== '#' ? `
                                <a href="${local.whatsappURL}" target="_blank" class="btn btn-success btn-sm flex-fill">
                                    <i class="fab fa-whatsapp me-1"></i>WhatsApp
                                </a>
                            ` : `
                                <button class="btn btn-success btn-sm flex-fill" disabled>
                                    <i class="fab fa-whatsapp me-1"></i>WhatsApp
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error:', error);
            showToast('error', 'Error al cargar los locales');
        }
    }

    // Inicializar búsqueda
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            cargarLocales(e.target.value);
        });
    }

    // Cargar locales al iniciar
    await cargarLocales();

    // Función global para mostrar servicios
    window.mostrarServicios = (localId) => {
        localStorage.setItem('localId', localId);
        window.location.href = `serviciosLocal.html?localId=${localId}`;
    };

    // Función global para mostrar publicaciones
    window.mostrarPublicaciones = async (localId) => {
        try {
            const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales/${localId}/publicaciones`);
            if (!response.ok) {
                throw new Error('Error al obtener las publicaciones');
            }
            const publicaciones = await response.json();
            const publicacionesList = document.getElementById('publicacionesList');

            if (publicaciones.length === 0) {
                publicacionesList.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-store fa-3x mb-3" style="color: var(--text-light)"></i>
                        <h4>Sin publicaciones disponibles</h4>
                        <p class="text-muted">Este local aún no tiene publicaciones</p>
                    </div>`;
            } else {
                publicacionesList.innerHTML = publicaciones.map(publicacion => `
                    <div class="feature">
                        <div class="position-relative">
                            <div class="badge position-absolute top-0 end-0 m-2">
                                ${publicacion.categoria || 'Servicio'}
                            </div>
                            <img src="${publicacion.imagen || 'https://via.placeholder.com/300x200?text=Servicio'}" 
                                 class="img-fluid w-100 mb-3" 
                                 style="border-radius: 8px; object-fit: cover; height: 200px;"
                                 alt="${publicacion.titulo}">
                        </div>
                        <h5 class="card-title">${publicacion.titulo}</h5>
                        <p class="card-text">${publicacion.descripcion}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="badge bg-primary">$${publicacion.precio || 'Consultar'}</span>
                            <small class="text-muted">
                                <i class="far fa-clock me-1"></i>${formatearFecha(publicacion.fecha)}
                            </small>
                        </div>
                    </div>
                `).join('');
            }

            publicacionesModal.show();
        } catch (error) {
            console.error('Error:', error);
            showToast('error', 'Error al cargar las publicaciones');
        }
    };

    // Función para formatear fecha
    window.formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
});

// Agregar estilos adicionales
const style = document.createElement('style');
style.textContent = `
    .card {
        border-radius: 10px;
        border: none;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .btn {
        border-radius: 20px;
        padding: 8px 20px;
    }
    .btn-info {
        background-color: #17a2b8;
        border-color: #17a2b8;
    }
    .btn-info:hover {
        background-color: #138496;
        border-color: #117a8b;
    }
`;
document.head.appendChild(style);
