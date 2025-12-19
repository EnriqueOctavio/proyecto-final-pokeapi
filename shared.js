const buttonContainer = document.querySelector('.buttons-tag-container');
const buttonTag = document.querySelectorAll('.button-tag');
const panels = document.querySelectorAll('[data-view-panel]');
const input = document.getElementById('valor-busqueda');
const form = document.getElementById('form-busqueda');
const tituloPrincipal = document.getElementById('titulo-principal');
const tipoBusqueda = document.getElementById('tipo-busqueda');
const pokemonCard = document.getElementById('pokemon-card');
const habilidadCard = document.getElementById('habilidad-card');
const autocompletar = document.getElementById('autocompletar');
let listaPokemonNombres = [];


// Template de la card de pokemon para restaurarla despues de cargar
const pokemon_card_template = `
  <div class="card-tag-container">
    <span class="card-tag-tipo">POKEMON_DATA</span>
    <span id="origenDatos" class="card-tag-origen origen-api">🌐 API</span>
  </div>

  <div class="card-imagen-container">
    <img id="pokemonImagen" class="pokemon-imagen" src="" alt="Pokemon">
  </div>

  <div class="pokemon-info-principal">
    <span id="iDPokemon" class="pokemon-nombre"></span>
    <h2 id="nombrePokemon" class="pokemon-nombre"></h2>
  </div>

  <div class="card-tipos"></div>

  <div class="habilidades-container">
    <h3>HABILIDADES</h3>
    <div class="card-habilidades"></div>
  </div>

  <div class="stats-container card-stats"></div>

  <div class="favorito-container">
    <button id="btn-favorito" onclick="toggle_fav()" class="botones boton-favorito">❤️</button>
  </div>

  <div class="evoluciones-seccion">
    <h3 class="evoluciones-titulo">CADENA DE EVOLUCIÓN</h3>
    <div class="evoluciones-container"></div>
  </div>
`;


// Ocultar las cards inicialmente
pokemonCard.style.display = 'none';
habilidadCard.style.display = 'none';

const titulos = {
  buscar: 'Pokémon Finder',
  historico: '📜 Histórico',
  vs: '⚔️ VS',
  favoritos: '❤️ Favoritos'
};

panels.forEach(panel => {
  panel.hidden = panel.dataset.viewPanel !== 'buscar';
});


buttonContainer.addEventListener('click', (event) => {
  const button = event.target.closest('.button-tag');
  if (!button) return;

  const vistaButton = button.dataset.view;

  buttonTag.forEach(btn => btn.classList.remove('button-tag--active'));
  button.classList.add('button-tag--active');

  panels.forEach(panel => {
    panel.hidden = panel.dataset.viewPanel !== vistaButton;
  });

  

  tituloPrincipal.textContent = titulos[vistaButton];
});


// Html dentro de otro html como si fuesen componentes

// para la terminal
// cd C:\Users\engonzalez\Desktop\pokeapi  
// npx serve 
// Nota: No basta con solo abrir el index.html


async function load_component(idContenedor, urlArchivo) {
  const contenedor = document.getElementById(idContenedor);
  const respuestaHtml = await fetch(urlArchivo);
  const html = await respuestaHtml.text();
  contenedor.innerHTML = html;
  
  // Ejecutar los scripts que vienen en el componente
  const scripts = contenedor.querySelectorAll('script');
  scripts.forEach(script => {
    const nuevoScript = document.createElement('script');
    nuevoScript.textContent = script.textContent;
    script.remove();
    document.body.appendChild(nuevoScript);
  });
}

load_component('historico-section', 'historico.html');
load_component('vs-section', 'pokevs.html');
load_component('favoritos-section', 'favoritos.html');



//Llamando el pokemon de la api y guardando en la cache (Kike no toques ya esto)

