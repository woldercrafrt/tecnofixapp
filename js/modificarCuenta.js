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

    let userData = null; // Variable para almacenar los datos del usuario

    // Obtener referencias a los elementos del formulario
    const nombreInput = document.getElementById('nombre');
    const correoInput = document.getElementById('correo');
    // const telefonoInput = document.getElementById('telefono');
    // const direccionInput = document.getElementById('direccion');
    const perfilForm = document.getElementById('perfilForm');

    // Función para cargar los datos del usuario
    async function cargarDatosUsuario() {
        try {
            const user = JSON.parse(userInfo);
            const userId = user.id;
            
            const response = await fetch(`${API_CONFIG.BASE_URL}/usuarios/${userId}`, {
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
                throw new Error(`Error al obtener datos del usuario: ${response.status}`);
            }

            userData = await response.json();

            if (userData) {
                // Rellenar todos los campos del formulario
                nombreInput.value = userData.nombre || '';
                correoInput.value = userData.correo || '';
                // telefonoInput.value = userData.telefono || '';
                // direccionInput.value = userData.direccion || '';
            } else {
                showToast('error', 'Usuario no encontrado');
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 2000);
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('error', 'Error al cargar la información del usuario');
        }
    }

    // Manejar el envío del formulario de perfil
    perfilForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!userData) {
            showToast('error', 'No se pueden actualizar los datos: Usuario no encontrado');
            return;
        }

        const datosActualizados = {
            nombre: nombreInput.value,
            correo: correoInput.value,
            rol: userData.rol
        };
        if (userData.localId !== undefined) {
            datosActualizados.localId = userData.localId;
        }

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/usuarios/${userData.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosActualizados)
            });

            if (response.ok) {
                showToast('success', 'Datos actualizados con éxito');
                
                // Actualizar la información del usuario en localStorage
                const updatedUser = { ...userData, ...datosActualizados };
                localStorage.setItem("user_info", JSON.stringify(updatedUser));
                
                // Si el nombre fue cambiado, mostrar mensaje
                if (datosActualizados.nombre !== userData.nombre) {
                    showToast('info', `Nombre actualizado a: ${datosActualizados.nombre}`);
                }
                
                // Recargar los datos del usuario
                setTimeout(() => {
                    cargarDatosUsuario();
                }, 1000);
            } else {
                if (response.status === 401) {
                    alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                    window.location.href = 'login.html';
                    return;
                }
                const errorData = await response.json();
                showToast('error', errorData.message || 'Error al actualizar los datos. Intente nuevamente.');
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            showToast('error', 'Error en la conexión. Por favor, intente más tarde.');
        }
    });

    // Cargar los datos del usuario al iniciar
    cargarDatosUsuario();

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
});