document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación usando el nuevo sistema JWT
    let userInfo = null;
    let localId = null;
    
    // Intentar obtener la información del usuario del nuevo sistema JWT
    const userInfoStr = localStorage.getItem('user_info');
    if (userInfoStr) {
        try {
            userInfo = JSON.parse(userInfoStr);
            console.log('Información del usuario:', userInfo);
        } catch (e) {
            console.error('Error al parsear información del usuario:', e);
        }
    }
    
    if (!userInfo) {
        showToast('error', 'Debes iniciar sesión para gestionar las citas');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // Verificar si el usuario es LOCAL
    if (userInfo.rol !== 'LOCAL') {
        showToast('error', 'Solo los locales pueden acceder a esta página');
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 2000);
        return;
    }

    // Obtener el ID del local asociado al usuario
    try {
        if (typeof API_CONFIG === 'undefined') {
            throw new Error('Error de configuración de la API');
        }

        // Buscar el local asociado al usuario
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales/usuario/${userInfo.id}`);
        if (!response) {
            throw new Error('Error de autenticación');
        }
        if (!response.ok) {
            throw new Error('No se encontró un local asociado a tu cuenta');
        }
        
        const local = await response.json();
        localId = local.id;
        console.log('Local encontrado:', local);

        // Cargar citas del local
        await cargarCitasLocal(localId);

    } catch (error) {
        console.error('Error:', error);
        showToast('error', error.message || 'Error al cargar las citas del local');
        
        // Si no hay local asociado, mostrar mensaje
        const citasContainer = document.getElementById('citasList');
        if (citasContainer) {
            citasContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-store"></i>
                    <h4>No tienes un local registrado</h4>
                    <p>Para gestionar citas, primero debes crear un local.</p>
                    <a href="crearLocal.html" class="btn btn-primary mt-3">
                        <i class="fas fa-plus me-2"></i>
                        Crear Local
                    </a>
                </div>
            `;
        }
    }

    // Configurar filtros
    document.getElementById('filterStatus').addEventListener('change', () => aplicarFiltros());
    document.getElementById('filterDate').addEventListener('change', () => aplicarFiltros());
});

