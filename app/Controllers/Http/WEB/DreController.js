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

      let TemDre = await Database.select('*').from('dbo.DRE').where({
        GrpVen: verified.grpven,
        DReRef: formatedTargetRef,
      })

      let DreJaGravado = []

      if (TemDre.length > 0) {
        // console.log('já tem dre, atualizar')

        // for (let i = 0; i < genDRE.length; i++) {
        //   await Database.table("dbo.DRE")
        //     .where({
        //       DreCod: genDRE[i].DreCod,
        //       GrpVen: verified.grpven,
        //       DReRef: formatedTargetRef
        //     })
        //     .update({
        //       DreVlr: genDRE[i].DreVlr !== null ? genDRE[i].DreVlr : 0,
        //       DrePorc: genDRE[i].DrePorc !== null ? genDRE[i].DrePorc : 0
        //     });
        // }

        DreJaGravado = genDRE
      } else {
        // console.log('nao tem dre, gravar')

        for (let i = 0; i < genDRE.length; i++) {
          await Database.insert({
            GrpVen: verified.grpven,
            DReRef: formatedTargetRef,
            DreCod: genDRE[i].DreCod,
            DreDesc: genDRE[i].DreDesc,
            DreTipo: null,
            DreVlr: 0,
            DrePorc: 0
          }).into('dbo.DRE')
        }

        DreJaGravado = await Database.raw(
          "execute dbo.GerarDRE @GrpVen = ?, @Ano = ?, @Mes = ?",
          [verified.grpven, ano, mes]
        )
      }

      const DovJaGravado = await Database.select('*').from('dbo.DOV').where({
        GrpVen: verified.grpven,
        DOVRef: formatedTargetRef,
      })

      response.status(200).send({
        DRE: DreJaGravado,
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

  async UpdateDRE({ request, response }) {
    const token = request.header("authorization");
    const { ano, mes, cod, vlr, porc } = request.only(['ano', 'mes', 'cod', 'vlr', 'porc'])

    try {
      const verified = seeToken(token);

      const formatedTargetRef = moment().set('year', ano).set('month', mes - 1).startOf('month').subtract(3, 'hours').toDate()

      await Database.table("dbo.DRE")
        .where({
          DreCod: cod,
          GrpVen: verified.grpven,
          DReRef: formatedTargetRef
        })
        .update({
          DreVlr: vlr,
          DrePorc: porc
        });

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
        params: null,
        payload: request.body,
        err: err,
        handler: 'DreController.UpdateDRE',
      })
    }
  }
}

module.exports = DreController;
