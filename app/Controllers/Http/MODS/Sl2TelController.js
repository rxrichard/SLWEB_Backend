"use strict";
const Database = use("Database");
const { GenTokenTMT, ListClients, FindUltimaInstalacao, FindEnderecoPorInstalacaoCliente } = require("../../../POG/TMTConn");

class Sl2TelController {
  //atualizar posse da máquina no totvs
  async Update({ response, params }) {
    const EquiCod = params.equicod;
    const filial = params.filial;

    // busco os dados da posse da máquina que acabaram de ser gravados no SLAplic
    const PDV = await Database.raw(
      "select P.CNPJ from dbo.PontoVenda as P inner join dbo.Cliente as C on P.CNPJ = C.CNPJ  where P.EquiCod = ? and P.PdvStatus = ?",
      [EquiCod, "A"]
    );

    // faço o login e recebo um token
    const tokenTMT = await GenTokenTMT(filial);

    // requisito todos os clientes da filial
    const lista = await ListClients(tokenTMT.data.access_token);

    // testo o cnpj pra ver se o cliente já existe na tmt
    let existeCliente = null
    for (let i = 0; i < lista.length; i++) {
      if (lista[i].Cnpj === PDV[0].CNPJ) {
        existeCliente = cliente.PessoaId
        break;
      }
    }


    /* 
    se não existir eu crio com os dados do slaplic
    se já existir eu atualizo com os que eu já tem no slaplic
    */

    response.status(200).send({ ClienteSLAplic: PDV[0].CNPJ, ClientesTotvs: lista });
    // response.status(200).send({ PontoDeVenda: PDV[0], EquiCod})
  }

  //retornar o endereco do SLAplic ou do TMT onde X máquina se encontra
  async Show({ params, response }) {
    const Ativo = params.ativo
    const tokenTMT = await GenTokenTMT('0201');

    const arrow = (end) => `${checkNull(end.Logradouro).trim()} ${checkNull(end.Numero).trim()} ${checkNull(end.Complemento).trim()}, ${checkNull(end.Bairro).trim()}, ${checkNull(end.NomeCidade).trim()} - ${checkNull(end.UF).trim()}, ${checkNull(end.CEP).trim()}`
    const checkNull = (value) => value === null || typeof value == 'undefined' ? '' : String(value)

    //retorna endereço da máquina no SLAplic
    const EndSLAplic = await Database.raw("SELECT E.EquiDesc AS Modelo, P.EquiCod AS Ativo, P.IMEI, P.AnxDesc AS Nome, P.PdvLogradouroPV AS Logradouro, P.PdvNumeroPV AS Numero, P.PdvComplementoPV AS Complemento, P.PdvBairroPV AS Bairro, P.PdvCidadePV AS NomeCidade, P.PdvUfPV AS UF, P.PdvCEP AS CEP FROM dbo.PontoVenda AS P INNER JOIN dbo.Equipamento AS E ON P.EquiCod = E.EquiCod WHERE (E.EquiCod = ?) AND (P.PdvStatus = 'A')", [Ativo])
    if (EndSLAplic.length > 0) {
      response.status(200).send(arrow(EndSLAplic[0]))
    } else {
      const IdMaqTotvs = await FindUltimaInstalacao(tokenTMT.data.access_token, Ativo);
      const EndTotvs = await FindEnderecoPorInstalacaoCliente(tokenTMT.data.access_token, IdMaqTotvs);
      if (typeof EndTotvs.data === 'string') {
        response.status(200).send(EndTotvs.data)
      } else {
        response.status(200).send(arrow(EndTotvs.data))
      }
    }
  }
}

module.exports = Sl2TelController;
