document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('crearLocalForm');

    // Verificar si el usuario está autenticado
    if (!API_CONFIG.isAuthenticated()) {
        showToast('error', 'Debes iniciar sesión para crear un local');
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
    if (user.rol !== 'LOCAL') {
        showToast('error', 'Solo usuarios con rol LOCAL pueden crear locales');
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 2000);
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const direccion = document.getElementById('direccion').value;
        const whatsappURL = document.getElementById('whatsappURL').value;

        const local = {
            nombre: nombre,
            direccion: direccion,
            whatsappURL: whatsappURL
        };

        try {
            // Debug: Mostrar lo que se está enviando
            console.log('Enviando al servidor:', JSON.stringify(local, null, 2));

            // Crear el local y asociarlo automáticamente al usuario
            const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales/crear-con-usuario?usuarioId=${user.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(local)
            });

            if (!response.ok) {
                let errorMessage = 'Error al crear el local';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    try {
                        const errorText = await response.text();
                        errorMessage = errorText || errorMessage;
                    } catch (textError) {
                        console.error('Error al leer respuesta de error:', textError);
                    }
                }
                throw new Error(errorMessage);
            }

            const createdLocal = await response.json();
            console.log('Local creado y asociado:', createdLocal);

            // Guardar información del local en localStorage
            localStorage.setItem('local_info', JSON.stringify(createdLocal));

            // Actualizar la información del usuario con el ID del local
            const updatedUser = {
                ...user,
                localId: createdLocal.id
            };
            localStorage.setItem('user_info', JSON.stringify(updatedUser));

            showToast('success', 'Local creado con éxito: ' + createdLocal.nombre);
            
            // Redirigir al panel del local
            setTimeout(() => {
                window.location.href = 'local.html';
            }, 2000);
        } catch (error) {
            console.error('Error:', error);
            showToast('error', error.message || 'Error al procesar la solicitud');
        }
    });
});

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
