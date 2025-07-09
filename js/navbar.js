// Navegación con JWT
document.addEventListener('DOMContentLoaded', function() {
    const userNav = document.getElementById('userNav');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');

    // Función para verificar autenticación
    function checkAuthentication() {
        // Verificar si API_CONFIG está disponible
        if (typeof API_CONFIG === 'undefined') {
            console.warn('API_CONFIG no está disponible, usando verificación básica');
            checkAuthenticationBasic();
            return;
        }

        if (API_CONFIG.isAuthenticated()) {
            // Usuario autenticado
            showAuthenticatedUser();
        } else {
            // Usuario no autenticado
            showUnauthenticatedUser();
        }
    }

    // Función para verificar autenticación básica (sin API_CONFIG)
    function checkAuthenticationBasic() {
        const token = localStorage.getItem('jwt_token');
        const userInfo = localStorage.getItem('user_info');
        
        if (token && userInfo) {
            showAuthenticatedUser();
        } else {
            showUnauthenticatedUser();
        }
    }

    // Función para mostrar usuario autenticado
    function showAuthenticatedUser() {
        const userInfo = localStorage.getItem('user_info');
        if (!userInfo) {
            console.log('No hay user_info en localStorage');
            showUnauthenticatedUser();
            return;
        }

        try {
            const user = JSON.parse(userInfo);
            console.log('Usuario autenticado:', user);
            
            const userNameText = user.nombre || user.correo || 'Usuario';
            const userRole = user.rol || 'USUARIO';
            const userId = user.id;
            
            console.log('userNameText:', userNameText);
            console.log('userRole:', userRole);
            console.log('userId:', userId);

            let menuItems = '';

            // Verificar si es administrador
            if (userRole === 'ADMIN') {
                console.log('Usuario es ADMIN, mostrando opciones de admin');
                showAdminLinks();
                return;
            }

            // Verificar si es usuario LOCAL
            if (userRole === 'LOCAL') {
                console.log('Usuario es LOCAL, verificando si tiene local...');
                
                // Primero verificar en localStorage como fallback rápido
                const localInfo = localStorage.getItem('local_info');
                const hasLocalInStorage = localInfo !== null;
                
                console.log('localInfo en localStorage:', localInfo);
                console.log('hasLocalInStorage:', hasLocalInStorage);
                
                // Si no hay información en localStorage, hacer la petición al servidor
                if (!hasLocalInStorage) {
                    checkUserLocal(userId, (hasLocal) => {
                        console.log('Resultado de checkUserLocal:', hasLocal);
                        buildLocalMenu(hasLocal, userNameText, userRole);
                    });
                } else {
                    // Usar la información de localStorage
                    console.log('Usando información de localStorage');
                    buildLocalMenu(true, userNameText, userRole);
                }
                return;
            } else {
                console.log('Usuario es normal, mostrando opciones básicas');
                // Opciones para usuarios normales
                menuItems += `
                    <li><a class="dropdown-item" href="usuario.html">
                        <i class="fas fa-user me-2"></i>Mi Perfil
                    </a></li>
                    <li><a class="dropdown-item" href="citasAgendadas.html">
                        <i class="fas fa-calendar me-2"></i>Mis Citas
                    </a></li>
                    <li><a class="dropdown-item" href="chat.html">
                        <i class="fas fa-comments me-2"></i>Mis Chats
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                `;
            }

            // Agregar opciones comunes
            menuItems += `
                <li><a class="dropdown-item" href="modificarCuenta.html">
                    <i class="fas fa-cog me-2"></i>Configuración
                </a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" id="logoutBtn">
                    <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                </a></li>
            `;

            console.log('Menu items finales:', menuItems);
            // Actualizar el HTML del navbar
            updateNavbarHTML(userNameText, userRole, menuItems);
        } catch (error) {
            console.error('Error al procesar información del usuario:', error);
            showUnauthenticatedUser();
        }
    }

    // Función auxiliar para construir el menú de usuarios LOCAL
    function buildLocalMenu(hasLocal, userNameText, userRole) {
        let menuItems = '';
        
        if (hasLocal) {
            console.log('Usuario tiene local, mostrando opciones de gestión');
            // Usuario tiene local - mostrar opciones de gestión
            menuItems += `
                <li><a class="dropdown-item" href="usuario.html">
                    <i class="fas fa-user me-2"></i>Mi Perfil
                </a></li>
                <li><a class="dropdown-item" href="local.html">
                    <i class="fas fa-building me-2"></i>Mi Local
                </a></li>
                <li><a class="dropdown-item" href="serviciosLocal.html">
                    <i class="fas fa-tools me-2"></i>Mis Servicios
                </a></li>
                <li><a class="dropdown-item" href="crearPublicacion.html">
                    <i class="fas fa-plus me-2"></i>Crear Publicación
                </a></li>
                <li><a class="dropdown-item" href="citasLocal.html">
                    <i class="fas fa-calendar-check me-2"></i>Gestionar Citas
                </a></li>
                <li><a class="dropdown-item" href="chatlocal.html">
                    <i class="fas fa-comments me-2"></i>Chat con Clientes
                </a></li>
            `;
        } else {
            console.log('Usuario no tiene local, mostrando opción para crear');
            // Usuario no tiene local - mostrar opción para crear
            menuItems += `
                <li><a class="dropdown-item" href="usuario.html">
                    <i class="fas fa-user me-2"></i>Mi Perfil
                </a></li>
                <li><a class="dropdown-item" href="crearLocal.html">
                    <i class="fas fa-plus-circle me-2"></i>Crear Mi Local
                </a></li>
            `;
        }
        
        // Continuar con el resto del menú
        menuItems += `<li><hr class="dropdown-divider"></li>`;
        
        // Agregar opciones comunes
        menuItems += `
            <li><a class="dropdown-item" href="modificarCuenta.html">
                <i class="fas fa-cog me-2"></i>Configuración
            </a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" id="logoutBtn">
                <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
            </a></li>
        `;

        console.log('Menu items para LOCAL:', menuItems);
        // Actualizar el HTML del navbar
        updateNavbarHTML(userNameText, userRole, menuItems);
    }

    // Función para verificar si el usuario tiene un local asociado
    function checkUserLocal(userId, callback) {
        console.log('checkUserLocal llamado con userId:', userId);
        
        if (!userId) {
            console.log('No hay userId, callback(false)');
            callback(false);
            return;
        }

        // Verificar si API_CONFIG está disponible
        if (typeof API_CONFIG !== 'undefined') {
            console.log('API_CONFIG disponible, haciendo petición a:', `${API_CONFIG.BASE_URL}/locales/usuario/${userId}`);
            
            API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales/usuario/${userId}`)
                .then(response => {
                    console.log('Respuesta del servidor:', response.status, response.statusText);
                    if (response && response.ok) {
                        return response.json();
                    }
                    return null;
                })
                .then(local => {
                    console.log('Datos del local recibidos:', local);
                    if (local) {
                        // Guardar información del local en localStorage para uso futuro
                        localStorage.setItem('local_info', JSON.stringify(local));
                        console.log('Local encontrado, callback(true)');
                        callback(true);
                    } else {
                        // Limpiar información del local si no existe
                        localStorage.removeItem('local_info');
                        console.log('No se encontró local, callback(false)');
                        callback(false);
                    }
                })
                .catch(error => {
                    console.error('Error al verificar local del usuario:', error);
                    // Si es un error de autenticación, no hacer nada especial
                    // ya que API_CONFIG.fetchWithAuth ya maneja la redirección
                    console.log('Error en petición, callback(false)');
                    callback(false);
                });
        } else {
            // Fallback: verificar en localStorage si hay información del local
            console.log('API_CONFIG no disponible, verificando localStorage');
            const localInfo = localStorage.getItem('local_info');
            console.log('localInfo en localStorage:', localInfo);
            callback(localInfo !== null);
        }
    }

    // Función para actualizar el HTML del navbar
    function updateNavbarHTML(userNameText, userRole, menuItems) {
        userNav.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-user-circle me-1"></i>${userNameText}
                    ${userRole === 'LOCAL' ? '<span class="badge bg-primary ms-1">Local</span>' : ''}
                    ${userRole === 'ADMIN' ? '<span class="badge bg-danger ms-1">Admin</span>' : ''}
                </a>
                <ul class="dropdown-menu" aria-labelledby="userDropdown">
                    ${menuItems}
                </ul>
            </li>
        `;

        // Agregar evento de logout
        const logoutButton = document.getElementById('logoutBtn');
        if (logoutButton) {
            logoutButton.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        }
    }

    // Función para mostrar usuario no autenticado
    function showUnauthenticatedUser() {
        if (userNav) {
            userNav.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="login.html">
                        <i class="fas fa-sign-in-alt me-1"></i>Iniciar Sesión
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="register.html">
                        <i class="fas fa-user-plus me-1"></i>Registrarse
                    </a>
                </li>
            `;
        }
    }

    // Función para hacer logout
    function logout() {
        // Mostrar confirmación
        if (confirm('¿Está seguro de que desea cerrar sesión?')) {
            // Limpiar datos del usuario
            localStorage.removeItem('user_info');
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('local_info');
            
            // Hacer logout usando la API si está disponible
            if (typeof API_CONFIG !== 'undefined') {
                API_CONFIG.logout();
            } else {
                // Redirección manual si API_CONFIG no está disponible
                window.location.href = 'login.html';
            }
        }
    }

    // Función para proteger páginas que requieren autenticación
    function protectPage() {
        const currentPage = window.location.pathname.split('/').pop();
        const publicPages = ['login.html', 'register.html', 'home.html', 'index.html'];
        
        // Si estamos en una página pública, no hacer nada
        if (publicPages.includes(currentPage)) {
            return;
        }
        
        let isAuthenticated = false;
        
        if (typeof API_CONFIG !== 'undefined') {
            isAuthenticated = API_CONFIG.isAuthenticated();
        } else {
            // Verificación básica sin API_CONFIG
            const token = localStorage.getItem('jwt_token');
            const userInfo = localStorage.getItem('user_info');
            isAuthenticated = !!(token && userInfo);
        }
        
        if (!isAuthenticated) {
            // Verificar si ya estamos redirigiendo para evitar bucles
            if (typeof API_CONFIG !== 'undefined' && API_CONFIG.isRedirecting) {
                return;
            }
            
            console.log('Usuario no autenticado, redirigiendo al login...');
            
            // Limpiar datos obsoletos
            localStorage.removeItem('user_info');
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('local_info');
            
            // Redirigir al login
            window.location.href = 'login.html';
        }
    }

    // Función para verificar permisos de administrador
    function checkAdminPermissions() {
        const userInfo = localStorage.getItem('user_info');
        if (userInfo) {
            try {
                const user = JSON.parse(userInfo);
                if (user.rol === 'ADMIN') {
                    // Mostrar enlaces de administrador
                    showAdminLinks();
                }
            } catch (e) {
                console.error('Error al verificar permisos de administrador:', e);
            }
        }
    }

    // Función para mostrar enlaces de administrador
    function showAdminLinks() {
        const navbarNav = document.querySelector('.navbar-nav');
        if (navbarNav) {
            // Verificar si ya existe el enlace de administrador
            const existingAdminLink = document.querySelector('a[href="admin.html"]');
            if (!existingAdminLink) {
                const adminLink = document.createElement('li');
                adminLink.className = 'nav-item';
                adminLink.innerHTML = `
                    <a class="nav-link" href="admin.html">
                        <i class="fas fa-shield-alt me-1"></i>Administración
                    </a>
                `;
                navbarNav.appendChild(adminLink);
            }
        }
    }

    // Función para verificar permisos de local
    function checkLocalPermissions() {
        const userInfo = localStorage.getItem('user_info');
        if (userInfo) {
            try {
                const user = JSON.parse(userInfo);
                if (user.rol === 'LOCAL') {
                    // Mostrar enlaces específicos para locales
                    showLocalLinks();
                }
            } catch (e) {
                console.error('Error al verificar permisos de local:', e);
            }
        }
    }

    // Función para mostrar enlaces específicos para locales
    function showLocalLinks() {
        const navbarNav = document.querySelector('.navbar-nav');
        if (navbarNav) {
            // Verificar si ya existen los enlaces de local
            const existingLocalLinks = document.querySelectorAll('a[href*="local"], a[href*="servicio"]');
            if (existingLocalLinks.length === 0) {
                // Obtener información del usuario
                const userInfo = localStorage.getItem('user_info');
                if (userInfo) {
                    try {
                        const user = JSON.parse(userInfo);
                        const userId = user.id;
                        
                        // Verificar si el usuario tiene un local asociado
                        checkUserLocal(userId, (hasLocal) => {
                            if (hasLocal) {
                                // Usuario tiene local - mostrar enlaces de gestión
                                const localLinks = [
                                    {
                                        href: 'local.html',
                                        icon: 'fas fa-store',
                                        text: 'Mi Local'
                                    },
                                    {
                                        href: 'serviciosLocal.html',
                                        icon: 'fas fa-tools',
                                        text: 'Servicios'
                                    },
                                    {
                                        href: 'chatlocal.html',
                                        icon: 'fas fa-comments',
                                        text: 'Chat'
                                    }
                                ];

                                localLinks.forEach(link => {
                                    const linkElement = document.createElement('li');
                                    linkElement.className = 'nav-item';
                                    linkElement.innerHTML = `
                                        <a class="nav-link" href="${link.href}">
                                            <i class="${link.icon} me-1"></i>${link.text}
                                        </a>
                                    `;
                                    navbarNav.appendChild(linkElement);
                                });
                            } else {
                                // Usuario no tiene local - mostrar enlace para crear
                                const createLocalLink = document.createElement('li');
                                createLocalLink.className = 'nav-item';
                                createLocalLink.innerHTML = `
                                    <a class="nav-link" href="crearLocal.html">
                                        <i class="fas fa-plus-circle me-1"></i>Crear Local
                                    </a>
                                `;
                                navbarNav.appendChild(createLocalLink);
                            }
                        });
                    } catch (e) {
                        console.error('Error al verificar local del usuario:', e);
                    }
                }
            }
        }
    }

    // Función para mostrar información del usuario en páginas específicas
    function showUserInfo() {
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement) {
            const userInfo = localStorage.getItem('user_info');
            if (userInfo) {
                try {
                    const user = JSON.parse(userInfo);
                    userInfoElement.innerHTML = `
                        <div class="user-info-card">
                            <h5><i class="fas fa-user-circle me-2"></i>${user.nombre}</h5>
                            <p><i class="fas fa-envelope me-2"></i>${user.correo}</p>
                            <p><i class="fas fa-user-tag me-2"></i>${user.rol}</p>
                        </div>
                    `;
                } catch (e) {
                    console.error('Error al mostrar información del usuario:', e);
                }
            }
        }
    }

    // Función de prueba para verificar el estado del usuario
    function debugUserState() {
        console.log('=== DEBUG USER STATE ===');
        const userInfo = localStorage.getItem('user_info');
        const localInfo = localStorage.getItem('local_info');
        const token = localStorage.getItem('jwt_token');
        
        console.log('user_info:', userInfo);
        console.log('local_info:', localInfo);
        console.log('jwt_token exists:', !!token);
        
        if (userInfo) {
            try {
                const user = JSON.parse(userInfo);
                console.log('Parsed user:', user);
                console.log('User role:', user.rol);
                console.log('User ID:', user.id);
            } catch (e) {
                console.error('Error parsing user_info:', e);
            }
        }
        
        if (localInfo) {
            try {
                const local = JSON.parse(localInfo);
                console.log('Parsed local:', local);
            } catch (e) {
                console.error('Error parsing local_info:', e);
            }
        }
        
        console.log('=== END DEBUG ===');
    }

    // Inicializar navegación con retraso para asegurar que API_CONFIG esté cargado
    setTimeout(() => {
        checkAuthentication();
        protectPage();
        checkAdminPermissions();
        checkLocalPermissions();
        showUserInfo();
        
        // Iniciar verificación periódica del token si API_CONFIG está disponible
        if (typeof API_CONFIG !== 'undefined') {
            // Verificar cada minuto
            setInterval(() => {
                API_CONFIG.checkTokenExpiration();
            }, 60000); // 60 segundos
            
            // Verificar inmediatamente
            API_CONFIG.checkTokenExpiration();
        }
    }, 100);

    // Verificar autenticación cada vez que se carga la página
    window.addEventListener('load', function() {
        setTimeout(() => {
            checkAuthentication();
        }, 100);
    });

    // Verificar autenticación cuando cambia el localStorage
    window.addEventListener('storage', function(e) {
        if (e.key === 'jwt_token' || e.key === 'user_info') {
            setTimeout(() => {
                checkAuthentication();
            }, 100);
        }
    });

    // Agregar función de debug al objeto window para acceso desde consola
    window.debugUserState = debugUserState;
});