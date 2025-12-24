// Control del Sistema - Comunicacion con backend Python

const API_URL = 'http://localhost:8000/api';

// Funciones de utilidad

function mostrarMensaje(mensaje, tipo = 'info') {
    const contenedor = document.createElement('div');
    contenedor.className = `mensaje mensaje-${tipo}`;
    contenedor.textContent = mensaje;
    contenedor.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        background: ${tipo === 'success' ? '#4CAF50' : tipo === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(contenedor);
    
    setTimeout(() => {
        contenedor.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => contenedor.remove(), 300);
    }, 3000);
}

function mostrarCargando(mostrar = true) {
    let overlay = document.getElementById('loading-overlay');
    
    if (mostrar) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.innerHTML = `
                <div style="
                    text-align: center;
                    background: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                ">
                    <div style="
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #006442;
                        border-radius: 50%;
                        width: 50px;
                        height: 50px;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 15px;
                    "></div>
                    <p style="margin: 0; color: #333; font-weight: 500;">Cargando...</p>
                </div>
            `;
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
            `;
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    } else if (overlay) {
        overlay.style.display = 'none';
    }
}

// Comunicacion con API

async function peticionAPI(endpoint, opciones = {}) {
    try {
        const config = {
            ...opciones,
            headers: {
                'Content-Type': 'application/json',
                ...opciones.headers
            }
        };
        
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();
        
        return data;
    } catch (error) {
        console.error('Error en peticion API:', error);
        return {
            exito: false,
            mensaje: 'Error de conexion con el servidor'
        };
    }
}

// Funciones de autenticacion

async function registrarProfesor(datos) {
    mostrarCargando(true);
    const resultado = await peticionAPI('/registro/profesor', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
    mostrarCargando(false);
    return resultado;
}

async function registrarEstudiante(datos) {
    mostrarCargando(true);
    const resultado = await peticionAPI('/registro/estudiante', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
    mostrarCargando(false);
    return resultado;
}

async function iniciarSesion(id, contrasena) {
    mostrarCargando(true);
    const resultado = await peticionAPI('/login', {
        method: 'POST',
        body: JSON.stringify({ id, contrasena })
    });
    mostrarCargando(false);
    
    if (resultado.exito) {
        localStorage.setItem('sesion', JSON.stringify(resultado.usuario));
        localStorage.setItem('sesionFecha', new Date().toISOString());
    }
    
    return resultado;
}

function cerrarSesion() {
    localStorage.removeItem('sesion');
    localStorage.removeItem('sesionFecha');
    window.location.href = '/index.html';
}

function obtenerSesion() {
    const sesionStr = localStorage.getItem('sesion');
    if (!sesionStr) return null;
    
    try {
        return JSON.parse(sesionStr);
    } catch {
        return null;
    }
}

function verificarSesion(tipoRequerido = null) {
    const sesion = obtenerSesion();
    
    if (!sesion) {
        mostrarMensaje('Debes iniciar sesion', 'error');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
        return false;
    }
    
    if (tipoRequerido && sesion.tipo !== tipoRequerido) {
        mostrarMensaje(`Esta pagina es solo para ${tipoRequerido}es`, 'error');
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1500);
        return false;
    }
    
    return true;
}

// Funciones de tareas

async function crearTarea(datos, profesorId) {
    mostrarCargando(true);
    datos.profesor_id = profesorId;
    
    const resultado = await peticionAPI('/tareas', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
    
    mostrarCargando(false);
    return resultado;
}

async function eliminarTarea(tareaId, profesorId) {
    mostrarCargando(true);
    
    const resultado = await peticionAPI(`/tareas/${tareaId}`, {
        method: 'DELETE',
        headers: {
            'X-Profesor-ID': profesorId
        }
    });
    
    mostrarCargando(false);
    return resultado;
}

// Funciones de calificaciones

async function asignarCalificacion(datos, profesorId) {
    mostrarCargando(true);
    datos.profesor_id = profesorId;
    
    const resultado = await peticionAPI('/calificaciones', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
    
    mostrarCargando(false);
    return resultado;
}

// Cargar componentes HTML

async function cargarHeader() {
    try {
        const response = await fetch('/pages/header.html');
        const html = await response.text();
        const headerPlaceholder = document.getElementById('header-placeholder');
        
        if (headerPlaceholder) {
            headerPlaceholder.innerHTML = html;
            actualizarHeaderConSesion();
        }
    } catch (error) {
        console.error('Error cargando header:', error);
    }
}

async function cargarFooter() {
    try {
        const response = await fetch('/pages/footer.html');
        const html = await response.text();
        const footerPlaceholder = document.getElementById('footer-placeholder');
        
        if (footerPlaceholder) {
            footerPlaceholder.innerHTML = html;
        }
    } catch (error) {
        console.error('Error cargando footer:', error);
    }
}

function actualizarHeaderConSesion() {
    const sesion = obtenerSesion();
    const navMenu = document.querySelector('.nav-menu');
    
    if (navMenu && sesion) {
        const itemUsuario = document.createElement('li');
        itemUsuario.innerHTML = `
            <a href="#" style="color: #006442; font-weight: bold;">
                ${sesion.nombres}
            </a>
        `;
        navMenu.appendChild(itemUsuario);
        
        const itemCerrar = document.createElement('li');
        itemCerrar.innerHTML = `
            <a href="#" onclick="cerrarSesion(); return false;" 
               style="color: #f44336; font-weight: bold;">
                Cerrar Sesion
            </a>
        `;
        navMenu.appendChild(itemCerrar);
    }
}

// Validaciones

function validarDNI(dni) {
    return /^\d{8}$/.test(dni);
}

function validarCorreo(correo) {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(correo);
}

function validarContrasena(contrasena) {
    if (contrasena.length < 6) {
        return { valido: false, mensaje: 'La contrasena debe tener al menos 6 caracteres' };
    }
    if (!/\d/.test(contrasena)) {
        return { valido: false, mensaje: 'La contrasena debe contener al menos un numero' };
    }
    return { valido: true };
}

function validarIDProfesor(id) {
    return /^PROF\d{3,}$/.test(id);
}

function validarIDEstudiante(id) {
    return /^EST\d{3,}$/.test(id);
}

// Manejo del login

document.addEventListener('DOMContentLoaded', () => {
    cargarHeader();
    cargarFooter();
    
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = document.getElementById('loginId').value.trim();
            const contrasena = document.getElementById('loginContrasena').value;
            
            if (!id || !contrasena) {
                mostrarMensaje('Completa todos los campos', 'error');
                return;
            }
            
            const resultado = await iniciarSesion(id, contrasena);
            
            if (resultado.exito) {
                mostrarMensaje(resultado.mensaje, 'success');
                
                setTimeout(() => {
                    if (resultado.usuario.tipo === 'profesor') {
                        window.location.href = '/pages/interfaz_profesor.html';
                    } else {
                        window.location.href = '/pages/interfaz_estudiante.html';
                    }
                }, 1000);
            } else {
                mostrarMensaje(resultado.mensaje, 'error');
            }
        });
    }
});

// Estilos dinamicos

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
