document.addEventListener('DOMContentLoaded', async () => {
    // Obtener información del usuario usando las claves correctas
    const token = localStorage.getItem("jwt_token");
    const userInfo = localStorage.getItem("user_info");

    // Verificar autenticación
    if (!token || !userInfo) {
        alert('No se ha encontrado información de usuario. Redirigiendo a inicio de sesión.');
        window.location.href = 'login.html';
        return;
    }

    const publicacionesList = document.getElementById('publicacionesList');
    const botonesPublicacion = document.getElementById('botonesPublicacion');

    try {
        const user = JSON.parse(userInfo);
        const usuarioId = user.id;

        // Agregar botón de nueva publicación si el usuario es un local
        if (user.rol === "LOCAL") {
            const btnNuevo = document.createElement('button');
            btnNuevo.className = 'btn btn-primary';
            btnNuevo.innerHTML = '<i class="fas fa-plus me-2"></i>Nueva Publicación';
            btnNuevo.onclick = () => window.location.href = 'crearPublicacion.html';
            botonesPublicacion.appendChild(btnNuevo);
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}/servicios`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`Error al obtener las publicaciones: ${response.status}`);
        }

        const publicaciones = await response.json();

        if (publicaciones.length === 0) {
            publicacionesList.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-store fa-3x mb-3" style="color: var(--text-light)"></i>
                    <h3>No hay publicaciones disponibles</h3>
                    <p class="text-muted">Sé el primero en publicar un servicio</p>
                </div>
            `;
            return;
        }

        publicaciones.forEach(publicacion => {
            const publicacionDiv = document.createElement('div');
            publicacionDiv.className = 'feature';
            
            // Determinar qué tipo de botón de chat mostrar
            const chatButton = publicacion.local.whatsappURL 
                ? `<a href="${publicacion.local.whatsappURL}" target="_blank" class="btn btn-success btn-sm">
                    <i class="fab fa-whatsapp me-1"></i>WhatsApp
                   </a>`
                : `<button class="btn btn-secondary btn-sm" onclick="abrirChat(${publicacion.id}, ${publicacion.local.id})">
                    <i class="fas fa-comments me-1"></i>Chat
                   </button>`;

            publicacionDiv.innerHTML = `
                <div class="position-relative">
                    <div class="badge position-absolute top-0 end-0 m-2">
                        ${publicacion.categoria || 'General'}
                    </div>
                    <img src="${publicacion.imagen || 'https://via.placeholder.com/300x200?text=Servicio+Tecnológico'}" 
                         class="img-fluid w-100 mb-3" 
                         style="border-radius: 8px; object-fit: cover; height: 200px;"
                         alt="${publicacion.nombre}">
                </div>
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title mb-0">${publicacion.nombre}</h5>
                    <span class="badge bg-primary">$${publicacion.precio}</span>
                </div>
                <p class="text-muted mb-2">
                    <i class="fas fa-store-alt me-1"></i>
                    ${publicacion.local.nombre || 'Local no especificado'}
                </p>
                <p class="card-text mb-3" style="height: 48px; overflow: hidden;">
                    ${publicacion.descripcion}
                </p>
                <div class="d-flex justify-content-between align-items-center">
                    <button class="btn btn-primary btn-sm" onclick="agendarCita(${publicacion.id}, ${publicacion.local.id})">
                        <i class="fas fa-calendar-plus me-1"></i>Agendar
                    </button>
                    ${chatButton}
                </div>
            `;
            publicacionesList.appendChild(publicacionDiv);
        });
    } catch (error) {
        console.error('Error:', error);
        publicacionesList.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x mb-3" style="color: var(--text-light)"></i>
                <h3>Error al cargar las publicaciones</h3>
                <p class="text-muted">${error.message || 'Por favor, intenta más tarde'}</p>
            </div>
        `;
    }
});

// Nueva función para manejar la redirección a agendarCita.html
function agendarCita(servicioId, localId) {
    localStorage.setItem('servicioId', servicioId);
    localStorage.setItem('localId', localId);
    window.location.href = 'agendarCita.html';
}

// Función para abrir chat interno
async function abrirChat(servicioId, localId) {
    const token = localStorage.getItem("jwt_token");
    const userInfo = localStorage.getItem("user_info");

    if (!token || !userInfo) {
        alert('No se ha encontrado información de usuario. Redirigiendo a inicio de sesión.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const user = JSON.parse(userInfo);
        const usuarioId = user.id;
        
        localStorage.setItem('localID', localId);
        
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

        const checkResponse = await fetch(`${API_CONFIG.BASE_URL}/chats/sala/${salaId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!checkResponse.ok) {
            if (checkResponse.status === 401) {
                alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Error al verificar la sala de chat');
        }

        const existingChats = await checkResponse.json();

        if (existingChats.length === 0) {
            const response = await fetch(`${API_CONFIG.BASE_URL}/chats`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mensajeInicial)
            });

            if (!response.ok) {
                if (response.status === 401) {
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error('Error al crear la sala de chat');
            }
        }

        window.location.href = 'chat.html';
    } catch (error) {
        console.error('Error:', error);
        showToast('error', 'Error al crear la sala de chat');
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
