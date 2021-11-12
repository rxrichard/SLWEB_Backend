"use strict";
const Database = use("Database");
const {
  GenTokenTMT,
  ListClients,
  ListSegmentos,
  FindUltimaInstalacao,
  ListCidades,
  FindEnderecoPorInstalacaoCliente,
  StoreClient,
  UpdateClient,
  ListInstalacoes,
  FecharInstalacoes,
  StoreInstalacao,
  ListMaquinas
} = require("../../../POG/TMTConn");

class Sl2TelController {
  //atualizar posse da máquina no totvs
  async Update({ response, params }) {
    const EquiCod = params.equicod;
    const filial = params.filial;

    try {
      //gero token tmt
      const tokenTMT = await GenTokenTMT(filial);

      //trago os dados do cliente e pdv do slaplic e todos os clientes do tmt
      let [PDV, clientes] = await Promise.all([
        Database.raw("select * from dbo.PontoVenda as P inner join dbo.Cliente as C on P.CNPJ = C.CNPJ  where P.EquiCod = ? and P.PdvStatus = ?", [EquiCod, "A"]),
        ListClients(tokenTMT.data.access_token),
      ]);

      // testo pra ver se o cliente já existe na tmt
      let IdGeral = returnClientID(clientes, PDV[0].CNPJ[0])

      //trago todas as cidades e segmentos do tmt para usar seus IDs
      let [cidades, segmentos] = await Promise.all([
        ListCidades(tokenTMT.data.access_token),
        ListSegmentos(tokenTMT.data.access_token),
      ])

      //filtro pra trazer só a cidade e segmento que preciso
      let cidadeCorreta = cidades.filter(cidade => String(cidade.Nome).normalize("NFD").toUpperCase().trim() === String(PDV[0].PdvCidadePV).normalize("NFD").toUpperCase().trim())[0];
      let segmentoCorreto = segmentos.filter(segmento => String(segmento.Codigo) === String(PDV[0].A1_SATIV1))

      //se o cliente não existir no tmt, crio um novo, sejá existir atualizo
      if (IdGeral === null) {
        await StoreClient(tokenTMT.data.access_token, PDV[0], cidadeCorreta, tokenTMT.data.empresaId, segmentoCorreto.length > 0 ? segmentoCorreto[0].Id : 269)

        /* preciso carregar todos os cliente do tmt novamente 
        e filtrar a lista mais uma vez para encontrar o ID 
        do cliente recem criado */
        clientes = await ListClients(tokenTMT.data.access_token)
        IdGeral = returnClientID(clientes, PDV[0].CNPJ[0])

      } else {
        await UpdateClient(tokenTMT.data.access_token, IdGeral, PDV[0], cidadeCorreta, tokenTMT.data.empresaId, segmentoCorreto.length > 0 ? segmentoCorreto[0].Id : 269)
      }

      //trago todas as máquinas e instalacoes de máquinas da filial no tmt
      let [maquinas, instalacoes] = await Promise.all([
        ListMaquinas(tokenTMT.data.access_token),
        ListInstalacoes(tokenTMT.data.access_token),
      ])

      /* encontro na lista de máquina a que me interessa pelo ID e tambem 
      filtro se existe alguma instalacao com data de encerramento 'null'*/
      let ativoCorreto = maquinas.filter(maquina => String(maquina.NumeroDeSerie) === String(EquiCod))[0]
      let instalacoesAtivo = instalacoes.filter(inst => String(inst.Matricula).trim() === String(EquiCod).trim() && inst.DataDeRemocao === null)
      
      //vou usar essa variavel pra verificar se preciso criar uma nova instalação
      let alreadyLinkedToClient = false

      /*para cada item do array de instalacoes com encerramento 'null' vou 
      verificar se é a instalação do mesmo cliente, se não for, encerro-a, se não,
      ignoro e altero o valor da variavel que indica instalacao já existente */
      instalacoesAtivo.forEach(async (instalacao) => {
        if (instalacao.ClienteId !== IdGeral) {
          await FecharInstalacoes(tokenTMT.data.access_token, instalacao)
        } else {
          alreadyLinkedToClient = true
        }
      })

      //se eu não encontrar nenhuma instalacao, crio uma nova, se sim, ignoro
      if (!alreadyLinkedToClient) {
        await StoreInstalacao(tokenTMT.data.access_token, tokenTMT.data.empresaId, ativoCorreto.Id, IdGeral)
      } else {
        console.log("Instalação já está ativa no cliente")
      }

      response.status(200).send({ message: "Atualizado com sucesso" });
    } catch (err) {
      response.status(400).send({
        message: 'Falha na atualização',
        error: err
      });
    }

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

const returnClientID = (clientes, targetCNPJ) => {
  let aux = null

  for (let i = 0; i < clientes.length; i++) {
    if (String(clientes[i].Cnpj).trim() === String(targetCNPJ).trim()) {
      aux = clientes[i].Id
      break;
    }
  }

  return aux
}