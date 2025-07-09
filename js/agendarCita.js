document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si el usuario está autenticado
    if (!API_CONFIG.isAuthenticated()) {
        showToast('error', 'Debes iniciar sesión para agendar una cita');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    const localId = localStorage.getItem('localId');
    const servicioId = localStorage.getItem('servicioId');

    if (!localId || !servicioId) {
        showToast('error', 'Faltan parámetros necesarios: ID del local o servicio');
        setTimeout(() => {
            window.location.href = 'mostrarLocales.html';
        }, 2000);
        return;
    }

    try {
        // Cargar detalles del local (usar endpoint público)
        const localResponse = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales/publico/${localId}`);
        if (!localResponse || !localResponse.ok) {
            throw new Error('Error al cargar los detalles del local');
        }
        const local = await localResponse.json();

        // Cargar detalles del servicio
        const serviciosResponse = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/locales/${localId}/servicios`);
        if (!serviciosResponse || !serviciosResponse.ok) {
            throw new Error('Error al cargar los servicios del local');
        }
        const servicios = await serviciosResponse.json();
        const servicioSeleccionado = servicios.find(s => s.id === parseInt(servicioId));

        if (!servicioSeleccionado) {
            throw new Error('El servicio seleccionado no está disponible');
        }

        // Actualizar la información en la página
        document.getElementById('nombreLocal').textContent = local.nombre;
        document.getElementById('direccionLocal').textContent = local.direccion;
        document.getElementById('nombreServicio').textContent = servicioSeleccionado.nombre;
        document.getElementById('precioServicio').textContent = `$${servicioSeleccionado.precio}`;

        // Ocultar el selector de servicios ya que no es necesario
        const servicioSelectContainer = document.querySelector('.mb-3');
        if (servicioSelectContainer) {
            servicioSelectContainer.style.display = 'none';
        }

        // Configurar el selector de fecha
        const fechaInput = document.getElementById('fecha');
        const hoy = new Date();
        const fechaMin = hoy.toISOString().split('T')[0];
        fechaInput.min = fechaMin;

        // Función para cargar las horas disponibles
        async function cargarHorasDisponibles(fecha) {
            const horasDisponiblesDiv = document.getElementById('horasDisponibles');
            horasDisponiblesDiv.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Cargando horas disponibles...</div>';

            try {
                const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/citas/publico/disponibilidad/${localId}/${fecha}`);
                if (!response || !response.ok) {
                    throw new Error('Error al cargar las horas disponibles');
                }

                const horas = await response.json();
                
                if (horas.length === 0) {
                    horasDisponiblesDiv.innerHTML = '<div class="text-center text-muted">No hay horas disponibles para esta fecha</div>';
                    return;
                }

                // Crear botones para cada hora disponible
                horasDisponiblesDiv.innerHTML = `
                    <div class="hora-row">
                        ${horas.map(hora => `
                            <button type="button" class="hora-btn" data-hora="${hora}">
                                ${hora}
                            </button>
                        `).join('')}
                    </div>
                `;

                // Agregar event listeners a los botones de hora
                document.querySelectorAll('.hora-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        // Remover la clase selected de todos los botones
                        document.querySelectorAll('.hora-btn').forEach(b => b.classList.remove('selected'));
                        // Agregar la clase selected al botón clickeado
                        btn.classList.add('selected');
                        // Actualizar el input de hora
                        document.getElementById('hora').value = btn.dataset.hora;
                    });
                });

            } catch (error) {
                console.error('Error:', error);
                horasDisponiblesDiv.innerHTML = `<div class="text-center text-danger">Error al cargar las horas disponibles: ${error.message}</div>`;
            }
        }

        // Event listener para el cambio de fecha
        fechaInput.addEventListener('change', (e) => {
            const fechaSeleccionada = e.target.value;
            if (fechaSeleccionada) {
                cargarHorasDisponibles(fechaSeleccionada);
            }
        });

        // Configurar el formulario
        const form = document.getElementById('agendarCitaForm');
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const fecha = document.getElementById('fecha').value;
            const hora = document.getElementById('hora').value;
            const notas = document.getElementById('notas').value;
            
            // Obtener el ID del usuario desde user_info en lugar de localStorage
            const userInfo = localStorage.getItem('user_info');
            if (!userInfo) {
                showToast('error', 'Información de usuario no encontrada. Por favor, inicia sesión nuevamente.');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            
            const user = JSON.parse(userInfo);
            const usuarioId = user.id;
            
            if (!fecha || !hora) {
                showToast('error', 'Por favor, selecciona una fecha y hora');
                return;
            }

            if (!usuarioId) {
                showToast('error', 'ID de usuario no válido');
                return;
            }

            const cita = {
                fecha: fecha,
                hora: hora,
                notas: notas,
                servicioId: parseInt(servicioId),
                localId: parseInt(localId),
                usuarioId: parseInt(usuarioId)
            };

            console.log('Datos de la cita a enviar:', cita);

            try {
                const response = await API_CONFIG.fetchWithAuth(`${API_CONFIG.BASE_URL}/citas`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(cita)
                });

                if (!response || !response.ok) {
                    const errorText = response ? await response.text() : 'No tiene permisos o sesión expirada';
                    throw new Error(errorText || 'Error al agendar la cita');
                }

                showToast('success', 'Cita agendada con éxito');
                // Limpiar localStorage después de agendar exitosamente
                localStorage.removeItem('localId');
                localStorage.removeItem('servicioId');
                setTimeout(() => {
                    window.location.href = 'citasAgendadas.html';
                }, 2000);
            } catch (error) {
                console.error('Error:', error);
                showToast('error', error.message);
            }
        });

    } catch (error) {
        console.error('Error general en la página de agendar cita:', error);
        showToast('error', error.message || 'Error al cargar la página de agendar cita');
    }
});

// Función para mostrar notificaciones toast
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
    
    // Remover el toast después de que se oculte
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

// Estilos adicionales
const style = document.createElement('style');
style.textContent = `
    .gap-2 { gap: 0.5rem; }
    
    #horasDisponibles {
        position: relative;
        justify-content: flex-start;
        align-items: flex-start;
        display: flex;
        padding: 0 15px;
        margin: 30px 40px;
        min-height: 120px;
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
    }

    .hora-row {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;  
        padding: 1  0px;
        justify-content: flex-start;
        align-items: flex-start;
        margin: 0 15px;
        min-height: 100px;
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }

    /* Contenedor del formulario */
    .form-container {
        padding: 30px;
        max-width: 1200px;
        margin: 0 auto;
    }

    /* Grupo de formulario */
    .form-group {
        margin-bottom: 25px;
    }

    /* Label del formulario */
    .form-label {
        margin-bottom: 10px;
        font-weight: 500;
    }

    /* Input del formulario */
    .form-control {
        margin-bottom: 15px;
    }

    .hora-row::-webkit-scrollbar {
        height: 8px;
    }

    .hora-row::-webkit-scrollbar-track {
        background: #f8f9fa;
        border-radius: 10px;
        margin: 0 15px;
    }

    .hora-row::-webkit-scrollbar-thumb {
        background-color: #0d6efd;
        border-radius: 10px;
        border: 2px solid #f8f9fa;
    }

    .hora-btn {
        background-color:rgba(0, 255, 213, 0);
        border-color:rgb(4, 140, 255);
        border: 2px solid:rgb(91, 159, 226);
        border-radius: 12px;
        padding: 15px 25px;
        min-width: 100px;
        height: 20px;
        flex: 0 0 auto;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1.1rem;
        font-weight: 500;
        color: #495057;
        white-space: nowrap;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 5px;
    }

    .hora-btn:hover {
        background-color: #e9ecef;
        border-color: #0d6efd;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .hora-btn.selected {
        background-color: #0d6efd;
        color: white;
        border-color: #0d6efd;
        box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
    }

    .hora-btn.selected:hover {
        background-color: #0b5ed7;
        border-color: #0a58ca;
    }

    .hora-btn i {
        opacity: 0.8;
        font-size: 1.2rem;
        margin-right: 10px;
    }

    .scroll-indicator {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        background-color: rgba(13, 110, 253, 0.9);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 2;
        border: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        font-size: 1.2rem;
    }

    .scroll-left {
        left: 5px;
    }

    .scroll-right {
        right: 5px;
    }

    #horasDisponibles:hover .scroll-indicator {
        opacity: 1;
    }

    .scroll-indicator:hover {
        background-color: rgba(13, 110, 253, 1);
        transform: translateY(-50%) scale(1.1);
    }

    @media (max-width: 768px) {
        #horasDisponibles {
            margin: 20px 15px;
        }

        .form-container {
            padding: 15px;
        }

        .hora-btn {
            min-width: 130px;
            height: 50px;
            font-size: 1rem;
            padding: 12px 20px;
        }
        
        .scroll-indicator {
            width: 35px;
            height: 35px;
        }

        #horasDisponibles {
            min-height: 100px;
        }
    }
`;
document.head.appendChild(style);