async function traerPoke(nombre) {
  const key = `pokemon_${nombre}`;
  const cache = getCache(key);

  if (cache) {
    return { data: cache, origen: 'cache' };
  }

  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${nombre}`);
  if (!res.ok) throw new Error('Pokémon no encontrado');

  const data = await res.json();
  save_cache(key, data);

  return { data, origen: 'api' };
}

let audioGrito = null;

function reproducirGritoPokemon(pokemon) {
  if (!pokemon.cries || !pokemon.cries.latest) return;

  // Detener audio anterior si existe
  if (audioGrito) {
    audioGrito.pause();
    audioGrito.currentTime = 0;
  }

  audioGrito = new Audio(pokemon.cries.latest);
  audioGrito.volume = 0.5; // opcional
  audioGrito.play().catch(() => {
    // Evita errores si el navegador bloquea autoplay
  });
}

async function cargarListaPokemon() {
  if (listaPokemonNombres.length > 0) return;

  const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
  const data = await res.json();

  listaPokemonNombres = data.results.map(p => p.name);
}

function mostrarAutocompletado(valor) {
  autocompletar.innerHTML = '';

  if (!valor || tipoBusqueda.value !== 'pokemon') return;

  const texto = valor.toLowerCase();

  const coincidencias = listaPokemonNombres
    .filter(nombre => nombre.startsWith(texto))
    .slice(0, 8); // límite de sugerencias

  coincidencias.forEach(nombre => {
    const item = document.createElement('div');
    item.className = 'autocompletar-item';
    item.textContent = nombre.toUpperCase();

    item.addEventListener('click', () => {
      input.value = nombre;
      autocompletar.innerHTML = '';
      buscarPokemon();
    });

    autocompletar.appendChild(item);
  });
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('#valor-busqueda')) {
    autocompletar.innerHTML = '';
  }
});

input.addEventListener('input', async () => {
  if (tipoBusqueda.value !== 'pokemon') {
    autocompletar.innerHTML = '';
    return;
  }

  await cargarListaPokemon();
  mostrarAutocompletado(input.value);
});


// Obtiene la evolucion del pokemon de la api
//Acá estamos llamando la evolucion del pokemon de la api y guardando en la cache
async function getEvo(speciesUrl) { 
  const key = `evo_${speciesUrl}`;
  const cache = getCache(key);

  if (cache) {
    return { data: cache, origen: 'cache' };
  }

  const speciesRes = await fetch(speciesUrl);
  const speciesData = await speciesRes.json();

  const evoRes = await fetch(speciesData.evolution_chain.url);
  const evoData = await evoRes.json();

  save_cache(key, evoData);
  return { data: evoData, origen: 'api' };
}


async function buscarPokemon() { // Busca la evolucion del pokemon
  const nombrePokemon = input.value.trim().toLowerCase();
  if (!nombrePokemon) return;

  // Ocultar card de habilidad y mostrar card de Pokémon
  habilidadCard.style.display = 'none';
  pokemonCard.style.display = 'block';

  // Mostrar cargando
  pokemonCard.innerHTML = `
    <div class="estado-cargando">
      <p>Cargando datos...</p>
    </div>
  `;

  try {
    const resultadoPokemon = await traerPoke(nombrePokemon);
    const pokemon = resultadoPokemon.data;
    reproducirGritoPokemon(pokemon);
    pokemonActual = {
      id: pokemon.id,
      nombre: pokemon.name.toUpperCase(),
      imagen: pokemon.sprites.front_default,
      tipos: pokemon.types.map(t => t.type.name.toUpperCase())
    };
    
    
    pokemonActualGlobal = pokemonActual; 

    const resultadoEvo = await getEvo(pokemon.species.url);

    const origenFinal =
      resultadoPokemon.origen === 'api' || resultadoEvo.origen === 'api'
        ? 'api'
        : 'cache';

    // Restaurar el HTML de la card
    pokemonCard.innerHTML = pokemon_card_template;
    
    updateFavBtn(pokemon.id);
    setOrigen(origenFinal);

    document.getElementById('pokemonImagen').src =
      pokemon.sprites.front_default;
    document.getElementById('nombrePokemon').textContent =
      pokemon.name.toUpperCase();
    document.getElementById('iDPokemon').textContent =
      `#${pokemon.id}`;

    pintarTipos(pokemon.types);
    render_abilities(pokemon.abilities);
    dibujarStats(pokemon.stats);

    // Obtener el nuevo contenedor de evoluciones (se recreó con el template)
    const nuevoEvoContainer = document.querySelector('.evoluciones-container');
    renderEvoChain(
      resultadoEvo.data.chain,
      nuevoEvoContainer,
      pokemon.name
    );

  } catch (error) {
    pokemonCard.innerHTML = `
      <div class="estado-error">
        <h3>Pokémon no encontrado</h3>
      </div>
    `;
    console.error(error);
  }
}


