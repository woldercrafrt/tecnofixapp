// Ejemplo de uso del sistema JWT en otras páginas
// Este archivo muestra cómo usar las nuevas funciones de autenticación

// 1. Verificar si el usuario está autenticado
function verificarAutenticacion() {
    if (!API_CONFIG.isAuthenticated()) {
        // Redirigir al login si no está autenticado
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 2. Obtener información del usuario actual
function obtenerUsuarioActual() {
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
        try {
            return JSON.parse(userInfo);
        } catch (e) {
            console.error('Error al parsear información del usuario:', e);
            return null;
        }
    }
    return null;
}

// 3. Ejemplo de petición autenticada a la API
async function obtenerCitasUsuario() {
    if (!verificarAutenticacion()) return;

    try {
        const usuario = obtenerUsuarioActual();
        if (!usuario) {
            console.error('No se pudo obtener información del usuario');
            return;
        }

        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/citas/usuario/${usuario.id}`);
        
        if (response && response.ok) {
            const citas = await response.json();
            console.log('Citas del usuario:', citas);
            return citas;
        } else {
            console.error('Error al obtener citas');
        }
    } catch (error) {
        console.error('Error en la petición:', error);
    }
}

// 4. Ejemplo de creación de cita con autenticación
async function crearCita(datosCita) {
    if (!verificarAutenticacion()) return;

    try {
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/citas`, {
            method: 'POST',
            body: JSON.stringify(datosCita)
        });

        if (response && response.ok) {
            const nuevaCita = await response.json();
            console.log('Cita creada:', nuevaCita);
            return nuevaCita;
        } else {
            const errorData = await response.json();
            console.error('Error al crear cita:', errorData);
        }
    } catch (error) {
        console.error('Error en la petición:', error);
    }
}

// 5. Ejemplo de actualización de perfil
async function actualizarPerfil(datosPerfil) {
    if (!verificarAutenticacion()) return;

    try {
        const usuario = obtenerUsuarioActual();
        if (!usuario) return;

        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/usuarios/${usuario.id}`, {
            method: 'PUT',
            body: JSON.stringify(datosPerfil)
        });

        if (response && response.ok) {
            const usuarioActualizado = await response.json();
            console.log('Perfil actualizado:', usuarioActualizado);
            
            // Actualizar información en localStorage
            localStorage.setItem('user_info', JSON.stringify(usuarioActualizado));
            
            return usuarioActualizado;
        } else {
            const errorData = await response.json();
            console.error('Error al actualizar perfil:', errorData);
        }
    } catch (error) {
        console.error('Error en la petición:', error);
    }
}

// 6. Ejemplo de verificación de permisos de administrador
function esAdministrador() {
    const usuario = obtenerUsuarioActual();
    return usuario && usuario.rol === 'ADMIN';
}

// 7. Ejemplo de función que requiere permisos de administrador
async function funcionSoloAdmin() {
    if (!esAdministrador()) {
        alert('No tienes permisos de administrador');
        return;
    }

    // Lógica específica para administradores
    console.log('Ejecutando función de administrador');
}

// 8. Ejemplo de manejo de errores de autenticación
async function peticionConManejoErrores() {
    try {
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/datos-protegidos`);
        
        if (response) {
            if (response.status === 401) {
                // Token expirado o inválido
                alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                API_CONFIG.logout();
                return;
            }
            
            if (response.status === 403) {
                // Sin permisos
                alert('No tienes permisos para acceder a este recurso.');
                return;
            }
            
            if (response.ok) {
                const datos = await response.json();
                console.log('Datos obtenidos:', datos);
                return datos;
            }
        }
    } catch (error) {
        console.error('Error en la petición:', error);
        alert('Error de conexión. Intente nuevamente.');
    }
}

// 9. Ejemplo de función para cerrar sesión
function cerrarSesion() {
    if (confirm('¿Está seguro de que desea cerrar sesión?')) {
        API_CONFIG.logout();
    }
}

// 10. Ejemplo de inicialización de página protegida
function inicializarPaginaProtegida() {
    // Verificar autenticación al cargar la página
    if (!verificarAutenticacion()) return;

    // Obtener información del usuario
    const usuario = obtenerUsuarioActual();
    if (usuario) {
        // Mostrar información del usuario en la página
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement) {
            userInfoElement.innerHTML = `
                <div class="user-info">
                    <h4>Bienvenido, ${usuario.nombre}</h4>
                    <p>Rol: ${usuario.rol}</p>
                    <p>Email: ${usuario.correo}</p>
                </div>
            `;
        }

        // Mostrar elementos específicos según el rol
        if (esAdministrador()) {
            mostrarElementosAdmin();
        }
    }

    // Cargar datos específicos de la página
    cargarDatosPagina();
}

// 11. Ejemplo de función para mostrar elementos de administrador
function mostrarElementosAdmin() {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        element.style.display = 'block';
    });
}

// 12. Ejemplo de función para cargar datos de la página
async function cargarDatosPagina() {
    // Ejemplo: cargar citas del usuario
    const citas = await obtenerCitasUsuario();
    if (citas) {
        mostrarCitas(citas);
    }
}

// 13. Ejemplo de función para mostrar citas
function mostrarCitas(citas) {
    const contenedor = document.getElementById('citasContainer');
    if (!contenedor) return;

    contenedor.innerHTML = '';
    
    citas.forEach(cita => {
        const citaElement = document.createElement('div');
        citaElement.className = 'cita-item';
        citaElement.innerHTML = `
            <h5>Cita #${cita.id}</h5>
            <p>Fecha: ${cita.fecha}</p>
            <p>Hora: ${cita.hora}</p>
            <p>Estado: ${cita.estado}</p>
        `;
        contenedor.appendChild(citaElement);
    });
}

// Exportar funciones para uso en otras páginas
window.JWTUtils = {
    verificarAutenticacion,
    obtenerUsuarioActual,
    obtenerCitasUsuario,
    crearCita,
    actualizarPerfil,
    esAdministrador,
    funcionSoloAdmin,
    peticionConManejoErrores,
    cerrarSesion,
    inicializarPaginaProtegida
}; 