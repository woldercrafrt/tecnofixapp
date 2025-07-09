document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const userInput = document.getElementById('correo');
    const passwordInput = document.getElementById('contrasena');
    const togglePassword = document.getElementById('togglePassword');
    const rememberMe = document.getElementById('rememberMe');
    const mensajeDiv = document.getElementById('registroMensaje');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Verificar que los elementos existan antes de continuar
    if (!loginForm || !userInput || !passwordInput) {
        console.error('Elementos del formulario no encontrados');
        return;
    }

    // Ocultar mensajes de error al inicio
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
    if (successMessage) {
        successMessage.style.display = 'none';
    }

    // Mostrar mensaje de registro si existe
    if (mensajeDiv) {
        const mensaje = localStorage.getItem('registrado');
        if (mensaje) {
            const mensajeContent = mensajeDiv.querySelector('div');
            if (mensajeContent) {
                mensajeContent.textContent = mensaje;
                mensajeDiv.style.display = 'flex';
                localStorage.removeItem('registrado');

                // Ocultar el mensaje después de 5 segundos
                setTimeout(() => {
                    mensajeDiv.style.display = 'none';
                }, 5000);
            }
        }
    }

    // Restaurar datos guardados si existen
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail && userInput) {
        userInput.value = savedEmail;
        if (rememberMe) rememberMe.checked = true;
    }

    // Verificar si ya está autenticado
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.isAuthenticated()) {
        window.location.href = 'home.html';
        return;
    }

    // Función para mostrar/ocultar contraseña
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = togglePassword.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }

    // Función para validar el inicio de sesión con JWT
    async function validarLogin(event) {
        event.preventDefault();

        // Ocultar mensajes anteriores
        if (errorMessage) errorMessage.style.display = 'none';
        if (successMessage) successMessage.style.display = 'none';

        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton ? submitButton.innerHTML : 'Iniciar Sesión';

        // Deshabilitar el botón y mostrar indicador de carga
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Iniciando sesión...';
        }

        try {
            // Validaciones básicas
            if (!userInput.value.trim() || !passwordInput.value) {
                showError('Por favor, complete todos los campos');
                return;
            }

            if (!isValidEmail(userInput.value.trim())) {
                showError('Por favor, ingrese un correo válido');
                return;
            }

            // Intentar login con JWT
            if (typeof API_CONFIG !== 'undefined') {
                const result = await API_CONFIG.login(userInput.value.trim(), passwordInput.value);
                
                if (result.success) {
                    // Guardar email si "recordar sesión" está marcado
                    if (rememberMe && rememberMe.checked) {
                        localStorage.setItem('rememberedEmail', userInput.value.trim());
                    } else {
                        localStorage.removeItem('rememberedEmail');
                    }

                    showSuccess('Inicio de sesión exitoso');
                    
                    // Redirigir después de un breve delay
                    setTimeout(() => {
                        window.location.href = 'home.html';
                    }, 1000);
                } else {
                    showError(result.error || 'Error en el inicio de sesión');
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } else {
                showError('Error de configuración de la API');
            }
        } catch (error) {
            console.error('Error en login:', error);
            showError('Error de conexión. Intente nuevamente.');
        } finally {
            // Restaurar el botón
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        }
    }

    // Event listener para el formulario (solo uno)
    loginForm.addEventListener('submit', validarLogin);

    // Validación en tiempo real del email
    if (userInput) {
        userInput.addEventListener('input', () => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (userInput.value && !emailRegex.test(userInput.value)) {
                userInput.classList.add('is-invalid');
            } else {
                userInput.classList.remove('is-invalid');
                const feedback = userInput.nextElementSibling;
                if (feedback?.classList.contains('invalid-feedback')) {
                    feedback.remove();
                }
                if (userInput.value) {
                    userInput.classList.add('is-valid');
                } else {
                    userInput.classList.remove('is-valid');
                }
            }
        });
    }

    // Validación de contraseña en tiempo real
    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            if (passwordInput.value.length < 6) {
                passwordInput.classList.add('is-invalid');
            } else {
                passwordInput.classList.remove('is-invalid');
                const feedback = passwordInput.parentNode.querySelector('.invalid-feedback');
                if (feedback) {
                    feedback.remove();
                }
                passwordInput.classList.add('is-valid');
            }
        });
    }

    // Deshabilitar botones de redes sociales temporalmente
    document.querySelectorAll('.btn-outline-primary, .btn-outline-info').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('info', 'Función no disponible en este momento');
        });
    });

    // Función para mostrar error
    function showError(message) {
        if (errorMessage) {
            const errorContent = errorMessage.querySelector('div');
            if (errorContent) {
                errorContent.textContent = message;
                errorMessage.style.display = 'block';
                if (successMessage) successMessage.style.display = 'none';
            }
        } else {
            // Si no hay elemento de error, usar toast
            showToast('error', message);
        }
    }

    // Función para mostrar éxito
    function showSuccess(message) {
        if (successMessage) {
            const successContent = successMessage.querySelector('div');
            if (successContent) {
                successContent.textContent = message;
                successMessage.style.display = 'block';
                if (errorMessage) errorMessage.style.display = 'none';
            }
        } else {
            // Si no hay elemento de éxito, usar toast
            showToast('success', message);
        }
    }

    // Función para validar email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Función para ir al registro
    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'register.html';
        });
    }
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