function obtenerFavoritos() {
  return JSON.parse(localStorage.getItem(favoritosPokemon)) || [];
}

function guardarFavoritos(favoritos) {
    localStorage.setItem(favoritosPokemon, JSON.stringify(favoritos));
  }


function toggle_fav() {
  if (!pokemonActualGlobal) return;

  let favs = obtenerFavoritos();

  const existe = favs.some(p => p.id === pokemonActualGlobal.id);

  if (existe) {
    favs = favs.filter(p => p.id !== pokemonActualGlobal.id);
  } else {
    favs.push(pokemonActualGlobal);
  }

  localStorage.setItem(favoritosPokemon,  JSON.stringify(favs));
  updateFavBtn(pokemonActualGlobal.id);
}

function updateFavBtn(id) {
  const btn = document.getElementById('btn-favorito');
  if (!btn) return;

  const favs = obtenerFavoritos();
  const esFav = favs.some(p => p.id === id);

  btn.textContent = esFav
    ? '❤️'
    : '🤍';
}


function getId(url) { // para obtener el id de la url
  return url.split('/').filter(Boolean).pop();
}


const type_colors = { // para los colores de los tipos de pokemon
  grass: '#78C850',
  poison: '#A040A0',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  bug: '#A8B820',
  normal: '#A8A878',
  ground: '#E0C068',
  fairy: '#EE99AC',
  fighting: '#C03028',
  psychic: '#F85888',
  rock: '#B8A038',
  ghost: '#705898',
  ice: '#98D8D8',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  flying: '#A890F0'
};


function pintarTipos(tipos) { // Esto aquí lo hice para relacionar los tipos de pokemon con los colores
  const contenedor = document.querySelector('.card-tipos');
  contenedor.innerHTML = "";

  tipos.forEach(t => {
    const span = document.createElement('span');
    span.className = 'tipo-tag';
    span.textContent = t.type.name.toUpperCase();
    span.style.backgroundColor = type_colors[t.type.name] || '#999';
    contenedor.appendChild(span);
  });
}


function render_abilities(habilidades) { // Esto aquí hace lo mismo pero para las habilidades de los pokemon
  const contenedor = document.querySelector('.card-habilidades');
  contenedor.innerHTML = "";

  habilidades.forEach(h => {
    const span = document.createElement('span');
    span.className = 'botones habilidad-tag';
    span.textContent = h.is_hidden
      ? `${h.ability.name} (Oculta)`
      :  h.ability.name;

    // Click para buscar la habilidad
    span.addEventListener('click', () => {
      input.value = h.ability.name;
      tipoBusqueda.value = 'habilidad';
      searchAbility();
    });

    contenedor.appendChild(span);
  });
}


function dibujarStats(stats) { // Esto aquí hace lo mismo pero para los stats de los pokemon
  const statsContainer = document.querySelector('.card-stats');
  statsContainer.innerHTML = "";

  stats.forEach(stat => {
    const nombre = stat.stat.name.replace('-', ' ').toUpperCase();
    const valor = stat.base_stat;
    const porcentaje = Math.min((valor / 200) * 100, 100);

    const fila = document.createElement('div');
    fila.className = 'stat-fila';

    fila.innerHTML = `
      <span class="stat-nombre">${nombre}</span>
      <div class="stat-barra-container">
        <div class="stat-barra" style="width:${porcentaje}%"></div>
      </div>
      <span class="stat-valor">${valor}</span>
    `;

    statsContainer.appendChild(fila);
  });
}

