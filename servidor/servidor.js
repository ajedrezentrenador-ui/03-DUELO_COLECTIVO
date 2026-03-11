const WebSocket = require('ws');

// ============================================
// CONFIGURACIÓN DEL ENTRENADOR (SOLO ADMINISTRADOR)
// ============================================
const CONFIG = {
    // ============================================
    // CONFIGURACIÓN GENERAL
    // ============================================
    modoJuego: 'duelo',
    maxJugadores: 2,                    // NÚMERO DE JUGADORES POR DUELO (2-10)
    
    // ============================================
    // CONFIGURACIÓN DE PROBLEMAS
    // ============================================
    problemasPorSesion: 6,              // 0 = TODOS los disponibles
    modoProblemas: 'azar',               // 'orden' o 'azar'
    
    // ============================================
    // CONFIGURACIÓN DE TEMPORIZADORES
    // ============================================
    tiempoPorProblema: 0,                 // segundos (0 = desactivado)
    tiempoTotalSesion: 180,               // segundos (0 = desactivado)
    
    // ============================================
    // CONFIGURACIÓN DE FALLOS
    // ============================================
    fallosMaximos: 3,
    intentosPorProblema: 1,
    
    // ============================================
    // CONFIGURACIÓN VISUAL
    // ============================================
    mostrarCoordenadas: true,             // Mostrar letras a-h alrededor del tablero
    tema: 'clasico'                       // 'clasico' o 'moderno'
};

// ============================================
// BASE DE DATOS DE PROBLEMAS (cargar desde problemas.js)
// ============================================
let problemas = [];

// Función para cargar problemas
function cargarProblemas() {
    try {
        // Si existe problemas.js, lo cargamos
        const problemasModule = require('./problemas.js');
        problemas = problemasModule.problemas || [];
        console.log(`📚 Problemas cargados desde problemas.js: ${problemas.length}`);
    } catch (e) {
        console.log('⚠️ No se encontró problemas.js, usando problemas por defecto');
        problemas = getProblemasDefault();
    }
}

// Problemas por defecto (10 ejemplos)
function getProblemasDefault() {
    return [
        {
            id: 1,
            fen: "r1b2r1k/ppp1b1pp/2n1q3/8/2B5/5N2/PP2QPPP/R4RK1 w - - 0 1",
            solucion: ["Bxe6"],
            objetivo: "Ganar material",
            descripcion: "Capturar la dama"
        },
        {
            id: 2,
            fen: "n7/2r3k1/p4p1p/1p6/4B3/1P4P1/P3R1KP/8 w - - 0 1",
            solucion: ["Bxa8"],
            objetivo: "Ganar material",
            descripcion: "Capturar la torre"
        },
        {
            id: 3,
            fen: "kn6/8/K7/8/8/8/3q3B/1Q6 w - - 0 1",
            solucion: ["Qxb8#"],
            objetivo: "Dar mate",
            descripcion: "Mate en 1"
        },
        {
            id: 4,
            fen: "r4r2/pp2npkp/4p1p1/1N1pNb2/2qP4/8/PPP2PPP/R2Q1RK1 w - - 0 1",
            solucion: ["Nxc4"],
            objetivo: "Ganar material",
            descripcion: "Capturar la dama"
        },
        {
            id: 5,
            fen: "8/8/8/8/2nb2B1/3k4/3B4/4K3 w - - 0 1",
            solucion: ["Bf5#"],
            objetivo: "Dar mate",
            descripcion: "Mate en 1"
        },
        {
            id: 6,
            fen: "r2q1rk1/2p1bppp/p3p3/1pPp4/1n1PnB2/P3PN2/1P2BPPP/R2QK2R b KQ - 0 1",
            solucion: ["Nc6"],
            objetivo: "Defensa",
            descripcion: "Proteger el peón"
        },
        {
            id: 7,
            fen: "3rr3/2p1k2p/ppb2R2/2p1P2p/8/8/PPP4P/2K3R1 w - - 0 1",
            solucion: ["Rg7#"],
            objetivo: "Dar mate",
            descripcion: "Mate en 1"
        },
        {
            id: 8,
            fen: "8/8/6k1/6P1/1p6/8/pK6/8 b - - 0 1",
            solucion: ["b3"],
            objetivo: "Ataque",
            descripcion: "Avanzar peón"
        },
        {
            id: 9,
            fen: "1R4k1/4rpp1/5n1p/8/8/pN6/P1B2PPb/5K2 b - - 0 1",
            solucion: ["Bxb8"],
            objetivo: "Ganar material",
            descripcion: "Capturar la torre"
        },
        {
            id: 10,
            fen: "rn1q1k2/p1ppp1br/5nQ1/1B4B1/3Pb2P/2P1N3/PP3P2/R3K1R1 w Q - 0 1",
            solucion: ["Nf5"],
            objetivo: "Ataque",
            descripcion: "Mover caballo"
        }
    ];
}

