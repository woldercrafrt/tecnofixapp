document.addEventListener('DOMContentLoaded', async () => {
    const localId = localStorage.getItem('localId');
    if (!localId) {
        showToast('error', 'No se encontró el ID del local');
        return;
    }

    try {
        // Cargar detalles del local
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales/${localId}`);
        if (!response.ok) {
            throw new Error('Error al cargar los detalles del local');
        }
        const local = await response.json();

        // Actualizar la información del local en la página
        document.getElementById('nombreLocal').textContent = local.nombre;
        document.getElementById('direccionLocal').textContent = local.direccion;
        document.getElementById('telefonoLocal').textContent = local.telefono;

        // Cargar mensajes del chat
        await cargarMensajes();

        // Configurar el formulario de envío de mensajes
        const form = document.getElementById('chatForm');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const mensaje = document.getElementById('mensaje').value.trim();
            if (!mensaje) return;

            try {
                const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/mensajes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contenido: mensaje,
                        localId: parseInt(localId),
                        usuarioId: parseInt(localStorage.getItem('userId')),
                        esLocal: true
                    })
                });

                if (!response.ok) {
                    throw new Error('Error al enviar el mensaje');
                }

                // Limpiar el campo de mensaje
                document.getElementById('mensaje').value = '';

                // Recargar los mensajes
                await cargarMensajes();
            } catch (error) {
                console.error('Error:', error);
                showToast('error', error.message);
            }
        });

        // Configurar actualización automática de mensajes
        setInterval(cargarMensajes, 5000);

    } catch (error) {
        console.error('Error:', error);
        showToast('error', error.message);
    }
});

async function cargarMensajes() {
    const localId = localStorage.getItem('localId');
    const chatContainer = document.getElementById('chatContainer');

    try {
        const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/mensajes/local/${localId}`);
        if (!response.ok) {
            throw new Error('Error al cargar los mensajes');
        }

        const mensajes = await response.json();
        
        // Ordenar mensajes por fecha
        mensajes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        // Limpiar el contenedor
        chatContainer.innerHTML = '';

        if (mensajes.length === 0) {
            chatContainer.innerHTML = `
                <div class="text-center text-muted my-4">
                    <i class="fas fa-comments fa-2x mb-2"></i>
                    <p>No hay mensajes aún</p>
                </div>
            `;
            return;
        }

        // Agrupar mensajes por fecha
        const mensajesPorFecha = {};
        mensajes.forEach(mensaje => {
            const fecha = new Date(mensaje.fecha).toLocaleDateString();
            if (!mensajesPorFecha[fecha]) {
                mensajesPorFecha[fecha] = [];
            }
            mensajesPorFecha[fecha].push(mensaje);
        });

        // Mostrar mensajes agrupados
        Object.entries(mensajesPorFecha).forEach(([fecha, mensajesDelDia]) => {
            // Agregar separador de fecha
            const fechaDiv = document.createElement('div');
            fechaDiv.className = 'text-center text-muted my-3';
            fechaDiv.innerHTML = `
                <span class="badge bg-light text-dark">
                    <i class="far fa-calendar-alt me-1"></i>
                    ${fecha}
                </span>
            `;
    const salasList = document.getElementById('salasList'); 
    const mensajeForm = document.getElementById('mensajeForm'); 
    const mensajeInput = document.getElementById('mensajeInput'); 
    const localId = localStorage.getItem("idlocal"); // Obtener el ID del local del localStorage

    // Función para cargar todas las salas del local
    async function cargarSalasDelLocal() {
        try {
            // Obtener todos los chats
            const response = await fetch('http://localhost:8080/api/chats');
            if (!response.ok) {
                throw new Error('Error al cargar los chats');
            }
            const todosLosChats = await response.json();

            // Crear un Set para almacenar salas únicas
            const salasUnicas = new Set();
            
            // Filtrar chats por localId y obtener salas únicas
            todosLosChats.forEach(chat => {
                if (chat.sala && chat.sala.includes(`-${localId}`)) {
                    salasUnicas.add(chat.sala);
                }
            });

            // Limpiar la lista actual
            salasList.innerHTML = ''; 

            // Mostrar cada sala única
            for (const sala of salasUnicas) {
                const [usuarioId, localIdSala] = sala.split('-');
                
                // Obtener el último mensaje de esta sala
                const mensajesDeSala = todosLosChats.filter(chat => chat.sala === sala);
                const ultimoMensaje = mensajesDeSala[mensajesDeSala.length - 1];

                const row = document.createElement('tr'); 
                row.innerHTML = `
                    <td>Usuario ${usuarioId}</td>
                    <td>${ultimoMensaje ? ultimoMensaje.mensaje : 'Sin mensajes'}</td>
                    <td>
                        <button class="btn btn-success" onclick="irAChatConUsuario('${sala}')">Ir a Chat</button>
                    </td>
                `;
                salasList.appendChild(row); 
            }
        } catch (error) {
            console.error(error); 
            alert('No se pudieron cargar los chats. Intenta de nuevo más tarde.'); 
        }
    }

    // Cargar las salas al iniciar
    await cargarSalasDelLocal();

    mensajeForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 
        const usuarioId = localStorage.getItem("usuarioId"); 
        const salaId = `${usuarioId}-${localId}`; 
        const mensaje = mensajeInput.value; 
        const fechaActual = new Date();
        const fechaFormateada = fechaActual.toISOString();

        const mensajeData = {
            mensaje: mensaje,
            urlImagen: null,
            sala: salaId,
            usuarioId: usuarioId,
            localId: localId,
            enviadoPor: 2, // 2 para indicar que fue enviado por el local
            fecha: fechaFormateada
        };

        try {
            const response = await fetch('http://localhost:8080/api/chats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mensajeData)
            });

            if (!response.ok) {
                throw new Error('Error al enviar el mensaje');
            }

            mensajeInput.value = ''; 
            await cargarSalasDelLocal(); // Recargar las salas después de enviar el mensaje
        } catch (error) {
            console.error('Error:', error);
            alert('Error al enviar el mensaje. Intenta de nuevo.'); 
        }
    });
});

// Función para redirigir a chatconusuario.html y guardar la sala en localStorage
function irAChatConUsuario(sala) {
    localStorage.setItem('salaChat', sala); 
    window.location.href = 'chatconusuario.html'; 
}
