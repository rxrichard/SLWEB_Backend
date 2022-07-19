"use strict";

const Database = use("Database");
const { seeToken } = require("../../../Services/jwtServices");
const logger = require("../../../../dump/index")

class DreController {
  async Show({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      response.status(200).send();
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'DreController.Show',
      })
    }
  }
}

module.exports = DreController;
