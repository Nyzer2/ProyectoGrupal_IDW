// Interfaz Estudiante - Panel de control para alumnos

let sesionActual = null;
let tareasDisponibles = [];
let misCalificaciones = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!verificarSesion('estudiante')) {
        return;
    }
    
    sesionActual = obtenerSesion();
    inicializarInterfaz();
    cargarDatos();
});

function inicializarInterfaz() {
    document.getElementById('nombreEstudiante').textContent = 
        `${sesionActual.nombres} ${sesionActual.apellidos}`;
    
    const iniciales = sesionActual.nombres.charAt(0) + sesionActual.apellidos.charAt(0);
    document.getElementById('userAvatar').textContent = iniciales;
    
    const btnCerrar = document.getElementById('btnCerrarSesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            if (confirm('¿Deseas cerrar sesion?')) {
                cerrarSesion();
            }
        });
    }
}

async function cargarDatos() {
    await cargarTareas();
    await cargarCalificaciones();
    cargarEstadisticas();
}

function cargarEstadisticas() {
    const totalTareas = tareasDisponibles.length;
    const calificadas = misCalificaciones.length;
    const pendientes = totalTareas - calificadas;
    
    let promedio = 0;
    if (misCalificaciones.length > 0) {
        const suma = misCalificaciones.reduce((acc, cal) => acc + cal.nota, 0);
        promedio = (suma / misCalificaciones.length).toFixed(1);
    }
    
    document.getElementById('totalTareas').textContent = totalTareas;
    document.getElementById('tareasPendientes').textContent = pendientes;
    document.getElementById('tareasCalificadas').textContent = calificadas;
    document.getElementById('promedioGeneral').textContent = promedio;
}

async function cargarTareas() {
    tareasDisponibles = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('tareas_PROF')) {
            const tareas = JSON.parse(localStorage.getItem(key));
            tareasDisponibles = tareasDisponibles.concat(tareas);
        }
    }
    
    renderizarTareas();
}

function renderizarTareas() {
    const contenedor = document.getElementById('listaTareas');
    if (!contenedor) return;
    
    if (tareasDisponibles.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <p>No hay tareas disponibles</p>
                <p>Los profesores aun no han creado tareas</p>
            </div>
        `;
        return;
    }
    
    const tareasOrdenadas = [...tareasDisponibles].sort((a, b) => {
        const fechaA = new Date(a.fechaEntrega);
        const fechaB = new Date(b.fechaEntrega);
        return fechaA - fechaB;
    });
    
    contenedor.innerHTML = tareasOrdenadas.map(tarea => {
        const calificacion = misCalificaciones.find(c => c.tarea_id === tarea.id);
        const fechaEntrega = new Date(tarea.fechaEntrega);
        const hoy = new Date();
        const diasRestantes = Math.ceil((fechaEntrega - hoy) / (1000 * 60 * 60 * 24));
        
        let estadoColor = '#4CAF50';
        let estadoTexto = 'Pendiente';
        
        if (calificacion) {
            estadoColor = calificacion.nota >= 11 ? '#4CAF50' : '#f44336';
            estadoTexto = 'Calificada';
        } else if (diasRestantes < 0) {
            estadoColor = '#f44336';
            estadoTexto = 'Vencida';
        } else if (diasRestantes <= 2) {
            estadoColor = '#FF9800';
            estadoTexto = 'Urgente';
        }
        
        return `
            <div class="tarea-card" style="border-left: 4px solid ${estadoColor}">
                <div class="tarea-header">
                    <h3>${tarea.titulo}</h3>
                    <span class="badge" style="background: ${estadoColor}">
                        ${estadoTexto}
                    </span>
                </div>
                <p class="tarea-descripcion">${tarea.descripcion}</p>
                <div class="tarea-info">
                    <span>&#128218; ${tarea.curso}</span>
                    <span>&#128197; ${formatearFecha(tarea.fechaEntrega)}</span>
                    <span>&#11088; ${tarea.puntos || 20} puntos</span>
                    <span>&#128221; ${tarea.tipo}</span>
                </div>
                ${calificacion ? `
                    <div class="calificacion-box" style="background: ${calificacion.nota >= 11 ? '#e8f5e9' : '#ffebee'}">
                        <strong style="color: ${calificacion.nota >= 11 ? '#4CAF50' : '#f44336'}">
                            Nota: ${calificacion.nota}/20
                        </strong>
                        ${calificacion.comentario ? `<p>${calificacion.comentario}</p>` : ''}
                    </div>
                ` : `
                    <div class="tarea-estado">
                        ${diasRestantes >= 0 
                            ? `<span>&#9203; ${diasRestantes} dias restantes</span>`
                            : `<span style="color: #f44336">&#9888; Tarea vencida</span>`
                        }
                    </div>
                `}
            </div>
        `;
    }).join('');
}

async function cargarCalificaciones() {
    const calificaciones = JSON.parse(localStorage.getItem('calificaciones') || '[]');
    misCalificaciones = calificaciones.filter(c => c.estudiante_id === sesionActual.id);
    renderizarCalificaciones();
}

function renderizarCalificaciones() {
    const contenedor = document.getElementById('listaCalificaciones');
    if (!contenedor) return;
    
    if (misCalificaciones.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <p>No tienes calificaciones aun</p>
                <p>Espera a que tus profesores califiquen tus tareas</p>
            </div>
        `;
        return;
    }
    
    const notas = misCalificaciones.map(c => c.nota);
    const promedio = (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2);
    const notaMasAlta = Math.max(...notas);
    const notaMasBaja = Math.min(...notas);
    const aprobadas = misCalificaciones.filter(c => c.nota >= 11).length;
    
    contenedor.innerHTML = `
        <div class="estadisticas-detalladas">
            <div class="stat-card-small">
                <h4>Promedio General</h4>
                <p class="stat-numero">${promedio}</p>
            </div>
            <div class="stat-card-small">
                <h4>Nota Mas Alta</h4>
                <p class="stat-numero" style="color: #4CAF50">${notaMasAlta}</p>
            </div>
            <div class="stat-card-small">
                <h4>Nota Mas Baja</h4>
                <p class="stat-numero" style="color: #f44336">${notaMasBaja}</p>
            </div>
            <div class="stat-card-small">
                <h4>Aprobadas</h4>
                <p class="stat-numero">${aprobadas}/${misCalificaciones.length}</p>
            </div>
        </div>
        
        <div class="calificaciones-lista">
            ${misCalificaciones.map(calificacion => {
                const tarea = tareasDisponibles.find(t => t.id === calificacion.tarea_id);
                if (!tarea) return '';
                
                const aprobado = calificacion.nota >= 11;
                
                return `
                    <div class="calificacion-item" style="border-left-color: ${aprobado ? '#4CAF50' : '#f44336'}">
                        <div class="calificacion-header">
                            <h3>${tarea.titulo}</h3>
                            <span class="nota-grande ${aprobado ? 'aprobado' : 'desaprobado'}">
                                ${calificacion.nota}/20
                            </span>
                        </div>
                        <p><strong>Curso:</strong> ${tarea.curso}</p>
                        <p><strong>Tipo:</strong> ${tarea.tipo}</p>
                        <p><strong>Fecha calificacion:</strong> ${formatearFecha(calificacion.fecha_calificacion)}</p>
                        ${calificacion.comentario ? `
                            <div class="comentario-profesor">
                                <strong>Comentario del profesor:</strong>
                                <p>${calificacion.comentario}</p>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
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
    
    if (tab === 'tareas') {
        cargarTareas();
    } else if (tab === 'calificaciones') {
        cargarCalificaciones();
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
