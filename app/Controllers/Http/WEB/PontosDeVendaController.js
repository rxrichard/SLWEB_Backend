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

      const pdvs = await Database.raw(QUERY_PDVS, [verified.grpven])

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

  async See({ request, response, params }) {
    const token = request.header("authorization");
    const type = params.type
    const PdvId = params.pdvid
    const AnxId = params.anxid

    try {
      const verified = seeToken(token);

      let data = null

      switch (type) {
        case 'basic':
          const infoBasica = await Database.raw(QUERY_PDV, [verified.grpven, verified.grpven, PdvId, AnxId])
          const depositos = await Database.select('*').from('dbo.Deposito').where({ GrpVen: verified.grpven })
          const configuracoes = await Database.select('*').from('dbo.CfgCad').where({ GrpVen: verified.grpven })

          data = {
            cadastro: infoBasica[0],
            depositos: depositos,
            configuracoes: configuracoes,
          }
          break
        case 'config':
          let cpdv = await Database.raw(QUERY_CONFIG_PDV, [verified.grpven, PdvId, AnxId])
          let ccab = await Database.select('CfgId', 'CfgDesc').from('dbo.CfgCad').where({ GrpVen: verified.grpven, CfgStatus: 'A' })
          let cdet = await Database.select('CfgId', 'PvpSel as Sel', 'ProdId', 'TveId as TipoVenda', 'RecId').from('dbo.CfgDet').where({ GrpVen: verified.grpven })
          
          let prodPCfg = await Database.raw(QUERY_PRODUTOS_CONFIGURACAO)
          let tiposVenda = await Database.select('TveId', 'TveDesc').from('dbo.TipoVenda')
          let receitas = await Database.select('RecId', 'RecDesc').from('dbo.Receita').where({ GrpVen: verified.grpven, RecStatus: 'A' })

          data = {
            CfgPdv: cpdv,
            CfgPadrao: ccab.map(cab => { return ({ ...cab, Produtos: cdet.filter(det => det.CfgId === cab.CfgId)}) }),
            Produtos: prodPCfg,
            TiposVenda: tiposVenda,
            Receitas: receitas
          }
          break
        case 'equip':
          const EquipsDisp = await Database.raw(QUERY_EQSDISP, [verified.grpven])

          data = { EqsDisp: EquipsDisp }
          break
      }

      response.status(200).send({
        Dados: data
      })
    } catch (err) {
      response.status(400).send()
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'PontosDeVendaController.See',
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

const QUERY_PDVS = "select P.PdvId, P.AnxId, P.AnxDesc, P.EquiCod, P.PdvDataAtivacao, P.PdvStatus from dbo.PontoVenda as P where P.GrpVen = ? order by PdvDataAtivacao DESC"

const QUERY_PDV = "select P.DepId, P.CfgId, P.EQUIPMOD_Desc, P.EquiCod, P.IMEI, P.AnxDesc, P.PdvLogradouroPV, P.PdvNumeroPV, P.PdvComplementoPV, P.PdvCidadePV, P.PdvCEP, P.PdvObs, P.PdvDataAtivacao, P.PdvDataEncerramento, P.PdvDataAlteracao, P.PdvMotivoEncerramento, P.PdvConsMin, P.PdvConsValor, P.PdvConsDose, P.PdvSomaCompartilhado, A.AnxFatMinimo, A.AnxCalcMinPor, A.AnxTipMin from dbo.PontoVenda as P inner join dbo.Anexos as A on P.AnxId = A.AnxId and A.GrpVen = ? where P.GrpVen = ? and P.PdvId = ? and P.AnxId = ?"
const QUERY_EQSDISP = "select EquiCod from dbo.Equipamento where EquiCod not in ( select EquiCod from dbo.PontoVenda where PdvStatus = 'A' ) and GrpVen = ?"
const QUERY_CONFIG_PDV = "select PvpSel as Sel, ProdId, TveId as TipoVenda, PvpVvn1 as Valor_1, PvpVvn2 as Valor_2, RecId from dbo.PVPROD where GrpVen = ? and PdvId = ? and AnxId = ?"
const QUERY_PRODUTOS_CONFIGURACAO = "SELECT dbo.Produtos.ProdId, dbo.Produtos.Produto, dbo.Produtos.RecId FROM dbo.Produtos WHERE (((dbo.Produtos.PrGrupo) Like 'DOSE%') AND ((dbo.Produtos.Venda)='S')) OR (((dbo.Produtos.ProdId)='12709') AND ((dbo.Produtos.Venda)='S'))"