const evoContainer = document.querySelector('.evoluciones-container');



function hacerCardEvo(nombre, id, esActual = false) { //Crea la card con las evoluciones de los pokemon
  const div = document.createElement('div');
  div.className = `botones ${esActual ? 'evolucion-actual' : 'otras-evoluciones'}`;

  div.innerHTML = `
    <img
      class="evolucion-imagen"
      src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png"
      alt="${nombre}"
    >
    <span class="evolucion-nombre">${nombre.toUpperCase()}</span>
  `;


  // Click para buscar esa evolucion
  div.addEventListener('click', () => {
    input.value = nombre;
    tipoBusqueda.value = 'pokemon';
    buscarPokemon();
  });

  return div;
}


function sacarCondicion(details) { // Obtiene las condiciones de las evoluciones de los pokemon
  if (!details || details.length === 0) return '';

  const d = details[0];
  const condiciones = [];

  if (d.min_level)
    condiciones.push(`Nivel ${d.min_level}`);

  if (d.item)
    condiciones.push(`Usar ${d.item.name.replace('-', ' ')}`);

  if (d.held_item)
    condiciones.push(`Sosteniendo ${d.held_item.name.replace('-', ' ')}`);

  if (d.min_happiness)
    condiciones.push(`Felicidad ≥ ${d.min_happiness}`);

  if (d.min_affection)
    condiciones.push(`Afecto ≥ ${d.min_affection}`);

  if (d.min_beauty)
    condiciones.push(`Belleza ≥ ${d.min_beauty}`);

  if (d.time_of_day)
    condiciones.push(`Durante el ${d.time_of_day}`);

  if (d.known_move)
    condiciones.push(`Aprender ${d.known_move.name.replace('-', ' ')}`);

  if (d.known_move_type)
    condiciones.push(`Movimiento tipo ${d.known_move_type.name}`);

  if (d.trigger?.name === 'trade')
    condiciones.push(`Intercambio`);

  if (d.trade_species)
    condiciones.push(`Intercambio por ${d.trade_species.name}`);

  if (d.party_species)
    condiciones.push(`Con ${d.party_species.name} en el equipo`);

  if (d.party_type)
    condiciones.push(`Con Pokémon tipo ${d.party_type.name} en el equipo`);

  if (d.relative_physical_stats !== null) {
    if (d.relative_physical_stats === 1)
      condiciones.push('Ataque > Defensa');
    else if (d.relative_physical_stats === -1)
      condiciones.push('Defensa > Ataque');
    else
      condiciones.push('Ataque = Defensa');
  }

  if (d.gender !== null) {
    condiciones.push(d.gender === 1 ? 'Solo hembras' : 'Solo machos');
  }

  if (d.location)
    condiciones.push(`En ${d.location.name.replace('-', ' ')}`);

  if (d.needs_overworld_rain)
    condiciones.push('Debe estar lloviendo');

  if (d.turn_upside_down)
    condiciones.push('Con la consola al revés');

  return condiciones.join(' · ');
}



function crearTextoCondicion(texto) { // Crea el texto de las condiciones de las evoluciones de los pokemon
  const span = document.createElement('span');
  span.className = 'evolucion-condicion';
  span.textContent = texto;
  return span;
}

function poner_flecha() { // Crea la flecha entre evoluciones
  const span = document.createElement('span');
  span.className = 'evolucion-flecha';
  span.textContent = '→';
  return span;
}


