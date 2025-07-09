document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('crearUsuarioLocalForm');
    
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const telefono = document.getElementById('telefono').value;
        const localId = localStorage.getItem('localId');

        if (!localId) {
            showToast('error', 'No se encontró el ID del local');
            return;
        }

        if (password !== confirmPassword) {
            showToast('error', 'Las contraseñas no coinciden');
            return;
        }

        const usuario = {
            nombre: nombre,
            email: email,
            password: password,
            telefono: telefono,
            rol: 'LOCAL',
            localId: parseInt(localId)
        };

        try {
            const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/usuarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(usuario)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Error al crear el usuario');
            }

            showToast('success', 'Usuario creado con éxito');
            setTimeout(() => {
                window.location.href = 'local.html';
            }, 2000);
        } catch (error) {
            console.error('Error:', error);
            showToast('error', error.message);
        }
    });
});

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