// Cargar problemas al inicio
cargarProblemas();

// ============================================
// PREPARAR PROBLEMAS SEGÚN CONFIGURACIÓN
// ============================================
function prepararProblemas() {
    let disponibles = [...problemas];
    
    // Mezclar si es modo azar
    if (CONFIG.modoProblemas === 'azar') {
        for (let i = disponibles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [disponibles[i], disponibles[j]] = [disponibles[j], disponibles[i]];
        }
    }
    
    // Limitar número de problemas
    if (CONFIG.problemasPorSesion > 0 && CONFIG.problemasPorSesion < disponibles.length) {
        disponibles = disponibles.slice(0, CONFIG.problemasPorSesion);
    }
    
    return disponibles;
}

const servidor = new WebSocket.Server({ port: 8080 });
let jugadores = {};
let duelos = [];
let idDueloCounter = 1;
let salaEspera = [];

console.log("====================================");
console.log("🖥️  SERVIDOR DE DUELO DE PROBLEMAS");
console.log("============ MODO DUELO ============");
console.log(`📡 Escuchando en: ws://localhost:8080`);
console.log(`📚 Problemas disponibles: ${problemas.length}`);
console.log(`🎯 Problemas por sesión: ${CONFIG.problemasPorSesion > 0 ? CONFIG.problemasPorSesion : 'TODOS'}`);
console.log(`🔄 Modo problemas: ${CONFIG.modoProblemas}`);
console.log(`👥 Jugadores por duelo: ${CONFIG.maxJugadores}`);
console.log(`⏱️ Tiempo por problema: ${CONFIG.tiempoPorProblema > 0 ? CONFIG.tiempoPorProblema + 's' : 'ILIMITADO'}`);
console.log(`⏱️ Tiempo total sesión: ${CONFIG.tiempoTotalSesion > 0 ? CONFIG.tiempoTotalSesion + 's' : 'ILIMITADO'}`);
console.log(`🎯 Fallos máximos: ${CONFIG.fallosMaximos}`);
console.log("====================================");

