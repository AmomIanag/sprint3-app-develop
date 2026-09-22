// Alturas simuladas para o protótipo acadêmico, associadas a cada localidade.

const localidades = [
  { nome: "São Paulo, SP, Brasil", alturaVegetacao: 12 },
  { nome: "Caieiras, SP, Brasil", alturaVegetacao: 20 },
  { nome: "Cajamar, SP, Brasil", alturaVegetacao: 27 },
  { nome: "Jundiaí, SP, Brasil", alturaVegetacao: 35 },
  { nome: "Itupeva, SP, Brasil", alturaVegetacao: 41 },
  { nome: "Campinas, SP, Brasil", alturaVegetacao: 50 },
  { nome: "Hortolândia, SP, Brasil", alturaVegetacao: 56 },
  { nome: "Sumaré, SP, Brasil", alturaVegetacao: 18 },
  { nome: "Americana, SP, Brasil", alturaVegetacao: 32 },
  { nome: "Limeira, SP, Brasil", alturaVegetacao: 64 }
];

// Faixas usadas para classificar a altura da vegetação e recomendar uma ação.
const faixasVegetacao = [
  {
    min: 0,
    max: 20,
    classificacao: "Normal",
    acao: "Nenhuma intervenção necessária.",
    classe: "status-normal"
  },
  {
    min: 20,
    max: 35,
    classificacao: "Atenção",
    acao: "Manter acompanhamento do ponto.",
    classe: "status-atencao"
  },
  {
    min: 35,
    max: 50,
    classificacao: "Risco",
    acao: "Programar intervenção da equipe.",
    classe: "status-risco"
  },
  {
    min: 50,
    max: null,
    classificacao: "Crítico",
    acao: "Realizar intervenção imediata.",
    classe: "status-critico"
  }
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

  const dadosLocalidades = [];
  let houveErro = false;

  // For que serve para passar pelas localidades
  for (let i = 0; i < localidades.length; i++) {
    mensagem.textContent =
      "Buscando " + (i + 1) + " de " + localidades.length;

    const dados = await buscarLocalidade(localidades[i]);

    if (dados) {
      dadosLocalidades.push(dados);
    } else {
      houveErro = true;
    }

    // Pausa entre cada localidade
    await esperar();
  }

  renderizarLocalidades(dadosLocalidades);

  if (dadosLocalidades.length === 0) {
    mensagem.textContent = "Erro ao carregar os dados. Tente novamente.";
  } else if (houveErro) {
    mensagem.textContent = "Dados carregados parcialmente. Algumas localidades não puderam ser consultadas.";
  } else {
    mensagem.textContent = "Dados carregados com sucesso.";
  }
  botao.disabled = false;
}


// Busca as coordenadas da localidade no OpenStreetMap (api sugerida pelo professor)

async function buscarLocalidade(localidade) {
  const enderecoMapa =
    "https://nominatim.openstreetmap.org/search" +
    "?format=json" +
    "&limit=1" +
    "&q=" +
    encodeURIComponent(localidade.nome);

  try {
    const respostaMapa = await fetch(enderecoMapa);

    const dadosMapa = await respostaMapa.json();

    if (dadosMapa.length === 0) {
      throw new Error("Localidade não encontrada.");
    }

    const latitude = dadosMapa[0].lat;
    const longitude = dadosMapa[0].lon;

    return await buscarClima(localidade, latitude, longitude);
  } catch (erro) {
    mensagem.textContent = "Erro ao buscar localização.";
    console.log(erro);
    return null;
  }
}


// Busca os dados meteorológicos no Open-Meteo (api sugerida pelo professor)

async function buscarClima(localidade, latitude, longitude) {
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
    const riscoClimatico = verificarRisco(
      temperatura,
      umidade,
      chuva,
      vento
    );

    return {
      nome: localidade.nome,
      alturaVegetacao: localidade.alturaVegetacao,
      latitude,
      longitude,
      temperatura,
      umidade,
      chuva,
      vento,
      riscoClimatico
    };

  } catch (erro) {
    mensagem.textContent = "Erro ao buscar dados meteorológicos.";
    console.log(erro);
    return null;
  }
}

// Recebe uma altura e retorna a faixa correspondente.
function classificarVegetacao(altura) {
  if (!Number.isFinite(altura) || altura < 0) {
    return null;
  }

  for (const faixa of faixasVegetacao) {
    const acimaDoMinimo = faixa.min === 0
      ? altura >= faixa.min
      : altura > faixa.min;
    const abaixoDoMaximo = faixa.max === null || altura <= faixa.max;

    if (acimaDoMinimo && abaixoDoMaximo) {
      return faixa;
    }
  }

  return null;
}

// Percorre os resultados e cria os cards dinamicamente.
function renderizarLocalidades(dadosLocalidades) {
  dadosLocalidades.forEach(function (dados) {
    criarCard(dados);
  });
}

// Cria um card para cada localidade

function criarCard(dados) {
  const classificacao = classificarVegetacao(dados.alturaVegetacao);

  if (!classificacao) {
    console.log("Altura de vegetação inválida para " + dados.nome);
    return;
  }

  const card = document.createElement("article");
  card.classList.add("card", classificacao.classe);

  card.innerHTML = `
    <span class="localizacao-rotulo">Localização</span>
    <h3>${dados.nome}</h3>

    <div class="vegetacao-resumo">
      <div class="vegetacao-altura">
        <span>Altura da vegetação</span>
        <strong>${dados.alturaVegetacao} cm</strong>
      </div>

      <div class="status-grupo">
        <span class="status-rotulo">Classificação</span>
        <span class="status-badge">${classificacao.classificacao}</span>
      </div>

      <p class="acao-recomendada">
        <strong>Ação recomendada:</strong>
        ${classificacao.acao}
      </p>
    </div>

    <h4 class="dados-climaticos">Dados climáticos e localização</h4>

    <p class="risco-climatico">
      <strong>Condição climática:</strong>
      ${dados.riscoClimatico}
    </p>

    <p class="dado-secundario">
      <strong>Latitude:</strong>
      ${Number(dados.latitude).toFixed(4)}
    </p>

    <p class="dado-secundario">
      <strong>Longitude:</strong>
      ${Number(dados.longitude).toFixed(4)}
    </p>

    <p class="dado-secundario">
      <strong>Temperatura:</strong>
      ${dados.temperatura} °C
    </p>

    <p class="dado-secundario">
      <strong>Umidade:</strong>
      ${dados.umidade}%
    </p>

    <p class="dado-secundario">
      <strong>Chuva:</strong>
      ${dados.chuva} mm
    </p>

    <p class="dado-secundario">
      <strong>Vento:</strong>
      ${dados.vento} km/h
    </p>

    <a
      href="https://www.openstreetmap.org/?mlat=${dados.latitude}&mlon=${dados.longitude}"
      target="_blank"
      rel="noopener noreferrer"
    >
      Ver no mapa →
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
