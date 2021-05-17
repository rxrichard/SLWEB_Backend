const axios = require("axios");
const Env = use("Env");

exports.GenTokenTMT = async (filial) => {
    const con = PureConnection()

    const Formulario = new URLSearchParams();
    Formulario.append("grant_type", "password");
    Formulario.append("username", Env.get("TMT_USER"));
    Formulario.append("password", Env.get("TMT_PASSWORD"));
    Formulario.append("filial", filial);

    return await con.post('/Token', Formulario)
}

exports.ListClients = async(token)=>{
    const con = AuthConnection(token)
    
    let result = await con.get('/api/v1/cliente?ps=10')
    if(result.data.TotalResults > result.data.PageSize){
        result = await con.get(`/api/v1/cliente?ps=${result.data.TotalResults}`)
    }

    return result
}



const PureConnection = () =>
  axios.create({
    baseURL: `${Env.get("TMT_URL")}`,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    crossDomain: true,
  });

const AuthConnection = (token) => axios.create({
    baseURL: `${Env.get("TMT_URL")}`,
    headers: {
      "Access-Control-Allow-Origin": "*",
      'Authorization': 'Bearer ' + token
    },
    crossDomain: true,
  });