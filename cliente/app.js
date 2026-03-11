let socket = null;
let chess = new Chess();
let miId = null;
let miNombre = '';
let puedeMover = false;
let piezaSeleccionada = null;
let arrastrando = false;
let clone = null;
let colorJugador = 'w';
let enDuelo = false;
let idDuelo = null;
let rivales = [];
let totalProblemas = 0;
let misResultados = [];
let misPuntos = 0;
let misAciertos = 0;
let misFallos = 0;
let tiempoRestanteProblema = 0;
let tiempoRestanteTotal = 0;
let fallosMaximos = 3;
let totalJugadores = 2;
let mostrarCoordenadas = true;
let tema = 'clasico';
let intervaloRelojProblema = null;
let intervaloRelojTotal = null;

// Elementos del DOM
const estadoSpan = document.getElementById('estado');
const btnConectar = document.getElementById('btnConectar');
const btnDesconectar = document.getElementById('btnDesconectar');
const tableroDiv = document.getElementById('tablero');
const miIdSpan = document.getElementById('miId');
const miNombreSpan = document.getElementById('miNombre');
const tiempoProblemaSpan = document.getElementById('tiempoProblema');
const tiempoTotalSpan = document.getElementById('tiempoTotal');
const turnoDisplay = document.getElementById('turnoDisplay');
const problemaDescSpan = document.getElementById('problemaDesc');
const mensajesDiv = document.getElementById('mensajes');
const btnRegistrar = document.getElementById('btnRegistrar');
const btnBuscarDuelo = document.getElementById('btnBuscarDuelo');
const btnCancelarBusqueda = document.getElementById('btnCancelarBusqueda');
const btnListo = document.getElementById('btnListo');
const btnAbandonar = document.getElementById('btnAbandonar');
const registroDiv = document.getElementById('registro');
const juegoPanelDiv = document.getElementById('juegoPanel');
const dueloPanelDiv = document.getElementById('dueloPanel');
const esperaDiv = document.getElementById('espera');
const preparacionDiv = document.getElementById('preparacion');
const dueloActivoDiv = document.getElementById('dueloActivo');
const contenedorMarcadores = document.getElementById('contenedorMarcadores');
const nombreRivalesSpan = document.getElementById('nombreRivales');
const miNombreDisplay = document.getElementById('miNombreDisplay');
const puntuacionPropiaSpan = document.getElementById('puntuacionPropia');
const aciertosPropiosSpan = document.getElementById('aciertosPropios');
const fallosPropiosSpan = document.getElementById('fallosPropios');
const nombreInput = document.getElementById('nombreInput');
const contadorEsperaSpan = document.getElementById('contadorEspera');
const tiempoPreparacionSpan = document.getElementById('tiempoPreparacion');
const coordenadasSuperiores = document.getElementById('coordsSuperiores');
const coordenadasInferiores = document.getElementById('coordsInferiores');

function obtenerURLPieza(pieza) {
    const prefijo = pieza.color === 'w' ? 'w' : 'b';
    let tipo = pieza.type.toLowerCase();
    return `imagenes/${prefijo}${tipo}.svg`;
}

function dibujarTablero() {
    const tablero = chess.board();
    tableroDiv.innerHTML = '';
    
    const rotado = (colorJugador === 'b');
    
    for (let i = 0; i < 8; i++) {
        const fila = rotado ? 7 - i : i;
        const numeroFila = 8 - fila; // Número real de la fila (1-8) para mostrar dentro
        
        for (let j = 0; j < 8; j++) {
            const columna = rotado ? 7 - j : j;
            
            const pieza = tablero[fila][columna];
            const casilla = document.createElement('div');
            casilla.className = `casilla ${(fila + columna) % 2 === 0 ? 'blanca' : 'negra'}`;
            casilla.dataset.fila = fila;
            casilla.dataset.columna = columna;
            
            // Número de fila para mostrar dentro de la casilla (usado por CSS)
            casilla.dataset.filaNum = numeroFila;
            
            if (pieza) {
                const img = document.createElement('img');
                img.src = obtenerURLPieza(pieza);
                img.dataset.fila = fila;
                img.dataset.columna = columna;
                img.dataset.pieza = pieza.type;
                img.dataset.color = pieza.color;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                img.style.padding = '2px';
                img.style.cursor = 'grab';
                img.style.userSelect = 'none';
                img.style.pointerEvents = 'auto';
                img.style.touchAction = 'none';
                
                img.addEventListener('mousedown', iniciarArrastre);
                img.addEventListener('touchstart', iniciarArrastreTouch, { passive: false });
                img.addEventListener('dragstart', (e) => e.preventDefault());
                
                casilla.appendChild(img);
            }
            
            casilla.addEventListener('dragover', (e) => e.preventDefault());
            casilla.addEventListener('drop', manejarSoltar);
            casilla.addEventListener('click', manejarClick);
            casilla.addEventListener('touchend', manejarClickTouch);
            
            tableroDiv.appendChild(casilla);
        }
    }
    
    actualizarTurno();
}

