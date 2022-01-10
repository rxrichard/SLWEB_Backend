'use strict'

const Database = use("Database");
const { seeToken } = require("../../../POG/jwt");
const moment = require("moment");
moment.locale("pt-br");

class ConsultaColetasController {
  /** @param {object} ctx
 * @param {import('@adonisjs/framework/src/Request')} ctx.request
 */
  async Show({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      const coletas = await Database.raw(queryColetas, [verified.grpven, verified.grpven])

      const equipamentos = await Database.raw(queryEquipamentos, [verified.grpven])

      response.status(200).send({
        Coletas: coletas,
        Equipamentos: equipamentos
      })
    } catch (err) {
      response.status(400).send(err)
    }
  }

  async See({ request, response, params }) {
    const token = request.header("authorization");
    const AnxId = params.anxid
    const PdvId = params.pdvid
    const FSeq = params.fseq

    try {
      const verified = seeToken(token);

      const detalhes = await Database.raw(queryColetasDetalhes, [AnxId, PdvId, FSeq, verified.grpven])

      response.status(200).send({
        Detalhes: detalhes
      })
    } catch (err) {
      response.status(400).send(err)
    }
  }

  async NovaColetaOptions({ request, response, params }) {
    const token = request.header("authorization");
    const EquiCod = params.equicod
    const AnxId = params.anxid

    try {
      const verified = seeToken(token);

      const ultimaColeta = await Database.raw(queryUltimaColeta, [verified.grpven, verified.grpven, EquiCod])

      let leiturasDisponiveis

      if (ultimaColeta.length > 0) {
        leiturasDisponiveis = await Database.raw(queryLeiturasDisponiveis, [ultimaColeta[0].LeituraId, EquiCod, verified.grpven, AnxId])
      } else {
        leiturasDisponiveis = await Database.raw(queryLeiturasDisponiveis, ['0', EquiCod, verified.grpven, AnxId])
      }


      response.status(200).send({
        UltColeta: ultimaColeta,
        LeiturasDisponiveis: leiturasDisponiveis
      })
    } catch (err) {
      response.status(400).send(err)
    }
  }

  async CalcColetas({ request, response, params }) {
    const token = request.header("authorization");
    const leitIniID = params.l1id;
    const leitFimID = params.l2id;
    const AnxId = params.anxid;
    const PdvId = params.pdvid;

    try {
      const verified = seeToken(token);

      const coletaInicial = await Database.raw(queryLeituraDetalhes, [leitIniID, AnxId, PdvId, verified.grpven])
      const coletaFinal = await Database.raw(queryLeituraDetalhes, [leitFimID, AnxId, PdvId, verified.grpven])

      let finalArray = []

      coletaFinal.forEach((element, index) => {
        finalArray.push({
          Selecao: element.Selecao,
          Real: {
            Ant: coletaInicial[index] ? Number(coletaInicial[index].QuantidadeVendaPaga) : 0,
            Agr: Number(element.QuantidadeVendaPaga),
          },
          Teste: {
            Ant: coletaInicial[index] ? Number(coletaInicial[index].QuantidadeVendaTeste) : 0,
            Agr: Number(element.QuantidadeVendaTeste),
          },
          Consumo: {
            Real: Number(element.QuantidadeVendaPaga) - (coletaInicial[index] ? Number(coletaInicial[index].QuantidadeVendaPaga) : 0),
            Teste: Number(element.QuantidadeVendaTeste) - (coletaInicial[index] ? Number(coletaInicial[index].QuantidadeVendaTeste) : 0),
          },
          PV1: element.PvpVvn1,
          PV2: element.PvpVvn2,
          Produto: element.Produto,
          ProdId: element.ProdId
        })
      })

      response.status(200).send({
        Coleta: finalArray
      })
    } catch (err) {
      response.status(400).send(err)
    }
  }

  async GravaColeta({ request, response, params }) {
    const token = request.header("authorization");

    const { ref } = request.only(['ref'])

    try {
      const verified = seeToken(token);

      if (ref === null || ref === '') {
        throw new Error('Ref não informada')
      }

      //gravar FichFatM e FichFatD

      response.status(200).send()
    } catch (err) {
      response.status(400).send(err)
    }
  }
}

module.exports = ConsultaColetasController

