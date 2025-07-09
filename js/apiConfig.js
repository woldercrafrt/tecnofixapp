// Configuración de la API con JWT
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api',
    
    // Variable para controlar redirecciones
    isRedirecting: false,
    
    // Función para obtener el token JWT del localStorage
    getToken: function() {
        return localStorage.getItem('jwt_token');
    },

    // Función para guardar el token JWT
    setToken: function(token) {
        localStorage.setItem('jwt_token', token);
    },

    // Función para eliminar el token JWT (logout)
    removeToken: function() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_info');
        localStorage.removeItem('local_info');
    },

    // Función para verificar si el usuario está autenticado
    isAuthenticated: function() {
        const token = this.getToken();
        if (!token) return false;
        
        // Verificar si el token está expirado (opcional)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < currentTime) {
                console.log('Token expirado, limpiando...');
                this.removeToken();
                return false;
            }
            return true;
        } catch (e) {
            console.error('Error al verificar token:', e);
            this.removeToken();
            return false;
        }
    },

    // Función para obtener los headers con el token JWT
    getHeaders: function() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    },

    // Función para manejar token expirado
    handleTokenExpired: function() {
        if (this.isRedirecting) return; // Evitar múltiples redirecciones
        
        this.isRedirecting = true;
        console.log('Token expirado, redirigiendo al login...');
        
        // Limpiar datos
        this.removeToken();
        
        // Verificar si ya estamos en la página de login
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage !== 'login.html' && currentPage !== 'index.html') {
            // Mostrar mensaje al usuario
            this.showExpiredTokenMessage();
            
            // Redirigir al login después de un breve delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            this.isRedirecting = false;
        }
    },

    // Función para mostrar mensaje de token expirado
    showExpiredTokenMessage: function() {
        // Crear o usar un contenedor de mensajes
        let messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(messageContainer);
        }

        const message = document.createElement('div');
        message.className = 'alert alert-warning alert-dismissible fade show';
        message.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Sesión expirada:</strong> Tu sesión ha expirado. Serás redirigido al login.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        messageContainer.appendChild(message);
        
        // Remover el mensaje después de 5 segundos
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);
    },

    // Función para hacer peticiones fetch con JWT
    fetchWithAuth: async function(url, options = {}) {
        const defaultOptions = {
            headers: this.getHeaders()
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, finalOptions);
            
            // Si la respuesta es 401, el token no es válido o expiró
            if (response.status === 401) {
                console.error('Token JWT inválido o expirado');
                this.handleTokenExpired();
                return null;
            }

            // Si la respuesta es 403, no tiene permisos
            if (response.status === 403) {
                console.error('No tiene permisos para realizar esta acción');
                this.showAccessDeniedMessage();
                return null;
            }

            // Si la respuesta es 404, recurso no encontrado
            if (response.status === 404) {
                console.error('Recurso no encontrado');
                this.showNotFoundMessage();
                return null;
            }

            return response;
        } catch (error) {
            console.error('Error en la petición:', error);
            throw error;
        }
    },

    // Función para mostrar mensaje de acceso denegado
    showAccessDeniedMessage: function() {
        let messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(messageContainer);
        }

        const message = document.createElement('div');
        message.className = 'alert alert-danger alert-dismissible fade show';
        message.innerHTML = `
            <i class="fas fa-ban me-2"></i>
            <strong>Acceso denegado:</strong> No tienes permisos para realizar esta acción.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        messageContainer.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);
    },

    // Función para mostrar mensaje de recurso no encontrado
    showNotFoundMessage: function() {
        let messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(messageContainer);
        }

        const message = document.createElement('div');
        message.className = 'alert alert-warning alert-dismissible fade show';
        message.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Recurso no encontrado:</strong> La información solicitada no está disponible.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        messageContainer.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);
    },

    // Función para hacer login
    login: async function(correo, contrasena) {
        try {
            const response = await fetch(`${this.BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    correo: correo,
                    contrasena: contrasena
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.setToken(data.accessToken);
                
                // Guardar información del usuario si está disponible
                if (data.user) {
                    localStorage.setItem('user_info', JSON.stringify(data.user));
                }
                
                // Resetear flag de redirección
                this.isRedirecting = false;
                
                return { success: true, data: data };
            } else {
                let errorMessage = 'Error de autenticación';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    // Si no es JSON, intentar leer como texto
                    try {
                        const errorText = await response.text();
                        errorMessage = errorText || errorMessage;
                    } catch (textError) {
                        console.error('Error al leer respuesta de error:', textError);
                    }
                }
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, error: 'Error de conexión' };
        }
    },

    // Función para hacer registro
    register: async function(nombre, correo, contrasena, rol = 'USUARIO') {
        try {
            const response = await fetch(`${this.BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre: nombre,
                    correo: correo,
                    contrasena: contrasena,
                    rol: rol
                })
            });

            if (response.ok) {
                let successMessage = 'Usuario registrado exitosamente';
                try {
                    const data = await response.json();
                    successMessage = data.message || successMessage;
                } catch (e) {
                    // Si no es JSON, intentar leer como texto
                    try {
                        const text = await response.text();
                        successMessage = text || successMessage;
                    } catch (textError) {
                        console.error('Error al leer respuesta de éxito:', textError);
                    }
                }
                return { success: true, message: successMessage };
            } else {
                let errorMessage = 'Error en el registro';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    // Si no es JSON, intentar leer como texto
                    try {
                        const errorText = await response.text();
                        errorMessage = errorText || errorMessage;
                    } catch (textError) {
                        console.error('Error al leer respuesta de error:', textError);
                    }
                }
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            console.error('Error en registro:', error);
            return { success: false, error: 'Error de conexión' };
        }
    },

    // Función para hacer logout
    logout: function() {
        this.removeToken();
        this.isRedirecting = false;
        window.location.href = 'login.html';
    },

    // Función para renovar token (opcional)
    refreshToken: async function() {
        // Implementar renovación de token si es necesario
        console.log('Función de renovación de token no implementada');
        return false;
    },

    // Función para verificar si el token está próximo a expirar
    checkTokenExpiration: function() {
        const token = this.getToken();
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = payload.exp - currentTime;
            
            // Si el token expira en menos de 5 minutos, mostrar advertencia
            if (timeUntilExpiry > 0 && timeUntilExpiry < 300) {
                this.showTokenExpirationWarning(timeUntilExpiry);
            }
        } catch (e) {
            console.error('Error al verificar expiración del token:', e);
        }
    },

    // Función para mostrar advertencia de expiración próxima
    showTokenExpirationWarning: function(secondsUntilExpiry) {
        // Evitar mostrar múltiples advertencias
        if (document.getElementById('token-expiration-warning')) {
            return;
        }

        const minutes = Math.floor(secondsUntilExpiry / 60);
        const seconds = secondsUntilExpiry % 60;
        
        let messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(messageContainer);
        }

        const warning = document.createElement('div');
        warning.id = 'token-expiration-warning';
        warning.className = 'alert alert-warning alert-dismissible fade show';
        warning.innerHTML = `
            <i class="fas fa-clock me-2"></i>
            <strong>Advertencia:</strong> Tu sesión expirará en ${minutes}:${seconds.toString().padStart(2, '0')}. 
            <a href="#" onclick="API_CONFIG.extendSession()">Extender sesión</a>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        messageContainer.appendChild(warning);
        
        // Remover la advertencia cuando expire el token
        setTimeout(() => {
            if (warning.parentNode) {
                warning.remove();
            }
        }, secondsUntilExpiry * 1000);
    },

    // Función para extender la sesión (simplemente redirige al login)
    extendSession: function() {
        // Remover la advertencia
        const warning = document.getElementById('token-expiration-warning');
        if (warning) {
            warning.remove();
        }
        
        // Mostrar mensaje informativo
        this.showInfoMessage('Por favor, inicia sesión nuevamente para extender tu sesión.');
        
        // Redirigir al login después de un breve delay
        setTimeout(() => {
            this.logout();
        }, 2000);
    },

    // Función para mostrar mensajes informativos
    showInfoMessage: function(message) {
        let messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(messageContainer);
        }

        const infoMessage = document.createElement('div');
        infoMessage.className = 'alert alert-info alert-dismissible fade show';
        infoMessage.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        messageContainer.appendChild(infoMessage);
        
        // Remover el mensaje después de 5 segundos
        setTimeout(() => {
            if (infoMessage.parentNode) {
                infoMessage.remove();
            }
        }, 5000);
    }
};

// Exportar la configuración
window.API_CONFIG = API_CONFIG; 