servidor.on('connection', (ws) => {
    if (Object.keys(jugadores).length >= 50) { // Límite absoluto de conexiones
        ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Servidor lleno' }));
        ws.close();
        return;
    }

    const idJugador = Math.random().toString(36).substring(2, 8);
    
    jugadores[idJugador] = {
        id: idJugador,
        conexion: ws,
        nombre: '',
        enDuelo: false,
        idDuelo: null,
        listo: false,
        
        puntuacion: 0,
        fallos: 0,
        aciertos: 0,
        
        indiceProblemaActual: 0,
        problemasAsignados: [],
        resultadosProblemas: [],
        
        problemaActual: null,
        indiceMovimiento: 0,
        problemaEnCurso: false,
        
        tiempoRestanteProblema: CONFIG.tiempoPorProblema,
        temporizadorProblema: null,
        
        tiempoInicioSesion: null,
        temporizadorTotal: null
    };

    console.log(`🎮 Jugador ${idJugador} conectado`);
    
    // Enviar configuración visual al cliente
    ws.send(JSON.stringify({ 
        tipo: 'bienvenida', 
        id: idJugador,
        modo: CONFIG.modoJuego,
        config: {
            tiempoPorProblema: CONFIG.tiempoPorProblema,
            tiempoTotalSesion: CONFIG.tiempoTotalSesion,
            fallosMaximos: CONFIG.fallosMaximos,
            mostrarCoordenadas: CONFIG.mostrarCoordenadas,
            tema: CONFIG.tema
        }
    }));

    ws.on('message', (mensaje) => {
        try {
            const datos = JSON.parse(mensaje.toString());
            console.log(`📨 ${idJugador}: ${datos.tipo}`);

            switch(datos.tipo) {
                case 'registro':
                    manejarRegistro(idJugador, datos);
                    break;

                case 'buscar_duelo':
                    manejarBuscarDuelo(idJugador);
                    break;

                case 'cancelar_busqueda':
                    manejarCancelarBusqueda(idJugador);
                    break;

                case 'listo_para_duelo':
                    manejarListoParaDuelo(idJugador);
                    break;

                case 'movimiento':
                    manejarMovimiento(idJugador, datos);
                    break;

                case 'abandonar':
                    manejarAbandono(idJugador);
                    break;
            }
        } catch (e) {
            console.error('Error:', e);
        }
    });

    ws.on('close', () => {
        console.log(`🚪 Jugador ${idJugador} desconectado`);
        manejarDesconexion(idJugador);
        delete jugadores[idJugador];
    });
});

// ============================================
// FUNCIONES DE MANEJO DE DUELOS
// ============================================

function manejarRegistro(idJugador, datos) {
    const jugador = jugadores[idJugador];
    jugador.nombre = datos.nombre;
    
    jugador.conexion.send(JSON.stringify({ 
        tipo: 'registro_ok',
        config: {
            tiempoPorProblema: CONFIG.tiempoPorProblema,
            tiempoTotalSesion: CONFIG.tiempoTotalSesion,
            fallosMaximos: CONFIG.fallosMaximos,
            mostrarCoordenadas: CONFIG.mostrarCoordenadas,
            tema: CONFIG.tema,
            totalJugadores: CONFIG.maxJugadores
        }
    }));
}

function manejarBuscarDuelo(idJugador) {
    const jugador = jugadores[idJugador];
    
    if (jugador.enDuelo) {
        jugador.conexion.send(JSON.stringify({
            tipo: 'error',
            mensaje: 'Ya estás en un duelo'
        }));
        return;
    }
    
    // Verificar si ya está en sala de espera
    if (!salaEspera.includes(idJugador)) {
        salaEspera.push(idJugador);
    }
    
    jugador.conexion.send(JSON.stringify({
        tipo: 'buscando',
        mensaje: `Buscando oponentes... (${salaEspera.length}/${CONFIG.maxJugadores})`,
        actuales: salaEspera.length,
        necesarios: CONFIG.maxJugadores
    }));
    
    console.log(`🔍 ${idJugador} buscando oponente. Sala: ${salaEspera.length}/${CONFIG.maxJugadores}`);
    
    // Cuando se alcanza el número de jugadores, crear duelo
    if (salaEspera.length >= CONFIG.maxJugadores) {
        const jugadoresDuelo = salaEspera.splice(0, CONFIG.maxJugadores);
        crearDuelo(jugadoresDuelo);
    }
}

function manejarCancelarBusqueda(idJugador) {
    const index = salaEspera.indexOf(idJugador);
    if (index !== -1) {
        salaEspera.splice(index, 1);
        jugadores[idJugador].conexion.send(JSON.stringify({
            tipo: 'busqueda_cancelada'
        }));
        
        // Notificar a los demás en sala
        salaEspera.forEach(jId => {
            const j = jugadores[jId];
            if (j) {
                j.conexion.send(JSON.stringify({
                    tipo: 'actualizar_espera',
                    actuales: salaEspera.length,
                    necesarios: CONFIG.maxJugadores
                }));
            }
        });
    }
}