async function cargarCitasLocal(localId) {
    try {
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/citas/local/${localId}`);
        if (!response.ok) {
            throw new Error('Error al cargar las citas');
        }
        
        const citas = await response.json();
        console.log('Citas del local recibidas:', citas);

        // Ordenar citas por fecha (más recientes primero)
        citas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        // Actualizar estadísticas
        actualizarEstadisticas(citas);

        // Mostrar citas
        mostrarCitas(citas);

    } catch (error) {
        console.error('Error al cargar citas:', error);
        showToast('error', 'Error al cargar las citas del local');
    }
}

function actualizarEstadisticas(citas) {
    const stats = {
        total: citas.length,
        pendientes: citas.filter(c => c.estado === 'PENDIENTE').length,
        confirmadas: citas.filter(c => c.estado === 'CONFIRMADA').length,
        completadas: citas.filter(c => c.estado === 'COMPLETADA').length,
        vencidas: citas.filter(c => c.estado === 'VENCIDA').length,
        canceladas: citas.filter(c => c.estado === 'CANCELADA').length
    };

    document.getElementById('totalCitas').textContent = stats.total;
    document.getElementById('pendientes').textContent = stats.pendientes;
    document.getElementById('confirmadas').textContent = stats.confirmadas;
    document.getElementById('completadas').textContent = stats.completadas;
}

function mostrarCitas(citas) {
    const citasContainer = document.getElementById('citasList');
    if (!citasContainer) {
        console.error('Contenedor de citas no encontrado');
        return;
    }
    
    citasContainer.innerHTML = '';

    if (citas.length === 0) {
        citasContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h4>No tienes citas agendadas</h4>
                <p>Las citas que agenden los clientes aparecerán aquí.</p>
            </div>
        `;
        return;
    }

    // Mensaje aclaratorio
    const infoMsg = document.createElement('div');
    infoMsg.className = 'alert alert-info';
    infoMsg.innerHTML = '<i class="fas fa-info-circle me-2"></i>Se muestran <b>todas las citas agendadas</b> a tu local. Puedes confirmar las pendientes y marcar como completadas las confirmadas.';
    citasContainer.appendChild(infoMsg);

    // Agrupar citas por estado
    const citasPorEstado = {
        PENDIENTE: [],
        CONFIRMADA: [],
        COMPLETADA: [],
        VENCIDA: [],
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
            citaCard.className = `card cita-card ${getPriorityClass(cita)}`;
            citaCard.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h5 class="card-title">${cita.servicio?.nombre || 'Servicio N/A'}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">
                                <i class="fas fa-user me-2"></i>${cita.usuario?.nombre || 'Cliente N/A'}
                            </h6>
                        </div>
                        <span class="badge bg-${getEstadoColor(cita.estado)} status-badge">${cita.estado}</span>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <p class="card-text">
                                <i class="fas fa-calendar-alt text-primary me-2"></i>
                                <strong>Fecha:</strong> ${new Date(cita.fecha).toLocaleDateString()}
                            </p>
                        </div>
                        <div class="col-md-6">
                            <p class="card-text">
                                <i class="fas fa-clock text-success me-2"></i>
                                <strong>Hora:</strong> ${cita.hora}
                            </p>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <p class="card-text">
                                <i class="fas fa-envelope text-info me-2"></i>
                                <strong>Email:</strong> ${cita.usuario?.email || 'N/A'}
                            </p>
                        </div>
                        <div class="col-md-6">
                            <p class="card-text">
                                <i class="fas fa-phone text-warning me-2"></i>
                                <strong>Teléfono:</strong> ${cita.usuario?.telefono || 'N/A'}
                            </p>
                        </div>
                    </div>
                    
                    ${cita.notas ? `
                        <div class="mb-3">
                            <p class="card-text">
                                <i class="fas fa-sticky-note text-secondary me-2"></i>
                                <strong>Notas:</strong> ${cita.notas}
                            </p>
                        </div>
                    ` : ''}
                    
                    <div class="action-buttons">
                        ${getBotonesAccion(cita)}
                    </div>
                </div>
            `;
            tabPane.appendChild(citaCard);
        });

        tabContent.appendChild(tabPane);
    });

    citasContainer.appendChild(tabContainer);
    citasContainer.appendChild(tabContent);
}

function getBotonesAccion(cita) {
    let botones = '';
    
    // Botones según el estado actual
    switch (cita.estado) {
        case 'PENDIENTE':
            botones += `
                <button class="btn btn-success btn-sm btn-confirmar" onclick="cambiarEstadoCita(${cita.id}, 'CONFIRMADA')">
                    <i class="fas fa-check me-2"></i>Confirmar Cita
                </button>
                <button class="btn btn-primary btn-sm" onclick="cambiarEstadoCita(${cita.id}, 'COMPLETADA')">
                    <i class="fas fa-check-double me-2"></i>Marcar Completada
                </button>
                <button class="btn btn-danger btn-sm" onclick="cambiarEstadoCita(${cita.id}, 'CANCELADA')">
                    <i class="fas fa-times me-2"></i>Cancelar
                </button>
            `;
            break;
        case 'CONFIRMADA':
            botones += `
                <button class="btn btn-primary btn-sm" onclick="cambiarEstadoCita(${cita.id}, 'COMPLETADA')">
                    <i class="fas fa-check-double me-2"></i>Marcar Completada
                </button>
                <button class="btn btn-warning btn-sm" onclick="cambiarEstadoCita(${cita.id}, 'PENDIENTE')">
                    <i class="fas fa-undo me-2"></i>Volver a Pendiente
                </button>
                <button class="btn btn-danger btn-sm" onclick="cambiarEstadoCita(${cita.id}, 'CANCELADA')">
                    <i class="fas fa-times me-2"></i>Cancelar
                </button>
            `;
            break;
        case 'COMPLETADA':
            botones += `
                <button class="btn btn-info btn-sm" onclick="cambiarEstadoCita(${cita.id}, 'CONFIRMADA')">
                    <i class="fas fa-undo me-2"></i>Volver a Confirmada
                </button>
                <button class="btn btn-warning btn-sm" onclick="cambiarEstadoCita(${cita.id}, 'PENDIENTE')">
                    <i class="fas fa-undo me-2"></i>Volver a Pendiente
                </button>
            `;
            break;
        case 'CANCELADA':
            botones += `
                <button class="btn btn-warning btn-sm" onclick="cambiarEstadoCita(${cita.id}, 'PENDIENTE')">
                    <i class="fas fa-undo me-2"></i>Reactivar
                </button>
            `;
            break;
        case 'VENCIDA':
            botones += `
                <button class="btn btn-warning btn-sm" onclick="cambiarEstadoCita(${cita.id}, 'PENDIENTE')">
                    <i class="fas fa-undo me-2"></i>Reactivar
                </button>
                <button class="btn btn-info btn-sm" onclick="cambiarEstadoCita(${cita.id}, 'CONFIRMADA')">
                    <i class="fas fa-check me-2"></i>Confirmar
                </button>
            `;
            break;
    }
    
    // Botón de chat siempre disponible
    if (cita.usuario?.id) {
        botones += `
            <button class="btn btn-outline-primary btn-sm" onclick="abrirChat(${cita.usuario.id})">
                <i class="fas fa-comments me-2"></i>Chatear
            </button>
        `;
    }
    
    return botones;
}

async function cambiarEstadoCita(citaId, nuevoEstado) {
    const estados = {
        'PENDIENTE': 'pendiente',
        'CONFIRMADA': 'confirmada',
        'COMPLETADA': 'completada',
        'VENCIDA': 'vencida',
        'CANCELADA': 'cancelada'
    };
    
    const estadoTexto = estados[nuevoEstado] || nuevoEstado.toLowerCase();
    
    if (!confirm(`¿Estás seguro de que deseas cambiar el estado de la cita a "${estadoTexto}"?`)) {
        return;
    }

    try {
        console.log(`Actualizando estado de cita ${citaId} a ${nuevoEstado}`);
        
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/citas/${citaId}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!response) {
            throw new Error('No se pudo conectar con el servidor');
        }

        if (!response.ok) {
            // Intentar obtener el mensaje de error del servidor
            let errorMessage = 'Error al actualizar el estado de la cita';
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (e) {
                // Si no se puede parsear el JSON, usar el status text
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }

        const citaActualizada = await response.json();
        console.log('Cita actualizada exitosamente:', citaActualizada);
        
        showToast('success', `Cita ${estadoTexto} exitosamente`);
        
        // Recargar las citas después de un breve delay
        setTimeout(() => {
            location.reload();
        }, 1000);

    } catch (error) {
        console.error('Error al cambiar estado de cita:', error);
        
        // Mostrar mensaje de error más específico
        let errorMessage = error.message || 'Error al actualizar el estado de la cita';
        
        // Si es un error de red, mostrar mensaje específico
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        }
        
        showToast('error', errorMessage);
    }
}

async function confirmarTodasPendientes() {
    if (!confirm('¿Estás seguro de que deseas confirmar todas las citas pendientes?')) {
        return;
    }

    try {
        // Obtener todas las citas pendientes
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/citas/local/${localId}`);
        if (!response.ok) {
            throw new Error('Error al obtener las citas');
        }
        
        const citas = await response.json();
        const citasPendientes = citas.filter(cita => cita.estado === 'PENDIENTE');
        
        if (citasPendientes.length === 0) {
            showToast('info', 'No hay citas pendientes para confirmar');
            return;
        }

        // Confirmar todas las citas pendientes
        const promesas = citasPendientes.map(cita => 
            API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/citas/${cita.id}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ estado: 'CONFIRMADA' })
            })
        );

        await Promise.all(promesas);
        showToast('success', `${citasPendientes.length} citas confirmadas exitosamente`);
        
        // Recargar las citas
        setTimeout(() => {
            location.reload();
        }, 1000);

    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Error al confirmar las citas pendientes');
    }
}

function getEstadoColor(estado) {
    switch (estado) {
        case 'PENDIENTE': return 'warning';
        case 'CONFIRMADA': return 'info';
        case 'COMPLETADA': return 'success';
        case 'VENCIDA': return 'secondary';
        case 'CANCELADA': return 'danger';
        default: return 'secondary';
    }
}

function getPriorityClass(cita) {
    const fecha = new Date(cita.fecha);
    const hoy = new Date();
    const diffTime = fecha - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'priority-high'; // Cita pasada
    if (diffDays <= 1) return 'priority-high'; // Hoy o mañana
    if (diffDays <= 3) return 'priority-medium'; // Esta semana
    return 'priority-low'; // Más de una semana
}

async function abrirChat(usuarioId) {
    // Redirigir al chat con el usuario específico
    window.location.href = `chat.html?usuario=${usuarioId}`;
}

function aplicarFiltros() {
    // Implementar filtros si es necesario
    console.log('Aplicando filtros...');
}

function refreshCitas() {
    location.reload();
}

function showToast(type, message) {
    // Crear contenedor de toast si no existe
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(toastContainer);
    }

    // Crear toast
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    toastContainer.appendChild(toast);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
} 