"use strict";

const Database = use("Database");
const moment = require('moment')
const { seeToken } = require("../../../Services/jwtServices");
const logger = require("../../../../dump/index")

class LogsController {
  /** @param {object} ctx
   * @param {import('@adonisjs/framework/src/Request')} ctx.request
   */
  async Navegacao({ request, response, params }) {
    const token = request.header("authorization");
    const { url } = request.only(['url'])

    try {
      const verified = seeToken(token);

      if (verified.role === 'Franquia') {
        await Database.insert({
          Quem: verified.user_code,
          Onde: url,
          Quando: moment().subtract(3, 'hours').toDate()
        }).into('dbo.NavegacaoWeb')
      }

      response.status(200).send();
    } catch (err) {
      response.status(400).send()
      logger.error({
        token: token,
        params: params,
        payload: request.body,
        err: err,
        handler: 'LogsController.Navegacao',
      })
    }
  }
}

module.exports = LogsController;
