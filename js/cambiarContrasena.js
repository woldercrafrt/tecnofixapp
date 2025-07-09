document.addEventListener('DOMContentLoaded', () => {
    const cambiarContrasenaForm = document.getElementById('cambiarContrasenaForm');

    cambiarContrasenaForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevenir el envío del formulario

        const contrasenaActual = document.getElementById('actualPassword').value;
        const nuevaContrasena = document.getElementById('newPassword').value;
        const confirmarContrasena = document.getElementById('confirmPassword').value;

        // Validar que la nueva contraseña y la confirmación coincidan
        if (nuevaContrasena !== confirmarContrasena) {
            alert('Las contraseñas no coinciden. Inténtalo de nuevo.');
            return;
        }

        // Aquí puedes agregar la lógica para verificar la contraseña actual y actualizarla
        // Por ejemplo, podrías hacer una llamada a una API para cambiar la contraseña

        alert('Contraseña cambiada exitosamente.');
        window.location.href = 'usuario.html'; // Redirigir al usuario después de cambiar la contraseña
    });
});

// Función global para mostrar/ocultar contraseña
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        if (input.type === 'password') {
            input.type = 'text';
        } else {
            input.type = 'password';
        }
    }
}