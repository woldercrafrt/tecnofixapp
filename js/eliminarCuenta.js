document.addEventListener('DOMContentLoaded', () => {
    const confirmarEliminacionButton = document.getElementById('confirmarEliminacion');

    // Verificar autenticación al cargar la página
    const token = localStorage.getItem("jwt_token");
    const userInfo = localStorage.getItem("user_info");

    if (!token || !userInfo) {
        alert('No se ha encontrado información de usuario. Redirigiendo a inicio de sesión.');
        window.location.href = 'login.html';
        return;
    }

    confirmarEliminacionButton.addEventListener('click', async () => {
        try {
            const user = JSON.parse(userInfo);
            const userId = user.id;
            const url = `http://localhost:8080/api/usuarios/${userId}`;

            if (confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) {
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    alert('Cuenta eliminada con éxito.');
                    // Limpiar localStorage usando las claves correctas
                    localStorage.removeItem("jwt_token");
                    localStorage.removeItem("user_info");
                    localStorage.removeItem("local_info");
                    localStorage.removeItem("rememberedEmail");
                    window.location.href = 'login.html';
                } else {
                    if (response.status === 401) {
                        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                        window.location.href = 'login.html';
                        return;
                    }
                    const errorData = await response.json();
                    alert(`Error al eliminar la cuenta: ${errorData.message || 'Intenta de nuevo más tarde.'}`);
                }
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Error en la conexión. Por favor, intenta más tarde.');
        }
    });
});