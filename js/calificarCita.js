// Obtener parámetros de la URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

const citaId = getQueryParam('citaId');
const localId = getQueryParam('localId');
let servicioId = getQueryParam('servicioId');

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
    if (!servicioId && citaId) {
        servicioId = await fetchServicioIdPorCita(citaId);
    }
});

document.getElementById('calificacionForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const puntuacion = document.getElementById('puntuacion').value;
    const comentario = document.getElementById('comentario').value;

    if (!servicioId) {
        document.getElementById('mensaje').innerText = 'No se pudo identificar el servicio a calificar.';
        return;
    }

    const calificacion = {
        puntuacion: parseInt(puntuacion),
        comentario: comentario,
        servicioId: servicioId,
        citaId: citaId
    };

    try {
        const response = await fetch('http://localhost:8080/api/calificaciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer ' + localStorage.getItem('token') // Descomenta si usas JWT
            },
            body: JSON.stringify(calificacion)
        });

        if (response.ok) {
            document.getElementById('mensaje').innerText = '¡Gracias por tu calificación!';
            document.getElementById('calificacionForm').reset();
        } else {
            document.getElementById('mensaje').innerText = 'Error al enviar la calificación.';
        }
    } catch (error) {
        document.getElementById('mensaje').innerText = 'Error de conexión.';
    }
}); 