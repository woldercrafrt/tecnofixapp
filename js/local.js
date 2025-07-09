document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si el usuario está autenticado
    if (!API_CONFIG.isAuthenticated()) {
        showToast('error', 'Debes iniciar sesión para acceder al panel del local');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // Obtener información del usuario
    const userInfo = localStorage.getItem('user_info');
    if (!userInfo) {
        showToast('error', 'Información de usuario no encontrada');
        return;
    }

    const user = JSON.parse(userInfo);
    
    // Verificar que el usuario tenga rol LOCAL
    if (user.rol !== 'LOCAL') {
        showToast('error', 'Solo usuarios con rol LOCAL pueden acceder al panel del local');
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 2000);
        return;
    }

    // Cargar información del local
    await cargarInformacionLocal(user.id);
    
    // Cargar estadísticas
    await cargarEstadisticas();
    
    // Cargar servicios recientes
    await cargarServiciosRecientes();
    
    // Cargar próximas citas
    await cargarProximasCitas();
});

// Función para cargar la información del local
async function cargarInformacionLocal(userId) {
    try {
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales/usuario/${userId}`);
        
        if (response.ok) {
            const local = await response.json();
            
            if (local) {
                // Guardar información del local en localStorage
                localStorage.setItem('local_info', JSON.stringify(local));
                
                // Mostrar información del local
                const infoLocalDiv = document.getElementById('infoLocal');
                if (infoLocalDiv) {
                    infoLocalDiv.innerHTML = `
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong><i class="fas fa-store me-2"></i>Nombre:</strong> ${local.nombre}</p>
                                <p><strong><i class="fas fa-map-marker-alt me-2"></i>Dirección:</strong> ${local.direccion}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong><i class="fab fa-whatsapp me-2"></i>WhatsApp:</strong> 
                                    <a href="${local.whatsappURL}" target="_blank" class="text-decoration-none">
                                        <i class="fab fa-whatsapp text-success"></i> Contactar
                                    </a>
                                </p>
                            </div>
                        </div>
                    `;
                }
            } else {
                // Usuario no tiene local
                showToast('error', 'No tienes un local asociado. Crea un local primero.');
                setTimeout(() => {
                    window.location.href = 'crearLocal.html';
                }, 2000);
            }
        } else {
            throw new Error('Error al cargar información del local');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Error al cargar información del local');
    }
}

// Función para cargar estadísticas
async function cargarEstadisticas() {
    try {
        const localInfo = localStorage.getItem('local_info');
        if (!localInfo) return;
        
        const local = JSON.parse(localInfo);
        
        // Cargar servicios
        const serviciosResponse = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/servicios/local/${local.id}`);
        if (serviciosResponse.ok) {
            const servicios = await serviciosResponse.json();
            document.getElementById('totalServicios').textContent = servicios.length;
        }
        
        // TODO: Implementar carga de citas, calificaciones y mensajes
        // Por ahora, mostrar valores por defecto
        document.getElementById('totalCitas').textContent = '0';
        document.getElementById('calificacionPromedio').textContent = '0.0';
        document.getElementById('totalMensajes').textContent = '0';
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Función para cargar servicios recientes
async function cargarServiciosRecientes() {
    try {
        const localInfo = localStorage.getItem('local_info');
        if (!localInfo) return;
        
        const local = JSON.parse(localInfo);
        
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/servicios/local/${local.id}`);
        
        if (response.ok) {
            const servicios = await response.json();
            const serviciosRecientesDiv = document.getElementById('serviciosRecientes');
            
            if (serviciosRecientesDiv) {
                if (servicios.length === 0) {
                    serviciosRecientesDiv.innerHTML = `
                        <div class="text-center text-muted py-4">
                            <i class="fas fa-tools fa-3x mb-3"></i>
                            <p>No tienes servicios registrados</p>
                            <a href="crearPublicacion.html" class="btn btn-primary">
                                <i class="fas fa-plus me-2"></i>Crear Primer Servicio
                            </a>
                        </div>
                    `;
                } else {
                    // Mostrar los últimos 5 servicios
                    const serviciosMostrar = servicios.slice(0, 5);
                    serviciosRecientesDiv.innerHTML = serviciosMostrar.map(servicio => `
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">${servicio.nombre}</h6>
                                <small class="text-muted">$${servicio.precio} - ${servicio.categoria}</small>
                            </div>
                            <span class="badge bg-primary rounded-pill">$${servicio.precio}</span>
                        </div>
                    `).join('');
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar servicios recientes:', error);
    }
}

// Función para cargar próximas citas
async function cargarProximasCitas() {
    try {
        const proximasCitasDiv = document.getElementById('proximasCitas');
        
        if (proximasCitasDiv) {
            // TODO: Implementar carga de citas desde el backend
            proximasCitasDiv.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-calendar fa-3x mb-3"></i>
                    <p>No hay citas programadas</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar próximas citas:', error);
    }
}

// Función para editar información del local
function editarInformacion() {
    const localInfo = localStorage.getItem('local_info');
    if (!localInfo) {
        showToast('error', 'No hay información del local para editar');
        return;
    }
    
    const local = JSON.parse(localInfo);
    
    // Llenar el modal con la información actual
    document.getElementById('editNombre').value = local.nombre;
    document.getElementById('editDireccion').value = local.direccion;
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('editarLocalModal'));
    modal.show();
}

// Función para guardar cambios del local
async function guardarCambios() {
    try {
        const localInfo = localStorage.getItem('local_info');
        if (!localInfo) {
            showToast('error', 'No hay información del local para actualizar');
            return;
        }
        
        const local = JSON.parse(localInfo);
        
        const datosActualizados = {
            nombre: document.getElementById('editNombre').value,
            direccion: document.getElementById('editDireccion').value,
            whatsappURL: local.whatsappURL // Mantener el WhatsApp actual
        };
        
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales/${local.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosActualizados)
        });
        
        if (response.ok) {
            const localActualizado = await response.json();
            localStorage.setItem('local_info', JSON.stringify(localActualizado));
            
            showToast('success', 'Información del local actualizada correctamente');
            
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editarLocalModal'));
            modal.hide();
            
            // Recargar la información
            await cargarInformacionLocal(localActualizado.id);
        } else {
            throw new Error('Error al actualizar el local');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Error al actualizar la información del local');
    }
}

// Función para mostrar notificaciones toast
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

// Función para crear el contenedor de toasts
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
}
