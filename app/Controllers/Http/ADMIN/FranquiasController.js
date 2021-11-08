"use strict";

const Database = use("Database");
const Helpers = use("Helpers");

const { seeToken } = require("../../../POG/jwt");

class AdministracaoController {
  async Show({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      const filiais = await Database.select("*")
        .from("dbo.FilialEntidadeGrVenda")
        .orderBy("M0_CODFIL", "DESC");

      if (filiais.length < 1) throw Error;

      response.status(200).send(filiais);
    } catch (err) {
      response.status(400).send(err);
    }
  }
}

module.exports = AdministracaoController;
