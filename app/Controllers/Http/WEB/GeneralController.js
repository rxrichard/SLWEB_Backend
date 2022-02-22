'use strict'

const Database = use("Database");
const Mail = use("Mail");
const Env = use("Env");
const { seeToken } = require("../../../Services/jwtServices");
const moment = require("moment");
const logger = require("../../../../dump/index")
moment.locale("pt-br");

class GeneralController {
  /** @param {object} ctx
 * @param {import('@adonisjs/framework/src/Request')} ctx.request
 */
  async Filiais({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);
      if (verified.role === 'Franquia') {
        throw new Error('Acesso negado')
      }

      const franqueados = await Database.select("M0_CODFIL", "GrupoVenda")
        .from("dbo.FilialEntidadeGrVenda")
        .orderBy("M0_CODFIL", "ASC");

      response.status(200).send(franqueados)
    } catch (err) {
      response.status(400).send()
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'GeneralController.Filiais',
      })
    }
  }

  async News({ request, response }) {
    const token = request.header("authorization");

    try {
      const news = await Database.select('*').from('dbo.NewsSLWEB').where({
        BannerStatus: 'A'
      })

      response.status(200).send({
        News: news
      })
    } catch (err) {
      response.status(400).send()
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'GeneralController.News',
      })
    }
  }
}

module.exports = GeneralController
