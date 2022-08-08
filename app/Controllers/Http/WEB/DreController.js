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

      const genDRE = await Database.raw(
        "execute dbo.GerarDRE @GrpVen = ?, @Ano = ?, @Mes = ?",
        [verified.grpven, ano, mes]
      )

      const DovJaGravado = await Database.select('*').from('dbo.DOV').where({
        GrpVen: verified.grpven,
        DOVRef: formatedTargetRef,
      })

      response.status(200).send({
        DRE: genDRE,
        DOV: DovJaGravado,
        Type: 'Gerado'
      });
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

  async Store({ request, response }) {
    const token = request.header("authorization");
    const { ano, mes, DRE, DOV } = request.only(['ano', 'mes', 'DRE', 'DOV'])

    try {
      const verified = seeToken(token);

      const formatedTargetRef = moment().set('year', ano).set('month', mes - 1).startOf('month').subtract(3, 'hours').toDate()

      // DRE.forEach(d => {
      //   await Database.raw(`IF EXISTS (SELECT DreCod FROM dbo.DRE WHERE GrpVen = ${verified.grpven} and DReRef = ${formatedTargetRef} and DreCod = ${d.DreCod}) BEGIN UPDATE dbo.DRE SET DreVlr = ${d.DreVlr}, DrePorc = ${d.DrePorc} WHERE GrpVen = ${verified.grpven} and DReRef = ${formatedTargetRef} and DreCod = ${d.DreCod} END ELSE BEGIN INSERT INTO dbo.DRE VALUES (${verified.grpven}, ${formatedTargetRef}, ${d.DreCod}, ${d.DreDesc}, null, ${d.DreVlr}, ${d.DrePorc}) END`)
      // })

      // DOV.forEach(d => {
      //   await Database.raw(`IF EXISTS (SELECT DOVCod FROM dbo.DOV WHERE GrpVen = ${verified.grpven} and DOVRef = ${formatedTargetRef} and DOVCod = ${d.DOVCod}) BEGIN UPDATE dbo.DOV SET DOVVlr = ${d.DOVVlr} WHERE GrpVen = ${verified.grpven} and DOVRef = ${formatedTargetRef} and DOVCod = ${d.DOVCod} END ELSE BEGIN INSERT INTO dbo.DOV VALUES (${verified.grpven}, ${formatedTargetRef}, ${d.DOVCod}, ${d.DOVDesc}, null, ${d.DOVVlr}) END`)
      // })

      response.status(200).send();
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'DreController.Store',
      })
    }
  }
}

module.exports = DreController;