function crearDuelo(jugadoresIds) {
    const idDuelo = idDueloCounter++;
    
    // Preparar problemas para este duelo
    const problemasDuelo = prepararProblemas();
    
    const duelo = {
        id: idDuelo,
        jugadores: jugadoresIds,
        estado: 'esperando',
        problemas: problemasDuelo,
        iniciado: false,
        tiempoInicio: null,
        tiempoRestanteTotal: CONFIG.tiempoTotalSesion,
        temporizadorTotal: null,
        finalizado: false,
        razonFinalizacion: null
    };
    
    duelos.push(duelo);
    
    // Configurar cada jugador
    jugadoresIds.forEach((jId, index) => {
        const j = jugadores[jId];
        if (!j) return;
        
        j.enDuelo = true;
        j.idDuelo = idDuelo;
        j.listo = false;
        j.indiceProblemaActual = 0;
        j.problemasAsignados = problemasDuelo.map(p => ({ ...p }));
        j.resultadosProblemas = new Array(problemasDuelo.length).fill(null);
        j.tiempoRestanteProblema = CONFIG.tiempoPorProblema;
        
        if (CONFIG.tiempoTotalSesion > 0) {
            j.tiempoInicioSesion = Date.now();
        }
    });
    
    const nombres = jugadoresIds.map(id => jugadores[id]?.nombre || 'Jugador').join(', ');
    console.log(`⚔️ DUELO CREADO: ${nombres} (ID: ${idDuelo}) - ${problemasDuelo.length} problemas`);
    
    // Notificar a cada jugador
    jugadoresIds.forEach(jId => {
        const j = jugadores[jId];
        if (!j) return;
        
        const otrosJugadores = jugadoresIds
            .filter(id => id !== jId)
            .map(id => jugadores[id]?.nombre || 'Jugador');
        
        j.conexion.send(JSON.stringify({
            tipo: 'duelo_creado',
            idDuelo: idDuelo,
            rivales: otrosJugadores,
            totalProblemas: problemasDuelo.length,
            totalJugadores: jugadoresIds.length,
            tiempoPreparacion: 5
        }));
    });
    
    // Iniciar cuenta atrás para comenzar
    setTimeout(() => {
        const dueloActual = duelos.find(d => d.id === idDuelo);
        if (dueloActual && !dueloActual.iniciado) {
            iniciarDuelo(idDuelo);
        }
    }, 5000); // 5 segundos de preparación
}

function manejarListoParaDuelo(idJugador) {
    const jugador = jugadores[idJugador];
    if (!jugador || !jugador.enDuelo) return;
    
    jugador.listo = true;
    
    const duelo = duelos.find(d => d.id === jugador.idDuelo);
    if (!duelo) return;
    
    // Verificar si todos están listos
    const todosListos = duelo.jugadores.every(jId => {
        const j = jugadores[jId];
        return j && j.listo;
    });
    
    if (todosListos && !duelo.iniciado) {
        iniciarDuelo(duelo.id);
    }
}

function iniciarDuelo(idDuelo) {
    const duelo = duelos.find(d => d.id === idDuelo);
    if (!duelo || duelo.iniciado) return;
    
    duelo.estado = 'en_curso';
    duelo.iniciado = true;
    duelo.tiempoInicio = Date.now();
    
    const nombres = duelo.jugadores.map(id => jugadores[id]?.nombre || 'Jugador').join(', ');
    console.log(`🏁 DUELO INICIADO: ${nombres}`);
    
    // Notificar a todos los jugadores
    duelo.jugadores.forEach(jId => {
        const j = jugadores[jId];
        if (!j) return;
        
        j.conexion.send(JSON.stringify({
            tipo: 'duelo_iniciado',
            mensaje: '¡El duelo ha comenzado!'
        }));
    });
    
    // Iniciar temporizador total si está activado
    if (CONFIG.tiempoTotalSesion > 0) {
        duelo.temporizadorTotal = setInterval(() => {
            if (!duelo || duelo.finalizado) return;
            
            duelo.tiempoRestanteTotal--;
            
            // Enviar tiempo a todos los jugadores
            duelo.jugadores.forEach(jId => {
                const j = jugadores[jId];
                if (j && j.conexion.readyState === WebSocket.OPEN) {
                    j.conexion.send(JSON.stringify({
                        tipo: 'tiempo_total',
                        tiempo: duelo.tiempoRestanteTotal
                    }));
                }
            });
            
            if (duelo.tiempoRestanteTotal <= 0) {
                duelo.razonFinalizacion = 'tiempo';
                finalizarDuelo(idDuelo);
            }
        }, 1000);
    }
    
    // Enviar primer problema a cada jugador
    duelo.jugadores.forEach(jId => {
        enviarProblemaAJugador(jId);
    });
}

