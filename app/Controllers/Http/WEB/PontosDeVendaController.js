"use strict";

const Database = use("Database");
const { seeToken } = require("../../../Services/jwtServices");
const logger = require("../../../../dump/index")

class PontosDeVendaController {
  /** @param {object} ctx
   * @param {import('@adonisjs/framework/src/Request')} ctx.request
   */
  async Show({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      const pdvs = await Database.raw(QUERY_PDVS, [verified.grpven, verified.grpven])

      // const depositos = await Database.select('*').from('dbo.Deposito').where({
      //   GrpVen: verified.grpven
      // })

      // const configuracoes = await Database.select('*').from('dbo.CfgCad').where({
      //   GrpVen: verified.grpven
      // })

      // const EquipsDisp = await Database.raw(QUERY_EQSDISP, [verified.grpven])

      response.status(200).send({
        PDVs: pdvs,
      });
    } catch (err) {
      response.status(400).send()
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'PontosDeVendaController.Show',
      })
    }
  }

  async InativPDV({ request, response }) {
    const token = request.header("authorization");
    const { PdvId, AnxId, Status } = request.only(['PdvId', 'AnxId', 'Status'])

    try {
      const verified = seeToken(token);

      const hoje = new Date()

      await Database.table("dbo.PontoVenda")
        .where({
          GrpVen: verified.grpven,
          PdvId: PdvId,
          AnxId: AnxId,
        })
        .update({
          PdvStatus: Status,
          PdvDataAlteracao: hoje,
          PdvDtSolicEncerra: Status === 'I' ? hoje : null,
          PdvDataEncerramento: Status === 'I' ? hoje : null,
        });

      response.status(200).send()
    } catch (err) {
      response.status(400).send()
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'PontosDeVendaController.InativPDV',
      })
    }
  }

  async Update({ request, response }) {
    const token = request.header("authorization");
    const { PDV } = request.only(['PDV'])

    try {
      const verified = seeToken(token);

      await Database.table("dbo.PontoVenda")
        .where({
          GrpVen: verified.grpven,
          PdvId: PDV.PdvId,
          AnxId: PDV.AnxId,
        })
        .update({
          DepId: PDV.DepId,
          CfgId: PDV.CfgId,
          PdvLogradouroPV: PDV.PdvLogradouroPV,
          PdvNumeroPV: PDV.PdvNumeroPV,
          PdvComplementoPV: PDV.PdvComplementoPV,
          PdvBairroPV: PDV.PdvBairroPV,
          PdvCidadePV: PDV.PdvCidadePV,
          PdvUfPV: PDV.PdvUfPV,
          PdvCEP: PDV.PdvCEP,
          PdvDepartamento: PDV.PdvDepartamento,
          PdvObs: PDV.PdvObs,
          PdvMotivoEncerramento: PDV.PdvMotivoEncerramento,
          PdvConsMin: PDV.PdvConsMin,
          PdvConsValor: PDV.PdvConsValor,
          PdvConsDose: PDV.PdvConsDose,
          PdvSomaCompartilhado: PDV.PdvSomaCompartilhado,
          PdvDataAlteracao: new Date()
        });

      await Database.table("dbo.Anexos")
        .where({
          GrpVen: verified.grpven,
          AnxId: PDV.AnxId,
        })
        .update({
          AnxFatMinimo: PDV.AnxFatMinimo,
          AnxCalcMinPor: PDV.AnxCalcMinPor,
          AnxTipMin: PDV.AnxTipMin,
        });

      response.status(200).send()
    } catch (err) {
      response.status(400).send()
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'PontosDeVendaController.Update',
      })
    }
  }
}

module.exports = PontosDeVendaController;

const QUERY_PDVS = "select P.PdvId, P.AnxDesc, P.EquiCod, P.PdvDataAtivacao, P.PdvStatus from dbo.PontoVenda as P where P.GrpVen = ? order by PdvDataAtivacao DESC"

const QUERY_EQSDISP = "select EquiCod from dbo.Equipamento where EquiCod not in ( select EquiCod from dbo.PontoVenda where PdvStatus = 'A' ) and GrpVen = ?"