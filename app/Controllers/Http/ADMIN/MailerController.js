"use strict";

const Database = use("Database");
const Drive = use('Drive');
const Helpers = use('Helpers');
const Mail = use("Mail");
const Env = use("Env");

const logger = require("../../../../dump/index")
const { seeToken } = require("../../../Services/jwtServices");

class MailerController {
  async Show({ request, response }) {
    const token = request.header("authorization");

    try {
      const verified = seeToken(token);

      if (verified.role === "Franquia") {
        throw new Error('Usuário não autorizado');
      }

      const log = await Database.select("*")
        .from("dbo.LogAvisos")
        .orderBy("DataOcor", "DESC");

      const recipients = await Database.raw("select A1_GRPVEN, M0_CODFIL, Email from dbo.FilialEntidadeGrVenda where Inatv IS NULL and M0_CODFIL <> '0201' and M0_CODFIL <> '0203' order by A1_GRPVEN ASC")

      response.status(200).send({
        History: log,
        AvailableRecipients: recipients
      });
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

  async DispatchEmail({ request, response }) {
    const token = request.header("authorization");
    const { subject, body, recipients, salvarNovoTemplate, nomeNovoTemplate } = request.only(['subject', 'body', 'recipients', 'salvarNovoTemplate', 'nomeNovoTemplate'])

    try {
      const verified = seeToken(token);

      if (verified.role === "Franquia") {
        throw new Error('Usuário não autorizado');
      }

      //converter texto bruto para edge(html) com as tags
      const rawBodyToEdge = FromRawMailToEdgeFormat(body);
      let templateName = null
      let templateCaminho = null

      if (salvarNovoTemplate) {
        console.log('salvar e enviar')
        templateName = `${nomeNovoTemplate}-${new Date().getTime()}`
        templateCaminho = Helpers.resourcesPath(`/views/emails/custom/${templateName}.edge`)

        await Drive.put(templateCaminho, Buffer.from(rawBodyToEdge))

        recipients.forEach(async (recipient) => {
          await Mail.send(
            `emails.custom.${templateName}`,
            null,
            (message) => {
              message
                .to(recipient)
                .from(Env.get("MAIL_USERNAME"), "Pilão Professional")
                .subject(subject);
            }
          );
        })
      } else {
        console.log('só enviar')
        recipients.forEach(async (recipient) => {
          await Mail.raw(
            rawBodyToEdge,
            (message) => {
              message
                .to(recipient)
                .from(Env.get("MAIL_USERNAME"), "Pilão Professional")
                .subject(subject);
            }
          );
        })
      }

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
      response.status(200).send();
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
}

module.exports = MailerController;

function FromRawMailToEdgeFormat(rawBody) {
  let Formated = '<label>' + String(rawBody)

  Formated = Formated.replace(/\n/g, "</label><br><label>")

  Formated = Formated.concat("</label>")

  return Formated
}