function actualizarTurno() {
    const turno = chess.turn();
    if (turno === 'w') {
        turnoDisplay.innerHTML = '⚪ Blancas';
        turnoDisplay.style.background = '#f39c12';
    } else {
        turnoDisplay.innerHTML = '⚫ Negras';
        turnoDisplay.style.background = '#34495e';
    }
}

function formatearTiempo(segundos) {
    if (segundos < 0) segundos = 0;
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins}:${segs.toString().padStart(2, '0')}`;
}

function iniciarArrastre(e) {
    if (!puedeMover) {
        e.preventDefault();
        return;
    }
    
    const img = e.target;
    const fila = parseInt(img.dataset.fila);
    const columna = parseInt(img.dataset.columna);
    const color = img.dataset.color;
    
    if (color !== chess.turn()) {
        e.preventDefault();
        return;
    }
    
    e.preventDefault();
    arrastrando = true;
    piezaSeleccionada = { fila, columna };
    
    img.style.opacity = '0.3';
    
    clone = img.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.width = '60px';
    clone.style.height = '60px';
    clone.style.left = (e.clientX - 30) + 'px';
    clone.style.top = (e.clientY - 30) + 'px';
    clone.style.opacity = '0.9';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '9999';
    clone.style.filter = 'drop-shadow(0 0 5px gold)';
    clone.style.transform = 'scale(1.1)';
    
    document.body.appendChild(clone);
    
    function moverClone(e) {
        if (!arrastrando || !clone) return;
        clone.style.left = (e.clientX - 30) + 'px';
        clone.style.top = (e.clientY - 30) + 'px';
    }
    
    function terminarArrastre(e) {
        if (!arrastrando) return;
        
        arrastrando = false;
        img.style.opacity = '1';
        
        if (clone && clone.parentNode) {
            document.body.removeChild(clone);
            clone = null;
        }
        
        const elementos = document.elementsFromPoint(e.clientX, e.clientY);
        for (let el of elementos) {
            if (el.classList && el.classList.contains('casilla')) {
                const filaDestino = parseInt(el.dataset.fila);
                const columnaDestino = parseInt(el.dataset.columna);
                realizarMovimiento(fila, columna, filaDestino, columnaDestino);
                break;
            }
        }
        
        piezaSeleccionada = null;
        document.removeEventListener('mousemove', moverClone);
        document.removeEventListener('mouseup', terminarArrastre);
    }
    
    document.addEventListener('mousemove', moverClone);
    document.addEventListener('mouseup', terminarArrastre);
}

function iniciarArrastreTouch(e) {
    e.preventDefault();
    if (!puedeMover) return;
    
    const touch = e.touches[0];
    const img = e.target;
    const fila = parseInt(img.dataset.fila);
    const columna = parseInt(img.dataset.columna);
    const color = img.dataset.color;
    
    if (color !== chess.turn()) return;
    
    arrastrando = true;
    piezaSeleccionada = { fila, columna };
    img.style.opacity = '0.3';
    
    clone = img.cloneNode(true);
    clone.style.position = 'fixed';
    clone.style.width = '60px';
    clone.style.height = '60px';
    clone.style.left = (touch.clientX - 30) + 'px';
    clone.style.top = (touch.clientY - 30) + 'px';
    clone.style.opacity = '0.9';
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '9999';
    clone.style.filter = 'drop-shadow(0 0 5px gold)';
    
    document.body.appendChild(clone);
    
    function moverCloneTouch(e) {
        e.preventDefault();
        if (!arrastrando || !clone) return;
        const touch = e.touches[0];
        clone.style.left = (touch.clientX - 30) + 'px';
        clone.style.top = (touch.clientY - 30) + 'px';
    }
    
    function terminarArrastreTouch(e) {
        e.preventDefault();
        if (!arrastrando) return;
        
        arrastrando = false;
        img.style.opacity = '1';
        
        if (clone && clone.parentNode) {
            document.body.removeChild(clone);
            clone = null;
        }
        
        const touch = e.changedTouches[0];
        const elementos = document.elementsFromPoint(touch.clientX, touch.clientY);
        
        for (let el of elementos) {
            if (el.classList && el.classList.contains('casilla')) {
                const filaDestino = parseInt(el.dataset.fila);
                const columnaDestino = parseInt(el.dataset.columna);
                realizarMovimiento(fila, columna, filaDestino, columnaDestino);
                break;
            }
        }
        
        piezaSeleccionada = null;
        document.removeEventListener('touchmove', moverCloneTouch);
        document.removeEventListener('touchend', terminarArrastreTouch);
    }
    
    document.addEventListener('touchmove', moverCloneTouch, { passive: false });
    document.addEventListener('touchend', terminarArrastreTouch, { passive: false });
}

function manejarSoltar(e) {
    e.preventDefault();
}

function manejarClick(e) {
    if (arrastrando) return;
    
    const casilla = e.currentTarget;
    const fila = parseInt(casilla.dataset.fila);
    const columna = parseInt(casilla.dataset.columna);
    const pieza = chess.board()[fila][columna];
    
    if (!puedeMover) return;
    
    if (!piezaSeleccionada && pieza && pieza.color === chess.turn()) {
        piezaSeleccionada = { fila, columna };
        resaltarCasilla(fila, columna);
        return;
    }
    
    if (piezaSeleccionada) {
        realizarMovimiento(piezaSeleccionada.fila, piezaSeleccionada.columna, fila, columna);
        piezaSeleccionada = null;
        quitarResaltado();
    }
}

function manejarClickTouch(e) {
    e.preventDefault();
    manejarClick(e);
}

function realizarMovimiento(filaOrigen, columnaOrigen, filaDestino, columnaDestino) {
    const desdeNotacion = `${String.fromCharCode(97 + columnaOrigen)}${8 - filaOrigen}`;
    const hastaNotacion = `${String.fromCharCode(97 + columnaDestino)}${8 - filaDestino}`;
    
    const movimiento = {
        from: desdeNotacion,
        to: hastaNotacion,
        promotion: 'q'
    };
    
    const movimientoLegal = chess.move(movimiento);
    
    if (movimientoLegal) {
        const notacionCompleta = movimientoLegal.san;
        dibujarTablero();
        
        socket.send(JSON.stringify({
            tipo: 'movimiento',
            movimiento: notacionCompleta
        }));
        
        puedeMover = false;
        actualizarTurno();
    }
}

function resaltarCasilla(fila, columna) {
    quitarResaltado();
    const casillas = document.querySelectorAll('.casilla');
    const indice = fila * 8 + columna;
    if (casillas[indice]) {
        casillas[indice].style.outline = '3px solid #f1c40f';
        casillas[indice].style.zIndex = '10';
    }
}

function quitarResaltado() {
    document.querySelectorAll('.casilla').forEach(c => {
        c.style.outline = '';
        c.style.zIndex = '';
    });
}

function agregarMensaje(texto, tipo) {
    const div = document.createElement('div');
    div.className = `mensaje ${tipo}`;
    div.textContent = texto;
    mensajesDiv.appendChild(div);
    mensajesDiv.scrollTop = mensajesDiv.scrollHeight;
}

btnConectar.onclick = () => {
    // Detectar entorno: local vs producción
    const wsUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'ws://localhost:8080'
        : `wss://${window.location.hostname}`;
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
        estadoSpan.textContent = 'Conectado';
        estadoSpan.className = 'conectado';
        btnConectar.disabled = true;
        btnDesconectar.disabled = false;
        registroDiv.style.display = 'block';
        agregarMensaje('✅ Conectado al servidor', 'sistema');
    };
    
    socket.onmessage = (event) => {
        const datos = JSON.parse(event.data);
        console.log('📩 Recibido:', datos.tipo);
        
        switch(datos.tipo) {
            case 'bienvenida':
                miId = datos.id;
                miIdSpan.textContent = miId;
                if (datos.config) {
                    mostrarCoordenadas = datos.config.mostrarCoordenadas;
                    tema = datos.config.tema;
                    
                    // Las coordenadas siempre se muestran en este diseño
                    if (coordenadasSuperiores) {
                        coordenadasSuperiores.style.display = 'flex';
                    }
                    if (coordenadasInferiores) {
                        coordenadasInferiores.style.display = 'flex';
                    }
                }
                break;
                
            case 'registro_ok':
                miNombre = nombreInput.value;
                miNombreSpan.textContent = miNombre;
                miNombreDisplay.textContent = miNombre;
                registroDiv.style.display = 'none';
                juegoPanelDiv.style.display = 'block';
                dueloPanelDiv.style.display = 'block';
                
                if (datos.config) {
                    tiempoRestanteProblema = datos.config.tiempoPorProblema;
                    tiempoRestanteTotal = datos.config.tiempoTotalSesion;
                    fallosMaximos = datos.config.fallosMaximos;
                    totalJugadores = datos.config.totalJugadores;
                    
                    if (tiempoProblemaSpan) {
                        tiempoProblemaSpan.textContent = tiempoRestanteProblema > 0 ? formatearTiempo(tiempoRestanteProblema) : '∞';
                    }
                    if (tiempoTotalSpan) {
                        tiempoTotalSpan.textContent = tiempoRestanteTotal > 0 ? formatearTiempo(tiempoRestanteTotal) : '∞';
                    }
                }
                
                agregarMensaje(`👋 Bienvenido ${miNombre}`, 'sistema');
                btnRegistrar.disabled = false;
                break;
                
            case 'buscando':
                esperaDiv.style.display = 'block';
                btnBuscarDuelo.disabled = true;
                btnCancelarBusqueda.style.display = 'inline-block';
                if (contadorEsperaSpan) {
                    contadorEsperaSpan.textContent = `${datos.actuales}/${datos.necesarios}`;
                }
                agregarMensaje(datos.mensaje, 'sistema');
                break;
                
            case 'actualizar_espera':
                if (contadorEsperaSpan) {
                    contadorEsperaSpan.textContent = `${datos.actuales}/${datos.necesarios}`;
                }
                break;
                
            case 'busqueda_cancelada':
                esperaDiv.style.display = 'none';
                btnBuscarDuelo.disabled = false;
                btnCancelarBusqueda.style.display = 'none';
                break;
                
            case 'duelo_creado':
                enDuelo = true;
                idDuelo = datos.idDuelo;
                rivales = datos.rivales;
                totalProblemas = datos.totalProblemas;
                totalJugadores = datos.totalJugadores;
                
                if (nombreRivalesSpan) {
                    nombreRivalesSpan.textContent = rivales.join(', ');
                }
                
                esperaDiv.style.display = 'none';
                preparacionDiv.style.display = 'block';
                btnCancelarBusqueda.style.display = 'none';
                
                agregarMensaje(`⚔️ Duelo contra: ${rivales.join(', ')}`, 'sistema');
                agregarMensaje('Prepara tus piezas...', 'sistema');
                
                // Cuenta atrás para inicio automático
                let tiempoRestante = datos.tiempoPreparacion || 5;
                if (tiempoPreparacionSpan) {
                    tiempoPreparacionSpan.textContent = tiempoRestante;
                }
                
                const intervalo = setInterval(() => {
                    tiempoRestante--;
                    if (tiempoPreparacionSpan) {
                        tiempoPreparacionSpan.textContent = tiempoRestante;
                    }
                    if (tiempoRestante <= 0) {
                        clearInterval(intervalo);
                    }
                }, 1000);
                break;
                
            case 'duelo_iniciado':
                preparacionDiv.style.display = 'none';
                dueloActivoDiv.style.display = 'block';
                btnAbandonar.style.display = 'inline-block';
                agregarMensaje('🏁 ¡El duelo ha comenzado!', 'sistema');
                break;
                
            case 'problema_duelo':
                chess.load(datos.fen);
                colorJugador = datos.colorJugador;
                dibujarTablero();
                problemaDescSpan.textContent = `P${datos.numProblema}/${datos.totalProblemas}: ${datos.descripcion}`;
                puedeMover = true;
                
                if (datos.tiempoPorProblema > 0) {
                    tiempoRestanteProblema = datos.tiempoPorProblema;
                    if (intervaloRelojProblema) clearInterval(intervaloRelojProblema);
                    
                    intervaloRelojProblema = setInterval(() => {
                        tiempoRestanteProblema--;
                        if (tiempoProblemaSpan) {
                            tiempoProblemaSpan.textContent = formatearTiempo(tiempoRestanteProblema);
                        }
                        if (tiempoRestanteProblema <= 0) {
                            clearInterval(intervaloRelojProblema);
                        }
                    }, 1000);
                }
                
                agregarMensaje(`🎯 Problema ${datos.numProblema}`, 'sistema');
                break;
                
            case 'movimiento_programa':
                chess.move(datos.movimiento);
                dibujarTablero();
                puedeMover = true;
                actualizarTurno();
                break;
                
            case 'movimiento_correcto':
                agregarMensaje(`✅ ${datos.mensaje}`, 'sistema');
                break;
                
            case 'problema_completado':
                agregarMensaje(datos.mensaje, 'sistema');
                if (intervaloRelojProblema) {
                    clearInterval(intervaloRelojProblema);
                    intervaloRelojProblema = null;
                }
                break;
                
            case 'todos_completados':
                agregarMensaje(datos.mensaje, 'sistema');
                break;
                
            case 'movimiento_incorrecto':
                misFallos = datos.fallosActuales;
                fallosPropiosSpan.textContent = misFallos;
                agregarMensaje(`❌ Incorrecto. Era ${datos.correcto}`, 'sistema');
                agregarMensaje(`⚠️ Fallos: ${misFallos}/${fallosMaximos}`, 'sistema');
                chess.undo();
                dibujarTablero();
                puedeMover = true;
                piezaSeleccionada = null;
                quitarResaltado();
                actualizarTurno();
                break;
                
            case 'tiempo_agotado':
                misFallos = datos.fallosActuales;
                fallosPropiosSpan.textContent = misFallos;
                agregarMensaje(datos.mensaje, 'sistema');
                agregarMensaje(`⚠️ Fallos: ${misFallos}/${fallosMaximos}`, 'sistema');
                
                if (intervaloRelojProblema) {
                    clearInterval(intervaloRelojProblema);
                    intervaloRelojProblema = null;
                }
                break;
                
            case 'eliminado':
                agregarMensaje(datos.mensaje, 'sistema');
                puedeMover = false;
                break;
                
            case 'tiempo_total':
                tiempoRestanteTotal = datos.tiempo;
                if (tiempoTotalSpan) {
                    tiempoTotalSpan.textContent = formatearTiempo(tiempoRestanteTotal);
                }
                if (tiempoRestanteTotal <= 10 && tiempoTotalSpan) {
                    tiempoTotalSpan.style.color = 'red';
                }
                break;
                
            case 'marcador_duelo':
                misPuntos = datos.propio.puntuacion;
                misAciertos = datos.propio.aciertos;
                misFallos = datos.propio.fallos;
                misResultados = datos.propio.resultados || [];
                
                puntuacionPropiaSpan.textContent = misPuntos;
                aciertosPropiosSpan.textContent = misAciertos;
                fallosPropiosSpan.textContent = misFallos;
                
                // Mostrar marcadores de otros jugadores
                if (contenedorMarcadores && datos.todos) {
                    contenedorMarcadores.innerHTML = '';
                    
                    datos.todos.forEach((jugador, index) => {
                        const card = document.createElement('div');
                        card.className = 'marcador-jugador';
                        card.innerHTML = `
                            <span class="jugador-nombre">${jugador.nombre}</span>
                            <span class="jugador-puntos">${jugador.puntuacion} pts</span>
                        `;
                        contenedorMarcadores.appendChild(card);
                    });
                }
                break;
                
            case 'duelo_finalizado':
                mostrarTablaResultados(datos.tabla);
                dueloActivoDiv.style.display = 'none';
                preparacionDiv.style.display = 'none';
                esperaDiv.style.display = 'none';
                enDuelo = false;
                btnBuscarDuelo.disabled = false;
                btnAbandonar.style.display = 'none';
                
                if (intervaloRelojProblema) clearInterval(intervaloRelojProblema);
                if (intervaloRelojTotal) clearInterval(intervaloRelojTotal);
                break;
                
            case 'error':
                alert('❌ Error: ' + datos.mensaje);
                break;
        }
    };
    
    socket.onclose = () => {
        estadoSpan.textContent = 'Desconectado';
        estadoSpan.className = 'desconectado';
        btnConectar.disabled = false;
        btnDesconectar.disabled = true;
        registroDiv.style.display = 'none';
        juegoPanelDiv.style.display = 'none';
        esperaDiv.style.display = 'none';
        preparacionDiv.style.display = 'none';
        dueloActivoDiv.style.display = 'none';
        btnCancelarBusqueda.style.display = 'none';
        btnAbandonar.style.display = 'none';
        agregarMensaje('🔌 Desconectado', 'sistema');
        
        if (intervaloRelojProblema) clearInterval(intervaloRelojProblema);
        if (intervaloRelojTotal) clearInterval(intervaloRelojTotal);
    };
};

