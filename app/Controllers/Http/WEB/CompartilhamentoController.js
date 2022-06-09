"use strict";

const Database = use("Database");
const { seeToken } = require("../../../Services/jwtServices");
const logger = require("../../../../dump/index")
const fs = require('fs');
const path = require('path');

class CompartilhamentoController {
  async Show({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);


      // fs.readdir(`\\\\172.31.82.25\\Integratto2\\`,
      //   { withFileTypes: true },
      //   (err, files) => {
      //     if (err)
      //       console.log(err);
      //     else {
      //       files.forEach(file => {
      //         console.log(file);
      //       })
      //     }
      //   })
      let folderPath = `\\\\172.31.82.25\\Integratto2\\`
      let res = fs.readdirSync(folderPath).map(fileName => {
        return fileName;
      })

      response.status(200).send({
        arquivos: res.filter(arq => arq.includes('.')),
        pastas: res.filter(arq => !arq.includes('.')),
        pathSegments: folderPath.split('\\').filter(p => p !== '')
      });
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'CompartilhamentoController.Show',
      })
    }
  }
}

module.exports = CompartilhamentoController;