function renderEvoChain(cadena, contenedor, pokemonActual) { // Renderiza la cadena de evoluciones de los pokemon
  contenedor.innerHTML = "";

  // El parámetro saltarCard indica si debemos saltar agregar la card (porque ya se agregó en un wrapper)
  function recorrer(nodo, saltarCard = false) {
    if (!saltarCard) {
      const id = getId(nodo.species.url);
      const esActual = nodo.species.name === pokemonActual;

      contenedor.appendChild(
        hacerCardEvo(nodo.species.name, id, esActual)
      );
    }

    if (nodo.evolves_to.length === 1) {
      const evo = nodo.evolves_to[0];
      const idEvo = getId(evo.species.url);
      const condicion = sacarCondicion(evo.evolution_details);
      
      // Agregar flecha antes del wrapper
      contenedor.appendChild(poner_flecha());
      
      const envoltorio = document.createElement('div');
      envoltorio.className = 'evolucion-wrapper';
      
      if (condicion) {
        envoltorio.appendChild(crearTextoCondicion(condicion));
      }
      
      envoltorio.appendChild(
        hacerCardEvo(evo.species.name, idEvo, evo.species.name === pokemonActual)
      );
      contenedor.appendChild(envoltorio);
      
      // Continuar con las siguientes evoluciones (saltarCard=true porque ya agregamos la card en el wrapper)
      if (evo.evolves_to.length > 0) {
        recorrer(evo, true);
      }
    }

    if (nodo.evolves_to.length > 1) {
      // Agregar flecha antes de la columna de evoluciones múltiples
      contenedor.appendChild(poner_flecha());
      
      const columna = document.createElement('div');
      columna.className = 'evoluciones-columna';

      nodo.evolves_to.forEach(evo => {
        const idEvo = getId(evo.species.url);
        const card = hacerCardEvo(
          evo.species.name,
          idEvo,
          evo.species.name === pokemonActual
        );

        const condicion = sacarCondicion(evo.evolution_details);
        const envoltorio = document.createElement('div');
        envoltorio.className = 'evolucion-wrapper';

        if (condicion) {
          envoltorio.appendChild(crearTextoCondicion(condicion));
        }

        envoltorio.appendChild(card);
        columna.appendChild(envoltorio);
      });

      contenedor.appendChild(columna);
    }
  }

  recorrer(cadena);
}


function setOrigen(origen) { // Muestra el origen de los datos de los pokemon (api o cache)
  const etiqueta = document.getElementById('origenDatos');

  etiqueta.classList.remove('origen-api', 'origen-cache');

  if (origen === 'cache') {
    etiqueta.textContent = '📦 CACHÉ';
    etiqueta.classList.add('origen-cache');
  } else {
    etiqueta.textContent = '🌐 API';
    etiqueta.classList.add('origen-api');
  }
}


const cache_time = 1000 * 60 * 5;  // 5 minutos

function save_cache(key, data) { // Guarda los datos en la cache
  localStorage.setItem(key,JSON.stringify({
      timestamp: Date.now(),
      data
    })
  );
}

function getCache(key) { // Obtiene los datos de la cache
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  const cache = JSON.parse(raw); // Convierte el raw a un objeto JSon
  if (Date.now() - cache.timestamp > cache_time) {
    localStorage.removeItem(key);
    return null;
  }
  return cache.data;
}


form.addEventListener('submit', (e) => {
  e.preventDefault();
  const tipo = tipoBusqueda.value;

  autocompletar.innerHTML = '';
  
  if (tipo === 'pokemon') {
    buscarPokemon();
  } else if (tipo === 'habilidad') {
    searchAbility();
  }
});


const favoritosPokemon = 'favoritos_pokemon';
let pokemonActualGlobal = null;


// BÚSQUEDA POR HABILIDAD 


// Acá obtenemos la habilidad de la api y la guardamos en cache
async function fetchAbility(nombre) {
  const clave = `habilidad_${nombre}`;
  const cacheado = getCache(clave);

  if (cacheado) {
    return { datos: cacheado, origen: 'cache' };
  }

  const respuesta = await fetch(`https://pokeapi.co/api/v2/ability/${nombre}`);
  if (!respuesta.ok) throw new Error('Habilidad no encontrada');

  const datos = await respuesta.json();
  save_cache(clave, datos);

  return { datos, origen: 'api' };
}