btnDesconectar.onclick = () => {
    if (socket) socket.close();
};

btnRegistrar.onclick = () => {
    const nombre = nombreInput.value.trim();
    if (!nombre) {
        alert('Ingresa un nombre');
        return;
    }
    socket.send(JSON.stringify({ tipo: 'registro', nombre: nombre }));
    btnRegistrar.disabled = true;
};

btnBuscarDuelo.onclick = () => {
    socket.send(JSON.stringify({ tipo: 'buscar_duelo' }));
};

btnCancelarBusqueda.onclick = () => {
    socket.send(JSON.stringify({ tipo: 'cancelar_busqueda' }));
};

btnListo.onclick = () => {
    socket.send(JSON.stringify({ tipo: 'listo_para_duelo' }));
    btnListo.disabled = true;
    agregarMensaje('✅ Estás listo. Esperando al resto...', 'sistema');
};

btnAbandonar.onclick = () => {
    if (confirm('¿Abandonar el duelo?')) {
        socket.send(JSON.stringify({ tipo: 'abandonar' }));
    }
};

function mostrarTablaResultados(tabla) {
    if (!tabla.jugadores || tabla.jugadores.length === 0) return;
    
    const ganador = tabla.empate ? '🤝 ¡EMPATE!' : `🏆 GANADOR: ${tabla.ganador}`;
    
    let html = `
        <div style="text-align: center;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">📊 RESULTADOS DEL DUELO</h3>
            <p style="font-size: 1.2em; margin: 10px 0; color: #e67e22; font-weight: bold;">
                ${ganador}
            </p>
            <hr>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 0.85em; min-width: 500px;">
                    <thead>
                        <tr style="background: #3498db; color: white;">
                            <th style="padding: 8px; border: 1px solid #ddd;">Jugador</th>
    `;
    
    for (let i = 1; i <= tabla.problemas.length; i++) {
        html += `<th style="padding: 8px; border: 1px solid #ddd;">P${i}</th>`;
    }
    
    html += `<th style="padding: 8px; border: 1px solid #ddd;">Total</th></tr></thead><tbody>`;
    
    tabla.jugadores.forEach(j => {
        const esGanador = j.nombre === tabla.ganador && !tabla.empate;
        html += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: ${esGanador ? '#ffd700' : '#f8f9fa'};">
                    ${j.nombre} ${esGanador ? '👑' : ''}
                </td>
        `;
        
        for (let i = 0; i < j.resultados.length; i++) {
            const r = j.resultados[i];
            let bgColor = '#f8f9fa';
            if (r === 1) bgColor = '#d4edda';
            else if (r === 0) bgColor = '#f8d7da';
            
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center; background: ${bgColor};">${r === 1 ? '✓' : r === 0 ? '✗' : '-'}</td>`;
        }
        
        // Rellenar problemas no jugados
        for (let i = j.resultados.length; i < tabla.problemas.length; i++) {
            html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center; background: #f8f9fa;">-</td>`;
        }
        
        html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; background: #e8f4f8;">${j.puntuacion}</td></tr>`;
    });
    
    html += `
            </tbody>
        </table>
        </div>
        <hr>
        <button onclick="this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode)" 
                style="padding: 10px 25px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 15px; font-size: 14px;">
            Cerrar
        </button>
    </div>`;
    
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '10000';
    modal.style.overflow = 'auto';
    modal.style.padding = '15px';
    
    const contenido = document.createElement('div');
    contenido.style.backgroundColor = 'white';
    contenido.style.padding = '25px';
    contenido.style.borderRadius = '15px';
    contenido.style.maxWidth = '800px';
    contenido.style.width = '100%';
    contenido.style.maxHeight = '90vh';
    contenido.style.overflow = 'auto';
    contenido.innerHTML = html;
    
    modal.appendChild(contenido);
    document.body.appendChild(modal);
}

// Inicializar tablero
dibujarTablero();