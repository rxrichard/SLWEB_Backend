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
        .where({ Inatv: null })
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

  async ShowNews({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      const news = await Database.raw("select NS.*, NSC.DtConfirmacao from dbo.NewsSLWEB as NS left join dbo.NewsSLWEBConfirmacao as NSC on NS.NewsId = NSC.NewsId and NSC.GrpVen = ? where NS.BannerStatus = 'A' order by NS.NewsId DESC", [verified.grpven])

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

  async StoreNews({ request, response }) {
    const token = request.header("authorization");
    const { news } = request.only(['news'])

    try {
      const verified = seeToken(token);

      if (verified.role === 'Franquia') {
        throw new Error('Acesso negado')
      }

      await Database.insert({
        BannerTitle: news.BannerTitle,
        BannerDescription: news.BannerDescription,
        BannerAlign: news.BannerAlign,
        ModalHeaderTitle: news.ModalHeaderTitle,
        ModalContent: news.ModalContent,
        BannerStatus: 'A',
        ReadConfirm: news.Comfirm,
        ModalPrompt: news.Prompt,
      }).into('dbo.NewsSLWEB')

      response.status(200).send()
    } catch (err) {
      response.status(400).send()
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'GeneralController.StoreNews',
      })
    }
  }

  async DestroyNews({ request, response, params }) {
    const token = request.header("authorization");
    const id = params.id

    try {
      await Database.table("dbo.NewsSLWEB")
        .where({
          NewsId: id,
        })
        .update({
          BannerStatus: 'I',
        });

      response.status(200).send()
    } catch (err) {
      response.status(400).send()
      logger.error({
        token: token,
        params: params,
        payload: request.body,
        err: err,
        handler: 'GeneralController.Destroy',
      })
    }
  }

  async CheckNews({ request, response }) {
    const token = request.header("authorization");
    const { newsId } = request.only(['newsId'])

    try {
      const verified = seeToken(token);

      const hoje = new Date()

      const jaChecou = await Database
        .select('*')
        .from('dbo.NewsSLWEBConfirmacao')
        .where({
          GrpVen: verified.grpven,
          NewsId: newsId,
        })

      if (jaChecou.length === 0) {
        await Database.insert({
          GrpVen: verified.grpven,
          NewsId: newsId,
          DtVisualizacao: hoje,
          DtConfirmacao: hoje
        }).into('dbo.NewsSLWEBConfirmacao')
      }


      response.status(200).send()
    } catch (err) {
      response.status(400).send()
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'GeneralController.CheckNews',
      })
    }
  }

  async CheckPendencias({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      const DeveConfirmacao = await Database
      .select('Equip')
      .from('dbo.FilialEntidadeGrVenda')
      .where({
        M0_CODFIL: verified.user_code
      })

      response.status(200).send({
        Equip: DeveConfirmacao[0] ? DeveConfirmacao[0].Equip === 'S' : false
      })
    } catch (err) {
      response.status(400).send()
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'GeneralController.CheckPendencias',
      })
    }
  }
}

module.exports = GeneralController