const queryColetas = 'SELECT dbo.FichFatM.GrpVen, dbo.FichFatM.AnxId, dbo.FichFatM.PdvId, dbo.FichFatM.EquiCod, dbo.FichFatM.FfmSeq, dbo.FichFatM.FfmRef AS Ref, dbo.FichFatM.FfmSeqM AS SeqMês, dbo.Anexos.AnxDesc AS Anexo, dbo.CalculaFat.CalcFatDesc AS Cálculo, dbo.FichFatM.FfmDtColetaAnt AS ColeteAnterior, dbo.FichFatM.FfmDtColeta AS DataColeta, dbo.FichFatM.FfmCNTAnt AS ContAnterior, dbo.FichFatM.FfmCNT AS Contador, dbo.FichFatM.FfmSelZero FROM ( dbo.FichFatM INNER JOIN dbo.Anexos ON dbo.FichFatM.AnxId = dbo.Anexos.AnxId ) INNER JOIN dbo.CalculaFat ON dbo.Anexos.CalcFatId = dbo.CalculaFat.CalcFatId WHERE dbo.FichFatM.GrpVen = ? AND dbo.Anexos.GrpVen = ? ORDER BY Ref DESC, SeqMês DESC'

const queryEquipamentos = "SELECT dbo.Anexos.GrpVen, dbo.Anexos.AnxDesc, dbo.Anexos.CNPJss, dbo.PontoVenda.EquiCod, dbo.PontoVenda.IMEI, dbo.PontoVenda.PdvDataAtivacao, dbo.PontoVenda.PdvStatus, dbo.PontoVenda.AnxId, dbo.PontoVenda.PdvId FROM dbo.Anexos INNER JOIN dbo.PontoVenda ON (dbo.Anexos.AnxId = dbo.PontoVenda.AnxId) AND ( dbo.Anexos.GrpVen = dbo.PontoVenda.GrpVen ) WHERE ( ((dbo.Anexos.GrpVen) = ?) AND ((dbo.PontoVenda.PdvStatus) = 'A') ) ORDER BY dbo.Anexos.AnxDesc, dbo.PontoVenda.EquiCod"

const queryColetasDetalhes = 'SELECT D.AnxId, D.PdvId, D.FfmSeq, D.PvpSel, D.FfdPago, D.FfdQtdFaturar, D.ProdId, D.TveId, D.PvpVvn1, D.PvpVvn2, P.Produto FROM FichFatD AS D left join dbo.Produtos as P on P.ProdId = D.ProdId WHERE D.AnxId=? AND D.PdvId=? AND D.FfmSeq=? and GrpVen = ?'

const queryUltimaColeta = "SELECT top(1) dbo.FichFatM.FfmDtColeta AS UltimaColeta, SUM(dbo.FichFatM.FfmSeq + 1) as ProximaColeta, dbo.FichFatM.FfmCNT as ContadorAnterior, SUM(dbo.FichFatM.FfmSeqM + 1) as ProximaColetaMes, dbo.FichFatM.FfmSelZero as Zerou, dbo.FichFatM.LeituraId FROM ( dbo.FichFatM INNER JOIN dbo.Anexos ON dbo.FichFatM.AnxId = dbo.Anexos.AnxId ) INNER JOIN dbo.CalculaFat ON dbo.Anexos.CalcFatId = dbo.CalculaFat.CalcFatId WHERE dbo.FichFatM.GrpVen = ? AND dbo.Anexos.GrpVen = ? AND dbo.FichFatM.EquiCod = ? group by dbo.FichFatM.FfmDtColeta, dbo.FichFatM.FfmCNT, dbo.FichFatM.FfmSelZero, dbo.FichFatM.LeituraId order by dbo.FichFatM.FfmDtColeta desc"

const queryLeiturasDisponiveis = "SELECT dbo.SLTELLeitura.LeituraId, dbo.SLTELLeitura.DataLeitura, dbo.SLTELLeitura.QuantidadeTotal AS Contador FROM dbo.SLTELLeitura INNER JOIN dbo.PontoVenda ON dbo.SLTELLeitura.Matricula = dbo.PontoVenda.EquiCod WHERE ( ((dbo.SLTELLeitura.LeituraId) >= ?) AND ((dbo.PontoVenda.EquiCod) = ?) AND ((dbo.PontoVenda.GrpVen) = ?) AND ((dbo.PontoVenda.PdvStatus) = 'A') AND ((dbo.PontoVenda.AnxId) = ?) ) order by LeituraId ASC"

const queryLeituraDetalhes = "SELECT LS.Selecao, LS.QuantidadeVendaPaga, LS.QuantidadeVendaTeste, PV.PvpVvn1, PV.PvpVvn2, P.Produto, P.ProdId FROM dbo.SLTEL_LeituraSelecao AS LS left join dbo.PVPROD as PV on LS.Selecao = PV.PvpSel left join dbo.Produtos as P on PV.ProdId  = P.ProdId WHERE LS.LeituraId = ? and PV.AnxId = ? and PV.PdvId = ? AND PV.GrpVen = ?"