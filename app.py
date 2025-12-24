# Logica del Sistema de Gestion Educativa
# Manejo de usuarios, tareas y calificaciones

import json
import os
import hashlib
import re
from datetime import datetime

# Configuracion de rutas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

USUARIOS_FILE = os.path.join(DATA_DIR, 'usuarios.json')
TAREAS_FILE = os.path.join(DATA_DIR, 'tareas.json')
CALIFICACIONES_FILE = os.path.join(DATA_DIR, 'calificaciones.json')

# Funciones para manejo de archivos JSON

def leer_json(archivo):
    try:
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"Error leyendo {archivo}: {e}")
        return []

def escribir_json(archivo, datos):
    try:
        with open(archivo, 'w', encoding='utf-8') as f:
            json.dump(datos, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error escribiendo {archivo}: {e}")
        return False

# Funciones de validacion

def validar_dni(dni):
    return bool(re.match(r'^\d{8}$', str(dni)))

def validar_correo(correo):
    patron = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(patron, correo))

def validar_contrasena(contrasena):
    if len(contrasena) < 6:
        return False, "La contrasena debe tener al menos 6 caracteres"
    if not any(char.isdigit() for char in contrasena):
        return False, "La contrasena debe contener al menos un numero"
    return True, "OK"

def hashear_contrasena(contrasena):
    return hashlib.sha256(contrasena.encode()).hexdigest()

def verificar_contrasena(contrasena, hash_guardado):
    return hashear_contrasena(contrasena) == hash_guardado

# Funciones de gestion de usuarios

def obtener_usuarios():
    return leer_json(USUARIOS_FILE)

def buscar_usuario_por_id(usuario_id):
    usuarios = obtener_usuarios()
    for usuario in usuarios:
        if usuario['id'] == usuario_id:
            return usuario
    return None

def buscar_usuario_por_correo(correo):
    usuarios = obtener_usuarios()
    for usuario in usuarios:
        if usuario['correo'] == correo:
            return usuario
    return None

def registrar_usuario(datos):
    campos_requeridos = ['id', 'nombres', 'apellidos', 'dni', 'correo', 'contrasena', 'tipo']
    for campo in campos_requeridos:
        if campo not in datos or not datos[campo]:
            return {'exito': False, 'mensaje': f'El campo {campo} es obligatorio'}
    
    if not validar_dni(datos['dni']):
        return {'exito': False, 'mensaje': 'DNI invalido. Debe tener 8 digitos'}
    
    if not validar_correo(datos['correo']):
        return {'exito': False, 'mensaje': 'Correo electronico invalido'}
    
    valido, mensaje = validar_contrasena(datos['contrasena'])
    if not valido:
        return {'exito': False, 'mensaje': mensaje}
    
    if buscar_usuario_por_id(datos['id']):
        return {'exito': False, 'mensaje': 'Este ID ya esta registrado'}
    
    if buscar_usuario_por_correo(datos['correo']):
        return {'exito': False, 'mensaje': 'Este correo ya esta registrado'}
    
    usuarios = obtener_usuarios()
    nuevo_usuario = {
        'id': datos['id'],
        'nombres': datos['nombres'],
        'apellidos': datos['apellidos'],
        'dni': datos['dni'],
        'correo': datos['correo'],
        'contrasena': hashear_contrasena(datos['contrasena']),
        'tipo': datos['tipo'],
        'fecha_registro': datetime.now().isoformat(),
        'ultimo_acceso': None
    }
    
    if datos['tipo'] == 'profesor':
        nuevo_usuario['especialidad'] = datos.get('especialidad', '')
    elif datos['tipo'] == 'estudiante':
        nuevo_usuario['grado'] = datos.get('grado', '')
        nuevo_usuario['seccion'] = datos.get('seccion', '')
    
    usuarios.append(nuevo_usuario)
    
    if escribir_json(USUARIOS_FILE, usuarios):
        return {'exito': True, 'mensaje': 'Registro exitoso'}
    else:
        return {'exito': False, 'mensaje': 'Error al guardar el usuario'}