// Función para buscar una habilidad
async function searchAbility() {
  const nombreHabilidad = input.value.trim().toLowerCase();
  if (!nombreHabilidad) return;

  // Ocultar card de Pokémon y mostrar card de habilidad
  pokemonCard.style.display = 'none';
  
  habilidadCard.style.display = 'block';

  // Mostrar cargando
  habilidadCard.innerHTML = `
    <div class="estado-cargando">
      <p>Cargando datos...</p>
    </div>
  `;

  try {
    const resultado = await fetchAbility(nombreHabilidad);
    const habilidad = resultado.datos;

    render_abilityCard(habilidad, resultado.origen);

  } catch (error) {
    habilidadCard.innerHTML = `
      <div class="estado-error">
        <h3>Habilidad no encontrada</h3>
      </div>
    `;
    console.error(error);
  }
}



// Función para mostrar la card de habilidad con todos sus datos
function render_abilityCard(habilidad, origen) {

  // Obtener el efecto en ingles
  const efectoEn = habilidad.effect_entries.find(e => e.language.name === 'en');
  const efecto = efectoEn?.short_effect || 'Sin descripción';


  // Filtrar solo Pokémon (no formas alternativas como mega, gmax, etc)
  const listaPokemon = habilidad.pokemon.filter(p => {
    const nombrePokemon = p.pokemon.name;
    return !nombrePokemon.includes('-mega') && 
           !nombrePokemon.includes('-gmax') && 
           !nombrePokemon.includes('-totem');
  });


  // Mostrar la card con los datos
  habilidadCard.innerHTML = `
    <div class="habilidad-card-header">
      <div class="habilidad-titulo">
        <span class="habilidad-icono">✨</span>
        <h2 class="habilidad-nombre">${habilidad.name.toUpperCase()}</h2>
      </div>
      <span class="habilidad-id">#${habilidad.id}</span>
    </div>

    <div class="habilidad-efecto-container">
      <h3 class="habilidad-efecto-titulo">EFECTO</h3>
      <p class="habilidad-efecto-texto">${efecto}</p>
    </div>

    <div class="habilidad-pokemon-container">
      <h3 class="habilidad-pokemon-titulo">
        POKÉMON CON ESTA HABILIDAD (<span class="habilidad-pokemon-count">${listaPokemon.length}</span>)
      </h3>
      
      <div class="habilidad-pokemon-grid">
        ${listaPokemon.map(p => {
          const idPokemon = getId(p.pokemon.url);
          const esOculta = p.is_hidden;
          return `
            <div class="habilidad-pokemon-item" data-pokemon="${p.pokemon.name}">
              <img 
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${idPokemon}.png" 
                alt="${p.pokemon.name}" 
                class="habilidad-pokemon-sprite"
              >
              <span class="habilidad-pokemon-nombre">${p.pokemon.name.toUpperCase()}</span>
              ${esOculta ? '<span class="habilidad-pokemon-oculta">(oculta)</span>' : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;


  // Agregar evento click a los Pokémon de la lista para poder buscarlos
  const itemsPokemon = habilidadCard.querySelectorAll('.habilidad-pokemon-item');
  itemsPokemon.forEach(item => {
    item.addEventListener('click', () => {
      const nombrePokemon = item.dataset.pokemon;
      input.value = nombrePokemon;
      tipoBusqueda.value = 'pokemon';
      buscarPokemon();
    });
  });
}

function toggleDarkMode() {
  const body = document.body;
  const btn = document.getElementById('btn-dark-mode');
  
  body.classList.toggle('dark-mode');
  
  // Cambiar el icono del botón
  if (body.classList.contains('dark-mode')) {
    btn.textContent = '☀️';
    localStorage.setItem('darkMode', 'enabled');
  } else {
    btn.textContent = '🌙';
    localStorage.setItem('darkMode', 'disabled');
  }
}

(function loadDarkModePreference() {
  const darkMode = localStorage.getItem('darkMode');
  const btn = document.getElementById('btn-dark-mode');
  
  if (darkMode === 'enabled') {
    document.body.classList.add('dark-mode');
    if (btn) btn.textContent = '☀️';
  }
})();
