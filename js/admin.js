document.addEventListener('DOMContentLoaded', () => {
    const userList = document.getElementById('userList');
    const searchUsers = document.getElementById('searchUsers');
    const filterRole = document.getElementById('filterRole');
    const sortBy = document.getElementById('sortBy');
    const toggleEditPassword = document.getElementById('toggleEditPassword');
    let usuarios = [];
    let filteredUsuarios = [];

    // Función para mostrar/ocultar contraseña
    toggleEditPassword.addEventListener('click', () => {
        const input = document.getElementById('editContrasena');
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        toggleEditPassword.querySelector('i').classList.toggle('fa-eye');
        toggleEditPassword.querySelector('i').classList.toggle('fa-eye-slash');
    });

    // Función para obtener usuarios
    async function obtenerUsuarios() {
        try {
            const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/usuarios`);
            if (!response.ok) {
                throw new Error('Error al obtener usuarios');
            }
            usuarios = await response.json();
            filteredUsuarios = [...usuarios];
            actualizarEstadisticas();
            aplicarFiltrosYOrdenamiento();
        } catch (error) {
            console.error('Error:', error);
            showToast('error', 'Error al cargar los usuarios');
        }
    }

    // Función para actualizar estadísticas
    function actualizarEstadisticas() {
        const stats = {
            total: usuarios.length,
            locales: usuarios.filter(u => u.rol === 'local').length,
            admins: usuarios.filter(u => u.rol === 'administrador').length,
            activos: usuarios.filter(u => u.ultimoAcceso && 
                new Date(u.ultimoAcceso) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
        };

        document.getElementById('totalUsers').textContent = stats.total;
        document.getElementById('totalLocales').textContent = stats.locales;
        document.getElementById('totalAdmins').textContent = stats.admins;
        document.getElementById('totalActive').textContent = stats.activos;
    }

    // Función para aplicar filtros y ordenamiento
    function aplicarFiltrosYOrdenamiento() {
        const searchTerm = searchUsers.value.toLowerCase();
        const roleFilter = filterRole.value;
        const sortOption = sortBy.value;

        filteredUsuarios = usuarios.filter(usuario => {
            const matchSearch = usuario.nombre.toLowerCase().includes(searchTerm) ||
                              usuario.correo.toLowerCase().includes(searchTerm);
            const matchRole = roleFilter === 'all' || usuario.rol === roleFilter;
            return matchSearch && matchRole;
        });

        // Aplicar ordenamiento
        filteredUsuarios.sort((a, b) => {
            switch (sortOption) {
                case 'nombre':
                    return a.nombre.localeCompare(b.nombre);
                case 'fecha':
                    return new Date(b.fechaRegistro) - new Date(a.fechaRegistro);
                case 'rol':
                    return a.rol.localeCompare(b.rol);
                default:
                    return 0;
            }
        });

        renderizarUsuarios();
    }

    // Función para renderizar usuarios
    function renderizarUsuarios() {
        if (filteredUsuarios.length === 0) {
            userList.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-users fa-3x mb-3" style="color: var(--text-light)"></i>
                    <h3>No se encontraron usuarios</h3>
                    <p class="text-muted">Intenta con otros filtros de búsqueda</p>
                </div>`;
            return;
        }

        userList.innerHTML = filteredUsuarios.map(usuario => `
            <div class="feature">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div class="d-flex align-items-center">
                        <div class="rounded-circle bg-${getRoleColor(usuario.rol)} p-3 me-3">
                            <i class="fas fa-${getRoleIcon(usuario.rol)} text-white"></i>
                        </div>
                        <div>
                            <h5 class="mb-1">${usuario.nombre}</h5>
                            <p class="text-muted mb-0">
                                <i class="fas fa-envelope me-1"></i>${usuario.correo}
                            </p>
                        </div>
                    </div>
                    <span class="badge bg-${getRoleColor(usuario.rol)}">
                        ${usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                    </span>
                </div>
                <div class="mb-3">
                    <p class="mb-1">
                        <i class="fas fa-calendar me-2"></i>
                        <strong>Registro:</strong> ${formatearFecha(usuario.fechaRegistro)}
                    </p>
                    ${usuario.ultimoAcceso ? `
                        <p class="mb-1">
                            <i class="fas fa-clock me-2"></i>
                            <strong>Último acceso:</strong> ${formatearFecha(usuario.ultimoAcceso)}
                        </p>
                    ` : ''}
                </div>
                <div class="d-flex justify-content-end">
                    <button class="btn btn-outline-primary btn-sm me-2" onclick="abrirModalEdicion(${usuario.id})">
                        <i class="fas fa-edit me-1"></i>Editar
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="confirmarEliminacion(${usuario.id})">
                        <i class="fas fa-trash-alt me-1"></i>Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Función para obtener el color según el rol
    function getRoleColor(rol) {
        switch (rol) {
            case 'administrador': return 'primary';
            case 'local': return 'success';
            default: return 'info';
        }
    }

    // Función para obtener el icono según el rol
    function getRoleIcon(rol) {
        switch (rol) {
            case 'administrador': return 'user-shield';
            case 'local': return 'store';
            default: return 'user';
        }
    }

    // Función para formatear fecha
    function formatearFecha(fecha) {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Event listeners para filtros
    searchUsers.addEventListener('input', aplicarFiltrosYOrdenamiento);
    filterRole.addEventListener('change', aplicarFiltrosYOrdenamiento);
    sortBy.addEventListener('change', aplicarFiltrosYOrdenamiento);

    // Función para abrir modal de edición
    window.abrirModalEdicion = (id) => {
        const usuario = usuarios.find(u => u.id === id);
        if (!usuario) return;

        document.getElementById('editUserId').value = usuario.id;
        document.getElementById('editNombre').value = usuario.nombre;
        document.getElementById('editCorreo').value = usuario.correo;
        document.getElementById('editContrasena').value = '';
        document.getElementById('editRol').value = usuario.rol;

        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
    };

    // Función para guardar cambios
    window.guardarCambios = async () => {
        const id = document.getElementById('editUserId').value;
        const nombre = document.getElementById('editNombre').value;
        const correo = document.getElementById('editCorreo').value;
        const contrasena = document.getElementById('editContrasena').value;
        const rol = document.getElementById('editRol').value;

        const data = {
            id,
            nombre,
            correo,
            rol
        };

        if (contrasena) {
            data.contrasena = contrasena;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/usuarios/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Error al actualizar usuario');

            showToast('success', 'Usuario actualizado exitosamente');
            bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
            await obtenerUsuarios();
        } catch (error) {
            console.error('Error:', error);
            showToast('error', 'Error al actualizar el usuario');
        }
    };

    // Función para confirmar eliminación
    window.confirmarEliminacion = (id) => {
        const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        
        confirmBtn.onclick = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/usuarios/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) throw new Error('Error al eliminar usuario');

                showToast('success', 'Usuario eliminado exitosamente');
                modal.hide();
                await obtenerUsuarios();
            } catch (error) {
                console.error('Error:', error);
                showToast('error', 'Error al eliminar el usuario');
            }
        };

        modal.show();
    };

    // Función para exportar usuarios
    window.exportarUsuarios = (formato) => {
        // Implementar la exportación según el formato
        showToast('info', `Exportando usuarios en formato ${formato.toUpperCase()}...`);
        // Aquí iría la lógica de exportación
    };

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

    // Inicializar la página
    obtenerUsuarios();
}); 