def iniciar_sesion(usuario_id, contrasena):
    usuario = buscar_usuario_por_id(usuario_id)
    
    if not usuario:
        return {'exito': False, 'mensaje': 'Usuario no encontrado'}
    
    if not verificar_contrasena(contrasena, usuario['contrasena']):
        return {'exito': False, 'mensaje': 'Contrasena incorrecta'}
    
    usuarios = obtener_usuarios()
    for u in usuarios:
        if u['id'] == usuario_id:
            u['ultimo_acceso'] = datetime.now().isoformat()
            break
    escribir_json(USUARIOS_FILE, usuarios)
    
    usuario_datos = {k: v for k, v in usuario.items() if k != 'contrasena'}
    
    return {
        'exito': True,
        'mensaje': f'Bienvenido, {usuario["nombres"]}!',
        'usuario': usuario_datos
    }

# Funciones de gestion de tareas

def obtener_tareas():
    return leer_json(TAREAS_FILE)

def obtener_tareas_por_profesor(profesor_id):
    tareas = obtener_tareas()
    return [t for t in tareas if t['profesor_id'] == profesor_id]

def obtener_tareas_para_estudiante():
    return obtener_tareas()

def crear_tarea(datos, profesor_id):
    campos_requeridos = ['titulo', 'descripcion', 'curso', 'fechaEntrega']
    for campo in campos_requeridos:
        if campo not in datos or not datos[campo]:
            return {'exito': False, 'mensaje': f'El campo {campo} es obligatorio'}
    
    tareas = obtener_tareas()
    tarea_id = len(tareas) + 1
    
    nueva_tarea = {
        'id': tarea_id,
        'titulo': datos['titulo'],
        'descripcion': datos['descripcion'],
        'curso': datos['curso'],
        'tipo': datos.get('tipo', 'tarea'),
        'fechaEntrega': datos['fechaEntrega'],
        'puntos': datos.get('puntos', 20),
        'profesor_id': profesor_id,
        'estado': 'activa',
        'fecha_creacion': datetime.now().isoformat()
    }
    
    tareas.append(nueva_tarea)
    
    if escribir_json(TAREAS_FILE, tareas):
        return {'exito': True, 'mensaje': 'Tarea creada exitosamente', 'tarea_id': tarea_id}
    else:
        return {'exito': False, 'mensaje': 'Error al guardar la tarea'}

def eliminar_tarea(tarea_id, profesor_id):
    tareas = obtener_tareas()
    tarea_encontrada = None
    
    for tarea in tareas:
        if tarea['id'] == tarea_id:
            tarea_encontrada = tarea
            break
    
    if not tarea_encontrada:
        return {'exito': False, 'mensaje': 'Tarea no encontrada'}
    
    if tarea_encontrada['profesor_id'] != profesor_id:
        return {'exito': False, 'mensaje': 'No tienes permiso para eliminar esta tarea'}
    
    tareas = [t for t in tareas if t['id'] != tarea_id]
    
    if escribir_json(TAREAS_FILE, tareas):
        calificaciones = obtener_calificaciones()
        calificaciones = [c for c in calificaciones if c['tarea_id'] != tarea_id]
        escribir_json(CALIFICACIONES_FILE, calificaciones)
        
        return {'exito': True, 'mensaje': 'Tarea eliminada exitosamente'}
    else:
        return {'exito': False, 'mensaje': 'Error al eliminar la tarea'}

# Funciones de gestion de calificaciones

def obtener_calificaciones():
    return leer_json(CALIFICACIONES_FILE)

def obtener_calificacion(tarea_id, estudiante_id):
    calificaciones = obtener_calificaciones()
    for cal in calificaciones:
        if cal['tarea_id'] == tarea_id and cal['estudiante_id'] == estudiante_id:
            return cal
    return None

