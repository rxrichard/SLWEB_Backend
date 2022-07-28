"use strict";

const Database = use("Database");
const moment = require("moment");
const { seeToken } = require("../../../Services/jwtServices");
const logger = require("../../../../dump/index")

class DreController {
  async Show({ request, response }) {
    const token = request.header("authorization");

    try {
      const refs = await Database.select('*').from('dbo.Referencia').orderBy('Refdt', 'desc')

      response.status(200).send({
        Referencias: refs
      });
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

  async See({ request, response, params }) {
    const token = request.header("authorization");
    const ano = params.ano
    const mes = params.mes

    try {
      const verified = seeToken(token);

      const formatedTargetRef = moment().set('year', ano).set('month', mes - 1).startOf('month').subtract(3, 'hours').toDate()

      //buscar na tabela DRE por grpven & ref
      const DreJaGravado = await Database.select('*').from('dbo.DRE').where({
        GrpVen: verified.grpven,
        DReRef: formatedTargetRef
      })

      if (DreJaGravado.length > 0) {
        const DovJaGravado = await Database.select('*').from('dbo.DOV').where({
          GrpVen: verified.grpven,
          DOVRef: formatedTargetRef,
        })

        response.status(200).send({
          DRE: DreJaGravado,
          DOV: DovJaGravado,
          Type: 'Gravado'
          
        });
      } else {
        const genDRE = await Database.raw("execute dbo.GerarDRE @GrpVen = ?, @Ano = ?, @Mes = ?", [verified.grpven, ano, mes])
        
        response.status(200).send({
          DRE: genDRE,
          DOV: [],
          Type: 'Gerado'
        });
      }
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: token,
        params: params,
        payload: request.body,
        err: err,
        handler: 'DreController.See',
      })
    }
  }
}

module.exports = DreController;
