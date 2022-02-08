"use strict";

const Database = use("Database");
const Mail = use("Mail");
const Env = use("Env");

const TiposEmail = [
  { id: 1, model: "Atualização de Equipamentos" },
  { id: 2, model: "Declarar Vendas" },
  { id: 3, model: "Notificação Extrajudicial" },
];

const logger = require("../../../../dump/index")
const { seeToken } = require("../../../Services/jwtServices");

class MailerController {
  async Show({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      if (verified.role === "Franquia") {
        response.status(401).send();
      }

      const log = await Database.select("*")
        .from("dbo.LogAvisos")
        .orderBy("DataOcor", "DESC");

      response.status(200).send({ log, Modelos: TiposEmail });
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: token,
        params: null,
        payload: request.body,
        err: err,
        handler: 'MailerController.Show',
      })
    }
  }

  async See({ request, response, params }) {
    const token = request.header("authorization");
    const HtmlModel = {};
    const recipients = [];

    try {
      const verified = seeToken(token);

      if (verified.role === "Franquia") {
        response.status(401).send();
      }

      // switch(params.model){
      //   case 1:
      //     HtmlModel = email
      //     recipients = await Database.select('*').from('dbo.FilialEntidadeGrVenda')
      //     break;
      //   case 2:
      //     HtmlModel = email
      //     recipients = await Database.select('*').from('dbo.FilialEntidadeGrVenda')
      //     break;
      //   case 3:
      //     HtmlModel = email
      //     recipients = await Database.select('*').from('dbo.FilialEntidadeGrVenda')
      //     break;
      // }

      response.status(200).send({
        model: HtmlModel,
        Destinatarios: recipients
      });
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: token,
        params: params,
        payload: request.body,
        err: err,
        handler: 'MailerController.See',
      })
    }
  }

  async DispararEmail({ request, response }) {
    try {
      // await Mail.connection("smtp_mass").send(
      //   "emails.notificacao_equipamentos",
      //   { Nome: "Voitila" },
      //   (message) => {
      //     message
      //       .to("voitilaaraujo@gmail.com")
      //       .cc(Env.get("MASS_SMTP_DOM"))
      //       .from(Env.get("MASS_SMTP_DOM"), "Pilão Professional")
      //       .subject('Atualização de Ativos');
      //   }
      // );
      response.status(200).send("enviado");
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: null,
        params: null,
        payload: request.body,
        err: err,
        handler: 'MailerController.DispararEmail',
      })
    }
  }

  async DispararNotificacao({ response }) {
    try {
      //OBS: ESSA QUERY TA RETORNANDO MUITOS CLIENTES NOVOS
      const ListaNotificados = await Database.select("Email", "GrupoVenda")
        .from("dbo.FilialEntidadeGrVenda")
        .where({
          Dominio: null,
          Inatv: null,
        });

      // fazer um map com a lista de notificacao pendente
      // ListaNotificados.map(async (Cliente) => {
      //   if (Cliente.Email !== null) {
      //     await Mail.send(
      //       "emails.notificacao",
      //       { Franqueado: Cliente.GrupoVenda.trim() },
      //       (message) => {
      //         message
      //           .to(Cliente.Email.trim())
      //           .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
      //           .subject("Aviso da franqueadora");
      //       }
      //     );
      //   }
      // });

      //testes...
      // await Mail.send(
      //   "emails.notificacao",
      //   { Franqueado: 'Voitila'.trim() },
      //   (message) => {
      //     message
      //       .to('voitila.araujo@pilaoprofessional.com.br'.trim())
      //       .from(Env.get("MAIL_USERNAME"), "SLAplic Web")
      //       .subject("Aviso da franqueadora");
      //   }
      // );

      // response.status(200).send("Tudo Enviado");
      response.status(200).send(ListaNotificados);
    } catch (err) {
      response.status(400).send();
      logger.error({
        token: null,
        params: null,
        payload: null,
        err: err,
        handler: 'MailerController.DispararNotificacao',
      })
    }
    //fazer um insert na lista de notificacoes dos emails mandados
  }
}

module.exports = MailerController;
