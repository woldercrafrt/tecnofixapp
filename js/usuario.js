document.addEventListener('DOMContentLoaded', () => {
    const usuarioNombreDiv = document.getElementById('usuarioNombre');
    const usuarioRolDiv = document.getElementById('usuarioRol');
    const citasCountDiv = document.getElementById('citasCount');
    const favoritosCountDiv = document.getElementById('favoritosCount');
    const calificacionesCountDiv = document.getElementById('calificacionesCount');
    
    // Obtener información del usuario desde localStorage usando las claves correctas
    const token = localStorage.getItem("jwt_token");
    const userInfo = localStorage.getItem("user_info");
    
    // Verificar si el usuario está autenticado
    if (!token || !userInfo) {
        console.log('No se encontró token o información de usuario');
        alert('No se ha encontrado información de usuario. Redirigiendo a inicio de sesión.');
        window.location.href = 'login.html';
        return;
    }

    try {
        // Parsear la información del usuario
        const user = JSON.parse(userInfo);
        
        // Mostrar información del usuario
        if (user.nombre) {
            usuarioNombreDiv.textContent = user.nombre;
        } else if (user.correo) {
            usuarioNombreDiv.textContent = user.correo;
        } else {
            usuarioNombreDiv.textContent = 'Usuario';
        }
        
        // Mostrar rol del usuario con formato
        if (user.rol) {
            const rolFormateado = user.rol === 'LOCAL' ? 'Propietario de Local' : 
                                 user.rol === 'ADMIN' ? 'Administrador' : 'Usuario';
            usuarioRolDiv.textContent = rolFormateado;
        }

        // Cargar estadísticas del usuario
        cargarEstadisticas(user.id);

    } catch (error) {
        console.error('Error al parsear información del usuario:', error);
        alert('Error al cargar información del usuario. Redirigiendo a inicio de sesión.');
        window.location.href = 'login.html';
        return;
    }

    // Manejar el evento de cierre de sesión
    const logoutButton = document.getElementById('logout');
    logoutButton.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            // Limpiar localStorage usando las claves correctas
            localStorage.removeItem("jwt_token");
            localStorage.removeItem("user_info");
            localStorage.removeItem("local_info");
            localStorage.removeItem("rememberedEmail");
            
            alert('Has cerrado sesión exitosamente.');
            window.location.href = 'login.html';
        }
    });
});

// Función para cargar estadísticas del usuario
async function cargarEstadisticas(userId) {
    const token = localStorage.getItem("jwt_token");
    
    if (!token || !userId) {
        console.log('No hay token o userId disponible');
        return;
    }

    try {
        // Cargar citas del usuario
        const citasResponse = await fetch(`http://localhost:8080/api/citas/usuario/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (citasResponse.ok) {
            const citas = await citasResponse.json();
            document.getElementById('citasCount').textContent = citas.length;
        } else {
            console.log('Error al cargar citas:', citasResponse.status);
            document.getElementById('citasCount').textContent = '0';
        }

        // Cargar calificaciones del usuario
        const calificacionesResponse = await fetch(`http://localhost:8080/api/calificaciones/usuario/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (calificacionesResponse.ok) {
            const calificaciones = await calificacionesResponse.json();
            document.getElementById('calificacionesCount').textContent = calificaciones.length;
        } else {
            console.log('Error al cargar calificaciones:', calificacionesResponse.status);
            document.getElementById('calificacionesCount').textContent = '0';
        }

        // Por ahora, favoritos se mantiene en 0 (se puede implementar más adelante)
        document.getElementById('favoritosCount').textContent = '0';

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        // En caso de error, mostrar 0 en todas las estadísticas
        document.getElementById('citasCount').textContent = '0';
        document.getElementById('calificacionesCount').textContent = '0';
        document.getElementById('favoritosCount').textContent = '0';
    }
}

// Función para verificar si el token está próximo a expirar
function verificarExpiracionToken() {
    const token = localStorage.getItem("jwt_token");
    if (!token) return;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expTime = payload.exp * 1000; // Convertir a milisegundos
        const currentTime = Date.now();
        const timeUntilExpiry = expTime - currentTime;
        
        // Si el token expira en menos de 5 minutos, mostrar advertencia
        if (timeUntilExpiry < 300000 && timeUntilExpiry > 0) {
            const minutesLeft = Math.floor(timeUntilExpiry / 60000);
            alert(`Tu sesión expirará en ${minutesLeft} minutos. Por favor, guarda tu trabajo.`);
        }
        
        // Si el token ya expiró, cerrar sesión
        if (timeUntilExpiry <= 0) {
            alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            localStorage.removeItem("jwt_token");
            localStorage.removeItem("user_info");
            localStorage.removeItem("local_info");
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error al verificar token:', error);
    }
}

// Verificar expiración del token cada minuto
setInterval(verificarExpiracionToken, 60000);

// Verificar al cargar la página
verificarExpiracionToken();