// Archivo JS común para todas las páginas de profesor
class Profesor {
    constructor(nombres, apellidos, dni, correo, id, contrasena) {
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.dni = dni;
        this.correo = correo;
        this.id = id;
        this.contrasena = contrasena;
    }
    guardar() {
        const datos = {
            nombres: this.nombres,
            apellidos: this.apellidos,
            dni: this.dni,
            correo: this.correo,
            id: this.id,
            contrasena: this.contrasena
        };
        localStorage.setItem('datosProfesor', JSON.stringify(datos)); // Simulación; en BD real, aquí iría fetch a API
        console.log('Datos guardados en clase Profesor:', datos); // Para debug
    }
}
function datosProfesor() {
    document.getElementById('btnSiguiente').addEventListener('click', () => {
        const form = document.getElementById('formProfesor');
        if (form.checkValidity()) {
            const profesor = new Profesor(
                document.getElementById('nombres').value,
                document.getElementById('apellidos').value,
                document.getElementById('dni').value,
                document.getElementById('correo').value,
                document.getElementById('id').value,
                document.getElementById('contrasena').value
            );
            profesor.guardar(); // Llama al método de la clase
            alert('¡Guardado en clase! Siguiente...');
            redirigir('registro_clase.html');
        } else {
            alert('Completa todo.');
        }
    });
}
document.addEventListener("DOMContentLoaded", () => {
    // Cargar header y footer en todas las páginas
    const loadComponent = (url, elementId) => {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('No se pudo cargar el recurso: ' + url);
                }
                return response.text();
            })
            .then(data => {
                document.getElementById(elementId).innerHTML = data;
            })
            .catch(error => {
                console.error('Error al cargar componente:', error);
                document.getElementById(elementId).innerHTML = `<p style="color:red;">Error al cargar ${elementId}.</p>`;
            });
    };
    loadComponent('/pages/header.html', 'header-placeholder');
    loadComponent('/pages/footer.html', 'footer-placeholder');

    // Lógica específica por página (usando el ID del body o checks)
    if (document.getElementById('formProfesor')) {
        // Lógica para registro_basico.html
        const btnSiguiente = document.getElementById('btnSiguiente');
        btnSiguiente.addEventListener('click', () => {
            const form = document.getElementById('formProfesor');
            if (form.checkValidity()) {
                const datosProfesor = {
                    nombres: document.getElementById('nombres').value,
                    apellidos: document.getElementById('apellidos').value,
                    dni: document.getElementById('dni').value,
                    correo: document.getElementById('correo').value,
                    id: document.getElementById('id').value,
                    contrasena: document.getElementById('contrasena').value
                };
                localStorage.setItem('datosProfesor', JSON.stringify(datosProfesor));
                alert('¡Datos básicos guardados! Redirigiendo...');
                window.location.href = 'registro_clase.html'; // Conexión a la siguiente página
            } else {
                alert('Completa todos los campos.');
            }
        });
    }

    if (document.getElementById('formClase')) {
        // Lógica para registro_clase.html
        const btnFinalizar = document.getElementById('btnFinalizar');
        btnFinalizar.addEventListener('click', () => {
            const form = document.getElementById('formClase');
            if (form.checkValidity()) {
                const datosClase = {
                    nombreClase: document.getElementById('nombreClase').value,
                    listaCursos: document.getElementById('listaCursos').value.split('\n').filter(c => c.trim() !== ''),
                    horario: document.getElementById('horario').value
                };
                localStorage.setItem('datosClase', JSON.stringify(datosClase));
                alert('¡Datos de clase guardados! Redirigiendo a tu interfaz...');
                window.location.href = 'interfaz_profesor.html'; // Conexión a la interfaz
            } else {
                alert('Completa todos los campos.');
            }
        });
    }

    if (document.getElementById('interfazProfesor')) {
        // Lógica para interfaz_profesor.html
        const profesor = JSON.parse(localStorage.getItem('datosProfesor'));
        const clase = JSON.parse(localStorage.getItem('datosClase'));
        if (profesor && clase) {
            document.getElementById('nombreProfesor').textContent = profesor.nombres + ' ' + profesor.apellidos;
            const listaCursosDisplay = document.getElementById('listaCursosDisplay');
            listaCursosDisplay.innerHTML = '';
            clase.listaCursos.forEach(curso => {
                const li = document.createElement('li');
                li.textContent = curso;
                listaCursosDisplay.appendChild(li);
            });
        } else {
            alert('No se encontraron datos. Regresa al inicio.');
            window.location.href = 'registro_basico.html';
        }

        // Simulación de subir trabajo
        const btnSubirTrabajo = document.getElementById('btnSubirTrabajo');
        btnSubirTrabajo.addEventListener('click', () => {
            alert('¡Trabajo subido! (Simulación)');
        });
    }
});