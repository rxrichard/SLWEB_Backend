const axios = require("axios");
const Env = use("Env");
const https = require('https');

//faz a autenticacao e devolve um token de acesso ao TMT
exports.GenTokenTMT = async (filial) => {
  const con = PureConnection();

  const Formulario = new URLSearchParams();

  Formulario.append("grant_type", "password");
  Formulario.append("username", Env.get("TMT_USER"));
  Formulario.append("password", Env.get("TMT_PASSWORD"));
  Formulario.append("filial", filial);

  return await con.post("/Token", Formulario);
};

//lista todos os clientes da filial no token
exports.ListClients = async (token) => {
  const con = AuthConnection(token);

  let result = await con.get("/api/v1/cliente?ps=10");
  if (result.data.TotalResults > result.data.PageSize) {
    result = await con.get(`/api/v1/cliente?ps=${result.data.TotalResults}`);
  }
  
  return result.data.List;
};

exports.FindUltimaInstalacao = async (token, ativo) => {
  const con = AuthConnection(token);
  let achou = true;
  let maior = false;
  let result = [];
  let max = await con.get("/api/v1/instalacao?ps=1");
  let resposta = [];

  do {
    result = await con.get(`/api/v1/instalacao?ps=${max.data.TotalResults}`);
    result.data.List.map((maq) => {
      if (String(maq.Matricula) === String(ativo)) {
        resposta.push(maq);
      }
    });
    achou = false;
  } while (achou);

  //se só tiver uma instalação da máquina retorna ela
  if (resposta.length === 1) {
    return resposta[0];
  } else if (resposta.length > 1) {
    //Se houver mais de uma instalação eu comparo elas pra buscar a mais recente
    for (let i = 0; i < resposta.length; i++) {
      for (let j = 0; j < resposta.length; j++) {
        if (
          resposta[i].DataInstalacaoString > resposta[j].DataInstalacaoString
        ) {
          maior = true;
        } else {
          maior = false;
          j = resposta.length;
        }
      }
      if (maior) {
        return resposta[i];
      }
    }
  } else {
    //se não houver nenhuma instalação da máquina
    return null;
  }
};

exports.FindEnderecoPorInstalacaoCliente = async (token, instalacao) => {
  if (instalacao === null) {
    return {data: "Localização não encontrada"};
  }
  const con = AuthConnection(token);

  return await con.get(`/api/v1/cliente/${instalacao.ClienteId}`);
};

//conexão não autenticada
const PureConnection = () =>
  axios.create({
    baseURL: `${Env.get("TMT_URL")}`,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    crossDomain: true,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
  });

  //conexão autenticada 
const AuthConnection = (token) =>
  axios.create({
    baseURL: `${Env.get("TMT_URL")}`,
    headers: {
      "Access-Control-Allow-Origin": "*",
      Authorization: "Bearer " + token,
    },
    crossDomain: true,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
  });