function enviarProblemaAJugador(idJugador) {
    const jugador = jugadores[idJugador];
    if (!jugador || !jugador.enDuelo) return;
    
    const duelo = duelos.find(d => d.id === jugador.idDuelo);
    if (!duelo || duelo.finalizado) return;
    
    if (jugador.indiceProblemaActual >= duelo.problemas.length) {
        verificarFinDuelo(duelo.id);
        return;
    }
    
    const problema = duelo.problemas[jugador.indiceProblemaActual];
    
    jugador.problemaActual = JSON.parse(JSON.stringify(problema));
    jugador.indiceMovimiento = 0;
    jugador.problemaEnCurso = true;
    jugador.tiempoRestanteProblema = CONFIG.tiempoPorProblema;
    
    const colorJugador = problema.fen.includes(' w ') ? 'w' : 'b';
    
    console.log(`📤 ${jugador.nombre} - Problema ${jugador.indiceProblemaActual + 1}/${duelo.problemas.length}`);
    
    jugador.conexion.send(JSON.stringify({
        tipo: 'problema_duelo',
        fen: problema.fen,
        colorJugador: colorJugador,
        descripcion: problema.descripcion,
        objetivo: problema.objetivo,
        numProblema: jugador.indiceProblemaActual + 1,
        totalProblemas: duelo.problemas.length,
        tiempoPorProblema: CONFIG.tiempoPorProblema
    }));
    
    // Iniciar temporizador del problema si está activado
    if (CONFIG.tiempoPorProblema > 0) {
        if (jugador.temporizadorProblema) {
            clearTimeout(jugador.temporizadorProblema);
        }
        
        jugador.temporizadorProblema = setTimeout(() => {
            if (!jugador.problemaEnCurso || !jugador.problemaActual) return;
            
            console.log(`⏰ ${jugador.nombre} - Tiempo agotado en problema`);
            
            jugador.fallos++;
            jugador.problemaEnCurso = false;
            
            registrarResultadoProblema(idJugador, 0);
            
            jugador.conexion.send(JSON.stringify({
                tipo: 'tiempo_agotado',
                mensaje: '⏰ Tiempo agotado',
                fallosActuales: jugador.fallos,
                fallosMaximos: CONFIG.fallosMaximos
            }));
            
            jugador.indiceProblemaActual++;
            
            if (jugador.fallos >= CONFIG.fallosMaximos) {
                jugador.conexion.send(JSON.stringify({
                    tipo: 'eliminado',
                    mensaje: 'Has alcanzado el límite de fallos'
                }));
                
                duelo.razonFinalizacion = 'eliminacion';
                finalizarDuelo(duelo.id);
            } else {
                setTimeout(() => {
                    enviarProblemaAJugador(idJugador);
                }, 1500);
            }
            
            actualizarMarcadorDuelo(duelo.id);
        }, CONFIG.tiempoPorProblema * 1000);
    }
}

