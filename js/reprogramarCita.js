document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    if (!API_CONFIG.isAuthenticated()) {
        showToast('error', 'Debes iniciar sesión para reprogramar una cita');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    const citaId = localStorage.getItem('citaIdAReprogramar');
    const localId = localStorage.getItem('localId');
    let servicioId = localStorage.getItem('servicioId');

    if (!citaId || !localId) {
        showToast('error', 'Faltan parámetros necesarios para reprogramar la cita');
        setTimeout(() => {
            window.location.href = 'citasAgendadas.html';
        }, 2000);
        return;
    }

    try {
        // Cargar detalles del local
               const localResponse = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales/${localId}`);
        if (!localResponse.ok) throw new Error('Error al cargar los detalles del local');
        const local = await localResponse.json();
        document.getElementById('nombreLocal').textContent = local.nombre;
        document.getElementById('direccionLocal').textContent = local.direccion;

        // Cargar servicios del local
        const serviciosResponse = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales/${localId}/servicios`);
        if (!serviciosResponse.ok) throw new Error('Error al cargar los servicios del local');
        const servicios = await serviciosResponse.json();

        // Llenar el select de servicios
        const servicioSelect = document.getElementById('servicioSelect');
        servicioSelect.innerHTML = '<option value="" disabled>Selecciona un servicio</option>';
        servicios.forEach(servicio => {
            const option = document.createElement('option');
            option.value = servicio.id;
            option.textContent = `${servicio.nombre} ($${servicio.precio})`;
            if (servicio.id === parseInt(servicioId)) option.selected = true;
            option.setAttribute('data-precio', servicio.precio);
            servicioSelect.appendChild(option);
        });

        // Mostrar precio del servicio seleccionado
        function actualizarPrecioServicio() {
            const selectedOption = servicioSelect.options[servicioSelect.selectedIndex];
            document.getElementById('nombreServicio').textContent = selectedOption ? selectedOption.textContent.split(' ($')[0] : '';
            document.getElementById('precioServicio').textContent = selectedOption ? `$${selectedOption.getAttribute('data-precio')}` : '';
        }
        servicioSelect.addEventListener('change', actualizarPrecioServicio);
        actualizarPrecioServicio();

        // Cargar datos actuales de la cita
        const citaResponse = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/citas/${citaId}`);
        if (!citaResponse.ok) throw new Error('Error al cargar los datos de la cita');
        const cita = await citaResponse.json();

        // Prellenar fecha y hora
        document.getElementById('fecha').value = cita.fecha;
        document.getElementById('hora').value = cita.hora;
        document.getElementById('notas').value = cita.notas || '';

        // Configurar fecha mínima
        const fechaInput = document.getElementById('fecha');
        const hoy = new Date();
        const fechaMin = hoy.toISOString().split('T')[0];
        fechaInput.min = fechaMin;

        // Cargar horas disponibles
        async function cargarHorasDisponibles(fecha) {
            const horasDisponiblesDiv = document.getElementById('horasDisponibles');
            horasDisponiblesDiv.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando horas disponibles...</div>';
            try {
                const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/citas/publico/disponibilidad/${localId}/${fecha}`);
                if (!response.ok) throw new Error('Error al cargar las horas disponibles');
                const horas = await response.json();
                if (horas.length === 0) {
                    horasDisponiblesDiv.innerHTML = '<div class="text-center text-muted">No hay horas disponibles para esta fecha</div>';
                    return;
                }
                horasDisponiblesDiv.innerHTML = `
                    
                        ${horas.map(hora => `
                            <button type="button" class="hora-btn" data-hora="${hora}">
                                ${hora}
                            </button>
                        `).join('')}
                    
                `;
                document.querySelectorAll('.hora-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.hora-btn').forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        document.getElementById('hora').value = btn.dataset.hora;
                    });
                });
            } catch (error) {
                horasDisponiblesDiv.innerHTML = `<div class="text-center text-danger">Error al cargar las horas disponibles: ${error.message}</div>`;
            }
        }
        fechaInput.addEventListener('change', (e) => {
            const fechaSeleccionada = e.target.value;
            if (fechaSeleccionada) cargarHorasDisponibles(fechaSeleccionada);
        });
        // Cargar horas disponibles para la fecha actual
        if (cita.fecha) cargarHorasDisponibles(cita.fecha);

        // Manejar envío del formulario
        const form = document.getElementById('reprogramarCitaForm');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const nuevaFecha = document.getElementById('fecha').value;
            const nuevaHora = document.getElementById('hora').value;
            const nuevoServicioId = servicioSelect.value;
            const notas = document.getElementById('notas').value;
            if (!nuevaFecha || !nuevaHora || !nuevoServicioId) {
                showToast('error', 'Por favor, completa todos los campos requeridos');
                return;
            }
            try {
                const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/citas/${citaId}/reprogramar`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fecha: nuevaFecha,
                        hora: nuevaHora,
                        servicioId: nuevoServicioId,
                        localId: localId
                    })
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || 'Error al reprogramar la cita');
                }
                showToast('success', 'Cita reprogramada con éxito');
                // Limpiar localStorage
                localStorage.removeItem('citaIdAReprogramar');
                setTimeout(() => {
                    window.location.href = 'citasAgendadas.html';
                }, 2000);
            } catch (error) {
                showToast('error', error.message);
            }
        });

        // Cargar datos públicos del usuario (ejemplo)
        const userId = localStorage.getItem('userId') || 1; // Usa 1 como ejemplo si no hay userId
        fetch(`http://localhost:8080/api/usuarios/publico/${userId}`)
          .then(res => res.json())
          .then(user => {
            if (!user) return;
            console.log('Usuario público:', user);
            // Si quieres mostrarlo en la página, agrega un elemento y asígnale user.nombre o user.rol
          });
    } catch (error) {
        showToast('error', error.message || 'Error al cargar la página de reprogramar cita');
    }
});

function showToast(type, message) {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => { toast.remove(); });
}
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
} 