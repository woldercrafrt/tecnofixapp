document.addEventListener('DOMContentLoaded', async () => {
    const eliminarLocalButton = document.getElementById('eliminarLocal');
    const eliminarServiciosButton = document.getElementById('eliminarServicios');
    const agregarServiciosButton = document.getElementById('agregarServicios');
    const buscarServiciosButton = document.getElementById('buscarServicios');
    const localIdInput = document.getElementById('localIdInput');
    const serviciosList = document.getElementById('serviciosList');
    const botonesLocal = document.getElementById('botonesLocal');
    const usuarioId = localStorage.getItem('usuarioId');
    const idlocal = localStorage.getItem("id");
    console.log(idlocal);
    // Verificar si el usuario está asignado a un local
    try {
        const response = await fetch(`http://localhost:8080/api/usuarios/${usuarioId}`);
        if (!response.ok) {
            throw new Error('Error al verificar el local del usuario');
        }
        const local = await response.json();
        console.log(local.localId);
        
        // Si el usuario no tiene local asignado, mostrar botón de crear local
        if (local.localId == null) {

        } else {
            // Si tiene local asignado, mostrar botón de crear usuario de local

            localStorage.setItem('localId', local.id); // Guardar el ID del local
        }
    } catch (error) {
        console.error('Error:', error);
        // En caso de error, mostrar botón de crear local por defecto

    }

    // Resto del código existente...
    eliminarLocalButton?.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que deseas eliminar este local? Esta acción no se puede deshacer.')) {
            const localId = localStorage.getItem("localID");
            try {
                const response = await fetch(`http://localhost:8080/api/locales/${localId}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    throw new Error('Error al eliminar el local');
                }
                alert('Local eliminado con éxito');
                window.location.href = 'home.html';
            } catch (error) {
                console.error('Error:', error);
                alert('No se pudo eliminar el local. Por favor, intenta más tarde.');
            }
        }
    });

    buscarServiciosButton?.addEventListener('click', async () => {
        const localId = localIdInput.value.trim();
        if (!localId) {
            alert('Por favor, ingresa un ID de local para buscar servicios.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/servicios?localId=${localId}`);
            if (!response.ok) {
                throw new Error('Error al buscar servicios');
            }

            const servicios = await response.json();
            serviciosList.innerHTML = '';

            if (servicios.length === 0) {
                serviciosList.innerHTML = '<p class="text-center">No se encontraron servicios para este local.</p>';
                return;
            }

            servicios.forEach(servicio => {
                const servicioDiv = document.createElement('div');
                servicioDiv.className = 'card mb-3';
                servicioDiv.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">${servicio.nombre}</h5>
                        <p class="card-text">Descripción: ${servicio.descripcion}</p>
                        <p class="card-text">Precio: $${servicio.precio}</p>
                        <button class="btn btn-danger" onclick="eliminarServicio(${servicio.id})">Eliminar Servicio</button>
                    </div>
                `;
                serviciosList.appendChild(servicioDiv);
            });
        } catch (error) {
            console.error('Error:', error);
            alert('No se pudieron buscar los servicios. Por favor, intenta más tarde.');
        }
    });

    eliminarServiciosButton?.addEventListener('click', async () => {
        const localId = localIdInput.value.trim();
        if (!localId) {
            alert('Por favor, ingresa un ID de local para eliminar servicios.');
            return;
        }

        if (confirm('¿Estás seguro de que deseas eliminar todos los servicios de este local? Esta acción no se puede deshacer.')) {
            try {
                const response = await fetch(`http://localhost:8080/api/servicios?localId=${localId}`);
                if (!response.ok) {
                    throw new Error('Error al buscar servicios');
                }

                const servicios = await response.json();

                for (const servicio of servicios) {
                    const deleteResponse = await fetch(`http://localhost:8080/api/servicios/${servicio.id}`, {
                        method: 'DELETE'
                    });
                    if (!deleteResponse.ok) {
                        console.error(`Error al eliminar el servicio con ID ${servicio.id}`);
                    }
                }

                alert('Todos los servicios han sido eliminados con éxito');
                serviciosList.innerHTML = '';
            } catch (error) {
                console.error('Error:', error);
                alert('No se pudieron eliminar los servicios. Por favor, intenta más tarde.');
            }
        }
    });
});

function eliminarServicio(servicioId) {
    if (confirm('¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.')) {
        fetch(`http://localhost:8080/api/servicios/${servicioId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al eliminar el servicio');
            }
            alert('Servicio eliminado con éxito');
            // Aquí podrías actualizar la vista o eliminar el servicio de la lista
        })
        .catch(error => {
            console.error('Error:', error);
            alert('No se pudo eliminar el servicio. Por favor, intenta más tarde.');
        });
    }
}
