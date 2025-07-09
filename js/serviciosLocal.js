document.addEventListener('DOMContentLoaded', async () => {
    const localId = localStorage.getItem('localId');
    if (!localId) {
        showToast('error', 'No se encontró el ID del local');
        return;
    }

    try {
        // Cargar detalles del local
        const localResponse = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales/publico/${localId}`);
        if (!localResponse) {
            // Ya se mostró el mensaje de error, solo retorna
            return;
        }
        if (!localResponse.ok) {
            throw new Error('Error al cargar los detalles del local');
        }
        const local = await localResponse.json();

        // Actualizar la información del local en la página
        document.getElementById('nombreLocal').textContent = local.nombre;
        document.getElementById('direccionLocal').textContent = local.direccion;
        document.getElementById('telefonoLocal').textContent = local.telefono;

        // Cargar servicios del local
        const serviciosResponse = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/servicios/local/${localId}`);
        if (!serviciosResponse.ok) {
            throw new Error('Error al cargar los servicios del local');
        }
        const servicios = await serviciosResponse.json();

        const serviciosContainer = document.getElementById('serviciosList');
        serviciosContainer.innerHTML = '';

        if (servicios.length === 0) {
            serviciosContainer.innerHTML = `
                <div class="text-center text-muted my-5">
                    <i class="fas fa-tools fa-3x mb-3"></i>
                    <h4>No hay servicios disponibles</h4>
                    <p>¡Agrega servicios para que los usuarios puedan agendar citas!</p>
                    <a href="crearPublicacion.html" class="btn btn-primary mt-3">
                        <i class="fas fa-plus me-2"></i>
                        Crear servicio
                    </a>
                </div>
            `;
            return;
        }

        // Crear tarjetas para cada servicio
        for (const servicio of servicios) {
            const calificaciones = await fetch(`${API_CONFIG.BASE_URL}/calificaciones/servicio/${servicio.id}`)
                .then(res => res.ok ? res.json() : [])
                .catch(() => []);
            let promedio = 0;
            let estrellas = '';
            if (calificaciones.length > 0) {
                promedio = calificaciones.reduce((acc, c) => acc + c.puntuacion, 0) / calificaciones.length;
                estrellas = '★'.repeat(Math.round(promedio)) + '☆'.repeat(5 - Math.round(promedio));
            } else {
                estrellas = 'Sin calificaciones';
            }
            const comentarios = calificaciones.map(c => `<div class='text-muted small mb-1'><b>${'★'.repeat(c.puntuacion)}${'☆'.repeat(5-c.puntuacion)}</b> ${c.comentario ? c.comentario : ''}</div>`).join('');
            const servicioCard = document.createElement('div');
            servicioCard.className = 'col-md-6 col-lg-4 mb-4';
            servicioCard.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">${servicio.nombre}</h5>
                        <p class="card-text">${servicio.descripcion}</p>
                        <p class="card-text">
                            <strong class="text-primary">$${servicio.precio}</strong>
                        </p>
                        <div class="mb-2"><span class="text-warning">${estrellas}</span> <span class="text-muted small">(${calificaciones.length} calificaciones)</span></div>
                        <div class="mb-2">${comentarios}</div>
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary" onclick="agendarCita(${servicio.id})">
                                <i class="fas fa-calendar-plus me-1"></i>Agendar Cita
                            </button>
                            ${local.whatsappURL ? `
                                <a href="${local.whatsappURL}" target="_blank" class="btn btn-success">
                                    <i class="fab fa-whatsapp me-1"></i>WhatsApp
                                </a>
                            ` : `
                                <button class="btn btn-success" disabled>
                                    <i class="fab fa-whatsapp me-1"></i>WhatsApp
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
            serviciosContainer.appendChild(servicioCard);
        }

    } catch (error) {
        console.error('Error:', error);
        showToast('error', error.message);
    }
});

async function editarServicio(servicioId) {
    try {
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/servicios/${servicioId}`);
        if (!response.ok) {
            throw new Error('Error al cargar los detalles del servicio');
        }
        const servicio = await response.json();

        // Llenar el formulario con los datos del servicio
        document.getElementById('servicioId').value = servicio.id;
        document.getElementById('nombre').value = servicio.nombre;
        document.getElementById('precio').value = servicio.precio;
        document.getElementById('descripcion').value = servicio.descripcion;

        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('editarServicioModal'));
        modal.show();
    } catch (error) {
        console.error('Error:', error);
        showToast('error', error.message);
    }
}

async function guardarServicio(event) {
    event.preventDefault();

    const servicioId = document.getElementById('servicioId').value;
    const servicio = {
        nombre: document.getElementById('nombre').value,
        precio: parseFloat(document.getElementById('precio').value),
        descripcion: document.getElementById('descripcion').value,
        localId: parseInt(localStorage.getItem('localId'))
    };

    try {
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/servicios/${servicioId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(servicio)
        });

        if (!response.ok) {
            throw new Error('Error al actualizar el servicio');
        }

        showToast('success', 'Servicio actualizado con éxito');

        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editarServicioModal'));
        modal.hide();

        // Recargar la página para mostrar los cambios
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    } catch (error) {
        console.error('Error:', error);
        showToast('error', error.message);
    }
}

async function eliminarServicio(servicioId) {
    if (!confirm('¿Está seguro de que desea eliminar este servicio?')) {
        return;
    }

    try {
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/servicios/${servicioId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Error al eliminar el servicio');
        }

        showToast('success', 'Servicio eliminado con éxito');

        // Recargar la página para mostrar los cambios
        setTimeout(() => {
            window.location.reload();
        }, 1500);
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

// Función para crear el contenedor de toasts
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
}

// Reemplazo la función agendarCita global para redirigir a agendarCita.html con el id del servicio
window.agendarCita = function(servicioId) {
    localStorage.setItem('servicioId', servicioId);
    window.location.href = 'agendarCita.html';
};
