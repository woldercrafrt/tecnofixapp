// Registro con JWT
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Verificar que los elementos existan antes de continuar
    if (!registerForm) {
        console.error('Formulario de registro no encontrado');
        return;
    }

    // Verificar si ya está autenticado
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.isAuthenticated()) {
        window.location.href = 'home.html';
        return;
    }

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Obtener elementos del formulario
        const nombreInput = document.getElementById('name');
        const correoInput = document.getElementById('email');
        const contrasenaInput = document.getElementById('password');
        const confirmarContrasenaInput = document.getElementById('confirmPassword');
        const rolInput = document.getElementById('role');

        // Verificar que todos los elementos existan
        if (!nombreInput || !correoInput || !contrasenaInput || !confirmarContrasenaInput || !rolInput) {
            console.error('Elementos del formulario no encontrados');
            showError('Error en el formulario. Recarga la página.');
            return;
        }

        // Obtener valores
        const nombre = nombreInput.value.trim();
        const correo = correoInput.value.trim();
        const contrasena = contrasenaInput.value;
        const confirmarContrasena = confirmarContrasenaInput.value;
        const rol = rolInput.value;
        
        // Validaciones
        if (!nombre || !correo || !contrasena || !confirmarContrasena || !rol) {
            showError('Por favor, complete todos los campos');
            return;
        }

        if (!isValidEmail(correo)) {
            showError('Por favor, ingrese un correo válido');
            return;
        }

        if (contrasena.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (contrasena !== confirmarContrasena) {
            showError('Las contraseñas no coinciden');
            return;
        }

        if (nombre.length < 2) {
            showError('El nombre debe tener al menos 2 caracteres');
            return;
        }

        // Convertir rol a formato del backend
        const rolBackend = rol === 'usuario' ? 'USUARIO' : rol === 'local' ? 'LOCAL' : 'USUARIO';

        // Mostrar loading
        showLoading();
        
        try {
            // Intentar registro con JWT
            if (typeof API_CONFIG !== 'undefined') {
                const result = await API_CONFIG.register(nombre, correo, contrasena, rolBackend);
                
                if (result.success) {
                    showSuccess(result.message || 'Usuario registrado exitosamente');
                    
                    // Limpiar formulario
                    registerForm.reset();
                    
                    // Redirigir al login después de un delay
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    showError(result.error || 'Error en el registro');
                }
            } else {
                showError('Error de configuración de la API');
            }
        } catch (error) {
            console.error('Error en registro:', error);
            showError('Error de conexión. Intente nuevamente.');
        } finally {
            hideLoading();
        }
    });

    // Función para mostrar error
    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            if (successMessage) successMessage.style.display = 'none';
        } else {
            // Si no hay elemento de error, usar toast
            showToast('error', message);
        }
    }

    // Función para mostrar éxito
    function showSuccess(message) {
        if (successMessage) {
            successMessage.textContent = message;
            successMessage.style.display = 'block';
            if (errorMessage) errorMessage.style.display = 'none';
        } else {
            // Si no hay elemento de éxito, usar toast
            showToast('success', message);
        }
    }

    // Función para mostrar loading
    function showLoading() {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
        }
    }

    // Función para ocultar loading
    function hideLoading() {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Crear Cuenta';
        }
    }

    // Función para validar email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Función para mostrar/ocultar contraseña
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }

    // Función para mostrar/ocultar confirmar contraseña
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (toggleConfirmPassword && confirmPasswordInput) {
        toggleConfirmPassword.addEventListener('click', function() {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }

    // Función para ir al login
    const loginLink = document.querySelector('a[href="login.html"]');
    if (loginLink) {
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'login.html';
        });
    }

    // Validación en tiempo real de contraseñas
    if (passwordInput && confirmPasswordInput) {
        function validatePasswords() {
            if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
                confirmPasswordInput.setCustomValidity('Las contraseñas no coinciden');
            } else {
                confirmPasswordInput.setCustomValidity('');
            }
        }
        
        passwordInput.addEventListener('input', validatePasswords);
        confirmPasswordInput.addEventListener('input', validatePasswords);
    }
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

// Función para crear el contenedor de toasts si no existe
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
}