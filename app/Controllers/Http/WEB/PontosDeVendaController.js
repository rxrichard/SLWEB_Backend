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

      const depositos = await Database.select('*').from('dbo.Deposito').where({
        GrpVen: verified.grpven
      })

      const configuracoes = await Database.select('*').from('dbo.CfgCad').where({
        GrpVen: verified.grpven
      })

      response.status(200).send({
        PDVs: pdvs,
        Depositos: depositos,
        Configuracoes: configuracoes
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
}

module.exports = PontosDeVendaController;

const QUERY_PDVS = "select P.*, A.AnxFatMinimo, A.AnxCalcMinPor, A.AnxTipMin from dbo.PontoVenda as P inner join dbo.Anexos as A on P.AnxId = A.AnxId and A.GrpVen = ? where P.GrpVen = ? order by PdvDataAtivacao DESC"