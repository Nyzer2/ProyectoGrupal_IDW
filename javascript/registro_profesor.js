// Registro de Profesor - Formulario de registro para docentes

document.addEventListener('DOMContentLoaded', () => {
    
    const passwordInput = document.getElementById('contrasena');
    const strengthIndicator = document.getElementById('passwordStrength');

    if (passwordInput && strengthIndicator) {
        passwordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            strengthIndicator.classList.remove('weak', 'medium', 'strong');
            
            if (password.length === 0) {
                strengthIndicator.classList.remove('visible');
                return;
            }

            strengthIndicator.classList.add('visible');
            
            let strength = 0;
            if (password.length >= 6) strength++;
            if (password.length >= 8) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[!@#$%^&*]/.test(password)) strength++;

            if (strength <= 2) {
                strengthIndicator.classList.add('weak');
            } else if (strength <= 4) {
                strengthIndicator.classList.add('medium');
            } else {
                strengthIndicator.classList.add('strong');
            }
        });
    }

    const dniInput = document.getElementById('dni');
    if (dniInput) {
        dniInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
        });
    }

    const idInput = document.getElementById('id');
    if (idInput) {
        idInput.addEventListener('input', (e) => {
            let value = e.target.value.toUpperCase();
            if (!value.startsWith('PROF')) {
                e.target.value = 'PROF';
            }
        });
    }

    const formRegistro = document.getElementById('formRegistroProfesor');
    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const datos = {
                id: document.getElementById('id').value.trim(),
                nombres: document.getElementById('nombres').value.trim(),
                apellidos: document.getElementById('apellidos').value.trim(),
                dni: document.getElementById('dni').value.trim(),
                correo: document.getElementById('correo').value.trim(),
                contrasena: document.getElementById('contrasena').value,
                especialidad: document.getElementById('especialidad').value.trim()
            };
            
            if (!datos.id || !datos.nombres || !datos.apellidos || !datos.dni || 
                !datos.correo || !datos.contrasena) {
                mostrarAlerta('Todos los campos son obligatorios', 'error');
                return;
            }
            
            if (!validarIDProfesor(datos.id)) {
                mostrarAlerta('El ID debe tener el formato PROF### (ej: PROF001)', 'error');
                return;
            }
            
            if (!validarDNI(datos.dni)) {
                mostrarAlerta('El DNI debe tener 8 digitos', 'error');
                return;
            }
            
            if (!validarCorreo(datos.correo)) {
                mostrarAlerta('Correo electronico invalido', 'error');
                return;
            }
            
            const validacionPass = validarContrasena(datos.contrasena);
            if (!validacionPass.valido) {
                mostrarAlerta(validacionPass.mensaje, 'error');
                return;
            }
            
            const resultado = await registrarProfesor(datos);
            
            if (resultado.exito) {
                mostrarAlerta(resultado.mensaje, 'success');
                formRegistro.reset();
                
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                mostrarAlerta(resultado.mensaje, 'error');
            }
        });
    }
});

function mostrarAlerta(mensaje, tipo) {
    const container = document.getElementById('alertContainer');
    if (container) {
        container.innerHTML = `
            <div class="alert ${tipo}">
                ${tipo === 'success' ? '' : ''} ${mensaje}
            </div>
        `;
        
        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    } else {
        if (typeof mostrarMensaje === 'function') {
            mostrarMensaje(mensaje, tipo);
        } else {
            alert(mensaje);
        }
    }
}
