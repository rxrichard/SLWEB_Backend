"use strict";

const Database = use("Database");
const Helpers = use("Helpers");

const logger = require("../../../../dump/index")
const { seeToken } = require("../../../Services/jwtServices");

class FranquiasController {
  async Show({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      if (verified.role === "Franquia") {
        throw new Error('Usuário não autorizado');
      }

      //verificar se o token é de ADM > 

      const filiais = await Database.select("*")
        .from("dbo.FilialEntidadeGrVenda")
        .orderBy("M0_CODFIL", "DESC");

      if (filiais.length < 1) throw Error;

      response.status(200).send(filiais);
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'FranquiasController.Show',
      })
    }
  }
}

module.exports = FranquiasController;
