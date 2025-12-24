// Interfaz Profesor - Panel de control para docentes

let sesionActual = null;
let tareasProfesor = [];
let estudiantesRegistrados = [];
let todasLasCalificaciones = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!verificarSesion('profesor')) {
        return;
    }
    
    sesionActual = obtenerSesion();
    inicializarInterfaz();
    cargarDatos();
    configurarEventos();
});

function inicializarInterfaz() {
    document.getElementById('nombreProfesor').textContent = 
        `${sesionActual.nombres} ${sesionActual.apellidos}`;
    
    const iniciales = sesionActual.nombres.charAt(0) + sesionActual.apellidos.charAt(0);
    document.getElementById('userAvatar').textContent = iniciales;
}

async function cargarDatos() {
    await cargarEstudiantes();
    await cargarTareas();
    await cargarTodasLasCalificaciones();
    cargarEstadisticas();
}

function configurarEventos() {
    const formTarea = document.getElementById('formCrearTarea');
    if (formTarea) {
        formTarea.addEventListener('submit', async (e) => {
            e.preventDefault();
            await crearNuevaTarea();
        });
    }
    
    const btnCerrar = document.getElementById('btnCerrarSesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            if (confirm('¿Deseas cerrar sesion?')) {
                cerrarSesion();
            }
        });
    }
    
    const fechaInput = document.getElementById('fechaEntrega');
    if (fechaInput) {
        const today = new Date().toISOString().split('T')[0];
        fechaInput.setAttribute('min', today);
    }
}

async function cargarEstudiantes() {
    const respuesta = await peticionAPI('/usuarios', { method: 'GET' });
    
    if (respuesta.exito) {
        estudiantesRegistrados = respuesta.usuarios.filter(u => u.tipo === 'estudiante');
        renderizarEstudiantes();
    }
}

async function cargarTodasLasCalificaciones() {
    const calificacionesLocal = localStorage.getItem('calificaciones');
    if (calificacionesLocal) {
        todasLasCalificaciones = JSON.parse(calificacionesLocal);
    }
}

function cargarEstadisticas() {
    const tareasGuardadas = localStorage.getItem(`tareas_${sesionActual.id}`);
    if (tareasGuardadas) {
        tareasProfesor = JSON.parse(tareasGuardadas);
    }
    
    const totalTareas = tareasProfesor.length;
    const tareasActivas = tareasProfesor.filter(t => {
        return new Date(t.fechaEntrega) >= new Date();
    }).length;
    
    const calificacionesProfesor = todasLasCalificaciones.filter(c => {
        const tarea = tareasProfesor.find(t => t.id === c.tarea_id);
        return tarea !== undefined;
    });
    
    document.getElementById('totalTareas').textContent = totalTareas;
    document.getElementById('tareasActivas').textContent = tareasActivas;
    document.getElementById('totalEstudiantes').textContent = estudiantesRegistrados.length;
    document.getElementById('calificaciones').textContent = calificacionesProfesor.length;
}

async function cargarTareas() {
    const tareasGuardadas = localStorage.getItem(`tareas_${sesionActual.id}`);
    if (tareasGuardadas) {
        tareasProfesor = JSON.parse(tareasGuardadas);
    }
    
    renderizarTareas();
}

