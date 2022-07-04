"use strict";

const Database = use("Database");

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

      const filiais = await Database.raw(QUERY_TODAS_FILIAIS)

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

const QUERY_TODAS_FILIAIS = "select A1_GRPVEN, A1_COD, M0_CODFIL, GrupoVenda, M0_FILIAL, M0_CGC, NREDUZ, Inatv, Consultor, UF, DtCadastro from dbo.FilialEntidadeGrVenda where A1_GRPVEN <> '990201' and A1_GRPVEN <> '990203' and A1_GRPVEN <> '000000' order by M0_CODFIL"