// Obtener parámetros de la URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

const citaId = getQueryParam('citaId');
const localId = getQueryParam('localId');
const servicioId = getQueryParam('servicioId'); // Captura el servicioId
// Eliminamos servicioId, ya no se usa

// Si no tenemos servicioId, lo buscamos por la cita
async function fetchServicioIdPorCita(citaId) {
    try {
        const response = await fetch(`http://localhost:8080/api/citas/${citaId}`);
        if (response.ok) {
            const cita = await response.json();
            return cita.servicioId || (cita.servicio && cita.servicio.id);
        }
    } catch (e) {
        // Manejo de error
    }
    return null;
}

window.addEventListener('DOMContentLoaded', async () => {
    // Generar estrellas interactivas
    const estrellasDiv = document.getElementById('estrellas');
    const puntuacionInput = document.getElementById('puntuacion');
    let puntuacionSeleccionada = 0;
    for (let i = 1; i <= 5; i++) {
        const estrella = document.createElement('i');
        estrella.className = 'fas fa-star fa-2x text-secondary star-rating';
        estrella.style.cursor = 'pointer';
        estrella.dataset.valor = i;
        estrella.addEventListener('mouseenter', () => pintarEstrellas(i));
        estrella.addEventListener('mouseleave', () => pintarEstrellas(puntuacionSeleccionada));
        estrella.addEventListener('click', () => {
            puntuacionSeleccionada = i;
            puntuacionInput.value = i;
            pintarEstrellas(i);
        });
        estrellasDiv.appendChild(estrella);
    }
    function pintarEstrellas(valor) {
        const estrellas = estrellasDiv.querySelectorAll('i');
        estrellas.forEach((estrella, idx) => {
            if (idx < valor) {
                estrella.classList.add('text-warning');
                estrella.classList.remove('text-secondary');
            } else {
                estrella.classList.remove('text-warning');
                estrella.classList.add('text-secondary');
            }
        });
    }

    // Deshabilitar el botón si no hay localId
    const submitBtn = document.querySelector('#calificacionForm button[type="submit"]');
    if (!localId) {
        submitBtn.disabled = true;
        document.getElementById('mensaje').innerHTML = '<div class="alert alert-danger">No se pudo identificar el local a calificar. Por favor, regresa a tus citas y vuelve a intentarlo.</div>';
    } else {
        submitBtn.disabled = false;
    }
});

document.getElementById('calificacionForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const puntuacion = document.getElementById('puntuacion').value;
    const comentario = document.getElementById('comentario').value;
    const mensajeDiv = document.getElementById('mensaje');

    if (!localId) {
        mensajeDiv.innerHTML = '<div class="alert alert-danger">No se pudo identificar el local a calificar.</div>';
        return;
    }
    if (!puntuacion) {
        mensajeDiv.innerHTML = '<div class="alert alert-warning">Selecciona una puntuación.</div>';
        return;
    }
    if (!servicioId) {
        mensajeDiv.innerHTML = '<div class="alert alert-danger">No se pudo identificar el servicio a calificar. Por favor, regresa a tus citas y vuelve a intentarlo.</div>';
        return;
    }
    // Obtener el id del usuario autenticado desde localStorage
    let usuarioId = null;
    const userInfo = localStorage.getItem('user_info');
    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            usuarioId = user.id;
        } catch (e) {}
    }
    if (!usuarioId) {
        mensajeDiv.innerHTML = '<div class="alert alert-danger">No se pudo identificar el usuario autenticado. Por favor, inicia sesión nuevamente.</div>';
        return;
    }
    const calificacion = {
        comentario: comentario,
        puntuacion: Number(puntuacion),
        localId: Number(localId),
        servicioId: Number(servicioId),
        usuarioId: Number(usuarioId)
    };
    console.log('JSON enviado a la API:', JSON.stringify(calificacion));

    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = API_CONFIG.getToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        const response = await fetch('http://localhost:8080/api/calificaciones/rapida', {
            method: 'POST',
            headers,
            body: JSON.stringify(calificacion)
        });

        if (response.ok) {
            mensajeDiv.innerHTML = '<div class="alert alert-success">¡Gracias por tu calificación!</div>';
            document.getElementById('calificacionForm').reset();
        } else {
            let errorMsg = 'Error al enviar la calificación.';
            try {
                const data = await response.json();
                if (typeof data === 'string') {
                    errorMsg = data;
                } else if (data && data.error) {
                    errorMsg = data.error;
                } else if (data && data.message) {
                    errorMsg = data.message;
                }
            } catch (e) {
                // Si no es JSON, intentar leer como texto
                try {
                    const text = await response.text();
                    if (text) errorMsg = text;
                } catch (err) {}
            }
            mensajeDiv.innerHTML = `<div class="alert alert-danger">${errorMsg}</div>`;
        }
    } catch (error) {
        mensajeDiv.innerHTML = '<div class="alert alert-danger">Error de conexión.</div>';
    }
}); 