function renderizarTareas() {
    const contenedor = document.getElementById('listaTareas');
    if (!contenedor) return;
    
    if (tareasProfesor.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <p>No has creado tareas aun</p>
                <p>Crea tu primera tarea usando el formulario</p>
            </div>
        `;
        return;
    }
    
    contenedor.innerHTML = tareasProfesor.map(tarea => {
        const fechaEntrega = new Date(tarea.fechaEntrega);
        const hoy = new Date();
        const diasRestantes = Math.ceil((fechaEntrega - hoy) / (1000 * 60 * 60 * 24));
        
        let estadoColor = '#4CAF50';
        if (diasRestantes < 0) estadoColor = '#f44336';
        else if (diasRestantes <= 2) estadoColor = '#FF9800';
        
        return `
            <div class="tarea-card" style="border-left: 4px solid ${estadoColor}">
                <div class="tarea-header">
                    <h3>${tarea.titulo}</h3>
                    <span class="badge" style="background: ${estadoColor}; color: white;">
                        ${tarea.curso}
                    </span>
                </div>
                <p class="tarea-descripcion">${tarea.descripcion}</p>
                <div class="tarea-info">
                    <span>&#128197; ${formatearFecha(tarea.fechaEntrega)}</span>
                    <span>&#11088; ${tarea.puntos || 20} puntos</span>
                    <span>&#128221; ${tarea.tipo || 'Tarea'}</span>
                    <span style="color: ${estadoColor}">
                        ${diasRestantes >= 0 ? `${diasRestantes} dias restantes` : 'Vencida'}
                    </span>
                </div>
                <div class="tarea-acciones">
                    <button onclick="verEntregas(${tarea.id})" class="btn btn-secondary btn-pequeno">
                        Ver Entregas
                    </button>
                    <button onclick="eliminarTarea(${tarea.id})" class="btn btn-danger btn-pequeno">
                        Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function crearNuevaTarea() {
    const datos = {
        titulo: document.getElementById('tituloTarea').value.trim(),
        descripcion: document.getElementById('descripcionTarea').value.trim(),
        curso: document.getElementById('cursoTarea').value.trim(),
        tipo: document.getElementById('tipoTarea').value,
        fechaEntrega: document.getElementById('fechaEntrega').value,
        puntos: parseInt(document.getElementById('puntosTarea').value) || 20
    };
    
    if (!datos.titulo || !datos.descripcion || !datos.curso || !datos.fechaEntrega) {
        mostrarMensaje('Completa todos los campos obligatorios', 'error');
        return;
    }
    
    const resultado = await crearTarea(datos, sesionActual.id);
    
    if (resultado.exito) {
        const nuevaTarea = {
            id: Date.now(),
            ...datos,
            profesor_id: sesionActual.id,
            fecha_creacion: new Date().toISOString()
        };
        
        tareasProfesor.push(nuevaTarea);
        localStorage.setItem(`tareas_${sesionActual.id}`, JSON.stringify(tareasProfesor));
        
        mostrarMensaje('Tarea creada exitosamente', 'success');
        document.getElementById('formCrearTarea').reset();
        renderizarTareas();
        cargarEstadisticas();
    } else {
        mostrarMensaje(resultado.mensaje, 'error');
    }
}

async function eliminarTarea(tareaId) {
    if (!confirm('¿Estas seguro de eliminar esta tarea?')) {
        return;
    }
    
    tareasProfesor = tareasProfesor.filter(t => t.id !== tareaId);
    localStorage.setItem(`tareas_${sesionActual.id}`, JSON.stringify(tareasProfesor));
    
    const calificaciones = JSON.parse(localStorage.getItem('calificaciones') || '[]');
    const calificacionesFiltradas = calificaciones.filter(c => c.tarea_id !== tareaId);
    localStorage.setItem('calificaciones', JSON.stringify(calificacionesFiltradas));
    
    mostrarMensaje('Tarea eliminada', 'success');
    renderizarTareas();
    cargarEstadisticas();
}

function verEntregas(tareaId) {
    const tarea = tareasProfesor.find(t => t.id === tareaId);
    if (!tarea) return;
    
    cambiarTab('calificaciones');
    mostrarFormularioCalificacion(tarea);
}

function mostrarFormularioCalificacion(tarea) {
    const seccionCalificaciones = document.getElementById('listaCalificaciones');
    if (!seccionCalificaciones) return;
    
    seccionCalificaciones.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h3>Calificar: ${tarea.titulo}</h3>
            <button onclick="cargarDatos(); cambiarTab('tareas')" class="btn btn-secondary" style="margin-top: 10px;">
                Volver a Tareas
            </button>
        </div>
        
        <div style="display: grid; gap: 15px;">
            ${estudiantesRegistrados.map(estudiante => {
                const calificacionGuardada = obtenerCalificacion(tarea.id, estudiante.id);
                
                return `
                    <div class="estudiante-card">
                        <div class="estudiante-info">
                            <div class="avatar-pequeno">
                                ${estudiante.nombres.charAt(0)}${estudiante.apellidos.charAt(0)}
                            </div>
                            <div>
                                <strong>${estudiante.nombres} ${estudiante.apellidos}</strong>
                                <br>
                                <small style="color: #666;">${estudiante.id}</small>
                            </div>
                        </div>
                        <div class="calificacion-form">
                            <input 
                                type="number" 
                                min="0" 
                                max="20" 
                                step="0.5"
                                placeholder="Nota"
                                value="${calificacionGuardada ? calificacionGuardada.nota : ''}"
                                id="nota_${estudiante.id}"
                                class="input-nota"
                            >
                            <input 
                                type="text" 
                                placeholder="Comentario"
                                value="${calificacionGuardada ? calificacionGuardada.comentario : ''}"
                                id="comentario_${estudiante.id}"
                                class="input-comentario"
                            >
                            <button 
                                onclick="guardarCalificacion(${tarea.id}, '${estudiante.id}')"
                                class="btn btn-primary btn-pequeno"
                            >
                                ${calificacionGuardada ? 'Actualizar' : 'Calificar'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function obtenerCalificacion(tareaId, estudianteId) {
    const calificaciones = JSON.parse(localStorage.getItem('calificaciones') || '[]');
    return calificaciones.find(c => 
        c.tarea_id === tareaId && c.estudiante_id === estudianteId
    );
}

async function guardarCalificacion(tareaId, estudianteId) {
    const nota = document.getElementById(`nota_${estudianteId}`).value;
    const comentario = document.getElementById(`comentario_${estudianteId}`).value;
    
    if (!nota) {
        mostrarMensaje('Ingresa una nota', 'error');
        return;
    }
    
    const notaNum = parseFloat(nota);
    if (notaNum < 0 || notaNum > 20) {
        mostrarMensaje('La nota debe estar entre 0 y 20', 'error');
        return;
    }
    
    const datos = {
        tarea_id: tareaId,
        estudiante_id: estudianteId,
        nota: notaNum,
        comentario: comentario
    };
    
    const resultado = await asignarCalificacion(datos, sesionActual.id);
    
    if (resultado.exito) {
        const calificaciones = JSON.parse(localStorage.getItem('calificaciones') || '[]');
        const index = calificaciones.findIndex(c => 
            c.tarea_id === tareaId && c.estudiante_id === estudianteId
        );
        
        const nuevaCalificacion = {
            ...datos,
            fecha_calificacion: new Date().toISOString()
        };
        
        if (index >= 0) {
            calificaciones[index] = nuevaCalificacion;
        } else {
            calificaciones.push(nuevaCalificacion);
        }
        
        localStorage.setItem('calificaciones', JSON.stringify(calificaciones));
        mostrarMensaje('Calificacion guardada', 'success');
        await cargarTodasLasCalificaciones();
        cargarEstadisticas();
    } else {
        mostrarMensaje(resultado.mensaje, 'error');
    }
}

function renderizarEstudiantes() {
    const contenedor = document.getElementById('listaEstudiantes');
    if (!contenedor) return;
    
    if (estudiantesRegistrados.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <p>No hay estudiantes registrados</p>
            </div>
        `;
        return;
    }
    
    contenedor.innerHTML = estudiantesRegistrados.map(estudiante => `
        <div class="estudiante-card">
            <div class="estudiante-info">
                <div class="avatar-pequeno">
                    ${estudiante.nombres.charAt(0)}${estudiante.apellidos.charAt(0)}
                </div>
                <div>
                    <strong>${estudiante.nombres} ${estudiante.apellidos}</strong>
                    <br>
                    <small style="color: #666;">ID: ${estudiante.id} | DNI: ${estudiante.dni}</small>
                    <br>
                    <small style="color: #666;">&#128231; ${estudiante.correo}</small>
                    ${estudiante.grado ? `<br><small style="color: #666;">Grado: ${estudiante.grado} - ${estudiante.seccion}</small>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function cambiarTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    
    const tabElement = Array.from(document.querySelectorAll('.tab'))
        .find(t => t.textContent.toLowerCase().includes(tab.toLowerCase()));
    
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    const seccion = document.getElementById(`seccion${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    if (seccion) {
        seccion.classList.add('active');
    }
}

function formatearFecha(fecha) {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