def asignar_calificacion(datos, profesor_id):
    campos_requeridos = ['tarea_id', 'estudiante_id', 'nota']
    for campo in campos_requeridos:
        if campo not in datos:
            return {'exito': False, 'mensaje': f'El campo {campo} es obligatorio'}
    
    try:
        nota = float(datos['nota'])
        if nota < 0 or nota > 20:
            return {'exito': False, 'mensaje': 'La nota debe estar entre 0 y 20'}
    except ValueError:
        return {'exito': False, 'mensaje': 'Nota invalida'}
    
    tarea = None
    for t in obtener_tareas():
        if t['id'] == datos['tarea_id']:
            tarea = t
            break
    
    if not tarea:
        return {'exito': False, 'mensaje': 'Tarea no encontrada'}
    
    if tarea['profesor_id'] != profesor_id:
        return {'exito': False, 'mensaje': 'No tienes permiso para calificar esta tarea'}
    
    estudiante = buscar_usuario_por_id(datos['estudiante_id'])
    if not estudiante or estudiante['tipo'] != 'estudiante':
        return {'exito': False, 'mensaje': 'Estudiante no encontrado'}
    
    calificaciones = obtener_calificaciones()
    
    calificacion_existente = None
    for i, cal in enumerate(calificaciones):
        if cal['tarea_id'] == datos['tarea_id'] and cal['estudiante_id'] == datos['estudiante_id']:
            calificacion_existente = i
            break
    
    nueva_calificacion = {
        'tarea_id': datos['tarea_id'],
        'estudiante_id': datos['estudiante_id'],
        'nota': nota,
        'comentario': datos.get('comentario', ''),
        'fecha_calificacion': datetime.now().isoformat()
    }
    
    if calificacion_existente is not None:
        calificaciones[calificacion_existente] = nueva_calificacion
    else:
        calificaciones.append(nueva_calificacion)
    
    if escribir_json(CALIFICACIONES_FILE, calificaciones):
        return {'exito': True, 'mensaje': 'Calificacion asignada exitosamente'}
    else:
        return {'exito': False, 'mensaje': 'Error al guardar la calificacion'}

def obtener_calificaciones_estudiante(estudiante_id):
    calificaciones = obtener_calificaciones()
    return [c for c in calificaciones if c['estudiante_id'] == estudiante_id]

def obtener_estadisticas_estudiante(estudiante_id):
    tareas = obtener_tareas()
    calificaciones = obtener_calificaciones_estudiante(estudiante_id)
    
    total_tareas = len(tareas)
    tareas_calificadas = len(calificaciones)
    tareas_pendientes = total_tareas - tareas_calificadas
    
    if calificaciones:
        promedio = sum(c['nota'] for c in calificaciones) / len(calificaciones)
    else:
        promedio = 0
    
    return {
        'total_tareas': total_tareas,
        'calificadas': tareas_calificadas,
        'pendientes': tareas_pendientes,
        'promedio': round(promedio, 2)
    }

def obtener_entregas_tarea(tarea_id):
    calificaciones = obtener_calificaciones()
    usuarios = obtener_usuarios()
    estudiantes = [u for u in usuarios if u['tipo'] == 'estudiante']
    
    entregas = []
    
    for estudiante in estudiantes:
        calificacion = None
        for cal in calificaciones:
            if cal['tarea_id'] == tarea_id and cal['estudiante_id'] == estudiante['id']:
                calificacion = cal
                break
        
        entrega = {
            'id': estudiante['id'],
            'nombres': estudiante['nombres'],
            'apellidos': estudiante['apellidos'],
            'nota': calificacion['nota'] if calificacion else None,
            'comentario': calificacion['comentario'] if calificacion else '',
            'fecha_calificacion': calificacion['fecha_calificacion'] if calificacion else None,
            'estado': 'calificada' if calificacion else 'pendiente'
        }
        
        entregas.append(entrega)
    
    return entregas

def obtener_estadisticas_profesor(profesor_id):
    tareas = obtener_tareas_por_profesor(profesor_id)
    calificaciones = obtener_calificaciones()
    
    total_tareas = len(tareas)
    
    total_entregas = 0
    entregas_calificadas = 0
    
    for tarea in tareas:
        entregas_tarea = [c for c in calificaciones if c['tarea_id'] == tarea['id']]
        total_entregas += len(entregas_tarea)
        entregas_calificadas += len(entregas_tarea)
    
    return {
        'total_tareas': total_tareas,
        'total_entregas': total_entregas,
        'entregas_calificadas': entregas_calificadas
    }