function manejarMovimiento(idJugador, datos) {
    const jugador = jugadores[idJugador];
    if (!jugador || !jugador.enDuelo || !jugador.problemaEnCurso) return;
    
    const duelo = duelos.find(d => d.id === jugador.idDuelo);
    if (!duelo || duelo.finalizado) return;
    
    // Cancelar temporizador del problema
    if (jugador.temporizadorProblema) {
        clearTimeout(jugador.temporizadorProblema);
        jugador.temporizadorProblema = null;
    }
    
    const problema = jugador.problemaActual;
    const indice = jugador.indiceMovimiento;
    
    if (datos.movimiento === problema.solucion[indice]) {
        jugador.indiceMovimiento++;
        
        if (jugador.indiceMovimiento >= problema.solucion.length) {
            finalizarProblemaExitoso(idJugador);
        } else {
            jugador.conexion.send(JSON.stringify({
                tipo: 'movimiento_correcto',
                mensaje: '✓ Correcto'
            }));
            
            setTimeout(() => {
                if (!jugador.problemaEnCurso) return;
                
                const movimientoPrograma = problema.solucion[jugador.indiceMovimiento];
                jugador.indiceMovimiento++;
                
                jugador.conexion.send(JSON.stringify({
                    tipo: 'movimiento_programa',
                    movimiento: movimientoPrograma
                }));
                
                if (jugador.indiceMovimiento >= problema.solucion.length) {
                    finalizarProblemaExitoso(idJugador);
                }
            }, 800);
        }
    } else {
        jugador.fallos++;
        jugador.problemaEnCurso = false;
        
        registrarResultadoProblema(idJugador, 0);
        
        console.log(`   ❌ ${jugador.nombre} falla. Fallos: ${jugador.fallos}/${CONFIG.fallosMaximos}`);
        
        jugador.conexion.send(JSON.stringify({
            tipo: 'movimiento_incorrecto',
            correcto: problema.solucion[indice],
            fallosActuales: jugador.fallos,
            fallosMaximos: CONFIG.fallosMaximos
        }));
        
        jugador.indiceProblemaActual++;
        
        if (jugador.fallos >= CONFIG.fallosMaximos) {
            jugador.conexion.send(JSON.stringify({
                tipo: 'eliminado',
                mensaje: 'Has alcanzado el límite de fallos'
            }));
            
            duelo.razonFinalizacion = 'eliminacion';
            finalizarDuelo(duelo.id);
            return;
        } else {
            setTimeout(() => {
                enviarProblemaAJugador(idJugador);
            }, 1500);
        }
    }
    
    actualizarMarcadorDuelo(duelo.id);
}

function finalizarProblemaExitoso(idJugador) {
    const jugador = jugadores[idJugador];
    if (!jugador) return;
    
    const duelo = duelos.find(d => d.id === jugador.idDuelo);
    if (!duelo) return;
    
    jugador.problemaEnCurso = false;
    jugador.aciertos++;
    
    registrarResultadoProblema(idJugador, 1);
    
    jugador.conexion.send(JSON.stringify({
        tipo: 'problema_completado',
        mensaje: '✅ ¡Problema resuelto!'
    }));
    
    jugador.indiceProblemaActual++;
    
    if (jugador.indiceProblemaActual >= duelo.problemas.length) {
        jugador.conexion.send(JSON.stringify({
            tipo: 'todos_completados',
            mensaje: '¡Has completado todos los problemas!'
        }));
        verificarFinDuelo(duelo.id);
    } else {
        setTimeout(() => {
            enviarProblemaAJugador(idJugador);
        }, 1500);
    }
    
    actualizarMarcadorDuelo(duelo.id);
}

function registrarResultadoProblema(idJugador, resultado) {
    const jugador = jugadores[idJugador];
    if (!jugador) return;
    
    const duelo = duelos.find(d => d.id === jugador.idDuelo);
    if (!duelo) return;
    
    jugador.resultadosProblemas[jugador.indiceProblemaActual] = resultado;
    jugador.puntuacion = (jugador.aciertos * 10) - (jugador.fallos * 5);
    if (jugador.puntuacion < 0) jugador.puntuacion = 0;
}

function actualizarMarcadorDuelo(idDuelo) {
    const duelo = duelos.find(d => d.id === idDuelo);
    if (!duelo || duelo.finalizado) return;
    
    const jugadoresEnDuelo = duelo.jugadores
        .map(id => jugadores[id])
        .filter(j => j);
    
    const marcadorGeneral = jugadoresEnDuelo.map(j => ({
        id: j.id,
        nombre: j.nombre,
        puntuacion: j.puntuacion,
        aciertos: j.aciertos,
        fallos: j.fallos,
        problemasCompletados: j.indiceProblemaActual,
        resultados: j.resultadosProblemas
    }));
    
    // Ordenar por puntuación
    marcadorGeneral.sort((a, b) => b.puntuacion - a.puntuacion);
    
    // Enviar a cada jugador
    duelo.jugadores.forEach(jId => {
        const j = jugadores[jId];
        if (!j || j.conexion.readyState !== WebSocket.OPEN) return;
        
        j.conexion.send(JSON.stringify({
            tipo: 'marcador_duelo',
            propio: {
                puntuacion: j.puntuacion,
                aciertos: j.aciertos,
                fallos: j.fallos,
                problemasCompletados: j.indiceProblemaActual,
                resultados: j.resultadosProblemas
            },
            todos: marcadorGeneral.filter(m => m.id !== jId)
        }));
    });
}

