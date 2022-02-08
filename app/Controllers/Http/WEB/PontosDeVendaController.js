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

      const PDVs = await Database
        .select('*')
        .from('dbo.PontoVenda')
        .where({
          GrpVen: verified.grpven
        }).orderBy('PdvDataAtivacao', 'desc')

      response.status(200).send(PDVs);
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
