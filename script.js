$(document).ready(function () {

  /* ========================================
     VARIABLES DE ESTADO
  ======================================== */
  let listaVisible = true;
  let contadorTareas = 0; // ID único por tarea

  /* -----------------------------------------------------------------------
     IMÁGENES: estática (tarea pendiente) y GIFs/VIDEOS animados
     Rutas locales: coloca tus archivos en la carpeta 'iconos/'
  -----------------------------------------------------------------------*/
  const IMG_JPG = 'iconos/icono1 .png'; // imagen estática (tarea pendiente)
  const IMG_GIF_EXITO = 'iconos/icono 1.gif';  // GIF animado (tarea completada EN TIEMPO)
  const VIDEO_TARDIO = 'iconos/icono-tardio.mp4';  // VIDEO (tarea completada FUERA DE TIEMPO)

  function escapeHtml(text) {
    return $('<div>').text(text).html();
  }

  function esVideo(ruta) {
    return /\.(mp4|webm)$/i.test(ruta);
  }

  function esArchivoVideo(archivo) {
    if (!archivo) return false;
    return archivo.type.startsWith('video/') || esVideo(archivo.name);
  }

  function crearMediaHTML(mediaUrl, mediaType) {
    if (!mediaUrl) {
      return `<img class="tarea-img" src="${IMG_JPG}" alt="estado" />`;
    }

    if (mediaType === 'video' || esVideo(mediaUrl)) {
      return `<video class="tarea-video" muted loop playsinline preload="metadata" src="${escapeHtml(mediaUrl)}"></video>`;
    }

    return `<img class="tarea-img" src="${escapeHtml(mediaUrl)}" alt="estado" />`;
  }

  /* ========================================
     FUNCIÓN: ACTUALIZAR ESTADÍSTICAS
  ======================================== */
  function actualizarStats() {
    const total       = $('#listaTareas li').length;
    const completadas = $('#listaTareas li.completada').length;
    const pendientes  = total - completadas;
    const porcentaje  = total > 0 ? Math.round((completadas / total) * 100) : 0;

    $('#totalTareas').text(total);
    $('#tareasCompletadas').text(completadas);
    $('#tareasPendientes').text(pendientes);
    $('#progressFill').css('width', porcentaje + '%');
    $('#progressLabel').text(porcentaje + '%');

    if (total === 0) {
      $('#emptyState').addClass('visible');
    } else {
      $('#emptyState').removeClass('visible');
    }
  }

  /* ========================================
     FUNCIÓN: MOSTRAR TOAST
  ======================================== */
  function mostrarToast(mensaje, tipo = 'info') {
    const icono = tipo === 'error' ? 'fa-circle-exclamation'
                : tipo === 'ok'   ? 'fa-circle-check'
                                  : 'fa-circle-info';

    const $toast = $(`
      <div class="toast ${tipo === 'error' ? 'error' : ''}">
        <i class="fa-solid ${icono}"></i>
        <span>${mensaje}</span>
      </div>
    `);

    $('body').append($toast);
    setTimeout(() => {
      $toast.fadeOut(0, function () { $(this).remove(); });
    }, 2800);
  }

  /* ========================================
     FUNCIÓN: FORMATEAR TIEMPO (segundos → mm:ss)
  ======================================== */
  function formatearTiempo(segundos) {
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /* ========================================
     FUNCIÓN: INICIAR CRONÓMETRO de una tarea
  ======================================== */
  function iniciarCronometro($li) {
    const id = $li.data('id');
    // Si ya tiene intervalo corriendo, no arrancar otro
    if ($li.data('intervalo')) return;

    const $display = $li.find('.crono-display');
    let segundos = parseInt($li.data('segundos')) || 0;

    const intervalo = setInterval(function () {
      if ($li.hasClass('completada')) {
        // Tarea completada → detener
        clearInterval(intervalo);
        $li.removeData('intervalo');
        $li.find('.crono-btn').html('<i class="fa-solid fa-flag-checkered"></i>').prop('disabled', true);
        return;
      }
      segundos++;
      $li.data('segundos', segundos);
      $display.text(formatearTiempo(segundos));
    }, 1000);

    $li.data('intervalo', intervalo);
    $li.find('.crono-btn')
      .html('<i class="fa-solid fa-stop"></i>')
      .addClass('corriendo');
  }

  /* ========================================
     FUNCIÓN: PAUSAR CRONÓMETRO de una tarea
  ======================================== */
  function pausarCronometro($li) {
    const intervalo = $li.data('intervalo');
    if (intervalo) {
      clearInterval(intervalo);
      $li.removeData('intervalo');
    }
    $li.find('.crono-btn')
      .html('<i class="fa-solid fa-play"></i>')
      .removeClass('corriendo');
  }

  /* ========================================
     FUNCIÓN: CREAR ÍTEM DE TAREA
  ======================================== */
  function crearTareaHTML(texto, tiempoLimite, mediaMiniUrl, mediaMiniType, mediaOnTimeUrl, mediaOnTimeType, mediaLateUrl, mediaLateType) {
    contadorTareas++;
    const mediaHtml = crearMediaHTML(mediaMiniUrl, mediaMiniType);

    return $(`
      <li class="tarea-item" data-id="${contadorTareas}" data-segundos="0" data-tiempo-limite="${tiempoLimite}" data-mini-media="${escapeHtml(mediaMiniUrl || '')}" data-mini-media-type="${escapeHtml(mediaMiniType || '')}" data-on-time-media="${escapeHtml(mediaOnTimeUrl || '')}" data-on-time-media-type="${escapeHtml(mediaOnTimeType || '')}" data-late-media="${escapeHtml(mediaLateUrl || '')}" data-late-media-type="${escapeHtml(mediaLateType || '')}">

        <!-- Imagen / GIF / Video personalizado -->
        <div class="tarea-img-wrap">
          ${mediaHtml}
        </div>

        <div class="tarea-check"></div>

        <div class="tarea-body">
          <span class="tarea-texto">${$('<div>').text(texto).html()}</span>
          <!-- CRONÓMETRO -->
          <div class="cronometro">
            <i class="fa-solid fa-stopwatch crono-icon"></i>
            <span class="crono-display">00:00</span>
            <button class="crono-btn" title="Iniciar / Pausar cronómetro">
              <i class="fa-solid fa-play"></i>
            </button>
          </div>
          <!-- TIEMPO LÍMITE -->
          <div class="tiempo-limite">
            <i class="fa-solid fa-hourglass-end"></i>
            <span class="limite-display">${formatearTiempo(tiempoLimite)}</span>
          </div>
        </div>

        <button class="btn-eliminar" title="Eliminar tarea">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </li>
    `);
  }

  /* ========================================
     FUNCIÓN: MOSTRAR CELEBRACIÓN (JPG → GIF o VIDEO)
  ======================================== */
  function mostrarCelebracion(textoTarea, tiempoFinal, contenido, esVideoMedia, mensaje) {
    // Resetear ambos elementos
    $('#celebracionImg').hide();
    $('#celebracionVideo').hide();
    // stop any previous media
    $('#celebracionVideo')[0]?.pause();
    $('#celebracionAudio')[0]?.pause();
    $('#celebracionAudio').attr('src', '');

    if (esVideoMedia) {
      $('#celebracionVideo').attr('src', contenido).show()[0].load();
      // play video (may contain its own audio)
      $('#celebracionVideo')[0].play().catch(()=>{});
    } else {
      $('#celebracionImg').attr('src', contenido).show();
      // play overlay audio (default sound) if available
      const defaultAudio = 'iconos/celebracion.mp3';
      // only play separate audio for image/gif overlays
      const audioEl = $('#celebracionAudio')[0];
      if (audioEl) {
        audioEl.src = defaultAudio;
        audioEl.currentTime = 0;
        audioEl.play().catch(()=>{});
      }
    }
    
    $('#celebracionMsg').html(mensaje);
    $('#celebracionOverlay').fadeIn(300);

    // Ocultar automáticamente luego de 3s y detener audio/video
    if (window.__celebracionTimeout) clearTimeout(window.__celebracionTimeout);
    window.__celebracionTimeout = setTimeout(function () {
      // pause audio and video
      $('#celebracionVideo')[0]?.pause();
      const audio = $('#celebracionAudio')[0];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
      }
      $('#celebracionOverlay').fadeOut(400);
    }, 3000);
  }

  /* ========================================
     AGREGAR TAREA — click en botón
  ======================================== */
  $('#btnAgregar').click(function () {
    const texto = $('#nuevaTarea').val().trim();
    const tiempoLimite = parseInt($('#tiempoLimite').val()) || 300;
    const miniArchivo = $('#mediaMiniFile')[0].files[0];
    const onTimeArchivo = $('#mediaOnTimeFile')[0].files[0];
    const lateArchivo = $('#mediaLateFile')[0].files[0];

    let mediaMiniUrl = '';
    let mediaMiniType = '';
    let mediaOnTimeUrl = '';
    let mediaOnTimeType = '';
    let mediaLateUrl = '';
    let mediaLateType = '';

    if (miniArchivo) {
      mediaMiniUrl = URL.createObjectURL(miniArchivo);
      mediaMiniType = esArchivoVideo(miniArchivo) ? 'video' : 'image';
    }
    if (onTimeArchivo) {
      mediaOnTimeUrl = URL.createObjectURL(onTimeArchivo);
      mediaOnTimeType = esArchivoVideo(onTimeArchivo) ? 'video' : 'image';
    }
    if (lateArchivo) {
      mediaLateUrl = URL.createObjectURL(lateArchivo);
      mediaLateType = esArchivoVideo(lateArchivo) ? 'video' : 'image';
    }

    if (texto === '') {
      mostrarToast('¡Escribí una tarea antes de agregar!', 'error');
      $('#nuevaTarea').focus();
      $('#nuevaTarea').addClass('shake');
      setTimeout(() => $('#nuevaTarea').removeClass('shake'), 400);
      return;
    }

    const $nuevaLi = crearTareaHTML(texto, tiempoLimite, mediaMiniUrl, mediaMiniType, mediaOnTimeUrl, mediaOnTimeType, mediaLateUrl, mediaLateType);

    if (!listaVisible) {
      $('#listaWrapper').fadeIn(300);
      listaVisible = true;
      $('#btnToggle').html('<i class="fa-solid fa-eye-slash"></i> Ocultar lista');
    }

    $nuevaLi.hide();
    $('#listaTareas').append($nuevaLi);
    $nuevaLi.fadeIn(350);

    $('#nuevaTarea').val('').focus();
    $('#mediaMiniFile').val('');
    $('#mediaOnTimeFile').val('');
    $('#mediaLateFile').val('');
    $('#personalizacionPanel').removeClass('visible');
    actualizarStats();
    mostrarToast('Tarea agregada correctamente.', 'ok');
  });

  $('#btnPersonalizar').click(function () {
    $('#personalizacionPanel').toggleClass('visible');
  });

  $('#btnCerrarPersonalizacion').click(function () {
    $('#personalizacionPanel').removeClass('visible');
  });

  /*AGREGAR TAREA — tecla Enter*/
  $('#nuevaTarea').keypress(function (e) {
    if (e.which === 13) $('#btnAgregar').click();
  });

  /* COMPLETAR TAREA — click en el ítem*/
  $('#listaTareas').on('click', 'li.tarea-item', function (e) {
    if ($(e.target).closest('.btn-eliminar').length) return;
    if ($(e.target).closest('.crono-btn').length) return;

    const $li      = $(this);
    const yaEstaba = $li.hasClass('completada');

    $li.toggleClass('completada');

    if (!yaEstaba) {
      // --- Se acaba de COMPLETAR ---
      pausarCronometro($li); // detener cronómetro

      const segundos      = parseInt($li.data('segundos')) || 0;
      const tiempoLimite  = parseInt($li.data('tiempo-limite')) || 300;
      const tiempoFinal   = formatearTiempo(segundos);
      const textoTarea    = $li.find('.tarea-texto').text();
      
      // Determinar si se completó en tiempo o tardío
      const enTiempo = segundos <= tiempoLimite;
      const mediaMiniUrl = $li.data('miniMedia') || '';
      const mediaOnTimeUrl = $li.data('onTimeMedia') || '';
      const mediaLateUrl = $li.data('lateMedia') || '';
      const mediaOnTimeType = $li.data('onTimeMediaType') || '';
      const mediaLateType = $li.data('lateMediaType') || '';
      const tieneMediaPersonalizada = Boolean(mediaMiniUrl);
      const contenido = enTiempo ? (mediaOnTimeUrl || IMG_GIF_EXITO) : (mediaLateUrl || VIDEO_TARDIO);
      const mensajeOverlay = enTiempo 
        ? `✅ <strong>"${textoTarea}"</strong><br>completada en <strong>${tiempoFinal}</strong> (¡A tiempo!)`
        : `⏱️ <strong>"${textoTarea}"</strong><br>completada en <strong>${tiempoFinal}</strong> (Pasaste ${formatearTiempo(segundos - tiempoLimite)})`;
      const esVideoMedia = (enTiempo ? mediaOnTimeType === 'video' : mediaLateType === 'video') || esVideo(contenido);

      if (!mediaMiniUrl) {
        const $media = $li.find('.tarea-img, .tarea-video');
        if ($media.is('img')) {
          $media.attr('src', contenido).addClass('img-gif');
        } else if ($media.is('video')) {
          $media.attr('src', contenido)[0]?.load();
        }
      }

      // Bloquear botón de cronómetro
      $li.find('.crono-btn')
        .html('<i class="fa-solid fa-flag-checkered"></i>')
        .prop('disabled', true)
        .removeClass('corriendo');

      mostrarCelebracion(textoTarea, tiempoFinal, contenido, esVideoMedia, mensajeOverlay);

      const toastMsg = enTiempo 
        ? `¡Completada en ${tiempoFinal}! 🎉` 
        : `¡Completada en ${tiempoFinal}! ⏱️ (+${formatearTiempo(segundos - tiempoLimite)})`;
      mostrarToast(toastMsg, 'ok');

      if (!mediaMiniUrl) {
        setTimeout(function () {
          $li.find('.tarea-img')
            .attr('src', IMG_JPG)
            .removeClass('img-gif');
        }, 3000);
      }

    } else {
      // --- Se DESCOMPLETÓ ---
      // Volver a imagen estática solo si no había mini tarjeta personalizada
      const mediaMiniUrl = $li.data('miniMedia') || '';
      if (!mediaMiniUrl) {
        $li.find('.tarea-img')
          .attr('src', IMG_JPG)
          .removeClass('img-gif');
      }

      // Habilitar cronómetro de nuevo
      $li.find('.crono-btn')
        .html('<i class="fa-solid fa-play"></i>')
        .prop('disabled', false);
    }

    actualizarStats();
  });

  /* CRONÓMETRO — botón play/stop por tarea*/
  $('#listaTareas').on('click', '.crono-btn', function (e) {
    e.stopPropagation();
    const $li = $(this).closest('li');

    if ($li.data('intervalo')) {
      pausarCronometro($li);
    } else {
      iniciarCronometro($li);
    }
  });

  /* CERRAR OVERLAY al hacer clic */
  $('#celebracionOverlay').click(function () {
    if (window.__celebracionTimeout) {
      clearTimeout(window.__celebracionTimeout);
      window.__celebracionTimeout = null;
    }
    // pause video and audio
    $('#celebracionVideo')[0]?.pause();
    const audio = $('#celebracionAudio')[0];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
    }
    $(this).fadeOut(300);
  });

  /* ELIMINAR TAREA*/
  $('#listaTareas').on('click', '.btn-eliminar', function (e) {
    e.stopPropagation();
    const $li = $(this).closest('li');
    pausarCronometro($li); // limpiar intervalo antes de remover

    const urls = [
      $li.data('miniMedia'),
      $li.data('onTimeMedia'),
      $li.data('lateMedia')
    ];
    urls.forEach(function (mediaUrl) {
      if (mediaUrl && mediaUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaUrl);
      }
    });

    $li.fadeOut(300, function () {
      $(this).remove();
      actualizarStats();
    });
    mostrarToast('Tarea eliminada.');
  });

  /* MOSTRAR / OCULTAR LISTA*/
  $('#btnToggle').click(function () {
    if (listaVisible) {
      $('#listaWrapper').fadeOut(400);
      $(this).html('<i class="fa-solid fa-eye"></i> Mostrar lista');
      listaVisible = false;
    } else {
      $('#listaWrapper').fadeIn(400);
      $(this).html('<i class="fa-solid fa-eye-slash"></i> Ocultar lista');
      listaVisible = true;
    }
  });

  /* CAMBIAR TEMA*/
  function aplicarTema(tema) {
    if (tema === 'claro') {
      $('body').addClass('light');
      $('#btnTema').html('<i class="fa-solid fa-sun"></i>');
      $('#btnTema').attr('title', 'Cambiar a modo oscuro');
      localStorage.setItem('tema', 'claro');
    } else {
      $('body').removeClass('light');
      $('#btnTema').html('<i class="fa-solid fa-moon"></i>');
      $('#btnTema').attr('title', 'Cambiar a modo claro');
      localStorage.setItem('tema', 'oscuro');
    }
  }

  const temaGuardado = localStorage.getItem('tema');
  aplicarTema(temaGuardado === 'claro' ? 'claro' : 'oscuro');

  $('#btnTema').click(function () {
    const temaActual = $('body').hasClass('light') ? 'claro' : 'oscuro';
    aplicarTema(temaActual === 'claro' ? 'oscuro' : 'claro');
  });

  /* INICIALIZACIÓN*/
  actualizarStats();

});
