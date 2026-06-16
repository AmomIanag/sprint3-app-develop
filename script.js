// Lista com as dez localidades que foram pedidas

const localidades = [
  "São Paulo, SP, Brasil",
  "Caieiras, SP, Brasil",
  "Cajamar, SP, Brasil",
  "Jundiaí, SP, Brasil",
  "Itupeva, SP, Brasil",
  "Campinas, SP, Brasil",
  "Hortolândia, SP, Brasil",
  "Sumaré, SP, Brasil",
  "Americana, SP, Brasil",
  "Limeira, SP, Brasil"
];


// Pegando elementos do nosso html

const botao = document.getElementById("botaoBuscar");
const cards = document.getElementById("cards");
const mensagem = document.getElementById("mensagem");


// Quando o botão for clicado, a função é executada

botao.addEventListener("click", buscarDados);


// Função principal

async function buscarDados() {
  cards.innerHTML = "";

  mensagem.textContent = "Carregando dados...";

  botao.disabled = true;

  // For que serve para passar pelas localidades
  for (let i = 0; i < localidades.length; i++) {
    mensagem.textContent =
      "Buscando " + (i + 1) + " de " + localidades.length;

    await buscarLocalidade(localidades[i]);

    // Pausa entre cada localidade
    await esperar();
  }

  mensagem.textContent = "Dados carregados com sucesso.";

  botao.disabled = false;
}


// Busca as coordenadas da localidade no OpenStreetMap (api sugerida pelo professor)

async function buscarLocalidade(nomeLocalidade) {
  const enderecoMapa =
    "https://nominatim.openstreetmap.org/search" +
    "?format=json" +
    "&limit=1" +
    "&q=" +
    encodeURIComponent(nomeLocalidade);

  try {
    const respostaMapa = await fetch(enderecoMapa);

    const dadosMapa = await respostaMapa.json();

    if (dadosMapa.length > 0) {
      const latitude = dadosMapa[0].lat;
      const longitude = dadosMapa[0].lon;

      await buscarClima(nomeLocalidade, latitude, longitude);
    }

  } catch (erro) {
    mensagem.textContent = "Erro ao buscar localização.";

    console.log(erro);
  }
}


// Busca os dados meteorológicos no Open-Meteo (api sugerida pelo professor)

async function buscarClima(nome, latitude, longitude) {
  const enderecoClima =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=" + latitude +
    "&longitude=" + longitude +
    "&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m";

  try {
    const respostaClima = await fetch(enderecoClima);

    const dadosClima = await respostaClima.json();

    const temperatura = dadosClima.current.temperature_2m;
    const umidade = dadosClima.current.relative_humidity_2m;
    const chuva = dadosClima.current.precipitation;
    const vento = dadosClima.current.wind_speed_10m;
    const risco = verificarRisco( //Const que le a nossa funcao para verificar o risco com base em informacoes climáticas
        temperatura,
        umidade,
        chuva,
        vento
    );

    criarCard( // card com as informacoes necessarias
      nome,
      latitude,
      longitude,
      temperatura,
      umidade,
      chuva,
      vento,
      risco
    );

  } catch (erro) {
    mensagem.textContent = "Erro ao buscar dados meteorológicos.";

    console.log(erro);
  }
}


// Cria um card para cada localidade

function criarCard(
  nome,
  latitude,
  longitude,
  temperatura,
  umidade,
  chuva,
  vento,
  risco
) {
  const card = document.createElement("div");

  card.classList.add("card");

  card.innerHTML = `
    <h3>${nome}</h3>
    
    <p class="risco">
      <strong>Risco identificado:</strong>
      ${risco}
    </p>

    <p>
      <strong>Latitude:</strong>
      ${Number(latitude).toFixed(4)}
    </p>

    <p>
      <strong>Longitude:</strong>
      ${Number(longitude).toFixed(4)}
    </p>

    <p>
      <strong>Temperatura:</strong>
      ${temperatura} °C
    </p>

    <p>
      <strong>Umidade:</strong>
      ${umidade}%
    </p>

    <p>
      <strong>Chuva:</strong>
      ${chuva} mm
    </p>

    <p>
      <strong>Vento:</strong>
      ${vento} km/h
    </p>

    <a
      href="https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}"
      target="_blank"
    >
      Ver no mapa
    </a>
  `;

  cards.appendChild(card);
}

// Função para verificar o risco e retornar análise se tem risco ou não
function verificarRisco(temperatura, umidade, chuva, vento) {
    if (temperatura >= 32 && umidade <=35) {
        return "Alto risco de incêndio";
    }

    if (chuva >= 20) {
        return "Risco de alagamento e erosão";
    }

    if (vento >= 40) {
        return "Risco de queda de árvore";
    }

    return "Risco baixo";
}

// Cria uma pausa de um segundo entre as consultas

function esperar() {
  return new Promise(function (resolve) {
    setTimeout(resolve, 1000);
  });
}