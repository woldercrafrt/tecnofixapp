document.addEventListener('DOMContentLoaded', async () => {
    const salasList = document.getElementById('salasList'); 
    const usuarioId = localStorage.getItem("usuarioId"); 
    const localId = localStorage.getItem("localID"); 
    const mensajeForm = document.getElementById('mensajeForm'); 
    const mensajeInput = document.getElementById('mensajeInput'); 

    const salaId = `${usuarioId}-${localId}`; 
    const response = await fetch(`http://localhost:8080/api/chats/sala/${salaId}`);
    
    try {
        if (!response.ok) {
            throw new Error('Error al obtener los chats');
        }

        const chats = await response.json(); 

        if (chats.length === 0) {
            salasList.innerHTML = '<tr><td colspan="3" class="text-center">No tienes chats en esta sala. Puedes iniciar una nueva conversación.</td></tr>';
            return;
        }

        chats.forEach(chat => {
            const chatRow = document.createElement('tr');
            // Verificar si el mensaje fue enviado por el usuario
            if (chat.enviadoPor === 1) {
                chatRow.style.backgroundColor = 'rgba(173, 216, 230, 0.5)'; // Azul muy claro
            }
            chatRow.innerHTML = `
                <td>${chat.id}</td>
                <td>${chat.mensaje}</td>
            `;
            salasList.appendChild(chatRow);
        });
    } catch (error) {
        console.error('Error:', error);
        salasList.innerHTML = '<tr><td colspan="3" class="text-center text-danger">No se pudieron cargar los chats. Por favor, intenta más tarde.</td></tr>';
    }

    mensajeForm.addEventListener('submit', async (event) => {
        event.preventDefault(); 

        const nuevoMensaje = mensajeInput.value; 
        const fechaActual = new Date(); 
        const fechaFormateada = fechaActual.toISOString(); 

        const mensajeData = {
            mensaje: nuevoMensaje, 
            urlImagen: null, 
            sala: salaId, 
            usuarioId: usuarioId, 
            localId: localId, 
            enviadoPor: 2, 
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

            const nuevoChat = await response.json(); 
            const chatRow = document.createElement('tr');
            // Verificar si el mensaje fue enviado por el usuario
            if (nuevoChat.enviadoPor === 2) {
                chatRow.style.backgroundColor = 'rgba(173, 216, 230, 0.5)'; // Azul muy claro
            }
            chatRow.innerHTML = `
                <td>${nuevoChat.id}</td>
                <td>${nuevoChat.mensaje}</td>
            `;
            salasList.appendChild(chatRow);
        } catch (error) {
            console.error('Error:', error);
            alert('No se pudo enviar el mensaje. Por favor, intenta más tarde.');
        }
    });
});