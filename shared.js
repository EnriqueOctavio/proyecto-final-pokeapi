const buttonContainer = document.querySelector('.buttons-tag-container');
const buttonTag = document.querySelectorAll('.button-tag');
const panels = document.querySelectorAll('[data-view-panel]');
const input = document.getElementById('valor-busqueda');
const form = document.getElementById('form-busqueda');
const tituloPrincipal = document.getElementById('titulo-principal');

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

async function cargarComponente(idContenedor, urlArchivo) {
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

cargarComponente('historico-section', 'historico.html');
cargarComponente('vs-section', 'vs.html');
cargarComponente('favoritos-section', 'favoritos.html');

//Acá estamos llamando el pokemon de la api y guardando en la cache

async function obtenerPokemon(nombre) {
  const key = `pokemon_${nombre}`;
  const cache = obtenerDeCache(key);

  if (cache) {
    return { data: cache, origen: 'cache' };
  }

  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${nombre}`);
  if (!res.ok) throw new Error('Pokémon no encontrado');

  const data = await res.json();
  guardarEnCache(key, data);

  return { data, origen: 'api' };
}

// Obtiene la evolucion del pokemon de la api
//Acá estamos llamando la evolucion del pokemon de la api y guardando en la cache
async function obtenerEvolucion(speciesUrl) { 
  const key = `evo_${speciesUrl}`;
  const cache = obtenerDeCache(key);

  if (cache) {
    return { data: cache, origen: 'cache' };
  }

  const speciesRes = await fetch(speciesUrl);
  const speciesData = await speciesRes.json();

  const evoRes = await fetch(speciesData.evolution_chain.url);
  const evoData = await evoRes.json();

  guardarEnCache(key, evoData);
  return { data: evoData, origen: 'api' };
}

async function searchEvolution() { // Busca la evolucion del pokemon
  const nombrePokemon = input.value.trim().toLowerCase();
  if (!nombrePokemon) return;

  try {
    const pokemonResult = await obtenerPokemon(nombrePokemon);
    const pokemon = pokemonResult.data;

    const evoResult = await obtenerEvolucion(pokemon.species.url);

    const origenFinal =
      pokemonResult.origen === 'api' || evoResult.origen === 'api'
        ? 'api'
        : 'cache';

    renderOrigen(origenFinal);

    document.getElementById('pokemonImagen').src =
      pokemon.sprites.front_default;
    document.getElementById('nombrePokemon').textContent =
      pokemon.name.toUpperCase();
    document.getElementById('iDPokemon').textContent =
      `#${pokemon.id}`;

    renderTipos(pokemon.types);
    renderHabilidades(pokemon.abilities);
    renderStats(pokemon.stats);

    renderCadenaFinal(
      evoResult.data.chain,
      evolucionesContainer,
      pokemon.name
    );

  } catch (error) {
    evolucionesContainer.innerHTML =
      `<span class="error">${error.message}</span>`;
    console.error(error);
  }
}

function getIdFromUrl(url) { // para obtener el id de la url
  return url.split('/').filter(Boolean).pop();
}

const typeColors = { // para los colores de los tipos de pokemon
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

function renderTipos(types) { // Esto aquí lo hicepara relacionar los tipos de pokemon con los colores
  const container = document.querySelector('.card-tipos');
  container.innerHTML = "";

  types.forEach(t => {
    const span = document.createElement('span');
    span.className = 'tipo-tag';
    span.textContent = t.type.name.toUpperCase();
    span.style.backgroundColor = typeColors[t.type.name] || '#999';
    container.appendChild(span);
  });
}

function renderHabilidades(abilities) { // Esto aquí hace lo mismo pero para las habilidades de los pokemon
  const container = document.querySelector('.card-habilidades');
  container.innerHTML = "";

  abilities.forEach(a => {
    const span = document.createElement('span');
    span.className = 'botones habilidad-tag';
    span.textContent = a.is_hidden
      ? `${a.ability.name} (Hidden)`
      : a.ability.name;

    container.appendChild(span);
  });
}

function renderStats(stats) { // Esto aquí hace lo mismo pero para los stats de los pokemon
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

const evolucionesContainer = document.querySelector('.evoluciones-container');

function crearCardEvolucion(nombre, id, esActual = false) { //Crea la card con las evoluciones de los pokemon
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

  return div;
}

function obtenerCondicionEvolucion(details) { // Obtiene las condiciones de las evoluciones de los pokemon
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


function crearCondicionEvolucion(texto) { // Crea el texto de las condiciones de las evoluciones de los pokemon
  const span = document.createElement('span');
  span.className = 'evolucion-condicion';
  span.textContent = texto;
  return span;
}

function renderCadenaFinal(chain, container, pokemonActual) { // Renderiza la cadena de evoluciones de los pokemon
  container.innerHTML = "";

  function recorrer(nodo) {
    const id = getIdFromUrl(nodo.species.url);
    const esActual = nodo.species.name === pokemonActual;

    container.appendChild(
      crearCardEvolucion(nodo.species.name, id, esActual)
    );

    if (nodo.evolves_to.length === 1) {
      const evo = nodo.evolves_to[0];
      const condicion = obtenerCondicionEvolucion(evo.evolution_details);
      if (condicion) {
        container.appendChild(crearCondicionEvolucion(condicion));
      }
      recorrer(evo);
    }

    if (nodo.evolves_to.length > 1) {
      const columna = document.createElement('div');
      columna.className = 'evoluciones-columna';

      nodo.evolves_to.forEach(evo => {
        const idEvo = getIdFromUrl(evo.species.url);
        const card = crearCardEvolucion(
          evo.species.name,
          idEvo,
          evo.species.name === pokemonActual
        );

        const condicion = obtenerCondicionEvolucion(evo.evolution_details);
        const wrapper = document.createElement('div');
        wrapper.className = 'evolucion-wrapper';

        if (condicion) {
          wrapper.appendChild(crearCondicionEvolucion(condicion));
        }

        wrapper.appendChild(card);
        columna.appendChild(wrapper);
      });

      container.appendChild(columna);
    }
  }

  recorrer(chain);
}

function renderOrigen(origen) { // Renderiza el origen de los datos de los pokemon (api o cache)
  const badge = document.getElementById('origenDatos');

  badge.classList.remove('origen-api', 'origen-cache');

  if (origen === 'cache') {
    badge.textContent = 'DESDE CACHÉ';
    badge.classList.add('origen-cache');
  } else {
    badge.textContent = 'DESDE API';
    badge.classList.add('origen-api');
  }
}

const chachetiempo = 1000 * 60 * 5; 

function guardarEnCache(key, data) { // Guarda los datos en la cache
  localStorage.setItem(key,JSON.stringify({
      timestamp: Date.now(),
      data
    })
  );
}

function obtenerDeCache(key) { // Obtiene los datos de la cache
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  const cache = JSON.parse(raw); // Convierte el raw a un objeto JSon
  if (Date.now() - cache.timestamp > chachetiempo) {
    localStorage.removeItem(key);
    return null;
  }
  return cache.data;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  searchEvolution();
});