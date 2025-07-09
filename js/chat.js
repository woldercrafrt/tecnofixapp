document.addEventListener('DOMContentLoaded', async () => {
    const salasList = document.getElementById('salasList'); 
    const mensajeForm = document.getElementById('mensajeForm'); 
    const mensajeInput = document.getElementById('mensajeInput'); 
    const typingIndicator = document.getElementById('typingIndicator');
    const notification = document.getElementById('notification');

    // Obtener información del usuario y token usando las claves correctas
    const token = localStorage.getItem("jwt_token");
    const userInfo = localStorage.getItem("user_info");
    const localInfo = localStorage.getItem("local_info");

    // Verificar autenticación
    if (!token || !userInfo) {
        showNotification('No se ha encontrado información de usuario. Redirigiendo a inicio de sesión.', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    try {
        const user = JSON.parse(userInfo);
        const usuarioId = user.id;
        
        let localId = null;
        if (localInfo) {
            const local = JSON.parse(localInfo);
            localId = local.id;
        }

        console.log("localid: ", localId, " usuario id: ", usuarioId);
        
        // Si no hay localId, mostrar mensaje apropiado
        if (!localId) {
            showEmptyState();
            return;
        }

        const salaId = `${usuarioId}-${localId}`; 
        
        // Hacer petición con autenticación JWT
        const response = await fetch(`http://localhost:8080/api/chats/sala/${salaId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                showNotification('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            throw new Error('Error al obtener los chats');
        }

        const chats = await response.json(); 

        if (chats.length === 0) {
            showEmptyState();
            return;
        }

        // Limpiar el área de mensajes
        salasList.innerHTML = '';
        
        // Mostrar mensajes
        chats.forEach(chat => {
            addMessageToChat(chat, usuarioId);
        });

        // Hacer scroll al final
        scrollToBottom();

        // Configurar el formulario de envío de mensajes
        mensajeForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 

            const nuevoMensaje = mensajeInput.value.trim();
            if (!nuevoMensaje) {
                showNotification('Por favor, escribe un mensaje.', 'warning');
                return;
            }

            // Mostrar indicador de escritura
            showTypingIndicator();

            const fechaActual = new Date(); 
            const fechaFormateada = fechaActual.toISOString(); 

            const mensajeData = {
                mensaje: nuevoMensaje, 
                urlImagen: null, 
                sala: salaId, 
                usuarioId: usuarioId, 
                localId: localId, 
                enviadoPor: 1, 
                fecha: fechaFormateada 
            };

            try {
                const response = await fetch('http://localhost:8080/api/chats', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(mensajeData)
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        showNotification('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'error');
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 2000);
                        return;
                    }
                    throw new Error('Error al enviar el mensaje');
                }

                mensajeInput.value = '';
                hideTypingIndicator();

                const nuevoChat = await response.json(); 
                addMessageToChat(nuevoChat, usuarioId);
                scrollToBottom();
                
                showNotification('Mensaje enviado correctamente', 'success');

            } catch (error) {
                console.error('Error:', error);
                hideTypingIndicator();
                showNotification('No se pudo enviar el mensaje. Por favor, intenta más tarde.', 'error');
            }
        });

        // Auto-scroll cuando se escribe
        mensajeInput.addEventListener('input', () => {
            if (mensajeInput.value.trim()) {
                showTypingIndicator();
            } else {
                hideTypingIndicator();
            }
        });

    } catch (error) {
        console.error('Error al cargar información del usuario:', error);
        showNotification('Error al cargar la información del usuario. Por favor, inicia sesión nuevamente.', 'error');
    }
});

// Función para agregar mensaje al chat
function addMessageToChat(chat, usuarioId) {
    const salasList = document.getElementById('salasList');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${chat.enviadoPor === 1 ? 'sent' : 'received'}`;
    
    const messageTime = new Date(chat.fecha).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <div class="message-bubble">
            <p>${escapeHtml(chat.mensaje)}</p>
            <div class="message-time">${messageTime}</div>
        </div>
    `;
    
    salasList.appendChild(messageDiv);
}

// Función para mostrar estado vacío
function showEmptyState() {
    const salasList = document.getElementById('salasList');
    salasList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-comments"></i>
            <h3>No hay mensajes aún</h3>
            <p>¡Inicia una conversación escribiendo un mensaje!</p>
        </div>
    `;
}

// Función para hacer scroll al final
function scrollToBottom() {
    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Función para mostrar indicador de escritura
function showTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.classList.add('show');
    }
}

// Función para ocultar indicador de escritura
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.classList.remove('show');
    }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    // Limpiar notificaciones anteriores
    notification.innerHTML = '';
    notification.className = 'notification';

    // Configurar el tipo de notificación
    let icon = 'info-circle';
    let bgColor = '#0053A6';
    
    switch (type) {
        case 'success':
            icon = 'check-circle';
            bgColor = '#28a745';
            break;
        case 'error':
            icon = 'exclamation-circle';
            bgColor = '#dc3545';
            break;
        case 'warning':
            icon = 'exclamation-triangle';
            bgColor = '#ffc107';
            break;
    }

    notification.style.background = bgColor;
    notification.innerHTML = `
        <i class="fas fa-${icon} me-2"></i>
        ${message}
    `;

    // Mostrar notificación
    notification.classList.add('show');

    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Función para escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-scroll cuando se carga la página
window.addEventListener('load', () => {
    setTimeout(scrollToBottom, 100);
});