function verificarFinDuelo(idDuelo) {
    const duelo = duelos.find(d => d.id === idDuelo);
    if (!duelo || duelo.finalizado) return;
    
    const todosTerminaron = duelo.jugadores.every(jId => {
        const j = jugadores[jId];
        return !j || j.indiceProblemaActual >= duelo.problemas.length || j.fallos >= CONFIG.fallosMaximos;
    });
    
    if (todosTerminaron) {
        duelo.razonFinalizacion = 'completado';
        finalizarDuelo(idDuelo);
    }
}

function finalizarDuelo(idDuelo) {
    const duelo = duelos.find(d => d.id === idDuelo);
    if (!duelo || duelo.finalizado) return;
    
    duelo.finalizado = true;
    duelo.estado = 'finalizado';
    
    if (duelo.temporizadorTotal) {
        clearInterval(duelo.temporizadorTotal);
        duelo.temporizadorTotal = null;
    }
    
    const jugadoresEnDuelo = duelo.jugadores
        .map(id => jugadores[id])
        .filter(j => j);
    
    console.log(`🏁 DUELO ${idDuelo} FINALIZADO - Razón: ${duelo.razonFinalizacion || 'desconocida'}`);
    
    const tabla = generarTablaResultados(duelo);
    
    jugadoresEnDuelo.forEach(j => {
        if (!j || j.conexion.readyState !== WebSocket.OPEN) return;
        
        j.enDuelo = false;
        j.idDuelo = null;
        j.problemaEnCurso = false;
        
        if (j.temporizadorProblema) {
            clearTimeout(j.temporizadorProblema);
            j.temporizadorProblema = null;
        }
        
        j.conexion.send(JSON.stringify({
            tipo: 'duelo_finalizado',
            razon: duelo.razonFinalizacion,
            tabla: tabla
        }));
    });
    
    const index = duelos.findIndex(d => d.id === idDuelo);
    if (index !== -1) duelos.splice(index, 1);
}

function generarTablaResultados(duelo) {
    const jugadoresEnDuelo = duelo.jugadores
        .map(id => jugadores[id])
        .filter(j => j);
    
    const resultados = jugadoresEnDuelo.map(j => ({
        nombre: j.nombre,
        puntuacion: j.puntuacion,
        aciertos: j.aciertos,
        fallos: j.fallos,
        problemasCompletados: j.indiceProblemaActual,
        resultados: j.resultadosProblemas
    }));
    
    resultados.sort((a, b) => b.puntuacion - a.puntuacion);
    
    return {
        problemas: duelo.problemas.map(p => p.id),
        jugadores: resultados,
        ganador: resultados[0]?.nombre,
        empate: resultados[0]?.puntuacion === resultados[1]?.puntuacion
    };
}

function manejarAbandono(idJugador) {
    const jugador = jugadores[idJugador];
    if (!jugador || !jugador.enDuelo) return;
    
    const duelo = duelos.find(d => d.id === jugador.idDuelo);
    if (duelo) {
        duelo.razonFinalizacion = 'abandono';
        finalizarDuelo(duelo.id);
    }
}

function manejarDesconexion(idJugador) {
    const jugador = jugadores[idJugador];
    if (!jugador) return;
    
    if (jugador.enDuelo) {
        manejarAbandono(idJugador);
    }
    
    const indexEspera = salaEspera.indexOf(idJugador);
    if (indexEspera !== -1) {
        salaEspera.splice(indexEspera, 1);
    }
}