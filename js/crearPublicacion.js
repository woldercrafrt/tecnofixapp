document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('crearPublicacionForm');

    // Verificar si el usuario está autenticado
    if (!API_CONFIG.isAuthenticated()) {
        showToast('error', 'Debes iniciar sesión para crear una publicación');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // Obtener información del usuario y su local
    const userInfo = localStorage.getItem('user_info');
    if (!userInfo) {
        showToast('error', 'Información de usuario no encontrada');
        return;
    }

    const user = JSON.parse(userInfo);
    if (user.rol !== 'LOCAL') {
        showToast('error', 'Solo usuarios con rol LOCAL pueden crear publicaciones');
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 2000);
        return;
    }

    // Verificar si el usuario tiene un local asociado
    checkUserLocal(user.id);

    // Cargar categorías dinámicamente
    loadCategorias();

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const precio = parseFloat(document.getElementById('precio').value);
        const descripcion = document.getElementById('descripcion').value;
        const categoria = document.getElementById('categoria').value;

        // Validaciones básicas
        if (!nombre || !precio || !descripcion || !categoria) {
            showToast('error', 'Por favor, completa todos los campos requeridos');
            return;
        }

        if (precio <= 0) {
            showToast('error', 'El precio debe ser mayor a 0');
            return;
        }

        // Obtener el localId del usuario
        const localInfo = localStorage.getItem('local_info');
        if (!localInfo) {
            showToast('error', 'No se encontró información del local. Crea un local primero.');
            setTimeout(() => {
                window.location.href = 'crearLocal.html';
            }, 2000);
            return;
        }

        const local = JSON.parse(localInfo);
        if (!local.id) {
            showToast('error', 'El local asociado no es válido. Intenta cerrar sesión y volver a entrar.');
            return;
        }

        // Crear el objeto de datos para la publicación
        const publicacion = {
            nombre: nombre,
            precio: precio,
            descripcion: descripcion,
            categoria: categoria,
            localId: local.id
        };

        try {
            console.log('Enviando publicación:', publicacion);

            const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/servicios/crear-rapido`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(publicacion)
            });

            if (response && response.ok) {
                const data = await response.json();
                showToast('success', 'Publicación creada con éxito: ' + data.nombre);
                setTimeout(() => {
                    form.reset();
                    window.location.href = 'local.html';
                }, 2000);
            } else {
                let errorMessage = 'Error al crear la publicación';
                if (response) {
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
                } else {
                    errorMessage = 'No se pudo conectar con el servidor.';
                }
                showToast('error',
                    errorMessage.includes('failed to lazily initialize')
                        ? 'Ocurrió un error interno. Por favor, recarga la página o cierra sesión y vuelve a intentarlo.'
                        : errorMessage
                );
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('error', error.message || 'Error al conectar con la API');
        }
    });
});

// Función para verificar si el usuario tiene un local asociado
async function checkUserLocal(userId) {
    try {
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales/usuario/${userId}`);
        if (response && response.ok) {
            const local = await response.json();
            if (local) {
                localStorage.setItem('local_info', JSON.stringify(local));
            } else {
                showToast('error', 'No tienes un local asociado. Crea un local primero.');
                setTimeout(() => {
                    window.location.href = 'crearLocal.html';
                }, 2000);
            }
        }
    } catch (error) {
        console.error('Error al verificar local del usuario:', error);
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

// Función para cargar categorías dinámicamente
async function loadCategorias() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/servicios/categorias`);
        if (response.ok) {
            const categorias = await response.json();
            const categoriaSelect = document.getElementById('categoria');
            
            // Limpiar opciones existentes excepto la primera
            categoriaSelect.innerHTML = '<option value="">Selecciona una categoría</option>';
            
            // Agregar las categorías del backend
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria;
                option.textContent = categoria.charAt(0) + categoria.slice(1).toLowerCase();
                categoriaSelect.appendChild(option);
            });
        } else {
            console.error('Error al cargar categorías:', response.status);
            // Fallback a categorías hardcodeadas
            loadDefaultCategorias();
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        // Fallback a categorías hardcodeadas
        loadDefaultCategorias();
    }
}

// Función de fallback para cargar categorías por defecto
function loadDefaultCategorias() {
    const categorias = [
        'REPARACION',
        'MANTENIMIENTO',
        'INSTALACION', 
        'CONSULTORIA',
        'VENTA',
        'OTRO'
    ];
    
    const categoriaSelect = document.getElementById('categoria');
    categoriaSelect.innerHTML = '<option value="">Selecciona una categoría</option>';
    
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria.charAt(0) + categoria.slice(1).toLowerCase();
        categoriaSelect.appendChild(option);
    });
}